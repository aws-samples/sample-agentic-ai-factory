# Design Document

## Overview

The Agentic AI Factory Services Layer is a cloud-native, multi-agent system built on Amazon Bedrock AgentCore Runtime that guides organizations through their AI transformation journey. The system implements a progressive four-stage workflow where specialized AI agents collaborate to assess organizational readiness, generate solution designs, create implementation plans, and produce deployment-ready specifications.

### Design Principles

1. **Progressive Workflow**: Each agent builds upon the outputs of previous agents, creating a natural transformation journey
2. **Session Persistence**: All conversation state and artifacts are preserved across sessions for seamless resumption
3. **Serverless Architecture**: Leverages AWS managed services for automatic scaling, high availability, and operational simplicity
4. **Event-Driven Design**: Agents communicate through asynchronous patterns using S3, DynamoDB, and EventBridge
5. **Security by Default**: Encryption at rest and in transit, least-privilege IAM, and session isolation
6. **Observability First**: Comprehensive logging, tracing, and metrics for operational excellence

## Architecture

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Agentic AI Factory                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │  Agent 1     │─▶│  Agent 2     │─▶│  Agent 3     │─▶│ Agent 4 ││
│  │ Assessment   │  │   Design     │  │  Planning    │  │  Impl   ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
│         │                 │                 │                │      │
│         ▼                 ▼                 ▼                ▼      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Session State & Artifacts (S3 + DynamoDB)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │                                                    │
         ▼                                                    ▼
┌─────────────────┐                                  ┌─────────────────┐
│  External User  │                                  │  External       │
│  (Web/API)      │                                  │  Systems        │
└─────────────────┘                                  └─────────────────┘
```

### High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ Assessment   │  │   Design     │  │  Planning    │  │  Impl   ││
│  │   API        │  │    API       │  │    API       │  │   API   ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │                 │                 │                │
         ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Lambda Integration Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ Assessment   │  │   Design     │  │  Planning    │  │  Impl   ││
│  │  Lambda      │  │   Lambda     │  │   Lambda     │  │ Lambda  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │                 │                 │                │
         ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Amazon Bedrock AgentCore Runtime                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │  Agent 1     │  │  Agent 2     │  │  Agent 3     │  │ Agent 4 ││
│  │ (Nova Pro)   │  │ (Nova Pro)   │  │ (Nova Pro)   │  │(Nova Pro)││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │                 │                 │                │
         ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Supporting Services                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │DynamoDB  │  │    S3    │  │ Bedrock  │  │  Secrets │  │ MCP  ││
│  │ Session  │  │Documents │  │   Data   │  │ Manager  │  │Server││
│  │  Memory  │  │Artifacts │  │Automation│  │          │  │      ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Agent 1: Assessment & Evaluation Agent

**Purpose**: Document analysis and conversational assessment across four dimensions

**Technology Stack**:
- Runtime: Amazon Bedrock AgentCore Runtime
- Model: Amazon Nova Pro (main agent), Claude Sonnet 4.5 (gap analysis)
- Framework: Strands Agents SDK
- Language: Python 3.11

**Key Components**:

1. **Document Upload Handler**: Receives documents via API, stores in session-scoped S3
2. **Bedrock Data Automation Integration**: Extracts structured content using dimension-specific blueprints
3. **Gap Analysis Engine**: Uses Claude Sonnet 4.5 to identify missing information and generate questions
4. **Smart Merging Engine**: Combines extracted data with user responses using confidence scoring
5. **Session State Manager**: Maintains global session state and persists to DynamoDB

**Tools**:
- `query_assessment_guidelines()`: Retrieves current assessment requirements via AgentCore Gateway
- `extract_document_content(document_type)`: Triggers Bedrock Data Automation extraction
- `analyze_document_gaps(dimension)`: Performs gap analysis using Claude Sonnet 4.5
- `save_assessment_data(session_id, dimension, data)`: Persists assessment data to S3 and DynamoDB

**Data Flow**:
1. User uploads document → S3 session storage
2. Agent selects blueprint → Bedrock Data Automation extraction
3. Confidence analysis → Gap identification
4. Claude Sonnet generates questions → User responds
5. Smart merge → S3 storage → DynamoDB progress update

**Interfaces**:
- Input: REST API (POST /assessment/start, POST /assessment/invoke)
- Output: DynamoDB session memory, S3 consolidated assessment data
- External: AgentCore Gateway (OAuth), Bedrock Data Automation, Secrets Manager

### Agent 2: Design Generation Agent

**Purpose**: Generate 30-section High-Level Design document from assessment data

**Technology Stack**:
- Runtime: Amazon Bedrock AgentCore Runtime
- Model: Amazon Nova Pro (temperature 0.3, max_tokens 10000)
- Framework: Strands Agents SDK with Sliding Window Conversation Manager
- Language: Python 3.11
- PDF Generation: Pandoc + XeLaTeX

**Key Components**:
1. **HLD Template Engine**: Loads 30-section template with metadata
2. **Section Generator**: Progressive generation with 200-1500 word targets
3. **AWS Knowledge Integration**: MCP server for pattern search and documentation
4. **Assessment Data Retriever**: Loads dimension-specific data from Agent 1
5. **PDF Generator**: Converts markdown to PDF with table of contents

**Tools**:
- `initialize_hld_structure()`: Creates 30-section framework
- `get_next_section_to_generate()`: Returns next pending section with context
- `get_assessment_data(dimension)`: Retrieves Agent 1 assessment data
- `search_aws_patterns(query)`: Searches AWS Knowledge MCP
- `read_aws_documentation(url)`: Reads specific AWS docs
- `save_design_output(section_id, content)`: Saves section to S3
- `assemble_hld_document(generate_pdf)`: Assembles final document and generates PDF
- `get_hld_progress()`: Returns completion status

**Data Flow**:
1. Initialize 30-section structure → metadata.json in S3
2. For each section: retrieve assessment data → search AWS patterns → generate content
3. Save section → update metadata → DynamoDB progress tracking
4. All sections complete → assemble markdown → generate PDF
5. Store final documents in S3

**Interfaces**:
- Input: REST API (POST /design/start, POST /design/generate), Agent 1 S3 data
- Output: S3 HLD sections, final markdown, PDF, DynamoDB progress
- External: AWS Knowledge MCP Server (knowledge-mcp.global.api.aws)

### Agent 3: Planning & Architecture Refinement Agent

**Purpose**: Transform HLD into detailed implementation roadmap

**Technology Stack**:
- Runtime: Amazon Bedrock AgentCore Runtime
- Model: Amazon Nova Pro
- Framework: Strands Agents SDK
- Language: Python 3.11

**Key Components**:
1. **Timeline Generator**: Creates phased schedules with dependencies
2. **Architecture Elaborator**: Specifies AWS services and configurations
3. **Resource Planner**: Defines team structure and capacity
4. **Risk Manager**: Generates risk register with mitigations
5. **KPI Framework Builder**: Establishes success metrics

**Tools**:
- `generate_implementation_timeline()`: Creates phased timeline
- `elaborate_architecture()`: Expands HLD into detailed specs
- `plan_resources()`: Defines team and budget
- `identify_risks()`: Generates risk register
- `create_kpi_framework()`: Establishes metrics

**Data Flow**:
1. Load HLD and assessment data from Agent 2
2. Generate timeline with phases, milestones, dependencies
3. Elaborate architecture with service selections
4. Plan resources and identify risks
5. Store implementation plan in S3 and DynamoDB

**Interfaces**:
- Input: REST API (POST /planning/start), Agent 2 HLD document
- Output: S3 implementation plan, DynamoDB progress
- External: None (uses internal knowledge base)

### Agent 4: Implementation Specification Agent

**Purpose**: Generate deployment-ready specifications for three implementation paths

**Technology Stack**:
- Runtime: Amazon Bedrock AgentCore Runtime
- Model: Amazon Nova Pro
- Framework: Strands Agents SDK
- Language: Python 3.11

**Key Components**:
1. **Path Router**: Determines traditional, AI-assisted, or Kiro fabrication
2. **Specification Generator**: Creates path-specific outputs
3. **Traceability Manager**: Links specs to assessment findings
4. **Template Engine**: Renders specifications from templates
5. **Validation Engine**: Ensures completeness and consistency

**Tools**:
- `select_implementation_path()`: Determines appropriate path
- `generate_traditional_specs()`: Creates epics, stories, tasks
- `generate_ai_assisted_specs()`: Creates prompts and schemas
- `generate_kiro_specs()`: Creates agent and workflow specifications
- `validate_specifications()`: Checks completeness and traceability

**Data Flow**:
1. Load implementation plan from Agent 3
2. Determine implementation path
3. Generate path-specific specifications
4. Create traceability mappings
5. Validate and store in S3

**Interfaces**:
- Input: REST API (POST /implementation/execute), Agent 3 plan
- Output: S3 specifications (JSON/YAML/Markdown), DynamoDB metadata
- External: None (uses internal templates)

## Data Models

### Session State (DynamoDB)

**Table**: `agentic-ai-factory-session-memory-{env}`

**Schema**:
```python
{
  "p_key": "session_id",  # Partition key
  "s_key": "assessment:latest|assessment:{timestamp}|design:hld:latest|...",  # Sort key
  "dimension": "technical|business|commercial|governance",
  "data": "JSON string of assessment/design/planning data",
  "timestamp": 1234567890,
  "completion_percentage": 75,
  "record_type": "latest|snapshot|extraction",
  "ttl": 1234567890  # 90 days from creation
}
```

**Access Patterns**:
- Get latest state: Query by p_key, s_key begins_with "assessment:latest"
- Get historical snapshots: Query by p_key, s_key begins_with "assessment:", sort by timestamp
- Get dimension progress: Query by p_key and dimension attribute

### Document Storage (S3)

**Bucket**: `agentic-ai-factory-sessions-{env}`

**Structure**:
```
s3://bucket/
  {session_id}/
    documents/
      {document_key}  # Original uploaded documents
    assessment/
      technical.json  # Extracted + merged assessment data
      business.json
      commercial.json
      governance.json
    design/
      hld/
        metadata.json  # Progress tracking
        1_document_control/
          1.1_document_purpose.md
          1.2_revision_history.md
        5_solution_design/
          5.2_technical_architecture.md
        high_level_design.md  # Final assembled document
        high_level_design.pdf
    planning/
      implementation_plan.json
      risk_register.json
    implementation/
      specifications.json
```

### Agent Configuration

**AgentCore Configuration** (`.bedrock_agentcore.yaml`):
```yaml
entrypoint: "agent{N}.py"
execution_role: "arn:aws:iam::{account}:role/{project}-agent{N}-execution-role-{env}"
region: "ap-southeast-2"
model: "amazon.nova-pro-v1:0"
container_runtime: "bedrock-agentcore"
protocol: "HTTP"
memory:
  short_term: true
  long_term:
    enabled: true
    retention_days: 30
```

## Error Handling

### Retry Strategy

**Bedrock Data Automation**:
- Retry count: 3
- Backoff: Exponential (1s, 2s, 4s)
- Timeout: 300s per attempt

**MCP Server Calls**:
- Retry count: 2
- Backoff: Linear (5s, 10s)
- Timeout: 30s per attempt

**S3/DynamoDB Operations**:
- Retry count: 3
- Backoff: Exponential with jitter
- Timeout: 10s per attempt

### Error Recovery

1. **Extraction Failures**: Log error, return graceful message, allow manual input
2. **MCP Timeouts**: Continue with available information, log warning
3. **Storage Failures**: Retry with backoff, preserve in-memory state
4. **Agent Errors**: Preserve session state, allow resume from last checkpoint

## Testing Strategy

### Unit Testing

**Coverage Target**: 80% code coverage

**Test Categories**:
- Tool function testing (each tool in isolation)
- Data model validation
- Error handling paths
- Configuration loading

**Framework**: pytest with mocking for AWS services

### Integration Testing

**Test Scenarios**:
- End-to-end agent workflows
- Cross-agent data handoff
- S3 and DynamoDB integration
- Bedrock Data Automation integration
- MCP server connectivity

**Environment**: Dedicated test environment with isolated resources

### Local Testing

**Tools**:
- `agent_local_cli_interactive.py`: Interactive CLI for agent testing
- Custom session IDs for state management testing
- Mock MCP server for offline testing

### CI/CD Testing

**Pipeline Stages**:
1. Lint and type checking (flake8, mypy)
2. Unit tests with coverage reporting
3. Integration tests against test environment
4. Deployment validation (agent status, test invocations)

## Security Architecture

### Encryption

**At Rest**:
- S3: Server-side encryption with KMS (SSE-KMS)
- DynamoDB: Encryption at rest with KMS
- Secrets Manager: Encrypted with KMS

**In Transit**:
- API Gateway: TLS 1.2+
- AgentCore Runtime: HTTPS
- AWS service calls: TLS 1.2+

### IAM Policies

**Agent Execution Roles**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::agentic-ai-factory-sessions-${env}/${session_id}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/agentic-ai-factory-session-memory-${env}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:agentic-ai-factory/*"
    }
  ]
}
```

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock-agentcore.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Session Isolation

- Session ID scoping for all S3 paths
- DynamoDB partition key isolation
- AgentCore micro VM isolation per session
- No cross-session data access

## Deployment Strategy

### Infrastructure as Code

**Tool**: AWS CloudFormation

**Stacks per Environment**:
- `agentic-ai-factory-agent1-{env}`: Agent 1 infrastructure
- `agentic-ai-factory-agent2-{env}`: Agent 2 infrastructure
- `agentic-ai-factory-agent3-{env}`: Agent 3 infrastructure
- `agentic-ai-factory-agent4-{env}`: Agent 4 infrastructure

**Resources per Stack**:
- DynamoDB table (session memory)
- S3 bucket (documents and artifacts)
- Lambda function (API integration)
- API Gateway (REST endpoints)
- IAM roles (execution and CodeBuild)
- CloudWatch log groups
- ECR repository (container images)
- CodeBuild project (container builds)

### Agent Deployment

**Process**:
1. Install `bedrock-agentcore-starter-toolkit`
2. Deploy CloudFormation infrastructure
3. Create ECR repository
4. Configure agent with `.bedrock_agentcore.yaml`
5. Build ARM64 container via CodeBuild
6. Push container to ECR
7. Deploy to AgentCore Runtime
8. Update Lambda with agent ARN
9. Validate deployment

**Timeline**: ~5-8 minutes per agent

### Environment Strategy

**Environments**:
- **Test**: Feature testing, rapid iteration
- **Development**: Integration testing, stakeholder demos
- **Staging**: Pre-production validation
- **Production**: Live system

**Promotion Path**: Test → Dev → Staging → Production (manual gates)

## Monitoring and Observability

### Metrics

**AgentCore Metrics**:
- Invocation count
- Response time (p50, p95, p99)
- Error rate
- Token usage
- Memory utilization

**Infrastructure Metrics**:
- API Gateway request count and latency
- Lambda invocation count and duration
- DynamoDB read/write capacity
- S3 request count and data transfer

**Business Metrics**:
- Sessions started
- Assessments completed
- Designs generated
- Plans created
- Specifications produced

### Logging

**CloudWatch Log Groups**:
- `/aws/bedrock-agentcore/runtimes/{agent-name}-DEFAULT`: Agent runtime logs
- `/aws/lambda/agentic-ai-factory-agent{N}-{env}`: Lambda integration logs

**Log Format**: Structured JSON with session_id, agent_name, operation, timestamp

### Tracing

**AWS X-Ray**: Distributed tracing across API Gateway → Lambda → AgentCore → Bedrock


### Dashboards

**CloudWatch Dashboards**:
- Infrastructure health (API, Lambda, DynamoDB, S3)
- Agent performance (invocations, latency, errors)
- Cost tracking (service usage)

**GenAI Dashboard**: Bedrock-specific metrics and agent observability

### Alerting

**CloudWatch Alarms**:
- Agent error rate > 5%
- API Gateway 5xx errors > 10/minute
- DynamoDB throttling events
- Lambda timeout rate > 1%
- S3 4xx errors > 50/minute

**SNS Topics**: Alert notifications to operations team

## Performance Considerations

### Scalability

**AgentCore Runtime**: Auto-scales based on invocation demand
**DynamoDB**: On-demand billing mode for automatic scaling
**S3**: Inherently scalable, no configuration needed
**API Gateway**: Rate limiting (1000 req/sec per account)

### Optimization

**Conversation Management**: Sliding window (20 messages) with result truncation
**Token Efficiency**: Full data in S3, summaries to agent
**Caching**: Blueprint ARNs in environment variables
**Async Processing**: Bedrock Data Automation jobs run asynchronously

### Latency Targets

- Agent invocation: < 5s (p95)
- Document extraction: < 30s (p95)
- Section generation: < 15s (p95)
- API response: < 10s (p95)

## Cost Optimization

### Estimated Monthly Costs (Light Usage)

**Per Agent**:
- AgentCore Runtime: $10-50
- CodeBuild: $5-10
- ECR: $1-5
- DynamoDB: $5-10
- S3: $1-5
- CloudWatch: $2-5

**Total (4 agents)**: $60-280/month

### Optimization Strategies

- AgentCore auto-scales to zero when idle
- DynamoDB on-demand (no idle costs)
- S3 lifecycle policies (delete after 90 days)
- CloudWatch log retention (30 days)
- ECR image cleanup (keep last 5 images)
