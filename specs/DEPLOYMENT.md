# Agentic AI Factory - Deployment Guide

Complete guide for deploying the Agentic AI Factory application.

## Quick Start

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 2. Deploy everything
./deploy.sh --profile my-aws-profile
```

## Prerequisites

- **Node.js** 18+ installed
- **Python** 3.11+ installed
- **AWS CLI** configured with credentials
- **AWS CDK** CLI installed: `npm install -g aws-cdk`
- **AWS Account** with appropriate permissions

## Configuration

### 1. Environment Variables

Create and configure the environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```bash
# Required
ENVIRONMENT=dev
CDK_DEFAULT_REGION=ap-southeast-2

# Admin User (required for first deployment)
ADMIN_EMAIL=admin@example.com
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
ADMIN_PASSWORD=SecurePassword123!

# Optional
AWS_PROFILE=my-aws-profile
```

### 2. AWS Profile (Optional)

If you have multiple AWS profiles, you can specify which one to use:

**Option 1: In .env file**
```bash
AWS_PROFILE=my-profile
```

**Option 2: Command line flag**
```bash
./deploy.sh --profile my-profile
```

## Deployment Options

### Option 1: Full Deployment (Recommended)

Deploy both frontend and backend:

```bash
# Deploy all stacks
./deploy.sh

# Deploy with specific profile
./deploy.sh --profile my-aws-profile

# Deploy all stacks explicitly
./deploy.sh --all --profile my-aws-profile
```

### Option 2: Backend Only

Deploy only backend (skip frontend build):

```bash
# Using root script
./deploy.sh --backend-only

# Using backend script
cd backend
./scripts/deploy.sh BackendStack
```

### Option 3: Specific Stack

Deploy a specific stack:

```bash
# Deploy backend stack only
./deploy.sh BackendStack

# Deploy frontend stack only
./deploy.sh FrontendStack

# With profile
./deploy.sh BackendStack --profile my-profile
```

### Option 4: Skip Builds

Skip frontend or backend builds (useful for quick iterations):

```bash
# Skip frontend build
./deploy.sh --skip-frontend BackendStack

# Skip backend build
./deploy.sh --skip-backend FrontendStack
```

## Deployment Script Options

The root `deploy.sh` script supports the following options:

| Option | Description |
|--------|-------------|
| `--all` | Deploy all stacks (default) |
| `--backend-only` | Deploy only backend stack |
| `--frontend-only` | Deploy only frontend stack |
| `--skip-frontend` | Skip frontend build |
| `--skip-backend` | Skip backend build |
| `--profile <name>` | Use specific AWS profile |
| `--help` | Show help message |

## What Gets Deployed

### Backend Stack
- **DynamoDB Tables**: Projects, Organizations, Agent Status, Agent Config
- **Cognito**: User Pool with groups (admin, project_manager, architect, developer)
- **AppSync API**: GraphQL API for frontend
- **Lambda Functions**: Resolvers for API operations
- **EventBridge**: Event bus for agent coordination
- **S3 Bucket**: Document storage

### Frontend Stack
- **S3 Bucket**: Static website hosting
- **CloudFront**: CDN distribution
- **Amplify Configuration**: Auto-generated config file

### Services Stack
- **Bedrock Agents**: AI agent configurations
- **Knowledge Bases**: Document knowledge bases
- **API Gateway**: REST API for services

### Arbiter Stack
- **Orchestration**: Agent coordination system
- **Worker Agents**: Task execution agents
- **Fabricator**: Dynamic agent creation

## Automatic Seeding

During first deployment, the following are automatically created:

### Organizations
- Default
- Engineering
- Product
- Operations

### Admin User
- Email: From `ADMIN_EMAIL` env var
- Password: From `ADMIN_PASSWORD` env var
- Organization: Default
- Role: admin
- Email verified: Yes

### Cognito Groups
- admin
- project_manager
- architect
- developer

## Post-Deployment

### 1. Get Application URL

After deployment, find the CloudFront URL in the outputs:

```bash
# Look for FrontendStack outputs
aws cloudformation describe-stacks \
  --stack-name agentic-ai-factory-frontend-dev \
  --query 'Stacks[0].Outputs'
```

### 2. Login

Navigate to the CloudFront URL and login with:
- Email: Your `ADMIN_EMAIL`
- Password: Your `ADMIN_PASSWORD`

### 3. Verify Deployment

1. Check Team Management page
2. Verify organizations are listed
3. Create a test project
4. Assign roles to new users

## Updating the Application

### Update Backend Only

```bash
cd backend
npm run build
./scripts/deploy.sh BackendStack
```

### Update Frontend Only

```bash
cd frontend
npm run build
cd ..
./deploy.sh --skip-backend FrontendStack
```

### Update Everything

```bash
./deploy.sh --all
```

## Troubleshooting

### Missing Environment Variables

**Error**: "Missing required environment variables"

**Solution**: Ensure `backend/.env` exists and contains all required variables:
```bash
cp backend/.env.example backend/.env
# Edit and configure
```

### Admin User Creation Failed

**Error**: "Admin user creation failed"

**Solution**: Check that:
- `ADMIN_EMAIL` is a valid email
- `ADMIN_PASSWORD` meets requirements (8+ chars, uppercase, lowercase, number, symbol)
- User doesn't already exist in Cognito

### AWS Profile Not Found

**Error**: "Profile not found"

**Solution**: 
```bash
# List available profiles
aws configure list-profiles

# Use correct profile name
./deploy.sh --profile correct-profile-name
```

### Build Failures

**Frontend build failed**:
```bash
cd frontend
npm install
npm run build
```

**Backend build failed**:
```bash
cd backend
npm install
npm run build
```

### CDK Bootstrap Required

**Error**: "This stack uses assets, so the toolkit stack must be deployed"

**Solution**:
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

## Clean Up

To remove all deployed resources:

```bash
cd backend
cdk destroy --all --profile my-profile
```

**Warning**: This will delete all data including:
- DynamoDB tables and data
- S3 buckets and files
- Cognito users
- All configurations

## Advanced Usage

### Deploy to Multiple Environments

```bash
# Development
ENVIRONMENT=dev ./deploy.sh --profile dev-profile

# Staging
ENVIRONMENT=staging ./deploy.sh --profile staging-profile

# Production
ENVIRONMENT=prod ./deploy.sh --profile prod-profile
```

### Custom Stack Names

Stacks are named based on the `ENVIRONMENT` variable:
- `agentic-ai-factory-backend-{ENVIRONMENT}`
- `agentic-ai-factory-frontend-{ENVIRONMENT}`
- `agentic-ai-factory-services-{ENVIRONMENT}`
- `agentic-ai-factory-arbiter-{ENVIRONMENT}`

### CI/CD Integration

For automated deployments:

```bash
#!/bin/bash
export ENVIRONMENT=prod
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
export ADMIN_EMAIL=admin@company.com
export ADMIN_PASSWORD=$SECURE_PASSWORD_FROM_SECRETS

./deploy.sh --all
```

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda errors
2. Review CloudFormation events for deployment issues
3. Verify IAM permissions for deployment user
4. Check AWS service quotas

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong passwords** - Follow Cognito password requirements
3. **Rotate credentials** - Regularly update admin passwords
4. **Use IAM roles** - For production, use IAM roles instead of access keys
5. **Enable MFA** - For admin accounts in production
6. **Review permissions** - Regularly audit IAM policies
