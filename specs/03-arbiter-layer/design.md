# Design Document

## Overview

The Agentic AI Factory Arbiter Layer is a multi-agent orchestration system that enables autonomous task coordination, dynamic agent creation, and parallel workflow execution. The arbiter implements a supervisor-worker pattern where a Supervisor Agent interprets requests and delegates tasks, a Fabricator Agent creates new capabilities on-demand, and Worker Agents execute dynamically loaded code. The system uses Amazon Bedrock for AI reasoning, SQS for asynchronous messaging, DynamoDB for state management, and S3 for code storage.

### Design Principles

1. **Autonomous Orchestration**: Supervisor makes decisions without constant user intervention
2. **Dynamic Capability Creation**: Fabricator generates new agents when required functionality doesn't exist
3. **Parallel Execution**: Multiple agents execute tasks concurrently for optimal performance
4. **Event-Driven Coordination**: EventBridge enables loose coupling between components
5. **Code Isolation**: Worker agents execute in isolated Lambda environments
6. **Governance by Design**: Fabricator enforces code generation rules and safety constraints

## Architecture

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Arbiter Layer                                   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Supervisor  │  │  Fabricator  │  │   Worker     │             │
│  │    Agent     │  │    Agent     │  │   Wrapper    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│         │                 │                 │                       │
│         ▼                 ▼                 ▼                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         State Management (DynamoDB + S3 + SQS)               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │                                                    │
         ▼                                                    ▼
┌─────────────────┐                                  ┌─────────────────┐
│  Backend Layer  │                                  │  Amazon Bedrock │
│  (EventBridge)  │                                  │  (Claude 3.5)   │
└─────────────────┘                                  └─────────────────┘
```

### High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Orchestration Flow                               │
│                                                                     │
│  User Request                                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────┐                                                  │
│  │ EventBridge  │ task.request event                               │
│  │  Event Bus   │                                                  │
│  └──────────────┘                                                  │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Supervisor Agent Lambda                         │  │
│  │  - Load agent configs from DynamoDB                          │  │
│  │  - Create tool specs for Bedrock                             │  │
│  │  - Invoke Bedrock Converse API                               │  │
│  │  - Delegate tasks to SQS queues                              │  │
│  │  - Track orchestration state                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│       │                                                             │
│       ├─────────────────┬──────────────────┐                       │
│       ▼                 ▼                  ▼                       │
│  ┌──────────┐     ┌──────────┐      ┌──────────┐                  │
│  │ Worker   │     │Fabricator│      │ Worker   │                  │
│  │ Queue    │     │  Queue   │      │ Queue    │                  │
│  └──────────┘     └──────────┘      └──────────┘                  │
│       │                 │                  │                       │
│       ▼                 ▼                  ▼                       │
│  ┌──────────┐     ┌──────────┐      ┌──────────┐                  │
│  │ Worker   │     │Fabricator│      │ Worker   │                  │
│  │ Wrapper  │     │  Agent   │      │ Wrapper  │                  │
│  │ Lambda   │     │  Lambda  │      │ Lambda   │                  │
│  └──────────┘     └──────────┘      └──────────┘                  │
│       │                 │                  │                       │
│       └─────────────────┴──────────────────┘                       │
│                         │                                           │
│                         ▼                                           │
│                  ┌──────────────┐                                   │
│                  │ EventBridge  │ task.completion event             │
│                  │  Event Bus   │                                   │
│                  └──────────────┘                                   │
│                         │                                           │
│                         ▼                                           │
│                  Back to Supervisor                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Supervisor Agent Lambda

**Purpose**: Orchestrate multi-agent workflows with autonomous decision-making

**Technology Stack**:
- Runtime: Python 3.11
- Framework: Boto3 for AWS services
- Model: Claude 3.5 Sonnet v2 (anthropic.claude-3-5-sonnet-20241022-v2:0)
- Timeout: 30 seconds
- Memory: 1024 MB

**Key Components**:

1. **Orchestration Manager**:
   - Creates orchestration records with unique IDs
   - Maintains conversation history across multi-turn interactions
   - Stores orchestration state in DynamoDB

2. **Agent Configuration Loader**:
   - Scans DynamoDB for active agent configurations
   - Filters agents by state (active only)
   - Converts agent schemas to Bedrock tool specs
   - Parses Decimal types from DynamoDB

3. **Bedrock Integration**:
   - Invokes Converse API with conversation history
   - Configures system prompt for autonomous behavior
   - Uses tool choice auto mode for agent selection
   - Processes tool use requests from model responses

4. **Task Delegation**:
   - Extracts tool use from Bedrock responses
   - Sends messages to SQS queues based on agent action config
   - Creates workflow tracking records for parallel tasks
   - Includes orchestration ID, agent use ID, and node name

5. **Result Aggregation**:
   - Updates workflow tracking on task completion
   - Checks if all parallel tasks are complete
   - Formats tool results for Bedrock conversation
   - Continues orchestration with aggregated results

**System Prompt**:
```
You are the Supervisor Agent responsible for autonomously coordinating and 
completing workflows on behalf of the user. Your role is to translate user 
requests into actionable plans, delegate tasks to the most suitable agents, 
and ensure successful end-to-end delivery.

Responsibilities:
1. Interpret & Plan - Convert requests into structured execution plans
2. Delegate & Orchestrate - Select appropriate agents and issue parallel calls
3. Monitor & Adapt - Track progress and handle failures autonomously
4. Quality & Completion - Ensure output meets user intent

Rules:
- Do not ask follow-up questions after initial request
- Prefer autonomy and inference over user re-engagement
- Use agents as primary mechanism for action
- Complete requests in fewest interaction rounds
```

**Data Flow**:
1. Receive task.request or task.completion event from EventBridge
2. Load or create orchestration record from DynamoDB
3. Load active agent configs and create tool specs
4. Invoke Bedrock Converse API with conversation history
5. Process tool use requests and delegate to SQS queues
6. Create workflow tracking for parallel tasks
7. Wait for task.completion events
8. Aggregate results and continue orchestration
9. Save final orchestration state to DynamoDB

### Fabricator Agent Lambda

**Purpose**: Generate new Python-based Strands agents on-demand

**Technology Stack**:
- Runtime: Python 3.11
- Framework: Strands Agents SDK, Strands Tools
- Model: Claude 3.5 Sonnet v2 with 40,000 max tokens
- Timeout: 15 minutes
- Memory: 1024 MB
- Read Timeout: 3600 seconds (1 hour)

**Key Components**:

1. **Agent Generation Engine**:
   - Uses Strands Agent with comprehensive system prompt
   - Generates Python code following SDK best practices
   - Creates handler() functions with proper signatures
   - Includes module-level docstrings

2. **Tool Integration**:
   - Strands built-in tools: file_write, http_request, shell
   - Custom tools: upload_agent_to_s3, upload_tool_to_s3
   - Custom tools: store_agent_config_dynamo, store_tool_config_dynamo
   - Custom tools: get_worker_tool, complete_task

3. **Code Storage**:
   - Uploads agent code to S3 agents/ folder
   - Uploads tool code to S3 tools/ folder
   - Stores agent config in DynamoDB Agent Config table
   - Stores tool config in DynamoDB Tools Config table

4. **Event Publishing**:
   - Publishes task.completion for orchestration workflows
   - Publishes agent.fabricated for direct UI requests
   - Includes orchestration ID and agent use ID

**System Prompt Structure**:
- Architectural context and governance requirements
- Core responsibilities (generate, not execute)
- Tool usage priority (Strands → Worker → Custom)
- Output format (Design Summary, Filename, Code, Metadata)
- Strands tools list with descriptions
- Worker tools list from DynamoDB
- Code generation rules and constraints

**Agent Generation Output**:
```
### 1. AGENT DESIGN SUMMARY
Purpose, inputs, outputs, tools, risks, assumptions

### 2. FILENAME
agent_name.py

### 3. CODE
from strands import Agent, tool, models

def handler(param: type) -> type:
    \"\"\"Agent description\"\"\"
    bedrock_model = models.BedrockModel(...)
    agent = Agent(model=bedrock_model, tools=[...])
    return agent(prompt)

### 4. METADATA FOR SUPERVISOR
{
  "agent_name": "...",
  "purpose": "...",
  "tools_used": [...],
  "risk_rating": "low|medium|high"
}
```

### Worker Wrapper Lambda

**Purpose**: Execute dynamically loaded agent code in isolated environments

**Technology Stack**:
- Runtime: Python 3.11
- Framework: Strands Agents SDK (for agent execution)
- Timeout: 15 minutes
- Memory: 1024 MB

**Key Components**:

1. **Configuration Loader**:
   - Retrieves agent config from DynamoDB by agentId
   - Extracts filename from config
   - Parses JSON config if stored as string

2. **Code Loader**:
   - Downloads agent Python file from S3 to /tmp/
   - Uses importlib for dynamic module loading
   - Imports module into sys.modules

3. **Agent Executor**:
   - Invokes handler() function with task parameters
   - Captures return values or exceptions
   - Logs execution details to CloudWatch

4. **Result Publisher**:
   - Publishes task.completion events to EventBridge
   - Includes orchestration ID, agent use ID, node name
   - Includes execution results or error messages

**Execution Flow**:
1. Receive SQS message with agent_input, orchestration_id, agent_use_id, node
2. Load agent config from DynamoDB
3. Download agent code from S3 to /tmp/loaded_module.py
4. Dynamically import module
5. Execute handler(**agent_input)
6. Capture results or errors
7. Publish task.completion event
8. Delete message from SQS

### DynamoDB Tables

**Purpose**: Store orchestration state, agent configs, and tool configs

**Table Schemas**:

1. **Orchestration Table**:
```python
{
  "orchestrationId": "uuid (PK)",
  "instance": 1234567890,  # timestamp
  "conversation": [
    {
      "role": "user|assistant",
      "content": [
        {"text": "..."},
        {"toolUse": {...}},
        {"toolResult": {...}}
      ]
    }
  ],
  "request_id": "uuid"  # for workflow tracking
}
```

2. **Worker State Table**:
```python
{
  "requestId": "uuid (PK)",
  "agent1": false,  # completion flag
  "agent2": false,
  "data": {
    "agent1": null,  # results
    "agent2": null
  }
}
```

3. **Agent Config Table**:
```python
{
  "agentId": "string (PK)",
  "config": {
    "name": "string",
    "filename": "string",
    "schema": {
      "type": "object",
      "properties": {...},
      "required": [...]
    },
    "version": "string",
    "description": "string",
    "action": {
      "type": "sqs",
      "target": "queue_url"
    }
  },
  "state": "active|inactive|maintenance",
  "categories": ["built-in", "worker", "developer"]
}
```

4. **Tools Config Table**:
```python
{
  "toolId": "string (PK)",
  "config": {
    "name": "string",
    "filename": "string",
    "schema": {
      "type": "object",
      "properties": {...},
      "required": [...]
    },
    "version": "string",
    "description": "string"
  },
  "state": "active|inactive|maintenance"
}
```

### SQS Queues

**Purpose**: Asynchronous agent invocation with retry logic

**Queue Configuration**:

1. **Worker Queue**:
   - Name: `agentic-ai-factory-worker-agent-queue-{env}`
   - Visibility Timeout: 15 minutes
   - Message Retention: 7 days
   - Dead Letter Queue: Enabled after 3 retries

2. **Fabricator Queue**:
   - Name: `agentic-ai-factory-fabricator-queue-{env}`
   - Visibility Timeout: 15 minutes
   - Message Retention: 7 days
   - Dead Letter Queue: Enabled after 3 retries

**Message Format**:
```json
{
  "agent_input": {
    "param1": "value1",
    "param2": "value2"
  },
  "orchestration_id": "uuid",
  "agent_use_id": "tooluse_xyz",
  "node": "agent_name"
}
```

### S3 Code Bucket

**Purpose**: Store dynamically generated agent and tool code

**Bucket Configuration**:
- Name: `agentic-ai-factory-code-{env}`
- Versioning: Disabled (latest version only)
- Encryption: S3-managed (SSE-S3)
- Public Access: Blocked
- Lifecycle: Optional cleanup after 90 days

**Folder Structure**:
```
s3://bucket/
  agents/
    agent1.py
    agent2.py
  tools/
    tool1.py
    tool2.py
```

**Access Control**:
- Fabricator Lambda: Write to agents/ and tools/
- Worker Wrapper Lambda: Read from agents/
- Fabricator Agent: Read from tools/ (via get_worker_tool)

## Data Models

### Orchestration Flow

```
1. User submits task
   ↓
2. EventBridge publishes task.request
   ↓
3. Supervisor creates orchestration
   ↓
4. Supervisor invokes Bedrock with agent tool specs
   ↓
5. Bedrock selects agents and returns tool use
   ↓
6. Supervisor sends messages to SQS queues
   ↓
7. Supervisor creates workflow tracking
   ↓
8. Workers/Fabricator process tasks
   ↓
9. Workers/Fabricator publish task.completion
   ↓
10. Supervisor updates workflow tracking
    ↓
11. If all complete: aggregate results
    ↓
12. Supervisor continues orchestration
    ↓
13. Repeat 4-12 until workflow complete
```

### Agent Fabrication Flow

```
1. Supervisor requests fabrication
   ↓
2. Message sent to Fabricator Queue
   ↓
3. Fabricator Lambda triggered
   ↓
4. Fabricator loads tool configs from DynamoDB
   ↓
5. Fabricator invokes Bedrock with generation prompt
   ↓
6. Bedrock generates agent code
   ↓
7. Fabricator writes code to /tmp/
   ↓
8. Fabricator uploads code to S3
   ↓
9. Fabricator stores config in DynamoDB
   ↓
10. Fabricator publishes completion event
    ↓
11. Supervisor receives completion
    ↓
12. Supervisor can now invoke new agent
```

## Error Handling

### Lambda Error Handling

**Supervisor Agent**:
- DynamoDB errors: Retry with exponential backoff
- Bedrock errors: Log and return error to user
- SQS errors: Log and retry message
- Orchestration load errors: Handle missing records gracefully

**Fabricator Agent**:
- Code generation errors: Log detailed error and return failure
- S3 upload errors: Retry up to 3 times
- DynamoDB errors: Retry with backoff
- Bedrock timeout: Extended read timeout (3600s)

**Worker Wrapper**:
- Agent execution errors: Capture exception and return error message
- S3 download errors: Retry up to 3 times
- Module import errors: Log and return graceful error
- Handler invocation errors: Capture and log with stack trace

### SQS Retry Logic

**Configuration**:
- Max Receives: 3
- Visibility Timeout: 15 minutes
- Dead Letter Queue: Enabled
- Redrive Policy: After 3 failed attempts

**Error Scenarios**:
- Lambda timeout: Message becomes visible again
- Lambda error: Message retried up to 3 times
- Persistent failure: Message moved to DLQ

## Testing Strategy

### Unit Testing

**Framework**: pytest with mocking

**Test Coverage**:
- Supervisor orchestration logic
- Agent config loading and parsing
- Tool spec generation
- Workflow tracking updates
- Fabricator code generation prompts
- Worker code loading and execution

### Integration Testing

**Test Scenarios**:
- End-to-end orchestration with multiple agents
- Parallel task execution and aggregation
- Agent fabrication and immediate invocation
- Error handling and retry logic
- EventBridge event processing

### Local Testing

**Tools**:
- Python dotenv for environment variables
- Local DynamoDB for state management
- Mocked Bedrock responses
- Direct function invocation

## Security Architecture

### IAM Roles and Permissions

**Supervisor Lambda Role**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["sqs:SendMessage"],
      "Resource": ["worker-queue-arn", "fabricator-queue-arn"]
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:*"],
      "Resource": ["orchestration-table-arn", "worker-state-table-arn", "agent-config-table-arn"]
    },
    {
      "Effect": "Allow",
      "Action": ["events:PutEvents"],
      "Resource": ["event-bus-arn"]
    }
  ]
}
```

**Fabricator Lambda Role**:
```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
  "Resource": "*"
},
{
  "Effect": "Allow",
  "Action": ["s3:PutObject"],
  "Resource": ["arn:aws:s3:::code-bucket/agents/*", "arn:aws:s3:::code-bucket/tools/*"]
},
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": ["arn:aws:s3:::code-bucket/tools/*"]
},
{
  "Effect": "Allow",
  "Action": ["dynamodb:PutItem"],
  "Resource": ["agent-config-table-arn", "tools-config-table-arn"]
}
```

**Worker Wrapper Lambda Role**:
```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": ["arn:aws:s3:::code-bucket/agents/*"]
},
{
  "Effect": "Allow",
  "Action": ["dynamodb:GetItem"],
  "Resource": ["agent-config-table-arn"]
},
{
  "Effect": "Allow",
  "Action": ["events:PutEvents"],
  "Resource": ["event-bus-arn"]
}
```

### Code Execution Isolation

- Each worker agent runs in separate Lambda invocation
- /tmp/ directory isolated per execution
- No shared state between executions
- Module imports scoped to execution context

## Deployment Strategy

### CDK Stack Structure

**ArbiterStack** (backend/lib/arbiter-stack.ts):
- DynamoDB tables (Orchestration, Worker State)
- Lambda functions (Supervisor, Fabricator, Worker Wrapper)
- SQS queues (Worker, Fabricator)
- S3 Code Bucket
- EventBridge rules
- IAM roles and policies
- Custom Resource for seeding

**Dependencies**:
- Requires BackendStack for EventBridge event bus
- Requires BackendStack for Agent Config table

### Deployment Process

1. Deploy BackendStack (creates event bus and agent config table)
2. Deploy ArbiterStack (creates arbiter components)
3. Seed fabricator agent configuration
4. Validate deployment with test orchestration

## Monitoring and Observability

### CloudWatch Metrics

**Lambda Metrics**:
- Invocation count and duration
- Error count and throttles
- Concurrent executions
- Memory utilization

**SQS Metrics**:
- Messages sent and received
- Messages in flight
- Age of oldest message
- Dead letter queue depth

**DynamoDB Metrics**:
- Read/write capacity units
- Throttled requests
- Item count

### CloudWatch Logs

**Log Groups**:
- `/aws/lambda/supervisor-agent-{env}`
- `/aws/lambda/fabricator-agent-{env}`
- `/aws/lambda/worker-wrapper-{env}`

**Log Format**: Structured with orchestration IDs, agent names, and operation details

### Alerting

**CloudWatch Alarms**:
- Lambda error rate > 5%
- SQS DLQ depth > 0
- Lambda timeout rate > 1%
- DynamoDB throttling events

## Performance Considerations

### Scalability

- Lambda: Auto-scales to 1000 concurrent executions
- SQS: Unlimited throughput
- DynamoDB: On-demand billing for automatic scaling
- S3: Unlimited storage and requests

### Optimization

- Supervisor: 30s timeout for quick orchestration
- Fabricator: 15min timeout for complex generation
- Worker: 15min timeout for long-running tasks
- Code caching: Reuse /tmp/ files when possible

### Latency Targets

- Supervisor orchestration: < 5s (p95)
- Agent fabrication: < 60s (p95)
- Worker execution: < 30s (p95)
- End-to-end workflow: < 2min (p95)

## Cost Optimization

### Estimated Monthly Costs (Moderate Usage)

- Lambda (Supervisor): $10-30
- Lambda (Fabricator): $20-50
- Lambda (Worker): $15-40
- DynamoDB: $10-30
- S3: $1-5
- SQS: $1-5
- EventBridge: $1-5

**Total**: $58-165/month

### Optimization Strategies

- Use on-demand Lambda (no idle costs)
- DynamoDB on-demand billing
- S3 lifecycle policies for old code
- SQS message batching
- CloudWatch log retention (7 days)
