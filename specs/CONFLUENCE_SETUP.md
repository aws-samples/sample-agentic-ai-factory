# Confluence Integration Setup

## Overview
The Agentic AI Factory can integrate with Atlassian Confluence to allow agents to read and reference existing documentation, requirements, and knowledge base articles during assessments and design generation.

## Architecture
The integration uses **AWS Bedrock AgentCore Gateway** as a secure bridge between agents and Confluence:
- **Gateway**: Bedrock AgentCore Gateway with Cognito OAuth authentication
- **Target**: Confluence Cloud API via OpenAPI schema
- **Authentication**: API Key stored in Bedrock AgentCore Token Vault
- **Agents**: Agent 1 (Assessment) has access to fetch Confluence content

## Prerequisites

1. **Confluence Cloud Instance** (e.g., `your-company.atlassian.net`)
2. **Confluence API Token** with read permissions
3. **OpenAPI Schema** for Confluence API (provided by AWS)
4. **Bedrock AgentCore** access enabled in your AWS account

## Setup Instructions

### 1. Create Confluence API Token

1. Log in to your Atlassian account
2. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
3. Click "Create API token"
4. Give it a label (e.g., "Agentic AI Factory")
5. Copy the generated token (you won't see it again)

### 2. Store API Key in Bedrock AgentCore Token Vault

```bash
# Create API key credential provider in Bedrock AgentCore
aws bedrock-agentcore create-api-key-credential-provider \
  --name "confluence-{env}" \
  --api-key "YOUR_CONFLUENCE_API_TOKEN" \
  --region ap-southeast-2 \
  --profile your-aws-profile

# Note the ARN returned - you'll need it for SSM parameter
```

The ARN format will be:
```
arn:aws:bedrock-agentcore:ap-southeast-2:ACCOUNT_ID:token-vault/default/apikeycredentialprovider/confluence-{env}
```

### 3. Upload Confluence OpenAPI Schema to S3

The Confluence OpenAPI schema is provided by AWS. Upload it to your S3 bucket:

```bash
# Create or use existing S3 bucket
aws s3 cp confluence-open-api.json s3://your-bucket/confluence-open-api.json \
  --region ap-southeast-2 \
  --profile your-aws-profile
```

### 4. Create SSM Parameters

Run these commands for **each environment** (dev, test, prod):

```bash
# Replace {env} with: dev, test, or prod
# Replace YOUR_* values with actual values from steps 2 and 3

aws ssm put-parameter \
  --name "/agentic-ai-factory/gateway/confluence-schema-uri-{env}" \
  --value "s3://your-bucket/confluence-open-api.json" \
  --type String \
  --region ap-southeast-2 \
  --profile your-aws-profile

aws ssm put-parameter \
  --name "/agentic-ai-factory/gateway/confluence-credential-provider-{env}" \
  --value "arn:aws:bedrock-agentcore:ap-southeast-2:ACCOUNT_ID:token-vault/default/apikeycredentialprovider/confluence-{env}" \
  --type String \
  --region ap-southeast-2 \
  --profile your-aws-profile
```

### 5. Example for Dev Environment

```bash
aws ssm put-parameter \
  --name "/agentic-ai-factory/gateway/confluence-schema-uri-dev" \
  --value "s3://agentic-ai-factory-schemas/confluence-open-api.json" \
  --type String \
  --region ap-southeast-2

aws ssm put-parameter \
  --name "/agentic-ai-factory/gateway/confluence-credential-provider-dev" \
  --value "arn:aws:bedrock-agentcore:ap-southeast-2:123456789012:token-vault/default/apikeycredentialprovider/confluence-dev" \
  --type String \
  --region ap-southeast-2
```

### 6. Verify Parameters

```bash
aws ssm get-parameters-by-path \
  --path "/agentic-ai-factory/gateway" \
  --region ap-southeast-2 \
  --query "Parameters[*].[Name,Value]" \
  --output table
```

## How It Works

### Infrastructure (services-stack.ts)
The CDK stack creates:
1. **Cognito User Pool** for OAuth authentication
2. **AgentCore Gateway** with JWT authorizer
3. **Confluence Target** configured with OpenAPI schema and API key
4. **Gateway Secret** in Secrets Manager for OAuth credentials

```typescript
const confluenceSchemaUri = ssm.StringParameter.valueForStringParameter(
  this,
  `/agentic-ai-factory/gateway/confluence-schema-uri-${props.environment}`
);

const confluenceTarget = new bedrockagentcore.CfnGatewayTarget(this, 'ConfluenceTarget', {
  name: 'confluence',
  gatewayIdentifier: gateway.attrGatewayIdentifier,
  targetConfiguration: {
    mcp: {
      openApiSchema: {
        s3: { uri: confluenceSchemaUri }
      }
    }
  },
  credentialProviderConfigurations: [{
    credentialProviderType: 'API_KEY',
    credentialProvider: {
      apiKeyCredentialProvider: {
        providerArn: confluenceCredentialProviderArn,
        credentialLocation: 'HEADER'
      }
    }
  }]
});
```

### Agent Access
Agent 1 (Assessment) has environment variables:
- `ACGW_SECRETS_ARN`: Gateway OAuth credentials
- `AGENTCORE_GATEWAY_URL`: Gateway endpoint URL

Agents can call Confluence APIs through the gateway to:
- Search for pages
- Retrieve page content
- Access space information
- Read requirements and documentation

## Usage

Once configured, agents can reference Confluence content during assessments:

**Example User Request:**
> "Please review the requirements in our Confluence page: https://company.atlassian.net/wiki/spaces/PROJ/pages/123456"

**Agent Response:**
Agent 1 will:
1. Extract page ID from URL
2. Call AgentCore Gateway to fetch content
3. Parse and analyze the Confluence page
4. Use the information in the assessment

## API Endpoints Available

Through the gateway, agents can access:
- `GET /wiki/api/v2/pages/{id}` - Get page content
- `GET /wiki/api/v2/pages` - Search pages
- `GET /wiki/api/v2/spaces` - List spaces
- And other Confluence Cloud REST API endpoints

## Security

- ✅ API token stored in Bedrock AgentCore Token Vault (encrypted)
- ✅ OAuth authentication via Cognito
- ✅ Gateway acts as secure proxy
- ✅ No direct Confluence access from agents
- ✅ All requests logged in CloudWatch

## Troubleshooting

### Gateway Not Found Error
```
Error: Gateway target 'confluence' not found
```
**Solution**: Ensure SSM parameters are created before deploying

### Authentication Failed
```
Confluence API returned 401 Unauthorized
```
**Solution**: Verify your Confluence API token is valid and has read permissions

### Schema Not Found
```
Error loading OpenAPI schema from S3
```
**Solution**: Verify the S3 URI is correct and the file exists

### Invalid Page URL
```
Could not extract page ID from URL
```
**Solution**: Ensure URL format is: `https://domain.atlassian.net/wiki/spaces/SPACE/pages/PAGE_ID/...`

## Deployment

After creating SSM parameters, deploy the stack:

```bash
./deploy.sh --profile your-aws-profile
```

The gateway and Confluence target will be automatically configured.

## Optional: Disable Confluence Integration

Confluence integration is **automatically optional**. The CDK stack will:
- ✅ Check if SSM parameters exist during deployment
- ✅ Create Confluence target only if parameters are found
- ✅ Skip Confluence integration if parameters don't exist
- ✅ Output integration status in CloudFormation outputs

**To disable**: Simply don't create the SSM parameters. The deployment will succeed without Confluence.

**To enable**: Create the SSM parameters as described above, then deploy.

## Cost Considerations

- **Bedrock AgentCore Gateway**: Pay per request
- **Confluence API**: Included in Confluence Cloud subscription
- **S3 Storage**: Minimal cost for OpenAPI schema
- **SSM Parameters**: Free (Standard tier)

## Additional Resources

- [Confluence Cloud REST API](https://developer.atlassian.com/cloud/confluence/rest/v2/)
- [Bedrock AgentCore Gateway Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore-gateway.html)
- [Atlassian API Tokens](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)
