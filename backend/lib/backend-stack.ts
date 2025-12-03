import * as cdk from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as path from 'path';
import { Construct } from "constructs";

interface BackendStackProps extends cdk.StackProps {
  environment: string;
}

export class BackendStack extends cdk.Stack {
  public readonly appSyncApi: appsync.GraphqlApi;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly agentConfigTable: dynamodb.Table;
  public readonly agentEventBus: events.EventBus;
  public readonly projectsTable: dynamodb.Table;
  public readonly conversationsTable: dynamodb.Table;
  public readonly documentBucket: any;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // EventBridge for agent coordination
    this.agentEventBus = new events.EventBus(this, "AgentEventBus", {
      eventBusName: `agentic-ai-factory-agents-${props.environment}`,
    });

    // Projects Table
    this.projectsTable = new dynamodb.Table(this, "ProjectsTable", {
      tableName: `agentic-ai-factory-projects-${props.environment}`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.projectsTable.addGlobalSecondaryIndex({
      indexName: 'OrganizationIndex',
      partitionKey: { name: 'organization', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
      tableName: `agentic-ai-factory-conversations-${props.environment}`,
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.documentBucket = new cdk.aws_s3.Bucket(this, 'DocumentBucket', {
      bucketName: `agentic-ai-factory-documents-${props.environment}-${this.account}-${this.region}`,
      versioned: true,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [cdk.aws_s3.HttpMethods.GET, cdk.aws_s3.HttpMethods.PUT, cdk.aws_s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // DynamoDB Tables
     const organisationTable = new dynamodb.Table(this, "OrganisationTable", {
      tableName: `agentic-ai-factory-organisations-${props.environment}`,
      partitionKey: { name: "orgId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });



    const agentStatusTable = new dynamodb.Table(this, "AgentStatusTable", {
      tableName: `agentic-ai-factory-agent-status-${props.environment}`,
      partitionKey: { name: "projectId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "agentId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.agentConfigTable = new dynamodb.Table(this, 'AgentConfigTable', {
      tableName: `agentic-ai-factory-agents-${props.environment}`,
      partitionKey: { name: 'agentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `agentic-ai-factory-users-${props.environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
        organization: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Groups for RBAC
    const adminGroup = new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "admin",
      description: "Full system access",
    });

    const projectManagerGroup = new cognito.CfnUserPoolGroup(
      this,
      "ProjectManagerGroup",
      {
        userPoolId: this.userPool.userPoolId,
        groupName: "project_manager",
        description: "Project management access",
      }
    );

    const architectGroup = new cognito.CfnUserPoolGroup(
      this,
      "ArchitectGroup",
      {
        userPoolId: this.userPool.userPoolId,
        groupName: "architect",
        description: "Architecture and design access",
      }
    );

    const developerGroup = new cognito.CfnUserPoolGroup(
      this,
      "DeveloperGroup",
      {
        userPoolId: this.userPool.userPoolId,
        groupName: "developer",
        description: "Development access",
      }
    );

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      userPoolClientName: `agentic-ai-factory-client-${props.environment}`,
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
      },
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });



    // Lambda functions for resolvers
    const projectResolverFunction = new lambda.Function(
      this,
      "ProjectResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "project-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          PROJECTS_TABLE: this.projectsTable.tableName,
          CONVERSATIONS_TABLE: this.conversationsTable.tableName,
          AGENT_STATUS_TABLE: agentStatusTable.tableName,
          EVENT_BUS_NAME: this.agentEventBus.eventBusName,
          USER_POOL_ID: this.userPool.userPoolId,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant Cognito permissions to project resolver
    projectResolverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cognito-idp:AdminGetUser'],
        resources: [this.userPool.userPoolArn],
      })
    );

    const conversationResolverFunction = new lambda.Function(
      this,
      "ConversationResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "conversation-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          PROJECTS_TABLE: this.projectsTable.tableName,
          CONVERSATIONS_TABLE: this.conversationsTable.tableName,
          AGENT_STATUS_TABLE: agentStatusTable.tableName,
          EVENT_BUS_NAME: this.agentEventBus.eventBusName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const agentResolverFunction = new lambda.Function(
      this,
      "AgentResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "agent-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          PROJECTS_TABLE: this.projectsTable.tableName,
          CONVERSATIONS_TABLE: this.conversationsTable.tableName,
          AGENT_STATUS_TABLE: agentStatusTable.tableName,
          EVENT_BUS_NAME: this.agentEventBus.eventBusName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const documentUploadResolverFunction = new lambda.Function(
      this,
      "DocumentUploadResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "document-upload-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          DOCUMENT_BUCKET: this.documentBucket.bucketName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const agentConfigResolverFunction = new lambda.Function(
      this,
      "AgentConfigResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "agent-config-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          AGENT_CONFIG_TABLE: this.agentConfigTable.tableName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const toolConfigResolverFunction = new lambda.Function(
      this,
      "ToolConfigResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "tool-config-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          TOOLS_CONFIG_TABLE: `agentic-ai-factory-tools-${props.environment}`,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const fabricatorRequestResolverFunction = new lambda.Function(
      this,
      "FabricatorRequestResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "fabricator-request-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          FABRICATOR_QUEUE_URL: `https://sqs.${this.region}.amazonaws.com/${this.account}/agentic-ai-factory-fabricator-queue-${props.environment}`,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to Lambda functions
    this.projectsTable.grantReadWriteData(projectResolverFunction);
    this.conversationsTable.grantReadWriteData(projectResolverFunction);
    agentStatusTable.grantReadWriteData(projectResolverFunction);

    this.conversationsTable.grantReadWriteData(conversationResolverFunction);
    agentStatusTable.grantReadWriteData(conversationResolverFunction);
    this.projectsTable.grantReadData(conversationResolverFunction);

    agentStatusTable.grantReadWriteData(agentResolverFunction);
    this.projectsTable.grantReadData(agentResolverFunction);

    // Grant S3 permissions for document upload
    this.documentBucket.grantPut(documentUploadResolverFunction);

    // Grant permissions for agent config
    this.agentConfigTable.grantReadWriteData(agentConfigResolverFunction);

    // Grant permissions for tool config
    toolConfigResolverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/agentic-ai-factory-tools-${props.environment}`,
        ],
      })
    );

    // Grant permissions for fabricator request
    fabricatorRequestResolverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
        resources: [
          `arn:aws:sqs:${this.region}:${this.account}:agentic-ai-factory-fabricator-queue-${props.environment}`,
        ],
      })
    );

    // Task Runner Resolver
    const taskRunnerResolverFunction = new lambda.Function(
      this,
      "TaskRunnerResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "task-runner-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          AGENT_EVENT_BUS_NAME: this.agentEventBus.eventBusName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // User Management Resolver
    const userManagementResolverFunction = new lambda.Function(
      this,
      "UserManagementResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "user-management-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          USER_POOL_ID: this.userPool.userPoolId,
          ORGANISATION_TABLE: organisationTable.tableName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant Cognito permissions to user management function
    userManagementResolverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:ListUsers',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:ListGroups',
        ],
        resources: [this.userPool.userPoolArn],
      })
    );

    // Grant DynamoDB permissions to user management function
    organisationTable.grantReadData(userManagementResolverFunction);

    // Seed Organizations Custom Resource
    const seedOrganizationsLambda = new lambda.Function(this, "SeedOrganizationsFunction", {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(__dirname,"../../src/lambda/seed-organizations")),
        timeout: cdk.Duration.seconds(30),
        environment: {
          ORGANISATION_TABLE: organisationTable.tableName,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      });

    organisationTable.grantWriteData(seedOrganizationsLambda);

    // Create Custom Resource to seed organizations
    const seedOrganizationsResource = new cdk.CustomResource(
      this,
      "SeedOrganizationsResource",
      {
        serviceToken: seedOrganizationsLambda.functionArn,
        properties: {
          // Trigger update when timestamp changes
          Timestamp: Date.now().toString(),
        },
      }
    );

    // Ensure the Custom Resource runs after the table is created
    seedOrganizationsResource.node.addDependency(organisationTable);

    // Seed Admin User Custom Resource
    const seedAdminUserLambda = new lambda.Function(
      this,
      "SeedAdminUserFunction",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "index.handler",
        code: lambda.Code.fromAsset("src/lambda/seed-admin-user"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          USER_POOL_ID: this.userPool.userPoolId,
          ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
          ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME || 'Admin',
          ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME || 'User',
          ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant Cognito permissions to seed admin user function
    seedAdminUserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminSetUserPassword',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminUpdateUserAttributes',
        ],
        resources: [this.userPool.userPoolArn],
      })
    );

    // Create Custom Resource to seed admin user
    const seedAdminUserResource = new cdk.CustomResource(
      this,
      "SeedAdminUserResource",
      {
        serviceToken: seedAdminUserLambda.functionArn,
        properties: {
          // Trigger update when these values change
          Timestamp: Date.now().toString(),
          AdminEmail: process.env.ADMIN_EMAIL || '',
        },
      }
    );

    // Ensure the Custom Resource runs after user pool and admin group are created
    seedAdminUserResource.node.addDependency(this.userPool);
    seedAdminUserResource.node.addDependency(adminGroup);

    // Grant EventBridge permissions
    this.agentEventBus.grantPutEventsTo(projectResolverFunction);
    this.agentEventBus.grantPutEventsTo(conversationResolverFunction);
    this.agentEventBus.grantPutEventsTo(agentResolverFunction);
    this.agentEventBus.grantPutEventsTo(taskRunnerResolverFunction);

    // AppSync GraphQL API (create early so we can reference it)
    this.appSyncApi = new appsync.GraphqlApi(this, "AgenticAIApi", {
      name: `agentic-ai-factory-api-${props.environment}`,
      schema: appsync.SchemaFile.fromAsset("src/schema/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: this.userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.IAM,
          },
        ],
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_WEEK,
      },
      xrayEnabled: true,
    });

    // Lambda function for handling agent messages
    const agentMessageHandlerFunction = new lambda.Function(
      this,
      "AgentMessageHandlerFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "agent-message-handler.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          PROJECTS_TABLE: this.projectsTable.tableName,
          CONVERSATIONS_TABLE: this.conversationsTable.tableName,
          AGENT_STATUS_TABLE: agentStatusTable.tableName,
          APPSYNC_ENDPOINT: this.appSyncApi.graphqlUrl,
          ENVIRONMENT: props.environment,
        },
        timeout: cdk.Duration.minutes(5), // Longer timeout for agent interactions
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant permissions to read SSM parameters for agent configuration
    agentMessageHandlerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/agentic-ai-factory/agents/*`,
        ],
      })
    );

    // Grant permissions to invoke Bedrock AgentCore Runtime
    agentMessageHandlerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock-agentcore:InvokeAgentRuntime",
          "bedrock-agentcore:InvokeAgent",
          "bedrock:InvokeModel",
        ],
        resources: ["*"], // AgentCore agents can be in different regions
      })
    );

    // Grant DynamoDB permissions for storing responses
    this.conversationsTable.grantReadWriteData(agentMessageHandlerFunction);
    agentStatusTable.grantReadWriteData(agentMessageHandlerFunction);

    // Grant AppSync permissions to trigger mutations
    agentMessageHandlerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["appsync:GraphQL"],
        resources: [
          `${this.appSyncApi.arn}/types/Mutation/fields/publishConversationMessage`,
        ],
      })
    );

    // EventBridge rule for message.sent_to_agent events
    const messageSentToAgentRule = new events.Rule(
      this,
      "MessageSentToAgentRule",
      {
        eventBus: this.agentEventBus,
        ruleName: `agentic-ai-factory-message-to-agent-${props.environment}`,
        description: "Triggers Lambda when a message is sent to an agent",
        eventPattern: {
          detailType: ["message.sent_to_agent"],
          source: ["agentic-ai-factory"],
        },
      }
    );

    // Add Lambda as target for the rule
    messageSentToAgentRule.addTarget(
      new targets.LambdaFunction(agentMessageHandlerFunction, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(2),
      })
    );

    // Project Progress Updater Lambda
    const projectProgressUpdater = new lambda.Function(
      this,
      'ProjectProgressUpdater',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'project-progress-updater.handler',
        code: lambda.Code.fromAsset('dist/lambda'),
        environment: {
          PROJECTS_TABLE: this.projectsTable.tableName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    this.projectsTable.grantReadWriteData(projectProgressUpdater);

    // Assessment Completion Notifier Lambda
    const assessmentCompletionNotifier = new lambda.Function(
      this,
      'AssessmentCompletionNotifier',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'assessment-completion-notifier.handler',
        code: lambda.Code.fromAsset('dist/lambda'),
        environment: {
          APPSYNC_ENDPOINT: this.appSyncApi.graphqlUrl,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    this.appSyncApi.grantMutation(assessmentCompletionNotifier, 'publishAssessmentCompletion');

    // EventBridge rule for assessment completion
    const assessmentCompletionRule = new events.Rule(
      this,
      'AssessmentCompletionRule',
      {
        eventBus: this.agentEventBus,
        ruleName: `agentic-ai-factory-assessment-completion-${props.environment}`,
        description: 'Triggers when all assessment dimensions are complete',
        eventPattern: {
          detailType: ['assessment.completed'],
          source: ['agentic-ai-factory.assessment'],
        },
      }
    );

    assessmentCompletionRule.addTarget(
      new targets.LambdaFunction(assessmentCompletionNotifier, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(2),
      })
    );

    // Design Progress Notifier Lambda
    const designProgressNotifier = new lambda.Function(
      this,
      'DesignProgressNotifier',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'design-progress-notifier.handler',
        code: lambda.Code.fromAsset('dist/lambda'),
        environment: {
          APPSYNC_ENDPOINT: this.appSyncApi.graphqlUrl,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    this.appSyncApi.grantMutation(designProgressNotifier, 'publishDesignProgress');

    // EventBridge rule for design progress updates
    const designProgressRule = new events.Rule(
      this,
      'DesignProgressRule',
      {
        eventBus: this.agentEventBus,
        ruleName: `agentic-ai-factory-design-progress-${props.environment}`,
        description: 'Triggers when design section progress is updated',
        eventPattern: {
          detailType: ['design.progress.updated'],
          source: ['agent2.design'],
        },
      }
    );

    designProgressRule.addTarget(
      new targets.LambdaFunction(designProgressNotifier, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(2),
      })
    );

    // Chatter Publisher Lambda - publishes all EventBridge messages to AppSync
    const chatterPublisherFunction = new lambda.Function(
      this,
      "ChatterPublisherFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "chatter-publisher.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          APPSYNC_ENDPOINT: this.appSyncApi.graphqlUrl,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant AppSync permissions to chatter publisher
    chatterPublisherFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["appsync:GraphQL"],
        resources: [
          `${this.appSyncApi.arn}/types/Mutation/fields/publishChatter`,
        ],
      })
    );

    // Chatter Resolver Lambda
    const chatterResolverFunction = new lambda.Function(
      this,
      "ChatterResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "chatter-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // EventBridge rule for ALL agent chatter - captures all messages on the bus
    const chatterRule = new events.Rule(
      this,
      'ChatterRule',
      {
        eventBus: this.agentEventBus,
        ruleName: `agentic-ai-factory-chatter-${props.environment}`,
        description: 'Captures all agent communication for real-time display',
        // Match all events on this bus by not specifying a pattern
        eventPattern: {
          source: [ { prefix: ''} ] as any[]
        },
      }
    );

    chatterRule.addTarget(
      new targets.LambdaFunction(chatterPublisherFunction, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(2),
      })
    );

    // EventBridge rule for progress updates
    const progressUpdateRule = new events.Rule(
      this,
      'ProgressUpdateRule',
      {
        eventBus: this.agentEventBus,
        ruleName: `agentic-ai-factory-progress-update-${props.environment}`,
        description: 'Updates project progress from agent events',
        eventPattern: {
          detailType: ['assessment.progress.updated', 'design.progress.updated'],
          source: ['agent1.assessment', 'agent2.design'],
        },
      }
    );

    progressUpdateRule.addTarget(
      new targets.LambdaFunction(projectProgressUpdater, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(2),
      })
    );

    // Data sources
    const projectsDataSource = this.appSyncApi.addDynamoDbDataSource(
      "ProjectsDataSource",
      this.projectsTable
    );
    const conversationsDataSource = this.appSyncApi.addDynamoDbDataSource(
      "ConversationsDataSource",
      this.conversationsTable
    );
    const agentStatusDataSource = this.appSyncApi.addDynamoDbDataSource(
      "AgentStatusDataSource",
      agentStatusTable
    );
    const projectLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "ProjectLambdaDataSource",
      projectResolverFunction
    );
    const conversationLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "ConversationLambdaDataSource",
      conversationResolverFunction
    );
    const agentLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "AgentLambdaDataSource",
      agentResolverFunction
    );
    const documentUploadLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "DocumentUploadLambdaDataSource",
      documentUploadResolverFunction
    );
    const agentConfigLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "AgentConfigLambdaDataSource",
      agentConfigResolverFunction
    );
    const toolConfigLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "ToolConfigLambdaDataSource",
      toolConfigResolverFunction
    );
    const fabricatorRequestLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "FabricatorRequestLambdaDataSource",
      fabricatorRequestResolverFunction
    );
    const taskRunnerLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "TaskRunnerLambdaDataSource",
      taskRunnerResolverFunction
    );
    const userManagementLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "UserManagementLambdaDataSource",
      userManagementResolverFunction
    );
    const chatterLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "ChatterLambdaDataSource",
      chatterResolverFunction
    );

    // Query resolvers
    projectLambdaDataSource.createResolver("GetProjectResolver", {
      typeName: "Query",
      fieldName: "getProject",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    projectLambdaDataSource.createResolver("ListProjectsResolver", {
      typeName: "Query",
      fieldName: "listProjects",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    agentLambdaDataSource.createResolver("GetAgentStatusResolver", {
      typeName: "Query",
      fieldName: "getAgentStatus",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    conversationLambdaDataSource.createResolver(
      "GetConversationHistoryResolver",
      {
        typeName: "Query",
        fieldName: "getConversationHistory",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      }
    );

    agentConfigLambdaDataSource.createResolver("ListAgentConfigsResolver", {
      typeName: "Query",
      fieldName: "listAgentConfigs",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    agentConfigLambdaDataSource.createResolver("GetAgentConfigResolver", {
      typeName: "Query",
      fieldName: "getAgentConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    conversationLambdaDataSource.createResolver("SendMessageResolver", {
      typeName: "Mutation",
      fieldName: "sendMessage",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    conversationLambdaDataSource.createResolver(
      "PublishConversationMessageResolver",
      {
        typeName: "Mutation",
        fieldName: "publishConversationMessage",
        requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
        responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
      }
    );

    // Mutation resolvers
    projectLambdaDataSource.createResolver("CreateProjectResolver", {
      typeName: "Mutation",
      fieldName: "createProject",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    projectLambdaDataSource.createResolver("UpdateProjectResolver", {
      typeName: "Mutation",
      fieldName: "updateProject",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    conversationLambdaDataSource.createResolver("SendMessageToAgentResolver", {
      typeName: "Mutation",
      fieldName: "sendMessageToAgent",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    projectLambdaDataSource.createResolver("UploadDocumentResolver", {
      typeName: "Mutation",
      fieldName: "uploadDocument",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    documentUploadLambdaDataSource.createResolver("GenerateDocumentUploadUrlResolver", {
      typeName: "Mutation",
      fieldName: "generateDocumentUploadUrl",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    agentConfigLambdaDataSource.createResolver("CreateAgentConfigResolver", {
      typeName: "Mutation",
      fieldName: "createAgentConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    agentConfigLambdaDataSource.createResolver("UpdateAgentConfigResolver", {
      typeName: "Mutation",
      fieldName: "updateAgentConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    agentConfigLambdaDataSource.createResolver("DeleteAgentConfigResolver", {
      typeName: "Mutation",
      fieldName: "deleteAgentConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Tool Config Resolvers
    toolConfigLambdaDataSource.createResolver("ListToolConfigsResolver", {
      typeName: "Query",
      fieldName: "listToolConfigs",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    toolConfigLambdaDataSource.createResolver("GetToolConfigResolver", {
      typeName: "Query",
      fieldName: "getToolConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    toolConfigLambdaDataSource.createResolver("CreateToolConfigResolver", {
      typeName: "Mutation",
      fieldName: "createToolConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    toolConfigLambdaDataSource.createResolver("UpdateToolConfigResolver", {
      typeName: "Mutation",
      fieldName: "updateToolConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    toolConfigLambdaDataSource.createResolver("DeleteToolConfigResolver", {
      typeName: "Mutation",
      fieldName: "deleteToolConfig",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Fabricator Request Resolver
    fabricatorRequestLambdaDataSource.createResolver("RequestAgentCreationResolver", {
      typeName: "Mutation",
      fieldName: "requestAgentCreation",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Task Runner Resolver
    taskRunnerLambdaDataSource.createResolver("SubmitTaskResolver", {
      typeName: "Mutation",
      fieldName: "submitTask",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // User Management Resolvers
    userManagementLambdaDataSource.createResolver("ListUsersResolver", {
      typeName: "Query",
      fieldName: "listUsers",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    userManagementLambdaDataSource.createResolver("GetUserResolver", {
      typeName: "Query",
      fieldName: "getUser",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    userManagementLambdaDataSource.createResolver("GetCurrentUserProfileResolver", {
      typeName: "Query",
      fieldName: "getCurrentUserProfile",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    userManagementLambdaDataSource.createResolver("AssignUserRoleResolver", {
      typeName: "Mutation",
      fieldName: "assignUserRole",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    userManagementLambdaDataSource.createResolver("RemoveUserRoleResolver", {
      typeName: "Mutation",
      fieldName: "removeUserRole",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    userManagementLambdaDataSource.createResolver("ListAvailableRolesResolver", {
      typeName: "Query",
      fieldName: "listAvailableRoles",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    userManagementLambdaDataSource.createResolver("ListOrganizationsResolver", {
      typeName: "Query",
      fieldName: "listOrganizations",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Chatter Resolver
    chatterLambdaDataSource.createResolver("PublishChatterResolver", {
      typeName: "Mutation",
      fieldName: "publishChatter",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Assessment Completion Resolver
    const assessmentCompletionResolverFunction = new lambda.Function(
      this,
      "AssessmentCompletionResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "assessment-completion-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const assessmentCompletionLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "AssessmentCompletionLambdaDataSource",
      assessmentCompletionResolverFunction
    );

    assessmentCompletionLambdaDataSource.createResolver("PublishAssessmentCompletionResolver", {
      typeName: "Mutation",
      fieldName: "publishAssessmentCompletion",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Assessment Progress Resolver
    const sessionMemoryTableName = `agentic-ai-factory-session-memory-${props.environment}`;
    const sessionMemoryTableArn = `arn:aws:dynamodb:${this.region}:${this.account}:table/agentic-ai-factory-session-memory-${props.environment}`;

    const assessmentProgressResolverFunction = new lambda.Function(
      this,
      "AssessmentProgressResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "assessment-progress-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          SESSION_MEMORY_TABLE: sessionMemoryTableName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    assessmentProgressResolverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:GetItem', 'dynamodb:Query'],
        resources: [sessionMemoryTableArn],
      })
    );

    const assessmentProgressLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "AssessmentProgressLambdaDataSource",
      assessmentProgressResolverFunction
    );

    assessmentProgressLambdaDataSource.createResolver("GetAssessmentProgressResolver", {
      typeName: "Query",
      fieldName: "getAssessmentProgress",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });



    // Design Progress Resolver
    const designProgressResolverFunction = new lambda.Function(
      this,
      "DesignProgressResolverFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "design-progress-resolver.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    const designProgressLambdaDataSource = this.appSyncApi.addLambdaDataSource(
      "DesignProgressLambdaDataSource",
      designProgressResolverFunction
    );

    designProgressLambdaDataSource.createResolver("PublishDesignProgressResolver", {
      typeName: "Mutation",
      fieldName: "publishDesignProgress",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Report Download URL Generator
    const sessionBucketName = `agentic-ai-factory-sessions-${props.environment}-${this.account}-${this.region}`;

    const generateReportUrlFunction = new lambda.Function(
      this,
      "GenerateReportUrlFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "generate-report-url.handler",
        code: lambda.Code.fromAsset("dist/lambda"),
        environment: {
          SESSION_BUCKET: sessionBucketName,
          PROJECTS_TABLE: this.projectsTable.tableName,
        },
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    generateReportUrlFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::${sessionBucketName}/*`,
          `arn:aws:s3:::${sessionBucketName}`
        ],
      })
    );
    this.projectsTable.grantReadData(generateReportUrlFunction);

    const generateReportUrlDataSource = this.appSyncApi.addLambdaDataSource(
      "GenerateReportUrlDataSource",
      generateReportUrlFunction
    );

    generateReportUrlDataSource.createResolver("GenerateReportDownloadUrlResolver", {
      typeName: "Query",
      fieldName: "generateReportDownloadUrl",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    // Subscription resolvers (handled by AppSync automatically with proper schema)


    // Outputs
    new cdk.CfnOutput(this, "GraphQLApiUrl", {
      value: this.appSyncApi.graphqlUrl,
      description: "GraphQL API URL",
    });

    new cdk.CfnOutput(this, "GraphQLApiId", {
      value: this.appSyncApi.apiId,
      description: "GraphQL API ID",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });



    // Export outputs for cross-stack references
    new cdk.CfnOutput(this, "GraphQLApiUrlExport", {
      value: this.appSyncApi.graphqlUrl,
      exportName: `${this.stackName}-GraphQLApiUrl`,
    });

    new cdk.CfnOutput(this, "UserPoolIdExport", {
      value: this.userPool.userPoolId,
      exportName: `${this.stackName}-UserPoolId`,
    });

    new cdk.CfnOutput(this, "UserPoolClientIdExport", {
      value: this.userPoolClient.userPoolClientId,
      exportName: `${this.stackName}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, "AgentMessageHandlerFunctionArn", {
      value: agentMessageHandlerFunction.functionArn,
      description: "Agent Message Handler Lambda Function ARN",
    });

    new cdk.CfnOutput(this, "EventBusName", {
      value: this.agentEventBus.eventBusName,
      description: "EventBridge Event Bus Name",
      exportName: `${this.stackName}-EventBusName`,
    });
  }
}
