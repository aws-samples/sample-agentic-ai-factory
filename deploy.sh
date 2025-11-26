#!/bin/bash

# Deployment script for Agentic AI Factory
# This script builds and deploys both frontend and backend
#
# Usage:
#   ./deploy.sh [options] [stack-name]
#
# Options:
#   --all                Deploy all stacks (default)
#   --backend-only       Deploy only backend stack
#   --frontend-only      Deploy only frontend stack
#   --skip-frontend      Skip frontend build
#   --skip-backend       Skip backend build
#   --profile <name>     Use specific AWS profile
#   --help               Show this help message
#
# Examples:
#   ./deploy.sh                                    # Deploy all with default profile
#   ./deploy.sh --all --profile my-profile         # Deploy all with specific profile
#   ./deploy.sh --backend-only                     # Deploy only backend
#   ./deploy.sh BackendStack --profile dev         # Deploy specific stack
#   ./deploy.sh --skip-frontend BackendStack       # Skip frontend build, deploy backend

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

show_help() {
    echo "Agentic AI Factory Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [options] [stack-name]"
    echo ""
    echo "Options:"
    echo "  --all                Deploy all stacks (default)"
    echo "  --backend-only       Deploy only backend stack"
    echo "  --frontend-only      Deploy only frontend stack"
    echo "  --skip-frontend      Skip frontend build"
    echo "  --skip-backend       Skip backend build"
    echo "  --profile <name>     Use specific AWS profile"
    echo "  --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                                    # Deploy all"
    echo "  ./deploy.sh --all --profile my-profile         # Deploy all with profile"
    echo "  ./deploy.sh --backend-only                     # Deploy only backend"
    echo "  ./deploy.sh BackendStack --profile dev         # Deploy specific stack"
    echo "  ./deploy.sh --skip-frontend BackendStack       # Skip frontend, deploy backend"
    exit 0
}

# Parse arguments
STACK_NAME=""
AWS_PROFILE=""
DEPLOY_ALL=true
DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true
SKIP_FRONTEND_BUILD=false
SKIP_BACKEND_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            ;;
        --all)
            DEPLOY_ALL=true
            shift
            ;;
        --backend-only)
            DEPLOY_ALL=false
            DEPLOY_FRONTEND=false
            SKIP_FRONTEND_BUILD=true
            shift
            ;;
        --frontend-only)
            DEPLOY_ALL=false
            DEPLOY_BACKEND=false
            SKIP_BACKEND_BUILD=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND_BUILD=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND_BUILD=true
            shift
            ;;
        --profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        *)
            if [ -z "$STACK_NAME" ]; then
                STACK_NAME="$1"
                DEPLOY_ALL=false
            fi
            shift
            ;;
    esac
done

print_header "Agentic AI Factory Deployment"

# Check if backend/.env exists
if [ -f backend/.env ]; then
    print_step "Loading environment variables from backend/.env..."
    export $(cat backend/.env | grep -v '^#' | xargs)
    
    # Validate required variables
    REQUIRED_VARS=("ENVIRONMENT" "CDK_DEFAULT_REGION")
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '   - %s\n' "${MISSING_VARS[@]}"
        exit 1
    fi
    
    print_success "Environment: $ENVIRONMENT"
    print_success "Region: $CDK_DEFAULT_REGION"
    
    # Check for admin credentials
    if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
        print_warning "ADMIN_EMAIL or ADMIN_PASSWORD not set"
        print_warning "Admin user will not be created automatically"
    else
        print_success "Admin Email: $ADMIN_EMAIL"
    fi
else
    print_warning "backend/.env not found - using default configuration"
fi

# Set AWS profile if specified
if [ -n "$AWS_PROFILE" ]; then
    print_success "AWS Profile: $AWS_PROFILE"
    export AWS_PROFILE="$AWS_PROFILE"
fi

echo ""

# Build Frontend
if [ "$SKIP_FRONTEND_BUILD" = false ]; then
    print_step "Building Frontend..."
    cd frontend
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    cd ..
else
    print_warning "Skipping frontend build"
fi

# Build Backend
if [ "$SKIP_BACKEND_BUILD" = false ]; then
    print_step "Building Backend TypeScript..."
    cd backend
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Backend TypeScript build completed"
    else
        print_error "Backend TypeScript build failed"
        exit 1
    fi
    
    print_step "Building Backend Lambda functions..."
    npm run build:lambda
    if [ $? -eq 0 ]; then
        print_success "Backend Lambda build completed"
    else
        print_error "Backend Lambda build failed"
        exit 1
    fi
    cd ..
else
    print_warning "Skipping backend build"
fi

# Prepare CDK command
CDK_CMD="npx cdk deploy"
if [ -n "$AWS_PROFILE" ]; then
    CDK_CMD="$CDK_CMD --profile $AWS_PROFILE"
fi
CDK_CMD="$CDK_CMD --require-approval never"

# Deploy with CDK
print_step "Deploying with CDK..."
cd backend

if [ "$DEPLOY_ALL" = true ]; then
    print_step "Deploying all stacks..."
    $CDK_CMD --all
elif [ -n "$STACK_NAME" ]; then
    print_step "Deploying $STACK_NAME..."
    $CDK_CMD "$STACK_NAME"
else
    print_step "Deploying BackendStack..."
    $CDK_CMD agentic-ai-factory-backend-$ENVIRONMENT
fi

if [ $? -eq 0 ]; then
    print_success "CDK deployment completed"
else
    print_error "CDK deployment failed"
    exit 1
fi

cd ..

print_header "✅ Deployment completed successfully!"

# Function to get stack outputs
get_stack_outputs() {
    local stack_name=$1
    local aws_cmd="aws cloudformation describe-stacks --stack-name $stack_name"
    
    # Add profile if specified
    if [ -n "$AWS_PROFILE" ]; then
        aws_cmd="$aws_cmd --profile $AWS_PROFILE"
    fi
    
    # Add region if specified
    if [ -n "$CDK_DEFAULT_REGION" ]; then
        aws_cmd="$aws_cmd --region $CDK_DEFAULT_REGION"
    fi
    
    aws_cmd="$aws_cmd --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' --output table"
    
    echo ""
    echo "Stack: $stack_name"
    eval $aws_cmd 2>/dev/null || echo "  (Stack not found or no outputs available)"
}

echo ""
echo "Stack Outputs:"

# Show outputs for deployed stacks
# if [ "$DEPLOY_ALL" = true ] || [ "$DEPLOY_BACKEND" = true ] || [ "$STACK_NAME" = "BackendStack" ] || [ -z "$STACK_NAME" ]; then
#     get_stack_outputs "agentic-ai-factory-backend-${ENVIRONMENT}"
# fi

if [ "$DEPLOY_ALL" = true ] || [ "$DEPLOY_FRONTEND" = true ] || [ "$STACK_NAME" = "FrontendStack" ]; then
    get_stack_outputs "agentic-ai-factory-frontend-${ENVIRONMENT}"
fi

# if [ "$DEPLOY_ALL" = true ] || [ "$STACK_NAME" = "ServicesStack" ]; then
#     get_stack_outputs "agentic-ai-factory-services-${ENVIRONMENT}"
# fi

# if [ "$DEPLOY_ALL" = true ] || [ "$STACK_NAME" = "ArbiterStack" ]; then
#     get_stack_outputs "agentic-ai-factory-arbiter-${ENVIRONMENT}"
# fi

echo ""
echo "📝 Next steps:"
echo "   1. Copy the CloudFront URL from the Frontend Stack outputs above"
echo "   2. Navigate to the URL in your browser"
echo "   3. Login with your admin credentials:"
if [ -n "$ADMIN_EMAIL" ]; then
    echo "      Email: $ADMIN_EMAIL"
    echo "      Password: (from your .env file)"
fi
echo "   4. Start managing your team and projects!"
echo ""
