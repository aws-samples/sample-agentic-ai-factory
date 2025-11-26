# Agentic AI Factory

Multi-agent AI system for enterprise application development using AWS Bedrock AgentCore.

## Architecture

3-layer architecture:

- **Service Layer**: 4 Bedrock agents + Knowledge Base (OpenSearch Serverless)
- **Backend Layer**: AppSync GraphQL API, Cognito, DynamoDB, EventBridge
- **Frontend Layer**: React UI on S3/CloudFront

## Prerequisites

- AWS CLI configured with credentials
- Node.js 18+
- Python 3.9+
- CDK 2.100.0

## Deployment

### 🚀 Quick Start (5 minutes)

```bash
# 1. Configure
cp backend/.env.example backend/.env
# Edit backend/.env with your AWS account and admin credentials

# 2. Deploy
./deploy.sh --profile my-aws-profile
```

See [QUICK_START.md](specs/QUICK_START.md) for detailed quick start guide.

### 📚 Full Documentation

- **[QUICK_START.md](specs/QUICK_START.md)** - Get started in 5 minutes
- **[DEPLOYMENT.md](specs/DEPLOYMENT.md)** - Complete deployment guide
- **[CONFLUENCE_SETUP.md](specs/CONFLUENCE_SETUP.md)** - (Optional) Integrate the Assessment with confluence, to modify or add to the requirements elicitation questions. 
- **[Codebase-foundation.spec.md](specs/codebase-foundation.spec.md)** - Codebase specification overview

### Common Deployment Commands

```bash
# Deploy everything (frontend + backend)
./deploy.sh

# Deploy with AWS profile
./deploy.sh --profile my-aws-profile

# Deploy backend only
./deploy.sh --backend-only

# Deploy specific stack
./deploy.sh BackendStack

# Get help
./deploy.sh --help
```

### What Gets Deployed

- ✅ **Backend**: AppSync API, Cognito, DynamoDB, Lambda functions
- ✅ **Frontend**: React app on S3/CloudFront
- ✅ **Services**: Bedrock agents and knowledge bases
- ✅ **Arbiter**: Agent orchestration system
- ✅ **Seeded Data**: Organizations, admin user, roles

### First Time Setup

The deployment automatically creates:
- 4 organizations (Default, Engineering, Product, Operations)
- Admin user with credentials from `.env`
- Cognito groups (admin, project_manager, architect, developer)
- All required AWS infrastructure

### Optional SSM Parameters

#### Confluence Integration (Optional)
```bash
# Only required if using Confluence integration
aws ssm put-parameter \
  --name "/agentic-ai-factory/gateway/confluence-schema-uri-{env}" \
  --value "s3://your-bucket/confluence-open-api.json" \
  --type String \
  --region ap-southeast-2

aws ssm put-parameter \
  --name "/agentic-ai-factory/gateway/confluence-credential-provider-{env}" \
  --value "arn:aws:bedrock-agentcore:ap-southeast-2:ACCOUNT:token-vault/default/apikeycredentialprovider/confluence-{env}" \
  --type String \
  --region ap-southeast-2
```

See [CONFLUENCE_SETUP.md](CONFLUENCE_SETUP.md) for detailed setup instructions.

## Resource Naming

All resources use `agentic-ai-factory-*` prefix with environment suffix:
- **CloudFormation Stacks**: `agentic-ai-factory-{component}-{env}`
  - Backend: `agentic-ai-factory-backend-{env}`
  - Frontend: `agentic-ai-factory-frontend-{env}`
  - Agents: `agentic-ai-factory-agent{N}-{env}`
- **Bedrock Agents**: `agent{N}_{name}_{env}`
  - agent1_assessment_{env}
  - agent2_design_{env}
  - agent3_planning_{env}
  - agent4_implementation_{env}
- **ECR Repositories**: `bedrock-agentcore-agent{N}_{name}_{env}`
- **DynamoDB Tables**: `agentic-ai-factory-{resource}-{env}`
- **S3 Buckets**: `agentic-ai-factory-{resource}-{env}-{account}-{region}`

## Known Issues

1. **Knowledge Base Data Source Deletion**: Web crawler data sources may fail to delete from vector store. Delete stack with `aws cloudformation delete-stack --stack-name <stack> --retain-resources <DataSourceLogicalId>` then manually delete orphaned resources.

## CI/CD

GitLab CI pipeline in `.gitlab-ci.yml`:
- Merge to main → manual staging/prod deployment jobs
- Uses `deploy-all.sh` for all environments

## Cleanup

### Delete All Resources

```bash
# 1. Delete Bedrock AgentCore agents (via console or CLI)
cd service/agent1_assessment && agentcore delete --agent agent1_assessment_${ENVIRONMENT} --region ap-southeast-2
cd ../agent2_design && agentcore delete --agent agent2_design_${ENVIRONMENT} --region ap-southeast-2
cd ../agent3_planning && agentcore delete --agent agent3_planning_${ENVIRONMENT} --region ap-southeast-2
cd ../agent4_implementation && agentcore delete --agent agent4_implementation_${ENVIRONMENT} --region ap-southeast-2

# 2. Delete CloudFormation stacks
aws cloudformation delete-stack --stack-name agentic-ai-factory-frontend-${ENVIRONMENT} --region ap-southeast-2
aws cloudformation delete-stack --stack-name agentic-ai-factory-backend-${ENVIRONMENT} --region ap-southeast-2
aws cloudformation delete-stack --stack-name agentic-ai-factory-agent4-${ENVIRONMENT} --region ap-southeast-2
aws cloudformation delete-stack --stack-name agentic-ai-factory-agent3-${ENVIRONMENT} --region ap-southeast-2
aws cloudformation delete-stack --stack-name agentic-ai-factory-agent2-${ENVIRONMENT} --region ap-southeast-2
aws cloudformation delete-stack --stack-name agentic-ai-factory-agent1-${ENVIRONMENT} --region ap-southeast-2
aws cloudformation delete-stack --stack-name agentic-factory-kb-${ENVIRONMENT} --region ap-southeast-2

# 3. Clean local build artifacts
./clean.sh  # Remove build artifacts, node_modules, caches
```

## Documentation

- [Backend](./backend/README.md)
- [GitLab Setup](./backend/GITLAB_SETUP.md)
- [Pipeline](./backend/PIPELINE.md)
- [Confluence Setup](./CONFLUENCE_SETUP.md) - Optional integration setup
