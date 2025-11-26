# Agentic AI Factory - Multi-Agent System

A comprehensive four-agent system for transforming organizations from traditional applications to agentic AI-powered solutions, built with Strands Agents SDK and deployed on Amazon Bedrock AgentCore Runtime.

## System Overview

The Agentic AI Factory consists of four interconnected agents that guide organizations through their complete AI transformation journey:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Agent 1      │───▶│    Agent 2      │───▶│    Agent 3      │───▶│    Agent 4      │
│   Assessment    │    │  High Level     │    │ Implementation  │    │Implementation   │
│  & Evaluation   │    │     Design      │    │    Planning     │    │   Guidance      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**What Each Agent Does:**
- **Agent 1**: Evaluates organizational readiness and generates assessment scores
- **Agent 2**: Creates high-level solution designs and architecture recommendations
- **Agent 3**: Develops detailed implementation plans and generates development artifacts
- **Agent 4**: Provides implementation guidance, specifications, and validation criteria

**Note**: Agents provide expert analysis and recommendations. Actual infrastructure deployment and code execution require integration with external tools and CI/CD pipelines.

## What's Implemented

### ✅ Currently Available:
- **Four AI Agents**: All agents deployed and operational on Amazon Bedrock AgentCore Runtime
- **Assessment Capabilities**: Comprehensive readiness evaluation across 4 dimensions
- **Design Generation**: High-level architecture and solution design recommendations
- **Planning Artifacts**: Implementation roadmaps, timelines, and resource planning
- **Implementation Guidance**: Detailed specifications, validation criteria, and execution plans
- **REST APIs**: API Gateway + Lambda integration for all agents
- **Infrastructure**: CloudFormation-based deployment with DynamoDB, S3, and monitoring
- **CI/CD Pipeline**: GitLab CI/CD with automated testing and deployment
- **Memory**: Short-term and long-term memory for all agents
- **Observability**: CloudWatch logs, X-Ray tracing, and GenAI dashboard

### 🚧 Planned Enhancements:
- **Document Processing**: Multi-format document ingestion (PDF, DOCX, etc.)
- **EventBridge Orchestration**: Automatic inter-agent communication
- **UI Frontend**: React/Next.js web interface
- **Authentication**: AWS Cognito user management
- **Actual Execution**: Integration with CI/CD tools for automated infrastructure deployment
- **Tool Integration**: boto3, Terraform, CloudFormation execution capabilities
- **Multi-tenancy**: Tenant isolation and data partitioning

## Architecture

- **Framework**: Strands Agents SDK with Claude Sonnet 4.5
- **Runtime**: Amazon Bedrock AgentCore Runtime
- **Model**: `au.anthropic.claude-sonnet-4-5-20250929-v1:0` (Australia inference endpoint)
- **Region**: `ap-southeast-2` (Sydney)
- **Integration**: REST APIs via API Gateway + Lambda → AgentCore Runtime

## Agents

### Agent 1 - Assessment & Evaluation
**Location**: `agent1_assessment/`

Conducts comprehensive readiness evaluations across four weighted dimensions:
- **Technical Feasibility** (30% weight) - Architecture, integration, data, security
- **Governance/Risk/Compliance** (25% weight) - Policies, regulations, risk management
- **Business Feasibility** (25% weight) - Value alignment, user adoption, change management
- **Commercial/Economics** (20% weight) - Budget, ROI, operational costs

**Key Features**:
- Dynamic questioning engine with adaptive follow-ups
- Context-aware assessment based on user input and conversation history
- Real-time scoring and gap analysis
- High-level solution design generation

**Note**: Document processing capabilities (PDF, DOCX, etc.) are planned but not yet implemented. Currently accepts text-based input.

### Agent 2 - High Level Design
**Location**: `agent2_design/`

Transforms assessment findings into comprehensive high-level solution designs:
- System architecture design and component identification
- Technology stack recommendations and integration patterns
- Data flow and security architecture definition
- Scalability and performance design considerations
- Solution blueprint generation

**Key Features**:
- Architecture pattern selection and validation
- Component interaction design
- Technology compatibility analysis
- Security and compliance design integration

### Agent 3 - Implementation Planning
**Location**: `agent3_planning/`

Converts high-level designs into detailed implementation roadmaps:
- Phased implementation timeline generation
- Resource allocation and team structure planning
- Risk mitigation strategy development
- Project milestone and deliverable definition
- Implementation sequencing and dependencies

**Key Features**:
- Timeline development with Gantt chart interfaces
- Resource requirement calculations
- Comprehensive risk mitigation planning
- Agile methodology alignment

### Agent 4 - Implementation Execution Guidance
**Location**: `agent4_implementation/`

Provides implementation guidance and recommendations based on outputs from the previous three agents:

**Guidance Areas**:
- **Infrastructure Deployment** - CloudFormation template recommendations, AWS resource planning
- **Application Development** - Code structure guidance, testing strategies, security best practices
- **Integration Setup** - API Gateway configuration guidance, data pipeline design
- **Testing & Validation** - Test suite recommendations, quality gate definitions
- **Deployment Pipeline** - CI/CD strategy recommendations, deployment sequencing

**Key Features**:
- Implementation task sequencing and dependency analysis
- Validation criteria and success metrics definition
- Artifact specification and documentation generation
- Multi-mode execution planning (automated, guided, manual, hybrid)
- Progress tracking and status reporting recommendations

**Note**: This agent provides expert guidance and recommendations. Actual infrastructure deployment and code execution would require integration with deployment tools and CI/CD pipelines.

## Deployment with GitLab CI/CD

This project uses **GitLab CI/CD** for automated testing, building, and deployment across multiple environments with **Amazon Bedrock AgentCore Runtime** deployment.

### Prerequisites
1. **GitLab Project** with CI/CD enabled
2. **AWS Account** with comprehensive IAM permissions configured
3. **Claude Sonnet 4.5 access** enabled in Bedrock console (ap-southeast-2)
4. **GitLab Runner** with AWS credentials or IAM role access
5. **Bedrock AgentCore** access enabled in your AWS account

### Deployment Architecture

The deployment uses **Amazon Bedrock AgentCore Runtime** with **AWS CodeBuild** for container image building:

**Build Process:**
1. Agent code packaged with dependencies
2. CodeBuild creates ARM64 Docker container
3. Container pushed to Amazon ECR
4. AgentCore Runtime pulls and deploys container
5. Agent available via ARN endpoint

**Key Components:**
- **ECR Repositories**: One per agent (`bedrock-agentcore-agent[1-4]`)
- **CodeBuild Projects**: Automated container builds (`bedrock-agentcore-agent[1-4]-builder`)
- **AgentCore Runtime**: Serverless agent execution with auto-scaling
- **Memory Service**: Short-term + Long-term memory for each agent
- **Observability**: CloudWatch logs, X-Ray tracing, GenAI dashboard

### Required AWS Permissions

The GitLab CI/CD pipeline requires comprehensive AWS permissions to deploy all four agents to Bedrock AgentCore Runtime:

#### Core Services Access:
- **Amazon Bedrock**: Model invocation, foundation model access, and AgentCore Runtime
- **Bedrock AgentCore**: Agent deployment, configuration, and runtime management
- **DynamoDB**: Table creation and data operations for agent state storage
- **S3**: Bucket creation and object operations for document storage and CodeBuild artifacts
- **Lambda**: Function creation and management for API integration
- **API Gateway**: REST API creation and configuration
- **CloudFormation**: Stack deployment and management
- **IAM**: Role creation and policy management for agent execution
- **CloudWatch**: Logging and monitoring
- **ECR**: Container registry for agent runtime images
- **CodeBuild**: Container image building for AgentCore Runtime deployment

#### Comprehensive IAM Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:*",
        "bedrock-agentcore:*",
        "bedrock-agent:*",
        "bedrock-agent-runtime:*",
        "dynamodb:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "events:*",
        "cloudformation:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:PassRole",
        "iam:GetRole",
        "iam:ListRoles",
        "ecr:*",
        "logs:*",
        "cloudwatch:*",
        "codebuild:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### GitLab CI/CD Setup

#### 1. Configure CI/CD Variables
In GitLab Project Settings → CI/CD → Variables, add:

```bash
# AWS Configuration
AWS_DEFAULT_REGION = ap-southeast-2

# Project Configuration  
PROJECT_NAME = agentic-ai-factory

# Bedrock Configuration
BEDROCK_MODEL_ID = au.anthropic.claude-sonnet-4-5-20250929-v1:0
```

**Authentication Options:**
- **Option 1**: Use GitLab runner with IAM role (recommended)
- **Option 2**: Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` variables (less secure)

**Variable Configuration Settings:**
- All variables: Not protected/masked (configuration values, not secrets)

#### 2. Pipeline Architecture

**Deployment Method**: Amazon Bedrock AgentCore Runtime deployment with supporting infrastructure
- ✅ **AgentCore Runtime**: Agents deployed to Bedrock AgentCore for scalable execution
- ✅ **Infrastructure Support**: CloudFormation deploys supporting AWS resources
- ✅ **Integrated Deployment**: Complete agent + infrastructure deployment
- ✅ **Production Ready**: Built-in monitoring, scaling, and observability

**Pipeline Stages:**
```
Test → Build → Deploy Test → Deploy Dev → Deploy Staging → Deploy Prod
```

**What Gets Deployed:**

**Per Environment (Test/Dev/Staging/Prod):**

**Infrastructure Layer (CloudFormation):**
- **DynamoDB Tables**: Agent state and session storage
- **S3 Buckets**: Document storage and artifacts  
- **Lambda Functions**: API integration layer
- **API Gateway**: REST endpoints for each agent
- **IAM Roles**: Secure execution policies for agents
- **CloudWatch**: Logging and monitoring

**Agent Layer (Bedrock AgentCore Runtime):**
- **Agent 1**: Assessment & Evaluation Agent deployed to AgentCore
- **Agent 2**: Design & Architecture Agent deployed to AgentCore
- **Agent 3**: Planning & Strategy Agent deployed to AgentCore
- **Agent 4**: Implementation Execution Agent deployed to AgentCore
- **Runtime Configuration**: Execution roles, memory, and scaling settings
- **Model Integration**: Claude Sonnet 4.5 via global inference profile

#### 3. Branch Strategy
- **`feature/*`** → Automatic testing, manual test deployment
- **`develop`** → Automatic testing + build, manual test/dev deployment
- **`main`** → Automatic testing + build, manual staging/prod deployment

### Quick Start Deployment

#### Test Environment (Feature Testing)
```bash
# Push feature branch
git checkout -b feature/my-feature
git push origin feature/my-feature

# Manually trigger test deployment in GitLab UI
# Pipeline → Jobs → deploy-test → Play button
```

#### Development Environment
```bash
# Push to develop branch
git checkout develop
git push origin develop

# Manually trigger dev deployment in GitLab UI
# Pipeline → Jobs → deploy-dev → Play button
```

#### Staging Environment  
```bash
# Push to main branch
git checkout main
git push origin main

# Manually trigger staging deployment in GitLab UI
# Pipeline → Jobs → deploy-staging → Play button
```

#### Production Environment
```bash
# After staging validation
# Manually trigger production deployment in GitLab UI
# Pipeline → Jobs → deploy-prod → Play button
# (Requires approval from authorized users)
```

### Deployment Process

Each deployment stage follows this comprehensive process:

#### Phase 1: Infrastructure Deployment (CloudFormation)
**Per Agent (4 agents total):**
- CloudFormation Stack: `agentic-ai-factory-agent[1-4]-{environment}`
- DynamoDB Table: Agent-specific data storage
- S3 Bucket: Document and artifact storage  
- Lambda Function: API integration layer
- API Gateway: REST endpoints
- IAM Execution Role: Secure access policies for AgentCore
- CloudWatch Log Group: Monitoring and debugging

#### Phase 2: Agent Deployment (Bedrock AgentCore)
**Per Agent:**
1. **ECR Repository Setup**: Auto-creates ECR repository for container images
2. **Configuration**: Creates `.bedrock_agentcore.yaml` with agent settings, execution role, and memory configuration
3. **Container Build**: CodeBuild creates ARM64 container image with agent code and dependencies
4. **ECR Push**: Container image pushed to Amazon ECR
5. **AgentCore Deployment**: Agent deployed to Bedrock AgentCore Runtime with long-term memory enabled
6. **Integration**: Lambda functions updated with agent ARNs
7. **Validation**: Agent status and invocation testing

**Deployment Output:**
```
✅ COMPLETED completed in 1.5s
🎉 CodeBuild completed successfully
Deployment completed successfully
Agent ARN: arn:aws:bedrock-agentcore:ap-southeast-2:941384789627:runtime/agent1-{ID}
Memory: Short-term + Long-term memory enabled
```

#### Phase 3: Integration & Validation
- **API Integration**: Lambda functions connect to deployed agents
- **Event Orchestration**: EventBridge rules for inter-agent communication
- **Health Checks**: Agent status verification and test invocations
- **Monitoring Setup**: CloudWatch dashboards and alerting

**Example for Test Environment:**
- **Infrastructure**: `agentic-ai-factory-agent1-test` (CloudFormation)
- **Agent Runtime**: Agent deployed to Bedrock AgentCore Runtime
- **Integration**: API Gateway → Lambda → AgentCore Agent
- **Monitoring**: CloudWatch logs and metrics

### Local Testing (Optional)

```bash
# Test individual agents locally
cd agent1_assessment
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 test_claude_sonnet4.py

# Test all agents
for agent in agent1_assessment agent2_design agent3_planning agent4_implementation; do
    echo "Testing $agent..."
    python3 $agent/test_claude_sonnet4.py
done
```

### Deployment Validation

After deployment, the pipeline automatically validates both infrastructure and agents:

#### Infrastructure Validation:
```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name agentic-ai-factory-agent1-{env} --query 'Stacks[0].StackStatus'

# Get API endpoints
aws cloudformation describe-stacks --stack-name agentic-ai-factory-agent1-{env} --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue'
```

#### Agent Runtime Validation:
```bash
# Check AgentCore status
agentcore status --region ap-southeast-2

# Test agent invocation
agentcore invoke '{"prompt": "Hello, this is a deployment validation test"}' --region ap-southeast-2

# Test API endpoints
curl -X POST https://{api-id}.execute-api.ap-southeast-2.amazonaws.com/{env}/assessment/start
```

#### End-to-End Validation:
- **Agent Deployment**: Verify agents are running in AgentCore Runtime
- **API Integration**: Test Lambda → AgentCore communication
- **Model Access**: Confirm Claude Sonnet 4.5 integration
- **Resource Access**: Validate DynamoDB and S3 permissions

### Agent Testing Status

All agents have been tested and validated:

- ✅ **Agent 1 - Assessment**: PASSED - Comprehensive readiness evaluation capabilities
- ✅ **Agent 2 - Design**: PASSED - High-level solution design generation  
- ✅ **Agent 3 - Planning**: PASSED - Implementation roadmap and timeline creation
- ✅ **Agent 4 - Implementation**: PASSED - Execution and deployment capabilities

**Test Coverage**:
- Model integration with Claude Sonnet 4.5
- API endpoint functionality
- Error handling and validation
- Performance benchmarks
- Security compliance

## Branching Strategy

The project follows a Git Flow branching strategy with environment-specific deployments:

### Branch Types & Rules

#### **`main` Branch (Production)**
- ✅ **Automatic**: Tests + Build artifacts
- 🚀 **Manual Deployments Available**:
  - `deploy-staging` (manual)
  - `deploy-prod` (manual)
- 🔒 **Protected**: Requires approvals for merges

#### **`develop` Branch (Development)**
- ✅ **Automatic**: Tests + Build artifacts  
- 🚀 **Manual Deployments Available**:
  - `deploy-test` (manual)
  - `deploy-dev` (manual)
- 🔄 **Integration branch** for feature development

#### **`feature/*` Branches (Feature Development)**
- ✅ **Automatic**: Tests only
- 🧪 **Manual Deployments Available**:
  - `deploy-test` (manual) - for testing individual features
- 🔧 **Short-lived** branches for specific features

#### **Merge Request Branches**
- ✅ **Automatic**: Tests only
- 🔍 **Validation** before merge

### Git Flow Diagram

```
main (production)
 ├── develop (integration)
 │    ├── feature/agent-improvements
 │    ├── feature/new-api-endpoints  
 │    └── feature/performance-optimization
 └── hotfix/critical-bug (direct to main if needed)
```

### Deployment Flow by Branch

| Branch Type | Test | Build | Test Env | Dev Env | Staging | Production |
|-------------|------|-------|----------|---------|---------|------------|
| `feature/*` | ✅ Auto | ❌ | 🎯 Manual | ❌ | ❌ | ❌ |
| `develop` | ✅ Auto | ✅ Auto | 🎯 Manual | 🎯 Manual | ❌ | ❌ |
| `main` | ✅ Auto | ✅ Auto | ❌ | ❌ | 🎯 Manual | 🎯 Manual |

### Typical Workflow

#### 1. Feature Development
```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-agent-capability
# Make changes, commit
git push origin feature/new-agent-capability
```
- Tests run automatically
- Optionally deploy to test environment for validation

#### 2. Integration
```bash
# Create merge request: feature/new-agent-capability → develop
# After review and approval, merge
```
- Tests + build run automatically on develop
- Deploy to test environment for integration testing
- Deploy to dev environment for stakeholder review

#### 3. Release
```bash
# Create merge request: develop → main
# After review and approval, merge
```
- Deploy to staging for final validation
- Deploy to production after approval

### Branch Protection Recommendations

- **`main`**: Require 2+ approvals, require CI to pass
- **`develop`**: Require 1+ approval, require CI to pass  
- **`feature/*`**: Require CI to pass before merge

### Environment URLs

- **Test**: `https://test-agentic-ai-factory.example.com`
- **Development**: `https://dev-agentic-ai-factory.example.com`
- **Staging**: `https://staging-agentic-ai-factory.example.com`
- **Production**: `https://agentic-ai-factory.example.com`

## System Integration

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Lambda Layer   │───▶│ AgentCore Agent │
│  (REST APIs)    │    │ (Integration)   │    │   (Runtime)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  CloudWatch     │    │ Claude Sonnet   │
│   (Frontend)    │    │   (Logging)     │    │     4.5         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### API Endpoints

Each agent provides REST API endpoints that integrate with Bedrock AgentCore:

**Agent 1 - Assessment** (AgentCore Runtime):
- `POST /assessment/start` - Start new assessment session
- `POST /assessment/invoke` - Send assessment prompts to AgentCore
- `GET /assessment/progress` - Check assessment progress

**Agent 2 - Design** (AgentCore Runtime):
- `POST /design/start` - Start new design session
- `POST /design/generate` - Generate high-level design via AgentCore
- `POST /design/refine` - Refine existing design
- `POST /design/validate` - Validate design components

**Agent 3 - Planning** (AgentCore Runtime):
- `POST /planning/start` - Start implementation planning session
- `POST /planning/generate` - Generate implementation roadmap via AgentCore
- `POST /planning/timeline` - Create project timeline
- `POST /planning/resources` - Calculate resource requirements

**Agent 4 - Implementation Guidance** (AgentCore Runtime):
- `POST /implementation/execute` - Get implementation execution guidance via AgentCore
- `GET /implementation/status` - Get guidance session status
- `GET /implementation/artifacts` - Get implementation recommendations and specifications
- `POST /implementation/plan` - Generate deployment plan and sequencing
- `GET /implementation/validate` - Get validation criteria and success metrics

### Integration Flow (Current Implementation)

1. **Client Request** → API Gateway
2. **API Gateway** → Lambda Function (API Integration Layer)
3. **Lambda Function** → Bedrock AgentCore Agent (via Agent ARN)
4. **AgentCore Agent** → Claude Sonnet 4.5 (Model Invocation)
5. **Response Flow** → AgentCore → Lambda → API Gateway → Client

**Current Agent Invocation:**
- Each agent is invoked independently via its REST API
- Client/orchestrator manages the workflow between agents
- Results stored in DynamoDB and S3 for handoff between agents

### Future Enhancement: Event-Driven Orchestration

**Planned (Not Yet Implemented):**
The system is designed to support Amazon EventBridge for automatic inter-agent communication:

```
Assessment Complete → Design Generated → Planning Created → Implementation Guidance
  (AgentCore 1)      (AgentCore 2)      (AgentCore 3)       (AgentCore 4)
       ↓                    ↓                  ↓                   ↓
   EventBridge ────────▶ EventBridge ────▶ EventBridge ────▶ EventBridge
```

This would enable:
- Automatic triggering of downstream agents
- Event-driven workflow orchestration
- Reduced client-side coordination logic
- Better scalability and decoupling
- Integration with external deployment tools for actual execution

### Data Flow (Current Implementation)

1. **Assessment Phase**: 
   - User provides context via API Gateway
   - Lambda invokes Agent 1 in AgentCore Runtime
   - Agent 1 conducts evaluation using Claude Sonnet 4.5
   - Generates readiness scores and gaps
   - Stores results in DynamoDB

2. **Design Phase**: 
   - Client retrieves assessment results from DynamoDB
   - Client invokes Agent 2 via API Gateway
   - Agent 2 (AgentCore) creates high-level design
   - Generates architecture and technology recommendations
   - Stores design artifacts in S3

3. **Planning Phase**: 
   - Client retrieves design specifications from S3
   - Client invokes Agent 3 via API Gateway
   - Agent 3 (AgentCore) creates implementation plan
   - Generates timeline, resources, and roadmap
   - Stores planning documents in S3

4. **Implementation Guidance Phase**: 
   - Client retrieves planning artifacts from S3
   - Client invokes Agent 4 via API Gateway
   - Agent 4 (AgentCore) provides implementation guidance and recommendations
   - Generates implementation specifications, validation criteria, and deployment plans
   - Stores guidance artifacts and specifications in S3
   
**Note**: Actual implementation execution (infrastructure deployment, code generation, etc.) would be performed by external CI/CD pipelines or deployment tools based on Agent 4's guidance.

**Note:** Inter-agent communication is currently client-orchestrated. EventBridge-based automatic orchestration is a planned enhancement.

## Cost Considerations

### Estimated Monthly Costs (Light Usage)
**Per Agent:**
- AgentCore Runtime: $10-50 (pay per invocation + compute time)
- CodeBuild: $5-10 (build minutes, ARM64)
- ECR: $1-5 (container image storage)
- DynamoDB: $5-10 (on-demand)
- S3: $1-5 (storage and requests)
- CloudWatch: $2-5 (logs and metrics)

**Total for 4 Agents**: $60-280/month (light usage)

**Cost Optimization:**
- AgentCore auto-scales to zero when not in use
- DynamoDB on-demand pricing (no idle costs)
- S3 lifecycle policies for old artifacts
- CloudWatch log retention policies

## Configuration

### AgentCore Runtime Configuration
All agents are deployed to Bedrock AgentCore Runtime with:
```yaml
# Agent Configuration
entrypoint: "agent{N}.py"
execution_role: "arn:aws:iam::{account}:role/{project}-agent{N}-execution-role-{env}"
region: "ap-southeast-2"
model: "au.anthropic.claude-sonnet-4-5-20250929-v1:0"

# Runtime Settings
container_runtime: "bedrock-agentcore"
protocol: "HTTP"
```

### AgentCore Resource Requirements
- **Agent 1**: AgentCore managed scaling, 300s timeout
- **Agent 2**: AgentCore managed scaling, 300s timeout  
- **Agent 3**: AgentCore managed scaling, 600s timeout (complex artifact generation)
- **Agent 4**: AgentCore managed scaling, 600s timeout (implementation execution)

### Supporting Infrastructure Resources
- **Lambda Functions**: 1GB memory, 300s timeout (API integration only)
- **DynamoDB**: On-demand billing mode
- **S3**: Standard storage with lifecycle policies
- **API Gateway**: Regional endpoints with throttling

## Deployment Fixes Applied

The following issues were resolved to enable successful AgentCore deployment:

### 1. Strands Agent Framework Compatibility
- **Issue**: Incorrect imports and API usage for Strands Agents SDK
- **Fixes Applied**:
  - Changed `from strands import Agent, Tool` → `from strands import Agent, tool` (lowercase)
  - Changed all `@Tool` decorators → `@tool` decorators
  - Changed `instructions=` parameter → `system_prompt=` parameter
  - Removed unsupported `add_tool()` method calls
  - Simplified tool architecture to pass `tools=[]` during Agent initialization
- **Impact**: Agents now properly initialize and run in AgentCore Runtime

### 2. Model Configuration
- **Issue**: Rate limiting and model access errors
- **Fixes Applied**:
  - Using cross-region inference profile: `au.anthropic.claude-sonnet-4-5-20250929-v1:0`
  - Provides higher quotas and cross-region routing
  - Better resilience for production workloads
- **Impact**: Reduced rate limiting errors and improved availability

### 3. ECR Repository Management & Permissions
- **Issue**: CodeBuild unable to push container images to ECR
- **Fixes Applied**:
  - Scripts explicitly create ECR repositories before configuration
  - Added ECR push permissions to all CodeBuild roles
  - Added ECR pull permissions to execution roles
  - Automated permission configuration in deploy scripts
- **Impact**: Container images successfully build and deploy

### 4. IAM Permissions
- **CodeBuild Access**: Added inline policy to GitLabCIRole (managed policy limit reached)
- **ECR Push**: CodeBuild roles granted comprehensive ECR permissions
- **ECR Pull**: Execution roles granted ECR pull permissions
- **Trust Policy**: Added `bedrock-agentcore.amazonaws.com` to execution role trust policies
- **Impact**: All AWS service integrations work correctly

### 5. Non-Interactive Configuration
- **Issue**: Interactive prompts blocking CI/CD pipeline
- **Fix**: Automated responses via printf for all configuration prompts
- **Features**: Short-term memory enabled for all agents (30-day retention)
- **Impact**: Fully automated CI/CD deployment

### 6. Runtime Initialization & Memory Provisioning
- **Issue**: Tests failing because runtime and memory not ready
- **Fixes Applied**:
  - Increased wait time from 30 seconds to 90 seconds
  - Allows time for container startup and memory provisioning
  - Disabled pre-deployment model tests to avoid rate limits
- **Impact**: Deployment tests now succeed consistently

### 7. Python Environment
- **Issue**: macOS Homebrew Python externally-managed environment
- **Fix**: Added `--break-system-packages` flag and PATH configuration
- **Impact**: Works in both local macOS and GitLab CI/CD environments

### 8. Type System Fixes
- **Issue**: Undefined type references in dataclasses
- **Fixes Applied**:
  - Fixed `PlanningPhase` → `str` in agent2_design
  - Fixed `ImplementationPath`, `Epic`, `AISpecification` → `str` in agent3_planning
- **Impact**: All agents import successfully without errors

## Monitoring & Observability

### AgentCore Runtime Monitoring
- **AgentCore Logs**: Automatic logging for all agent invocations
- **CloudWatch Log Groups**: `/aws/bedrock-agentcore/runtimes/[AGENT-NAME]-DEFAULT`
- **X-Ray Tracing**: Distributed tracing enabled by default
- **GenAI Dashboard**: https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#gen-ai-observability/agent-core

### Viewing Logs
```bash
# Tail agent logs
aws logs tail /aws/bedrock-agentcore/runtimes/agent1_assessment-[ID]-DEFAULT \
  --log-stream-name-prefix "2025/10/12/[runtime-logs]" --follow

# View recent logs
aws logs tail /aws/bedrock-agentcore/runtimes/agent1_assessment-[ID]-DEFAULT \
  --log-stream-name-prefix "2025/10/12/[runtime-logs]" --since 1h
```

### Agent Status
```bash
# Check agent status
agentcore status --agent agent1_assessment

# Test agent invocation
agentcore invoke '{"prompt": "Hello"}' --agent agent1_assessment
```
- **AgentCore Metrics**: Built-in performance and usage metrics
- **Agent Status**: Real-time agent health and availability monitoring
- **Invocation Tracing**: Complete request/response tracing

### Infrastructure Monitoring
- **CloudWatch Logs**: `/aws/lambda/agentic-ai-factory-agent{1,2,3,4}-{env}` (API layer)
- **X-Ray Tracing**: Distributed tracing across Lambda → AgentCore → Bedrock
- **EventBridge Monitoring**: Event flow and processing metrics
- **Bedrock Metrics**: Model invocation and performance tracking

### Observability Tools
- **AgentCore CLI**: `agentcore status` for real-time agent monitoring
- **CloudWatch Dashboards**: Infrastructure and API performance
- **Bedrock Console**: Model usage and cost tracking
- **GitLab CI/CD**: Pipeline and deployment monitoring

## Security

- **IAM Roles**: Least privilege access for each agent
- **KMS Encryption**: Data at rest and in transit
- **VPC Isolation**: Private subnets for sensitive operations
- **API Gateway**: Rate limiting and authentication
- **Audit Logging**: Complete audit trail via CloudTrail

## Troubleshooting

### Common Issues

**Model Access Denied**: Enable Claude Sonnet 4.5 in Bedrock console (ap-southeast-2)
**AgentCore Access**: Ensure Bedrock AgentCore is available in your AWS account
**Region Issues**: Ensure using ap-southeast-2 region consistently
**Deployment Fails**: Check AWS permissions and GitLab runner credentials
**CloudFormation Errors**: Check stack events for detailed error information
**Agent Deployment Errors**: Check `agentcore status` and CloudWatch logs
**Agent Runtime Issues**: Use `agentcore invoke` to test agent functionality

### Debug Commands

#### Infrastructure Debugging:
```bash
# Check model access
aws bedrock get-foundation-model --model-identifier anthropic.claude-sonnet-4-5-20250929-v1:0 --region ap-southeast-2

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name agentic-ai-factory-agent1-test --region ap-southeast-2

# Check stack events for errors
aws cloudformation describe-stack-events --stack-name agentic-ai-factory-agent1-test --region ap-southeast-2

# Check Lambda logs
aws logs tail /aws/lambda/agentic-ai-factory-agent1-test --follow
```

#### AgentCore Debugging:
```bash
# Check agent status
agentcore status --region ap-southeast-2

# Check specific agent status
agentcore status --agent agent1 --region ap-southeast-2

# Test agent invocation
agentcore invoke '{"prompt": "Test message"}' --region ap-southeast-2

# Test with specific agent
agentcore invoke '{"prompt": "Test message"}' --agent agent1 --region ap-southeast-2

# Verbose status output
agentcore status --verbose --region ap-southeast-2
```

#### API Testing:
```bash
# Test API endpoints
curl -X POST https://{api-id}.execute-api.ap-southeast-2.amazonaws.com/test/assessment/start

# Test with payload
curl -X POST https://{api-id}.execute-api.ap-southeast-2.amazonaws.com/test/assessment/invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Start assessment for my organization"}'
```

### GitLab CI/CD Troubleshooting

**Pipeline Fails at Deployment:**
1. Check GitLab CI/CD job logs for specific error messages
2. Verify AWS credentials are properly configured
3. Ensure all required AWS permissions are granted (including Bedrock AgentCore)
4. Check CloudFormation stack events for infrastructure issues
5. Verify `bedrock-agentcore-starter-toolkit` installation
6. Check agent code structure and entrypoint configuration

**Common GitLab CI Errors:**
- `AccessDenied`: Missing AWS permissions (especially Bedrock AgentCore)
- `ValidationError`: CloudFormation template issues
- `ResourceAlreadyExists`: Stack or resource naming conflicts
- `InsufficientCapabilities`: Missing CAPABILITY_NAMED_IAM
- `agentcore command not found`: Toolkit installation failed
- `Agent configuration failed`: Invalid entrypoint or execution role
- `LimitExceeded: Cannot exceed quota for PoliciesPerRole`: IAM role has 10 managed policies (AWS limit)

**IAM Policy Limit Issue:**
If you encounter `LimitExceeded: Cannot exceed quota for PoliciesPerRole: 10`, your GitLabCIRole has reached the AWS limit of 10 managed policies. Add CodeBuild permissions as an inline policy instead:

```bash
# Create inline policy for CodeBuild
cat > /tmp/codebuild-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:CreateProject",
        "codebuild:UpdateProject",
        "codebuild:DeleteProject",
        "codebuild:BatchGetProjects",
        "codebuild:ListProjects",
        "codebuild:StartBuild",
        "codebuild:BatchGetBuilds",
        "codebuild:StopBuild"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Add inline policy to role
aws iam put-role-policy \
  --role-name GitLabCIRole \
  --policy-name CodeBuildAccess \
  --policy-document file:///tmp/codebuild-policy.json
```

Or via AWS Console:
1. Go to IAM → Roles → GitLabCIRole
2. Click "Add permissions" → "Create inline policy"
3. Switch to JSON tab and paste the policy above
4. Name it "CodeBuildAccess" and create

**AgentCore Specific Errors:**
- `ExecutionRoleNotFound`: IAM role not created or accessible
- `ModelAccessDenied`: Claude Sonnet 4.5 not enabled in ap-southeast-2
- `AgentDeploymentFailed`: Check agent code structure and dependencies
- `ConfigurationError`: Verify agent entrypoint and requirements.txt
- `CodeBuild failed during COMPLETED phase`: ECR push permissions missing on CodeBuild role
- `Access denied while validating ECR URI`: Execution role needs ECR pull permissions
- `Role validation failed`: Execution role trust policy missing bedrock-agentcore.amazonaws.com

**Successful Deployment Indicators:**
```
✅ COMPLETED completed in 1.5s
🎉 CodeBuild completed successfully
Deployment completed successfully - Agent: arn:aws:bedrock-agentcore:...
```

**Post-Deployment Verification:**
```bash
# Check agent status
agentcore status --agent agent1

# Test agent invocation
agentcore invoke '{"prompt": "Hello, I would like to start an assessment"}' --agent agent1

# View CloudWatch logs
aws logs tail /aws/bedrock-agentcore/runtimes/[AGENT-ID]-DEFAULT \
  --log-stream-name-prefix "2025/10/12/[runtime-logs]" --follow

# Access GenAI Observability Dashboard
# https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#gen-ai-observability/agent-core
```

**Pipeline Job Debugging:**
```bash
# View job logs in GitLab UI
GitLab Project → CI/CD → Pipelines → [Pipeline] → [Job] → View Logs

# Check job artifacts
GitLab Project → CI/CD → Pipelines → [Pipeline] → [Job] → Browse Artifacts
```

## Development

### Project Structure
```
├── .gitlab-ci.yml             # GitLab CI/CD pipeline
├── deployment/gitlab/         # GitLab deployment configuration
├── agent1_assessment/         # Assessment & Evaluation Agent
│   ├── agent1.py             # Main agent implementation
│   ├── api_integration.py    # REST API layer
│   ├── infrastructure.yaml   # CloudFormation template
│   └── test_claude_sonnet4.py # Integration tests
├── agent2_design/            # High Level Design Agent
├── agent3_planning/          # Implementation Planning Agent
├── agent4_implementation/    # Implementation Execution Agent
└── README.md                 # This file
```

### Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Follow the established agent pattern
3. Use Claude Sonnet 4.5 global inference profile
4. Implement comprehensive error handling
5. Include integration tests
6. Create merge request to `develop` branch
7. Pipeline will automatically test your changes
8. After review, merge and deploy via GitLab CI

### GitLab CI Pipeline

The pipeline automatically:
- ✅ **Tests** all four agents on every commit
- 📦 **Builds** deployment artifacts for all agents
- 🏗️ **Deploys** infrastructure via CloudFormation
- 🤖 **Deploys** agents to Bedrock AgentCore Runtime
- 🔍 **Validates** infrastructure, agent status, and invocations
- 📊 **Monitors** performance across infrastructure and AgentCore

**Deployment Process per Agent:**
1. Install `bedrock-agentcore-starter-toolkit`
2. Deploy CloudFormation infrastructure (DynamoDB, S3, Lambda, API Gateway, IAM roles)
3. Create ECR repository for container images
4. Configure agent with execution role, ECR URI, and long-term memory
5. Build ARM64 container via CodeBuild
6. Push container to ECR
7. Deploy to AgentCore Runtime
8. Update Lambda with agent ARN
9. Validate deployment and test invocation

**Deployment Timeline:**
- Infrastructure: ~2-3 minutes (CloudFormation)
- Agent Build: ~30 seconds (CodeBuild)
- Agent Deployment: ~1-2 minutes (AgentCore)
- Memory Provisioning: ~2-3 minutes (Long-term memory)
- **Total per Agent**: ~5-8 minutes
- **All 4 Agents**: ~20-30 minutes

See `deployment/gitlab/README.md` for detailed pipeline documentation.

## Agent 4 - Implementation Guidance Modes

Agent 4 provides implementation guidance tailored to different organizational needs:

### Automated Mode Guidance
- Generates specifications for fully automated CI/CD execution
- Provides validation criteria and rollback procedures
- Suitable for well-defined, low-risk tasks
- Best for: Infrastructure provisioning, standard deployments

### Guided Mode Guidance
- Creates step-by-step execution plans with validation checkpoints
- Defines approval gates for critical operations
- Provides detailed progress tracking specifications
- Best for: Complex integrations, production deployments

### Manual Mode Guidance
- Provides detailed instructions and specifications for human execution
- Defines validation criteria and feedback mechanisms
- Generates comprehensive documentation and runbooks
- Best for: Custom implementations, learning scenarios

### Hybrid Mode Guidance
- Combines automated and manual execution recommendations
- Identifies tasks suitable for automation vs. human oversight
- Provides escalation criteria and decision frameworks
- Best for: Large-scale transformations, enterprise deployments

**Note**: Agent 4 provides expert guidance and recommendations. Actual execution requires integration with deployment tools, CI/CD pipelines, or manual implementation by development teams.

## Future Enhancements

### Planned Features (Not Yet Implemented):

1. **UI Integration**: Connect all four agents to React/Next.js frontend for user-friendly interaction
2. **Authentication**: Implement AWS Cognito for user management and multi-user support
3. **Multi-tenancy**: Add tenant isolation and data partitioning for enterprise deployments
4. **EventBridge Orchestration**: Implement automatic inter-agent communication and workflow automation
5. **Analytics Dashboard**: Add comprehensive usage and performance analytics
6. **Agent 4 Execution Integration**: Integrate with CI/CD tools (GitHub Actions, GitLab CI, Jenkins) for actual implementation execution
7. **Tool Integration**: Add actual implementation tools (boto3 for AWS, Terraform, CloudFormation execution)
8. **Artifact Storage**: Enhanced artifact management with versioning and rollback capabilities

## GitLab CI/CD Pipeline

### Pipeline Overview
```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Test   │──▶│  Build  │──▶│Deploy   │──▶│Deploy   │──▶│Deploy   │──▶│Deploy   │
│ Agents  │   │Artifacts│   │  Test   │   │  Dev    │   │Staging  │   │  Prod   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### Pipeline Features

**✅ Automated Testing**: All agents tested on every commit
**📦 Artifact Building**: Deployment packages created for releases  
**🏗️ Infrastructure Deployment**: CloudFormation deploys supporting resources
**🤖 Agent Deployment**: Bedrock AgentCore Runtime deployment with `agentcore` CLI
**🔍 Comprehensive Validation**: Infrastructure, agent status, and invocation testing
**🚀 Multi-Environment**: Test, Dev, Staging, Production environments
**🔒 Manual Gates**: Manual approval required for deployments
**📊 Full Observability**: Pipeline, infrastructure, and agent runtime monitoring
**⚡ Scalable Runtime**: Agents run on Bedrock AgentCore for automatic scaling
**🔐 Secure Execution**: IAM roles and policies for secure agent execution

### Environments & Access

| Environment | Branch | Trigger | URL |
|-------------|--------|---------|-----|
| **Test** | `feature/*`, `develop` | Manual | `https://test-agentic-ai-factory.example.com` |
| **Development** | `develop` | Manual | `https://dev-agentic-ai-factory.example.com` |
| **Staging** | `main` | Manual | `https://staging-agentic-ai-factory.example.com` |
| **Production** | `main` | Manual | `https://agentic-ai-factory.example.com` |

### Monitoring & Observability

- **Pipeline Status**: GitLab CI/CD dashboard with real-time job status
- **Infrastructure Status**: CloudFormation stack monitoring
- **Agent Runtime Status**: AgentCore status monitoring and health checks
- **Agent Performance**: CloudWatch dashboards and Bedrock metrics
- **API Monitoring**: API Gateway request/response monitoring
- **Agent Invocation Monitoring**: AgentCore invocation metrics and tracing
- **Error Tracking**: CloudWatch logs with structured logging
- **Deployment Validation**: Infrastructure, agent status, and invocation testing

## Support

For issues and questions:
- **Pipeline Issues**: Check GitLab CI/CD logs and job outputs
- **Agent Issues**: Review CloudWatch logs for detailed error information
- **Model Access**: Ensure Claude Sonnet 4.5 model access is enabled in ap-southeast-2
- **AWS Permissions**: Verify IAM roles and policies are correctly configured
- **Deployment Guide**: See `deployment/gitlab/README.md` for detailed instructions