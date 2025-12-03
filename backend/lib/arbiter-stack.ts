import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from "constructs";
import path = require('path');

interface ArbiterStackProps extends cdk.StackProps {
  agentEventBus: events.EventBus;
  agentConfigTable: dynamodb.Table;
  environment: string;
}

export class ArbiterStack extends cdk.Stack {
  public readonly orchestrationTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ArbiterStackProps) {
    super(scope, id, props);

    this.orchestrationTable = new dynamodb.Table(this, 'OrchestrationTable', {
      tableName: `agentic-ai-factory-agent-orchestration-${props.environment}`,
      partitionKey: { name: 'orchestrationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workerStateTable = new dynamodb.Table(this, 'WorkerStateTable', {
      tableName: `agentic-ai-factory-worker-state-${props.environment}`,
      partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const supervisorLambda = new PythonFunction(this, 'SupervisorAgent', {
      runtime: lambda.Runtime.PYTHON_3_11,
      entry: path.join(__dirname, '../../../arbiter/supervisor'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        ORCHESTRATION_TABLE: this.orchestrationTable.tableName,
        COMPLETION_BUS_NAME: props.agentEventBus.eventBusName,
        EVENT_BUS_NAME: props.agentEventBus.eventBusName,
        WORKER_STATE_TABLE: workerStateTable.tableName,
        AGENT_CONFIG_TABLE: props.agentConfigTable.tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['bedrock:InvokeModel'],
          resources: ['*'],
        }),
        // Crazy high permissions. Might need to split the stacks for specific permission, or maybe some sort of sqs name/domain scoping
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
          resources: ['*'],
        }),
      ],
    });

    this.orchestrationTable.grantReadWriteData(supervisorLambda);
    props.agentEventBus.grantPutEventsTo(supervisorLambda);
    workerStateTable.grantReadWriteData(supervisorLambda);
    props.agentConfigTable.grantReadData(supervisorLambda);

    const taskRequestRule = new events.Rule(this, 'TaskRequestRule', {
      eventBus: props.agentEventBus,
      eventPattern: {
        source: ['task.request'],
      },
    });

    const completionRule = new events.Rule(this, 'TaskCompletionRule', {
      eventBus: props.agentEventBus,
      eventPattern: {
        source: ['task.completion'],
      },
    });

    taskRequestRule.addTarget(new targets.LambdaFunction(supervisorLambda));
    completionRule.addTarget(new targets.LambdaFunction(supervisorLambda));

    const code_bucket = new Bucket(this, 'CodeBucket', {
      bucketName: `agentic-ai-factory-code-${props.environment}-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // Dead letter queue for failed worker messages
    const workerAgentDLQ = new Queue(this, `workerAgentDLQ`, {
      queueName: `agentic-ai-factory-worker-agent-dlq-${props.environment}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const workerAgentQueue = new Queue(this, `workerAgentQueue`, {
      queueName: `agentic-ai-factory-worker-agent-queue-${props.environment}`,
      visibilityTimeout: cdk.Duration.minutes(15),
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: workerAgentDLQ,
        maxReceiveCount: 3, // Retry 3 times before sending to DLQ
      },
    });

    const workerAgentWrapperLambda = new PythonFunction(this, 'WorkerAgentWrapper', {
      runtime: lambda.Runtime.PYTHON_3_11,
      entry: path.join(__dirname, '../../../arbiter/workerWrapper'),
      handler: 'lambda_handler',
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        COMPLETION_BUS_NAME: props.agentEventBus.eventBusName,
        AGENT_CONFIG_TABLE: props.agentConfigTable.tableName,
        AGENT_BUCKET_NAME: code_bucket.bucketName,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
          resources: ['*'],
        }),
      ],
    });

    props.agentEventBus.grantPutEventsTo(workerAgentWrapperLambda);
    props.agentConfigTable.grantReadData(workerAgentWrapperLambda);
    code_bucket.grantRead(workerAgentWrapperLambda);

    workerAgentWrapperLambda.addEventSource(new SqsEventSource(workerAgentQueue, {
      batchSize: 1, // Process one message at a time
      reportBatchItemFailures: true, // Enable partial batch responses
    }));
    
    const toolsConfigTable = new dynamodb.Table(this, 'ToolsConfigTable', {
      tableName: `agentic-ai-factory-tools-${props.environment}`,
      partitionKey: { name: 'toolId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    const fabricatorQueue = new Queue(this, `fabricatorQueue`, {
      queueName: `agentic-ai-factory-fabricator-queue-${props.environment}`,
      visibilityTimeout: cdk.Duration.minutes(15),
      retentionPeriod: cdk.Duration.days(7),
    });

    const fabricatorLambda = new PythonFunction(this, 'FabricatorAgent', {
      runtime: lambda.Runtime.PYTHON_3_11,
      entry: path.join(__dirname, '../../../arbiter/fabricator'),
      handler: 'lambda_handler',
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        COMPLETION_BUS_NAME: props.agentEventBus.eventBusName,
        WORKFLOW_STATE_TABLE: workerStateTable.tableName,
        AGENT_CONFIG_TABLE: props.agentConfigTable.tableName,
        TOOLS_CONFIG_TABLE: toolsConfigTable.tableName,
        AGENT_BUCKET_NAME: code_bucket.bucketName,
        WORKER_QUEUE_URL: workerAgentQueue.queueUrl,
      },
      initialPolicy: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['bedrock:*'],
          resources: ['*'],
        }),
      ],
    });

    props.agentEventBus.grantPutEventsTo(fabricatorLambda);
    workerStateTable.grantReadWriteData(fabricatorLambda);
    props.agentConfigTable.grantReadWriteData(fabricatorLambda);
    toolsConfigTable.grantReadWriteData(fabricatorLambda);
    code_bucket.grantReadWrite(fabricatorLambda);

    fabricatorLambda.addEventSource(new SqsEventSource(fabricatorQueue));

    // Seed initial agent configuration
    const seedAgentConfigLambda = new lambda.Function(this, 'SeedAgentConfigFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../arbiter/seedConfig')),
      timeout: cdk.Duration.seconds(30),
      environment: {
        AGENT_CONFIG_TABLE: props.agentConfigTable.tableName,
        WORKER_QUEUE_URL: workerAgentQueue.queueUrl,
        FABRICATOR_QUEUE_URL: fabricatorQueue.queueUrl,
      },
    });

    props.agentConfigTable.grantWriteData(seedAgentConfigLambda);

    // Invoke the Custom Resource to seed agent config table
    // This must come after fabricatorQueue is created since we pass its URL
    const seedAgentConfigResource = new cdk.CustomResource(this, 'SeedAgentConfigResource', {
      serviceToken: seedAgentConfigLambda.functionArn,
      properties: {
        // Trigger update when these values change
        Timestamp: Date.now().toString(),
      },
    });

    // Ensure the Custom Resource runs after the table and queue are created
    seedAgentConfigResource.node.addDependency(props.agentConfigTable);
    seedAgentConfigResource.node.addDependency(fabricatorQueue);

  }
}