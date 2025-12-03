#!/bin/bash
set -e

ENVIRONMENT=$1
REGION=${AWS_DEFAULT_REGION:-ap-southeast-2}

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: $0 <environment>"
  echo "Example: $0 dev"
  exit 1
fi

echo "🚀 Deploying Backend to $ENVIRONMENT environment..."

# Verify frontend build exists
if [ ! -d "../frontend/build" ]; then
  echo "❌ Error: Frontend build not found at ../frontend/build"
  echo "Please run frontend/deploy.sh first"
  exit 1
fi
echo "✅ Frontend build verified"

# Install dependencies
if [ ! -d "node_modules/@types/node" ]; then
  rm -rf node_modules package-lock.json
  npm install
fi

# Build TypeScript
npm run build

# Build Lambda functions
npm run build:lambda

# Deploy CDK stacks
CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_ACCOUNT
export CDK_DEFAULT_REGION=$REGION
export ENVIRONMENT
export FRONTEND_BUILD_PATH="$(cd .. && pwd)/frontend/build"

# Bootstrap CDK if not already done
echo "Checking CDK bootstrap..."
npx aws-cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION || true

# Deploy all stacks (backend + frontend)
echo "📦 Deploying backend and frontend stacks..."
npx aws-cdk deploy --all --require-approval never

# Get stack outputs
STACK_NAME="agentic-ai-factory-backend-${ENVIRONMENT}"
APPSYNC_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`GraphQLApiUrl`].OutputValue' \
  --output text 2>/dev/null || echo "")

USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text 2>/dev/null || echo "")

echo "✅ Backend deployed successfully!"
if [ -n "$APPSYNC_URL" ]; then
  echo "AppSync URL: $APPSYNC_URL"
  echo "User Pool ID: $USER_POOL_ID"
else
  echo "Stack outputs will be available after deployment completes."
fi
