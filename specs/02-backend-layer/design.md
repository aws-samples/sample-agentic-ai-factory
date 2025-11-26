# Design Document

## Overview

The Agentic AI Factory Backend Layer is a cloud-native integration and middleware system built on AWS AppSync GraphQL API that provides real-time bidirectional communication between the frontend user interface and the service layer AI agents. The backend implements authentication, authorization, event-driven orchestration, state management, and frontend hosting to create a complete platform for AI transformation workflows.

### Design Principles

1. **GraphQL-First API**: Single endpoint for all data operations with strongly-typed schema and real-time subscriptions
2. **Event-Driven Architecture**: Asynchronous agent coordination through EventBridge for scalability and resilience
3. **Serverless Infrastructure**: Leverages AWS managed services for automatic scaling and operational simplicity
4. **Real-time Communication**: WebSocket subscriptions for live updates without polling
5. **Security by Default**: Cognito authentication, IAM authorization, encryption at rest and in transit
6. **Multi-Tenancy Ready**: Project-based isolation with ownership and role-based access control

## Architecture

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend Layer                                   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │   AppSync    │  │   Cognito    │  │ EventBridge  │  │DynamoDB ││
│  │  GraphQL API │  │  User Pool   │  │  Event Bus   │  │ Tables  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
│         │                 │                 │                │      │
│         ▼                 ▼                 ▼                ▼      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Lambda Resolvers & Event Handlers              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │                                                    │
         ▼                                                    ▼
┌─────────────────┐                                  ┌─────────────────┐
│  Frontend UI    │                                  │  Service Layer  │
│  (S3+CloudFront)│                                  │  (AgentCore)    │
└─────────────────┘                                  └─────────────────┘
```

### High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ CloudFront   │  │      S3      │  │  aws-exports │             │
│  │ Distribution │  │    Bucket    │  │    Config    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
         │                                                    │
         ▼                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              AWS AppSync GraphQL API                         │  │
│  │  - Cognito User Pool Auth                                    │  │
│  │  - IAM Auth (service-to-service)                             │  │
│  │  - Real-time WebSocket Subscriptions                         │  │
│  │  - X-Ray Tracing & CloudWatch Logging                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │                 │                 │                │
         ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Lambda Resolver Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │   Project    │  │Conversation  │  │    Agent     │  │Document ││
│  │  Resolver    │  │  Resolver    │  │  Resolver    │  │ Upload  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │Agent Config  │  │Tool Config   │  │Fabricator    │  │  User   ││
│  │  Resolver    │  │  Resolver    │  │  Request     │  │  Mgmt   ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │                 │                 │                │
         ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Event Processing Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │Agent Message │  │  Progress    │  │ Assessment   │  │ Design  ││
│  │   Handler    │  │  Updater     │  │ Completion   │  │Progress ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │                 │                 │                │
         ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │  Projects    │  │Conversations │  │Agent Status  │  │ Agent   ││
│  │   Table      │  │    Table     │  │    Table     │  │ Config  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │Organizations │  │    Tools     │  │Orchestration │             │
│  │    Table     │  │    Table     │  │    Table     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### AWS AppSync GraphQL API

**Purpose**: Central API gateway providing GraphQL queries, mutations, and real-time subscriptions

**Technology Stack**:
- Service: AWS AppSync
- Schema: GraphQL SDL with strongly-typed definitions
- Authentication: Cognito User Pools (primary), IAM (service-to-service)
- Protocol: HTTPS for queries/mutations, WSS for subscriptions

**Key Features**:
1. **Queries**: 15 query operations for data retrieval (projects, agents, conversations, users, progress)
2. **Mutations**: 20 mutation operations for data modification and event triggering
3. **Subscriptions**: 5 real-time subscriptions for live updates (agent status, messages, progress)
4. **Authorization**: Field-level authorization with Cognito groups and custom logic
5. **Observability**: X-Ray tracing, CloudWatch logging with field-level detail

**GraphQL Schema Highlights**:
- Project management (CRUD operations with status tracking)
- Conversation management (bidirectional messaging with agents)
- Agent status tracking (real-time processing updates)
- User management (RBAC with four roles)
- Document upload (pre-signed URL generation)
- Configuration management (agents and tools)

**Data Sources**:
- DynamoDB data sources (direct table access)
- Lambda data sources (custom business logic)
- None data sources (pass-through for subscriptions)

### Amazon Cognito Authentication

**Purpose**: User authentication and authorization with RBAC

**Technology Stack**:
- Service: Amazon Cognito User Pools
- Authentication: Email + password with SRP
- MFA: Optional SMS and TOTP
- Token: JWT with 1-hour access token, 30-day refresh token

**User Pool Configuration**:

- Sign-in: Email only (no username)
- Auto-verify: Email verification required
- Password policy: Min 8 chars, mixed case, numbers, symbols
- Custom attributes: role, organization
- Account recovery: Email only

**User Groups (RBAC)**:
1. **admin**: Full system access, user management, all operations
2. **project_manager**: Project management, monitoring, reporting
3. **architect**: Project interaction, agent communication, design review
4. **developer**: Read-only access to projects and implementations

**OAuth Configuration**:
- Flows: Authorization code grant, implicit code grant
- Scopes: email, openid, profile
- Token validity: Access 1h, ID 1h, Refresh 30d

**Integration**:
- AppSync: Primary authorization mode
- Lambda: AdminGetUser for user profile enrichment
- Frontend: aws-exports.json configuration

### Lambda Resolvers

**Purpose**: Implement GraphQL field resolution with custom business logic

**Technology Stack**:
- Runtime: Node.js 18.x
- Build: esbuild for bundling
- Timeout: 30 seconds (standard), 5 minutes (agent message handler)
- Memory: 1024 MB (standard), 2048 MB (agent message handler)

**Resolver Functions**:

1. **Project Resolver** (`project-resolver.ts`):
   - Operations: createProject, updateProject, getProject, listProjects
   - Tables: Projects, Conversations, Agent Status
   - Events: Publishes project lifecycle events to EventBridge
   - Authorization: Owner-based access control

2. **Conversation Resolver** (`conversation-resolver.ts`):
   - Operations: sendMessage, sendMessageToAgent, getConversationHistory, publishConversationMessage
   - Tables: Conversations, Agent Status
   - Events: Publishes "message.sent_to_agent" events
   - Real-time: Triggers subscription updates

3. **Agent Resolver** (`agent-resolver.ts`):
   - Operations: getAgentStatus, updateAgentStatus
   - Tables: Agent Status, Projects
   - Real-time: Publishes status updates to subscriptions

4. **Document Upload Resolver** (`document-upload-resolver.ts`):
   - Operations: generateDocumentUploadUrl
   - Storage: Generates pre-signed S3 URLs (15-minute expiration)
   - Security: Project-scoped paths, CORS configuration

5. **Agent Config Resolver** (`agent-config-resolver.ts`):
   - Operations: listAgentConfigs, getAgentConfig, createAgentConfig, updateAgentConfig, deleteAgentConfig
   - Tables: Agent Config
   - Validation: JSON schema validation

6. **Tool Config Resolver** (`tool-config-resolver.ts`):
   - Operations: listToolConfigs, getToolConfig, createToolConfig, updateToolConfig, deleteToolConfig
   - Tables: Tools Config
   - State management: active, inactive, maintenance

7. **Fabricator Request Resolver** (`fabricator-request-resolver.ts`):
   - Operations: requestAgentCreation
   - Queue: Sends messages to SQS fabricator queue
   - Response: Returns request ID and confirmation

8. **Task Runner Resolver** (`task-runner-resolver.ts`):
   - Operations: submitTask
   - Events: Publishes "task.request" events to EventBridge
   - Orchestration: Initiates multi-agent workflows

9. **User Management Resolver** (`user-management-resolver.ts`):
   - Operations: listUsers, getUser, getCurrentUserProfile, assignUserRole, removeUserRole, listAvailableRoles, listOrganizations
   - Cognito: AdminGetUser, AdminAddUserToGroup, AdminRemoveUserFromGroup
   - Tables: Organizations

10. **Assessment Progress Resolver** (`assessment-progress-resolver.ts`):
    - Operations: getAssessmentProgress
    - Tables: Session Memory (from Services Stack)
    - Returns: Dimension-specific completion percentages

11. **Report Download Resolver** (`generate-report-url.ts`):
    - Operations: generateReportDownloadUrl
    - Storage: Generates pre-signed S3 URLs for reports
    - Validation: Checks report existence before URL generation

### Event Handlers

**Purpose**: Process EventBridge events for agent coordination and workflow automation

**Event Handler Functions**:

1. **Agent Message Handler** (`agent-message-handler.ts`):
   - Trigger: EventBridge "message.sent_to_agent" events
   - Processing: Retrieves agent config from SSM, invokes AgentCore Runtime
   - Integration: Bedrock AgentCore InvokeAgent API
   - Response: Stores agent responses in Conversations table
   - Subscription: Publishes GraphQL mutations for real-time updates
   - Timeout: 5 minutes for long-running agent interactions

2. **Project Progress Updater** (`project-progress-updater.ts`):
   - Trigger: EventBridge "assessment.progress.updated", "design.progress.updated" events
   - Processing: Updates project progress percentages
   - Tables: Projects
   - Calculation: Aggregates dimension/section progress

3. **Assessment Completion Notifier** (`assessment-completion-notifier.ts`):
   - Trigger: EventBridge "assessment.completed" events
   - Processing: Publishes GraphQL subscription updates
   - Subscription: onAssessmentCompleted
   - Workflow: Signals readiness for design phase

4. **Design Progress Notifier** (`design-progress-notifier.ts`):
   - Trigger: EventBridge "design.progress.updated" events
   - Processing: Publishes GraphQL subscription updates
   - Subscription: onDesignProgress
   - Real-time: Section-by-section progress updates

### DynamoDB Tables

**Purpose**: Persistent storage for projects, conversations, agent state, and configuration

**Table Schemas**:

1. **Projects Table**:
```typescript
{
  id: string (PK),
  name: string,
  status: ProjectStatus,
  currentModule: Module,
  progress: ProjectProgress,
  createdAt: string,
  updatedAt: string,
  owner: string,
  organization: string,
  description?: string,
  requirements?: string
}
```
- GSI: OrganizationIndex (organization, createdAt)
- Stream: NEW_AND_OLD_IMAGES for change tracking
- Billing: On-demand

2. **Conversations Table**:
```typescript
{
  projectId: string (PK),
  timestamp: string (SK),
  id: string,
  agentId: string,
  message: string,
  messageType: MessageType,
  metadata?: object,
  correlationId?: string
}
```
- Access pattern: Query by projectId, sort by timestamp
- Billing: On-demand

3. **Agent Status Table**:
```typescript
{
  projectId: string (PK),
  agentId: string (SK),
  status: AgentStatusEnum,
  currentTask?: string,
  progress?: number,
  lastUpdate: string,
  metadata?: object,
  errorMessage?: string
}
```
- Access pattern: Get specific agent status, list all agents for project
- Billing: On-demand

4. **Agent Config Table**:
```typescript
{
  agentId: string (PK),
  config: object,
  state: AgentState,
  categories?: string[],
  createdAt: string,
  updatedAt: string
}
```
- Access pattern: Get by agentId, scan all configs
- Billing: On-demand

5. **Organizations Table**:
```typescript
{
  orgId: string (PK),
  name: string,
  description?: string,
  createdAt: string
}
```
- Seeded with default organizations
- Billing: On-demand

6. **Tools Config Table**:
```typescript
{
  toolId: string (PK),
  config: object,
  state: ToolState,
  categories?: string[],
  createdAt: string,
  updatedAt: string
}
```
- Access pattern: Get by toolId, scan all tools
- Billing: On-demand

7. **Orchestration Table** (Arbiter Stack):
```typescript
{
  orchestrationId: string (PK),
  taskDetails: object,
  agentAssignments: object[],
  status: string,
  createdAt: string,
  updatedAt: string
}
```
- Multi-agent task coordination
- Billing: On-demand

8. **Worker State Table** (Arbiter Stack):
```typescript
{
  requestId: string (PK),
  workflowState: object,
  status: string,
  results?: object,
  createdAt: string,
  updatedAt: string
}
```
- Worker agent state tracking
- Billing: On-demand

### Amazon EventBridge

**Purpose**: Event-driven coordination between agents and workflow automation

**Event Bus**: `agentic-ai-factory-agents-{environment}`

**Event Patterns**:

1. **message.sent_to_agent**:
```json
{
  "source": "agentic-ai-factory",
  "detail-type": "message.sent_to_agent",
  "detail": {
    "projectId": "string",
    "agentId": "string",
    "message": "string",
    "correlationId": "string"
  }
}
```
- Target: Agent Message Handler Lambda
- Retry: 2 attempts, 2-hour max age

2. **assessment.completed**:
```json
{
  "source": "agentic-ai-factory.assessment",
  "detail-type": "assessment.completed",
  "detail": {
    "projectId": "string",
    "allDimensionsComplete": true
  }
}
```
- Target: Assessment Completion Notifier Lambda

3. **assessment.progress.updated**:
```json
{
  "source": "agent1.assessment",
  "detail-type": "assessment.progress.updated",
  "detail": {
    "projectId": "string",
    "dimension": "string",
    "completionPercentage": 75
  }
}
```
- Target: Project Progress Updater Lambda

4. **design.progress.updated**:
```json
{
  "source": "agent2.design",
  "detail-type": "design.progress.updated",
  "detail": {
    "projectId": "string",
    "sectionId": "string",
    "completionPercentage": 50
  }
}
```
- Targets: Design Progress Notifier, Project Progress Updater

5. **task.request** / **task.completion**:
```json
{
  "source": "task.request",
  "detail-type": "task.request",
  "detail": {
    "orchestrationId": "string",
    "taskDetails": "object"
  }
}
```
- Target: Supervisor Agent Lambda (Arbiter Stack)

### Frontend Hosting

**Purpose**: Serve React/Next.js frontend application via CDN

**Technology Stack**:
- Storage: Amazon S3 with versioning
- CDN: Amazon CloudFront
- Security: Origin Access Identity (OAI)
- Protocol: HTTPS only with HTTP redirect

**S3 Bucket Configuration**:
- Name: `agentic-ai-factory-frontend-{environment}-{account}-{region}`
- Versioning: Enabled
- Public access: Blocked
- Encryption: S3-managed

**CloudFront Distribution**:
- Origins: S3 (static assets), AppSync (API proxy)
- Default behavior: S3 origin with caching
- API behavior: `/api/*` path pattern to AppSync (no caching)
- Custom error responses: 404/403 → index.html (SPA routing)
- Price class: PriceClass_100 (North America, Europe)

**Deployment**:
- Source: `../frontend/build` directory
- Config: `aws-exports.json` with AppSync and Cognito settings
- Invalidation: `/*` on deployment

### Arbiter Stack (Multi-Agent Orchestration)

**Purpose**: Coordinate complex multi-agent workflows with supervisor and worker patterns

**Components**:

1. **Supervisor Agent Lambda**:
   - Runtime: Python 3.11
   - Function: Orchestrates multi-agent tasks
   - Tables: Orchestration, Worker State, Agent Config
   - Events: Listens to task.request and task.completion
   - Queue: Sends messages to worker queue

2. **Worker Agent Wrapper Lambda**:
   - Runtime: Python 3.11
   - Function: Executes worker agent tasks
   - Trigger: SQS worker queue
   - Bedrock: Invokes models for agent cognition
   - Storage: Loads agent code from S3

3. **Fabricator Agent Lambda**:
   - Runtime: Python 3.11
   - Function: Creates dynamic agents based on specifications
   - Trigger: SQS fabricator queue
   - Tables: Agent Config, Tools Config, Worker State
   - Storage: Stores generated agent code in S3

4. **SQS Queues**:
   - Worker Queue: 15-minute visibility timeout, 7-day retention
   - Fabricator Queue: 15-minute visibility timeout, 7-day retention

5. **Code Bucket**:
   - Name: `agentic-ai-factory-code-{environment}`
   - Purpose: Store dynamically generated agent code
   - Access: Read by worker wrapper, write by fabricator

## Data Models

### Project Status Flow

```
CREATED → IN_PROGRESS → ASSESSMENT_COMPLETE → DESIGN_COMPLETE → 
PLANNING_COMPLETE → IMPLEMENTATION_READY → COMPLETED
                                ↓
                             ERROR
```

### Message Flow

```
User → GraphQL Mutation (sendMessageToAgent)
  → Conversation Resolver
    → Store in DynamoDB
      → Publish EventBridge event
        → Agent Message Handler
          → Invoke AgentCore Runtime
            → Store agent response
              → Publish GraphQL Mutation
                → Subscription update to client
```

### Authentication Flow

```
User → Cognito Sign In
  → JWT Token (access + refresh)
    → GraphQL Request with Authorization header
      → AppSync validates token
        → Cognito User Pool verification
          → Extract user groups
            → Field-level authorization
              → Lambda resolver execution
```

## Error Handling

### GraphQL Error Responses

**Structure**:
```json
{
  "errors": [
    {
      "message": "User-friendly error message",
      "errorType": "Unauthorized|NotFound|ValidationError|InternalError",
      "path": ["mutation", "createProject"],
      "locations": [{"line": 2, "column": 3}]
    }
  ]
}
```

### Lambda Error Handling

**Retry Strategy**:
- DynamoDB: 3 retries with exponential backoff
- EventBridge: 2 retries, 2-hour max event age
- SQS: 3 retries, then dead-letter queue

**Error Logging**:
- CloudWatch Logs: Structured JSON with error details
- X-Ray: Distributed tracing with error annotations
- Metrics: Error count and rate metrics

## Testing Strategy

### Unit Testing

**Framework**: Jest with ts-jest

**Coverage Target**: 80% code coverage

**Test Categories**:
- Resolver function logic
- Data model validation
- Authorization logic
- Error handling paths

### Integration Testing

**Test Scenarios**:
- End-to-end GraphQL operations
- Real-time subscription delivery
- EventBridge event processing
- Cognito authentication flows
- Cross-stack integration (Backend ↔ Services)

**Environment**: Dedicated test environment with isolated resources

### Local Testing

**Tools**:
- AWS SAM Local for Lambda testing
- AppSync Local for GraphQL testing
- DynamoDB Local for database testing

## Security Architecture

### Encryption

**At Rest**:
- DynamoDB: AWS managed encryption
- S3: SSE-S3 encryption
- CloudWatch Logs: Encrypted

**In Transit**:
- AppSync: HTTPS/WSS only (TLS 1.2+)
- Lambda: HTTPS for all AWS service calls
- CloudFront: HTTPS with HTTP redirect

### IAM Policies

**Lambda Execution Roles**:
- Least-privilege access to specific tables
- Resource-level permissions for S3 paths
- Explicit deny for unauthorized actions

**AppSync Service Role**:
- DynamoDB: Read/write to specific tables
- Lambda: Invoke specific functions
- CloudWatch: Write logs

### CORS Configuration

**S3 Bucket**:
```json
{
  "allowedHeaders": ["*"],
  "allowedMethods": ["GET", "PUT", "POST"],
  "allowedOrigins": ["*"],
  "maxAge": 3000
}
```

**AppSync**: Configured via CloudFront origin

## Deployment Strategy

### Infrastructure as Code

**Tool**: AWS CDK (TypeScript)

**Stacks**:
1. **KnowledgeBaseStack**: OpenSearch Serverless, Bedrock Knowledge Bases
2. **ServicesStack**: AgentCore Runtime agents, DynamoDB, S3, Bedrock Data Automation
3. **BackendStack**: AppSync, Cognito, Lambda resolvers, EventBridge, DynamoDB
4. **ArbiterStack**: Supervisor, worker, fabricator agents with SQS queues
5. **FrontendStack**: S3, CloudFront distribution

**Deployment Order**:
1. KnowledgeBaseStack (independent)
2. ServicesStack (depends on KnowledgeBaseStack)
3. BackendStack (depends on ServicesStack for tables and buckets)
4. ArbiterStack (depends on BackendStack for event bus and agent config)
5. FrontendStack (depends on BackendStack for AppSync and Cognito)

### Environment Strategy

**Environments**:
- **dev**: Development environment for rapid iteration
- **staging**: Pre-production validation
- **prod**: Production environment

**Configuration**:
- Environment variables in CDK context
- SSM Parameter Store for agent configurations
- Secrets Manager for sensitive credentials

### Deployment Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Build Lambda functions
npm run build:lambda

# Synthesize CloudFormation
npm run cdk:synth

# Deploy all stacks
npm run deploy

# Deploy specific stack
cdk deploy BackendStack

# Destroy infrastructure
npm run cdk:destroy
```

## Monitoring and Observability

### CloudWatch Metrics

**AppSync Metrics**:
- Request count and latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Connection count (WebSocket)
- Subscription count

**Lambda Metrics**:
- Invocation count and duration
- Error count and throttles
- Concurrent executions
- Memory utilization

**DynamoDB Metrics**:
- Read/write capacity units
- Throttled requests
- Item count and table size

### CloudWatch Logs

**Log Groups**:
- `/aws/appsync/apis/{api-id}`: GraphQL operations
- `/aws/lambda/{function-name}`: Lambda execution logs
- `/aws/events/{rule-name}`: EventBridge rule executions

**Log Format**: Structured JSON with requestId, timestamp, level, message, context

### X-Ray Tracing

**Enabled For**:
- AppSync API (all operations)
- Lambda functions (all resolvers and handlers)
- DynamoDB operations
- EventBridge events

**Service Map**: Visual representation of request flow across services

### Dashboards

**CloudWatch Dashboards**:
- API health (request rate, latency, errors)
- Lambda performance (duration, errors, throttles)
- Database health (capacity, throttles)
- Real-time connections (WebSocket count)

### Alerting

**CloudWatch Alarms**:
- API error rate > 5%
- Lambda error rate > 1%
- DynamoDB throttling events
- Lambda timeout rate > 1%
- WebSocket connection failures

**SNS Topics**: Alert notifications to operations team

## Performance Considerations

### Scalability

**AppSync**: Auto-scales for concurrent connections and requests
**Lambda**: Concurrent execution scaling (up to account limits)
**DynamoDB**: On-demand billing for automatic scaling
**CloudFront**: Global edge network for low latency

### Optimization

**GraphQL**:
- Field-level caching for static data
- Batch resolvers for N+1 query prevention
- Connection pooling for DynamoDB

**Lambda**:
- Provisioned concurrency for critical functions
- Code bundling with esbuild for faster cold starts
- Environment variable caching

**DynamoDB**:
- Efficient key design for query patterns
- GSI for alternative access patterns
- Projection optimization for query efficiency

### Latency Targets

- GraphQL query: < 500ms (p95)
- GraphQL mutation: < 1s (p95)
- Subscription delivery: < 2s (p95)
- Lambda resolver: < 300ms (p95)
- Agent message processing: < 30s (p95)

## Cost Optimization

### Estimated Monthly Costs (Moderate Usage)

**AppSync**: $50-150 (queries, mutations, subscriptions, data transfer)
**Lambda**: $30-80 (invocations, duration)
**DynamoDB**: $20-60 (on-demand reads/writes)
**S3**: $5-15 (storage, requests)
**CloudFront**: $10-30 (data transfer, requests)
**Cognito**: $5-20 (MAU-based pricing)
**EventBridge**: $1-5 (events published)

**Total**: $121-360/month (moderate usage)

### Optimization Strategies

- AppSync caching for frequently accessed data
- Lambda provisioned concurrency only for critical paths
- DynamoDB on-demand (no idle costs)
- S3 lifecycle policies for old documents
- CloudFront caching for static assets
- CloudWatch log retention (7 days for dev, 30 days for prod)
