#!/bin/bash
set -e

export AWS_PAGER=""
ENVIRONMENT=${1:-dev}
PROJECT_NAME="agentic-ai-factory"
REGION=${AWS_DEFAULT_REGION:-ap-southeast-2}
STACK_NAME="${PROJECT_NAME}-agent3-${ENVIRONMENT}"

echo "🚀 Deploying Agent 3 - Planning"
echo "Environment: $ENVIRONMENT | Region: $REGION"

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install --upgrade pip --break-system-packages 2>/dev/null || true
pip3 install -r requirements.txt --break-system-packages || pip3 install -r requirements.txt
pip3 install bedrock-agentcore-starter-toolkit --break-system-packages || pip3 install bedrock-agentcore-starter-toolkit

# Deploy CloudFormation stack
echo "🏗️  Deploying infrastructure..."
aws cloudformation deploy \
    --template-file infrastructure.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION \
    --tags Environment=$ENVIRONMENT Project=$PROJECT_NAME Agent=agent3-planning

if [ $? -ne 0 ]; then
    echo "❌ Infrastructure deployment failed"
    exit 1
fi

echo "✅ Infrastructure deployed successfully"

# Get stack outputs
echo "📊 Getting stack outputs..."
EXECUTION_ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ExecutionRoleArn`].OutputValue' \
    --output text)

# Setup ECR
echo "📦 Setting up ECR repository..."
ECR_REPO="bedrock-agentcore-agent3_planning_${ENVIRONMENT}"
ECR_URI=$(aws ecr describe-repositories \
    --repository-names $ECR_REPO \
    --region $REGION \
    --query 'repositories[0].repositoryUri' \
    --output text 2>/dev/null || echo "")

if [ -z "$ECR_URI" ] || [ "$ECR_URI" == "None" ]; then
    echo "Creating ECR repository: $ECR_REPO"
    ECR_URI=$(aws ecr create-repository \
        --repository-name $ECR_REPO \
        --region $REGION \
        --query 'repository.repositoryUri' \
        --output text)
    echo "✅ ECR repository created: $ECR_URI"
else
    echo "✅ ECR repository already exists: $ECR_URI"
fi

# Configure AgentCore (will detect existing agent and populate yaml)
echo "⚙️  Configuring AgentCore..."
if [ -f .bedrock_agentcore.yaml ]; then
    echo "✓ Existing config found, updating..."
fi

printf "%s\n%s\nno\nno\nno\nno\n" "$EXECUTION_ROLE_ARN" "$ECR_URI" | agentcore configure \
    --entrypoint agent3.py \
    --name agent3_planning_${ENVIRONMENT} \
    --requirements-file requirements.txt \
    --region $REGION

echo "✅ AgentCore configuration created"

# Deploy agent
echo "🤖 Deploying agent to AgentCore Runtime..."
agentcore launch --agent agent3_planning_${ENVIRONMENT} --auto-update-on-conflict

if [ $? -ne 0 ]; then
    echo "❌ Agent launch failed"
    exit 1
fi

# Get agent ARN
AGENT_ARN=$(grep -A 10 "bedrock_agentcore:" .bedrock_agentcore.yaml | grep "agent_arn:" | awk '{print $2}' | tr -d '"' 2>/dev/null || echo "")

if [ -z "$AGENT_ARN" ]; then
    echo "⚠️  Could not retrieve agent ARN from config file"
    exit 1
fi

echo "✅ Agent deployment successful!"
echo "📋 Agent ARN: $AGENT_ARN"
