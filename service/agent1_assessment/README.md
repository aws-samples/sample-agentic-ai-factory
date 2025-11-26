# Agent 1 - Assessment & Evaluation

Agent 1 conducts comprehensive readiness assessments across four weighted dimensions using document analysis and adaptive questioning.

## Environment Variables

### Required Environment Variables

#### AWS Configuration
```bash
AWS_REGION=ap-southeast-2                    # AWS region for services (default: ap-southeast-2)
```

#### Document Storage
```bash
DOCUMENT_BUCKET=agentic-ai-factory-documents-dev        # S3 bucket for document storage
SESSION_BUCKET=agentic-ai-factory-sessions-dev          # S3 bucket for session data and extracted content
```

#### Bedrock Data Automation Blueprint ARNs
```bash
EXTRACT_BLUEPRINT_ARN_TECHNICAL=arn:aws:bedrock:ap-southeast-2:ACCOUNT:blueprint/BLUEPRINT_ID
EXTRACT_BLUEPRINT_ARN_BUSINESS=arn:aws:bedrock:ap-southeast-2:ACCOUNT:blueprint/BLUEPRINT_ID
EXTRACT_BLUEPRINT_ARN_COMMERCIAL=arn:aws:bedrock:ap-southeast-2:ACCOUNT:blueprint/BLUEPRINT_ID
EXTRACT_BLUEPRINT_ARN_GOVERNANCE=arn:aws:bedrock:ap-southeast-2:ACCOUNT:blueprint/BLUEPRINT_ID
```

#### AgentCore Gateway (for assessment guidelines)
```bash
AGENTCORE_GATEWAY_URL=https://your-gateway-url           # AgentCore Gateway URL
ACGW_SECRETS_ARN=arn:aws:secretsmanager:region:account:secret:name   # Secrets Manager ARN for OAuth credentials
```

**ACGW_SECRETS_ARN Secret Contents:**
The secret should contain OAuth credentials as JSON:
```json
{
  "client_id": "your_oauth_client_id",
  "client_secret": "your_oauth_client_secret",
  "token_url": "https://auth.atlassian.com/oauth/token",
  "confluence_domain": "your-domain"
}
```

## Usage

### Document Extraction
The agent supports document extraction for different assessment dimensions:

```python
# Extract technical assessment data
extract_document_content(document_type="technical")

# Extract business assessment data  
extract_document_content(document_type="business")

# Extract commercial assessment data
extract_document_content(document_type="commercial")

# Extract governance assessment data
extract_document_content(document_type="governance")
```

### Session Management
- Each session runs in an isolated AgentCore micro VM
- Session data is stored globally within the agent instance
- Document keys are automatically tracked per session

### Assessment Guidelines
Query assessment guidelines for structured evaluation:

```python
# Get technical dimension guidelines
query_assessment_guidelines(dimension="technical")

# Get specific category within dimension
query_assessment_guidelines(dimension="technical", category="Current Architecture & Systems")
```

## Assessment Dimensions

1. **Technical Feasibility (30% weight)**
   - Current architecture and systems
   - Integration landscape and data strategy
   - Security and performance requirements

2. **Governance, Risk & Compliance (25% weight)**
   - AI governance frameworks
   - Regulatory compliance requirements
   - Risk management processes

3. **Business Feasibility (25% weight)**
   - Business objectives and alignment
   - Stakeholder buy-in and culture
   - Change management readiness

4. **Commercial & Economics (20% weight)**
   - Budget allocation and cost modeling
   - ROI expectations and resource planning
   - Economic feasibility analysis

## Tools Available

- `query_assessment_guidelines()` - Retrieve structured assessment guidelines via AgentCore Gateway
- `extract_document_content()` - Extract content using Bedrock Data Automation blueprints
- `save_assessment_data()` - Save assessment responses to S3
- `analyze_document_gaps()` - Analyze gaps between documents and requirements
