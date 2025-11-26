import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as bedrockagentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as agentcore from '@aws-cdk/aws-bedrock-agentcore-alpha';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ServicesStackProps extends cdk.StackProps {
  complianceKnowledgeBaseId: string;
  integrationsKnowledgeBaseId: string;
  fileSourcesKnowledgeBaseId: string;
  environment: string;
}

export class ServicesStack extends cdk.Stack {
  public readonly conversationsTable: dynamodb.Table;
  public readonly sessionMemoryTable: dynamodb.Table;
  public readonly sessionBucket: s3.Bucket;
  public readonly documentBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ServicesStackProps) {
      super(scope, id, props);
  
      this.conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
        tableName: `agentic-ai-factory-conversations-${props.environment}`,
        partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
      });

      // Common Infrastructure - Session Memory
      this.sessionMemoryTable = new dynamodb.Table(this, 'SessionMemoryTable', {
        tableName: `agentic-ai-factory-session-memory-${props.environment}`,
        partitionKey: { name: 'p_key', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 's_key', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        timeToLiveAttribute: 'ttl',
      });

      // Common Infrastructure - Session Data Bucket
      this.sessionBucket = new s3.Bucket(this, 'SessionBucket', {
        bucketName: `agentic-ai-factory-sessions-${props.environment}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteOldSessions',
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
      });

      // Bedrock Data Automation Blueprints - Trimmed for efficiency
      const technicalBlueprint = new bedrock.CfnBlueprint(this, 'TechnicalBlueprint', {
        blueprintName: `aifactory-technical-${props.environment}`,
        type: 'DOCUMENT',
        schema: {
          "class": "Technical Feasibility Assessment",
          "description": "Technical readiness assessment for agentic AI transformation",
          "properties": {
            "System Architecture": { "type": "string", "inferenceType": "explicit", "instruction": "Current architecture type and cloud maturity" },
            "Core Technologies": { "type": "string", "inferenceType": "explicit", "instruction": "Platforms, languages, and key technologies" },
            "Integration Landscape": { "type": "string", "inferenceType": "explicit", "instruction": "Integration patterns, protocols, and systems" },
            "Data Infrastructure": { "type": "string", "inferenceType": "explicit", "instruction": "Data sources, storage, governance, and sensitivity" },
            "Security Posture": { "type": "string", "inferenceType": "explicit", "instruction": "IAM, encryption, network security, and monitoring" },
            "Observability": { "type": "string", "inferenceType": "explicit", "instruction": "Logging, monitoring, tracing, and alerting" },
            "AI ML Experience": { "type": "string", "inferenceType": "explicit", "instruction": "Current AI/ML capabilities and model experience" },
            "Performance Requirements": { "type": "string", "inferenceType": "explicit", "instruction": "SLAs, volumes, scalability, and DR needs" },
            "DevOps Maturity": { "type": "string", "inferenceType": "explicit", "instruction": "CI/CD, IaC, testing, and deployment practices" }
          }
        }
      });

      const businessBlueprint = new bedrock.CfnBlueprint(this, 'BusinessBlueprint', {
        blueprintName: `aifactory-business-${props.environment}`,
        type: 'DOCUMENT',
        schema: {
          "class": "Business Feasibility Assessment",
          "description": "Business feasibility assessment for agentic AI transformation",
          "properties": {
            "Business Objectives": { "type": "string", "inferenceType": "explicit", "instruction": "Primary objectives, success metrics, and strategic alignment" },
            "Stakeholder Landscape": { "type": "string", "inferenceType": "explicit", "instruction": "Executive sponsorship, key stakeholders, and buy-in status" },
            "Organizational Culture": { "type": "string", "inferenceType": "explicit", "instruction": "Innovation appetite, risk tolerance, and transformation experience" },
            "User Adoption": { "type": "string", "inferenceType": "explicit", "instruction": "End users, technology proficiency, and attitudes toward AI" },
            "Change Management": { "type": "string", "inferenceType": "explicit", "instruction": "Change capability, communication plans, and training approach" },
            "Process Maturity": { "type": "string", "inferenceType": "explicit", "instruction": "Process documentation, automation level, and complexity" },
            "Skills and Capabilities": { "type": "string", "inferenceType": "explicit", "instruction": "Current skills, gaps, and hiring/training plans" },
            "Success Metrics": { "type": "string", "inferenceType": "explicit", "instruction": "KPIs, baselines, targets, and measurement approach" }
          }
        },
      });

      const commercialBlueprint = new bedrock.CfnBlueprint(this, 'CommercialBlueprint', {
        blueprintName: `aifactory-commercial-${props.environment}`,
        type: 'DOCUMENT',
        schema: {
          "class": "Commercial and Economics Assessment",
          "description": "Commercial and economic assessment for agentic AI transformation",
          "properties": {
            "Budget and Investment": { "type": "string", "inferenceType": "explicit", "instruction": "Total budget, breakdown, approval status, and funding source" },
            "Cost Modeling": { "type": "string", "inferenceType": "explicit", "instruction": "Cost estimation methodology and AI cost drivers understanding" },
            "Operational Costs": { "type": "string", "inferenceType": "explicit", "instruction": "Ongoing costs, usage projections, and optimization strategies" },
            "ROI Expectations": { "type": "string", "inferenceType": "explicit", "instruction": "Expected ROI, payback period, and calculation methodology" },
            "Resource Allocation": { "type": "string", "inferenceType": "explicit", "instruction": "Team size, composition, availability, and competing priorities" },
            "Cost Benefit Analysis": { "type": "string", "inferenceType": "explicit", "instruction": "Current costs, efficiency gains, and quantifiable benefits" },
            "Financial Governance": { "type": "string", "inferenceType": "explicit", "instruction": "Budget tracking, approval thresholds, and controls" },
            "Economic Viability": { "type": "string", "inferenceType": "explicit", "instruction": "Market conditions, competitive pressure, and strategic value" }
          }
        },
      });

      const governanceBlueprint = new bedrock.CfnBlueprint(this, 'GovernanceBlueprint', {
        blueprintName: `aifactory-governance-${props.environment}`,
        type: 'DOCUMENT',
        schema: {
          "class": "Governance Risk and Compliance Assessment",
          "description": "Governance, risk, and compliance assessment for agentic AI transformation",
          "properties": {
            "AI Governance": { "type": "string", "inferenceType": "explicit", "instruction": "AI policies, oversight committees, and responsible AI principles" },
            "Regulatory Compliance": { "type": "string", "inferenceType": "explicit", "instruction": "Industry regulations, data privacy laws, and AI-specific requirements" },
            "Risk Management": { "type": "string", "inferenceType": "explicit", "instruction": "Risk framework, appetite for autonomy, and mitigation strategies" },
            "Data Governance": { "type": "string", "inferenceType": "explicit", "instruction": "Data ownership, classification, lineage, and access controls" },
            "Model Governance": { "type": "string", "inferenceType": "explicit", "instruction": "Model documentation, explainability, bias detection, and monitoring" },
            "Audit and Traceability": { "type": "string", "inferenceType": "explicit", "instruction": "Audit logging, decision traceability, and compliance reporting" },
            "Security Governance": { "type": "string", "inferenceType": "explicit", "instruction": "Security certifications, assessments, and incident response" },
            "Change Approval": { "type": "string", "inferenceType": "explicit", "instruction": "Change management process, approval authority, and impact assessment" }
          }
        },
      });

      // Cognito User Pool for AgentCore Gateway OAuth
      const gatewayUserPool = new cognito.UserPool(this, 'GatewayUserPool', {
        userPoolName: `agentic-ai-factory-gateway-${props.environment}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Cognito Domain for OAuth token endpoint
      const gatewayDomain = gatewayUserPool.addDomain('GatewayDomain', {
        cognitoDomain: {
          domainPrefix: `agentic-ai-factory-gateway-${props.environment}-${cdk.Stack.of(this).account}`,
        },
      });

      // Cognito User Pool Client (M2M) with client credentials flow
      const gatewayClient = gatewayUserPool.addClient('GatewayClient', {
        userPoolClientName: `gateway-m2m-client-${props.environment}`,
        generateSecret: true,
        authFlows: {
          userPassword: false,
          userSrp: false,
          custom: false,
        },
        oAuth: {
          flows: {
            clientCredentials: true,
          },
          scopes: [cognito.OAuthScope.custom('confluence/read')],
        },
      });

      // Resource Server for custom scopes
      const gatewayResourceServer = gatewayUserPool.addResourceServer('GatewayResourceServer', {
        identifier: 'confluence',
        scopes: [
          {
            scopeName: 'read',
            scopeDescription: 'Read access to Confluence via Gateway',
          },
        ],
      });

      // Ensure resource server is created before client
      gatewayClient.node.addDependency(gatewayResourceServer);

      // IAM Role for Gateway
      const gatewayRole = new iam.Role(this, 'GatewayRole', {
        roleName: `agentic-ai-factory-gateway-role-${props.environment}`,
        path: '/service-role/',
        assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
        description: 'Execution role for AgentCore Gateway',
      });

      // AgentCore Gateway (CloudFormation L1 construct)
      const gateway = new bedrockagentcore.CfnGateway(this, 'AgentCoreGateway', {
        name: `agentic-ai-factory-gateway-${props.environment}`,
        authorizerType: 'CUSTOM_JWT',
        protocolType: 'MCP',
        roleArn: gatewayRole.roleArn,
        authorizerConfiguration: {
          customJwtAuthorizer: {
            allowedClients: [gatewayClient.userPoolClientId],
            discoveryUrl: `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${gatewayUserPool.userPoolId}/.well-known/openid-configuration`,
          },
        },
      });

      // Gateway Base Policy - GetGateway permission
      gatewayRole.addToPolicy(new iam.PolicyStatement({
        sid: 'GetGateway',
        effect: iam.Effect.ALLOW,
        actions: ['bedrock-agentcore:GetGateway'],
        resources: [gateway.attrGatewayArn],
      }));

      // Gateway API Key Policy - Workload identity and secrets access
      gatewayRole.addToPolicy(new iam.PolicyStatement({
        sid: 'GetWorkloadAccessToken',
        effect: iam.Effect.ALLOW,
        actions: ['bedrock-agentcore:GetWorkloadAccessToken'],
        resources: [
          `arn:aws:bedrock-agentcore:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:workload-identity-directory/default`,
          `arn:aws:bedrock-agentcore:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:workload-identity-directory/default/workload-identity/${gateway.name}-*`,
        ],
      }));

      gatewayRole.addToPolicy(new iam.PolicyStatement({
        sid: 'GetResourceApiKey',
        effect: iam.Effect.ALLOW,
        actions: ['bedrock-agentcore:GetResourceApiKey'],
        resources: [
          `arn:aws:bedrock-agentcore:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:token-vault/default`,
          `arn:aws:bedrock-agentcore:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:token-vault/default/apikeycredentialprovider/*`,
          `arn:aws:bedrock-agentcore:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:workload-identity-directory/default`,
          `arn:aws:bedrock-agentcore:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:workload-identity-directory/default/workload-identity/${gateway.name}-*`,
        ],
      }));

      // Get Confluence domain from context or use default
      const confluenceDomain = this.node.tryGetContext('confluenceDomain') || 'snathanausamzn.atlassian.net';

      // Secrets Manager Secret for OAuth credentials (placeholder, will be updated by Custom Resource)
      const gatewaySecret = new secretsmanager.Secret(this, 'GatewayOAuthSecret', {
        secretName: `agentic-ai-factory/gateway-oauth-${props.environment}`,
        description: 'OAuth credentials for AgentCore Gateway Confluence integration',
        secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
          client_id: 'placeholder',
          client_secret: 'placeholder',
          token_url: 'placeholder',
          confluence_domain: 'placeholder',
        })),
      });

      // Ensure gatewaySecret is created after gatewayDomain
      gatewaySecret.node.addDependency(gatewayDomain);

      // Lambda function to fetch Cognito client secret and update Secrets Manager
      const cognitoSecretHandler = new lambda.Function(this, 'CognitoSecretHandler', {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../../src/lambda/cognito-secret-handler')),
        timeout: cdk.Duration.seconds(30),
      });

      // Grant permissions to Lambda
      cognitoSecretHandler.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cognito-idp:DescribeUserPoolClient'],
        resources: [gatewayUserPool.userPoolArn],
      }));
 
      gatewaySecret.grantWrite(cognitoSecretHandler);

      // Custom Resource to sync Cognito client secret to Secrets Manager
      const cognitoSecretSync = new cr.AwsCustomResource(this, 'CognitoSecretSync', {
        onCreate: {
          service: 'Lambda',
          action: 'invoke',
          parameters: {
            FunctionName: cognitoSecretHandler.functionName,
            Payload: JSON.stringify({
              RequestType: 'Create',
              ResourceProperties: {
                UserPoolId: gatewayUserPool.userPoolId,
                ClientId: gatewayClient.userPoolClientId,
                SecretArn: gatewaySecret.secretArn,
                TokenUrl: `https://${gatewayDomain.domainName}.auth.${cdk.Stack.of(this).region}.amazoncognito.com/oauth2/token`,
                ConfluenceDomain: confluenceDomain,
                Version: '2', // Increment to force update
              },
            }),
          },
          physicalResourceId: cr.PhysicalResourceId.of('CognitoSecretSync'),
        },
        onUpdate: {
          service: 'Lambda',
          action: 'invoke',
          parameters: {
            FunctionName: cognitoSecretHandler.functionName,
            Payload: JSON.stringify({
              RequestType: 'Update',
              ResourceProperties: {
                UserPoolId: gatewayUserPool.userPoolId,
                ClientId: gatewayClient.userPoolClientId,
                SecretArn: gatewaySecret.secretArn,
                TokenUrl: `https://${gatewayDomain.domainName}.auth.${cdk.Stack.of(this).region}.amazoncognito.com/oauth2/token`,
                ConfluenceDomain: confluenceDomain,
                Version: '2', // Increment to force update
              },
            }),
          },
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['lambda:InvokeFunction'],
            resources: [cognitoSecretHandler.functionArn],
          }),
        ]),
      });

      cognitoSecretSync.node.addDependency(gatewayClient);
      cognitoSecretSync.node.addDependency(gatewaySecret);

      // Grant Gateway role access to read OAuth secret
      gatewaySecret.grantRead(gatewayRole);

      // Grant Gateway role access to bedrock-agentcore-identity secrets
      gatewayRole.addToPolicy(new iam.PolicyStatement({
        sid: 'GetSecretValue',
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:secret:bedrock-agentcore-identity!default/apikey/confluence-${props.environment}-*`,
        ],
      }));

      // Optional: Confluence Integration
      // Only create if SSM parameters exist
      try {
        const confluenceSchemaUri = ssm.StringParameter.valueFromLookup(
          this,
          `/agentic-ai-factory/gateway/confluence-schema-uri-${props.environment}`
        );

        const confluenceCredentialProviderArn = ssm.StringParameter.valueFromLookup(
          this,
          `/agentic-ai-factory/gateway/confluence-credential-provider-${props.environment}`
        );

        // Only create Confluence target if parameters are not dummy values
        if (confluenceSchemaUri && !confluenceSchemaUri.includes('dummy-value') &&
            confluenceCredentialProviderArn && !confluenceCredentialProviderArn.includes('dummy-value')) {
          
          const confluenceTarget = new bedrockagentcore.CfnGatewayTarget(this, 'ConfluenceTarget', {
            name: 'confluence',
            gatewayIdentifier: gateway.attrGatewayIdentifier,
            targetConfiguration: {
              mcp: {
                openApiSchema: {
                  s3: {
                    uri: confluenceSchemaUri,
                  },
                },
              },
            },
            credentialProviderConfigurations: [
              {
                credentialProviderType: 'API_KEY',
                credentialProvider: {
                  apiKeyCredentialProvider: {
                    providerArn: confluenceCredentialProviderArn,
                    credentialLocation: 'HEADER',
                  },
                },
              },
            ],
          });

          new cdk.CfnOutput(this, 'ConfluenceIntegrationStatus', {
            value: 'Enabled',
            description: 'Confluence integration is configured',
          });
        } else {
          new cdk.CfnOutput(this, 'ConfluenceIntegrationStatus', {
            value: 'Disabled - SSM parameters not found',
            description: 'Confluence integration skipped (optional)',
          });
        }
      } catch (error) {
        // Parameters don't exist - skip Confluence integration
        new cdk.CfnOutput(this, 'ConfluenceIntegrationStatus', {
          value: 'Disabled - SSM parameters not configured',
          description: 'Confluence integration skipped (optional)',
        });
      }

      // Agent 1 - Document Upload Bucket
      this.documentBucket = new s3.Bucket(this, 'DocumentBucket', {
        bucketName: `agentic-ai-factory-documents-${props.environment}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
            allowedOrigins: ['*'],
            maxAge: 3000,
          },
        ],
      });



      // Agent 1 - Runtime
      const agent1Runtime = new agentcore.Runtime(this, 'Agent1Runtime', {
        runtimeName: `agent1_assessment_${props.environment}`,
        agentRuntimeArtifact: agentcore.AgentRuntimeArtifact.fromAsset(
          path.join(__dirname, '../../../service/agent1_assessment')
        ),
        description: 'Agent 1 - Document Review & Information Gathering',
        environmentVariables: {
          AWS_REGION: cdk.Stack.of(this).region,
          DOCUMENT_BUCKET: this.documentBucket.bucketName,
          SESSION_BUCKET: this.sessionBucket.bucketName,
          SESSION_MEMORY_TABLE: this.sessionMemoryTable.tableName,
          EVENT_BUS_NAME: `agentic-ai-factory-agents-${props.environment}`,
          EXTRACT_BLUEPRINT_ARN_TECHNICAL: technicalBlueprint.attrBlueprintArn,
          EXTRACT_BLUEPRINT_ARN_BUSINESS: businessBlueprint.attrBlueprintArn,
          EXTRACT_BLUEPRINT_ARN_COMMERCIAL: commercialBlueprint.attrBlueprintArn,
          EXTRACT_BLUEPRINT_ARN_GOVERNANCE: governanceBlueprint.attrBlueprintArn,
          ACGW_SECRETS_ARN: gatewaySecret.secretArn,
          AGENTCORE_GATEWAY_URL: gateway.attrGatewayUrl,
        },
      });

      // Grant permissions to Agent 1
      this.documentBucket.grantReadWrite(agent1Runtime);
      this.sessionBucket.grantReadWrite(agent1Runtime);
      this.sessionMemoryTable.grantReadWriteData(agent1Runtime);
      gatewaySecret.grantRead(agent1Runtime);

      // Grant explicit S3 permissions for Bedrock Data Automation
      agent1Runtime.grantPrincipal.addToPrincipalPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:ListBucket',
          's3:GetBucketLocation',
        ],
        resources: [
          this.documentBucket.bucketArn,
          `${this.documentBucket.bucketArn}/*`,
          this.sessionBucket.bucketArn,
          `${this.sessionBucket.bucketArn}/*`,
        ],
      }));

      // Grant Bedrock Data Automation permissions
      agent1Runtime.grantPrincipal.addToPrincipalPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      }));

      agent1Runtime.grantPrincipal.addToPrincipalPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeDataAutomationAsync',
          'bedrock:GetDataAutomationStatus',
          'bedrock:CreateDataAutomationProject',
          'bedrock:GetDataAutomationProject',
          'bedrock:ListDataAutomationProjects',
        ],
        resources: ['*'],
      }));

      // Agent 2 - Runtime
      const agent2Runtime = new agentcore.Runtime(this, 'Agent2Runtime', {
        runtimeName: `agent2_design_${props.environment}`,
        agentRuntimeArtifact: agentcore.AgentRuntimeArtifact.fromAsset(
          path.join(__dirname, '../../../service/agent2_design')
        ),
        description: 'Agent 2 - High-Level Design Generation',
        environmentVariables: {
          AWS_REGION: cdk.Stack.of(this).region,
          SESSION_BUCKET: this.sessionBucket.bucketName,
          SESSION_MEMORY_TABLE: this.sessionMemoryTable.tableName,
          EVENT_BUS_NAME: `agentic-ai-factory-agents-${props.environment}`,
          PROJECTS_TABLE_NAME: `agentic-ai-factory-projects-${props.environment}`,
        },
      });

      // Grant permissions to Agent 2
      this.sessionBucket.grantReadWrite(agent2Runtime);
      this.sessionMemoryTable.grantReadWriteData(agent2Runtime);
      
      // Grant DynamoDB permissions for projects table
      agent2Runtime.grantPrincipal.addToPrincipalPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
        ],
        resources: [
          `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:table/agentic-ai-factory-projects-${props.environment}`,
        ],
      }));

      // Grant Bedrock model invocation permissions
      agent2Runtime.grantPrincipal.addToPrincipalPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      }));

      // Reference EventBridge event bus and grant permissions to agents
      const agentEventBus = events.EventBus.fromEventBusName(
        this,
        'AgentEventBusRef',
        `agentic-ai-factory-agents-${props.environment}`
      );
      agentEventBus.grantPutEventsTo(agent1Runtime);
      agentEventBus.grantPutEventsTo(agent2Runtime);

      // HLD PDF Generator Lambda Container
      const pdfGeneratorRepo = new ecr.Repository(this, 'PdfGeneratorRepo', {
        repositoryName: `hld-pdf-generator-${props.environment}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        emptyOnDelete: true,
      });

      const pdfGeneratorFunction = new lambda.DockerImageFunction(this, 'HldPdfGenerator', {
        functionName: `agentic-ai-factory-pdf-generator-${props.environment}`,
        code: lambda.DockerImageCode.fromImageAsset(
          path.join(__dirname, '../../../service/hld_pdf_generator'),
          {
            platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,
          }
        ),
        timeout: cdk.Duration.minutes(5),
        memorySize: 2048,
        description: 'Generates PDF from HLD markdown documents',
      });

      // Grant S3 permissions
      this.sessionBucket.grantReadWrite(pdfGeneratorFunction);

      // Add S3 event notification
      this.sessionBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(pdfGeneratorFunction),
        { suffix: '/design/high_level_design.md' }
      );

      // Lambda to notify EventBridge when PDF is created
      const pdfCreatedNotifier = new lambda.Function(this, 'HldPdfCreatedNotifier', {
        functionName: `agentic-ai-factory-pdf-notifier-${props.environment}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'lambda_handler.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../../../service/hld_pdf_notifier')),
        environment: {
          EVENT_BUS_NAME: agentEventBus.eventBusName,
        },
        description: 'Publishes EventBridge event when HLD PDF is created',
      });

      // Grant EventBridge permissions
      agentEventBus.grantPutEventsTo(pdfCreatedNotifier);

      // Add S3 event notification for PDF creation
      this.sessionBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(pdfCreatedNotifier),
        { suffix: '/design/high_level_design.pdf' }
      );

      // Outputs

      // SSM Parameter for agent1 
      const agent1Parameter = new ssm.StringParameter(this, 'Agent1Parameter', {
        parameterName: `/agentic-ai-factory/agents/agent1-${props.environment}`,
        description: 'Configuration for agent1 (Assessment Agent) - AgentCore Runtime ARN',
        stringValue: JSON.stringify({
          agentRuntimeArn: agent1Runtime.agentRuntimeArn,
          region: this.region,
          description: 'Assessment Agent - Update with actual AgentCore Runtime ARN',
        }),
        tier: ssm.ParameterTier.STANDARD,
      });

      new cdk.CfnOutput(this, 'Agent1ParameterName', {
        value: agent1Parameter.parameterName,
        description: 'SSM Parameter name for agent1 configuration',
      });

      // SSM Parameter for agent2
      const agent2Parameter = new ssm.StringParameter(this, 'Agent2Parameter', {
        parameterName: `/agentic-ai-factory/agents/agent2-${props.environment}`,
        description: 'Configuration for agent2 (Design Agent) - AgentCore Runtime ARN',
        stringValue: JSON.stringify({
          agentRuntimeArn: agent2Runtime.agentRuntimeArn,
          region: this.region,
          description: 'Design Agent - High-Level Design Generation',
        }),
        tier: ssm.ParameterTier.STANDARD,
      });

      new cdk.CfnOutput(this, 'Agent2ParameterName', {
        value: agent2Parameter.parameterName,
        description: 'SSM Parameter name for agent2 configuration',
      });

      new cdk.CfnOutput(this, 'Agent2RuntimeArn', {
        value: agent2Runtime.agentRuntimeArn,
      });

      new cdk.CfnOutput(this, 'SessionMemoryTableName', {
        value: this.sessionMemoryTable.tableName,
      });

      new cdk.CfnOutput(this, 'SessionMemoryTableArn', {
        value: this.sessionMemoryTable.tableArn,
      });

      new cdk.CfnOutput(this, 'SessionBucketName', {
        value: this.sessionBucket.bucketName,
      });

      new cdk.CfnOutput(this, 'SessionBucketArn', {
        value: this.sessionBucket.bucketArn,
      });

      new cdk.CfnOutput(this, 'DocumentBucketName', {
        value: this.documentBucket.bucketName,
        exportName: `${this.stackName}-DocumentBucketName`,
      });

      new cdk.CfnOutput(this, 'Agent1RuntimeArn', {
        value: agent1Runtime.agentRuntimeArn,
      });

      new cdk.CfnOutput(this, 'TechnicalBlueprintArn', {
        value: technicalBlueprint.attrBlueprintArn,
        description: 'Technical Assessment Blueprint ARN',
      });

      new cdk.CfnOutput(this, 'BusinessBlueprintArn', {
        value: businessBlueprint.attrBlueprintArn,
        description: 'Business Assessment Blueprint ARN',
      });

      new cdk.CfnOutput(this, 'CommercialBlueprintArn', {
        value: commercialBlueprint.attrBlueprintArn,
        description: 'Commercial Assessment Blueprint ARN',
      });

      new cdk.CfnOutput(this, 'GovernanceBlueprintArn', {
        value: governanceBlueprint.attrBlueprintArn,
        description: 'Governance Assessment Blueprint ARN',
      });

      new cdk.CfnOutput(this, 'GatewayUserPoolId', {
        value: gatewayUserPool.userPoolId,
      });

      new cdk.CfnOutput(this, 'GatewayClientId', {
        value: gatewayClient.userPoolClientId,
      });

      new cdk.CfnOutput(this, 'GatewayTokenUrl', {
        value: `https://${gatewayDomain.domainName}.auth.${cdk.Stack.of(this).region}.amazoncognito.com/oauth2/token`,
      });

      new cdk.CfnOutput(this, 'GatewaySecretArn', {
        value: gatewaySecret.secretArn,
      });

      new cdk.CfnOutput(this, 'GatewayUrl', {
        value: gateway.attrGatewayUrl,
        description: 'AgentCore Gateway URL',
      });

      new cdk.CfnOutput(this, 'GatewayArn', {
        value: gateway.attrGatewayArn,
        description: 'AgentCore Gateway ARN',
      });
  }
}
