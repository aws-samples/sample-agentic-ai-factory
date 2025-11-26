#!/bin/bash

set -e

# Configuration
REGION="ap-southeast-2"
STACK_NAME="agentic-ai-factory-kb"
TEMPLATE_FILE="infrastructure.yaml"

# Parse command line arguments
ENVIRONMENT="dev"
if [ $# -gt 0 ]; then
    ENVIRONMENT=$1
fi

echo "Deploying common infrastructure for environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack: $STACK_NAME-$ENVIRONMENT"

# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --parameter-overrides Environment="$ENVIRONMENT" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo "✅ Knowledge Base infra deployed successfully"
    echo "Stack: $STACK_NAME-$ENVIRONMENT"
    
    # Call post-deployment script
    echo -e "\nRunning post-deploy actions for Knowledge Base environment: $ENVIRONMENT"
    ./post-deploy-kb.sh "$ENVIRONMENT"
    
    if [ $? -eq 0 ]; then
        echo "✅ Post-deployment actions completed successfully"
        echo "✅ Knowledge Bases for Agents deployed successfully"
        echo "Stack: $STACK_NAME-$ENVIRONMENT"        
    else
        echo "❌ Post-deployment failed"
        exit 1
    fi
else
    echo "❌ CloudFormation deployment failed"
    exit 1
fi