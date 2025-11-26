#!/bin/bash

set -e

# Configuration
REGION="ap-southeast-2"
STACK_NAME="agentic-ai-factory-common-infrastructure"
TEMPLATE_FILE="common-infra.yaml"

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
    --region "$REGION" \
    --no-fail-on-empty-changeset

echo "✅ Common infrastructure deployed successfully"
echo "Stack: $STACK_NAME-$ENVIRONMENT"
echo "Table: agentic-ai-factory-session-memory-$ENVIRONMENT"
