import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const AGENT_CONFIG_TABLE = process.env.AGENT_CONFIG_TABLE!;

interface AgentConfig {
  agentId: string;
  config: any;
  state: 'active' | 'inactive' | 'maintenance';
  categories?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const fieldName = event.info.fieldName;

  try {
    switch (fieldName) {
      case 'listAgentConfigs':
        return await listAgentConfigs();
      
      case 'getAgentConfig':
        return await getAgentConfig(event.arguments.agentId);
      
      case 'createAgentConfig':
        return await createAgentConfig(event.arguments.input);
      
      case 'updateAgentConfig':
        return await updateAgentConfig(event.arguments.input);
      
      case 'deleteAgentConfig':
        return await deleteAgentConfig(event.arguments.agentId);
      
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

async function listAgentConfigs(): Promise<AgentConfig[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: AGENT_CONFIG_TABLE,
    })
  );

  return (result.Items || []).map(item => ({
    agentId: item.agentId,
    // AWSJSON type expects a JSON string, so ensure it's stringified
    config: typeof item.config === 'string' ? item.config : JSON.stringify(item.config),
    state: item.state || 'active',
    categories: item.categories || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

async function getAgentConfig(agentId: string): Promise<AgentConfig | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: AGENT_CONFIG_TABLE,
      Key: { agentId },
    })
  );

  if (!result.Item) {
    return null;
  }

  return {
    agentId: result.Item.agentId,
    // AWSJSON type expects a JSON string, so ensure it's stringified
    config: typeof result.Item.config === 'string' ? result.Item.config : JSON.stringify(result.Item.config),
    state: result.Item.state || 'active',
    categories: result.Item.categories || [],
    createdAt: result.Item.createdAt,
    updatedAt: result.Item.updatedAt,
  };
}

async function createAgentConfig(input: any): Promise<AgentConfig> {
  const now = new Date().toISOString();
  const config = typeof input.config === 'string' ? JSON.parse(input.config) : input.config;

  const agentConfig: AgentConfig = {
    agentId: input.agentId,
    config,
    state: input.state || 'active',
    categories: input.categories || [],
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: AGENT_CONFIG_TABLE,
      Item: agentConfig,
    })
  );

  return {
    ...agentConfig,
    config: JSON.stringify(config),
  };
}

async function updateAgentConfig(input: any): Promise<AgentConfig> {
  const existing = await getAgentConfig(input.agentId);
  if (!existing) {
    throw new Error(`Agent config not found: ${input.agentId}`);
  }

  const now = new Date().toISOString();
  const existingConfig = typeof existing.config === 'string' ? JSON.parse(existing.config) : existing.config;
  const newConfig = input.config 
    ? (typeof input.config === 'string' ? JSON.parse(input.config) : input.config)
    : existingConfig;

  const updatedConfig: AgentConfig = {
    agentId: input.agentId,
    config: newConfig,
    state: input.state || existing.state,
    categories: input.categories !== undefined ? input.categories : existing.categories,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: AGENT_CONFIG_TABLE,
      Item: updatedConfig,
    })
  );

  return {
    ...updatedConfig,
    config: JSON.stringify(newConfig),
  };
}

async function deleteAgentConfig(agentId: string): Promise<{ success: boolean; message?: string }> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: AGENT_CONFIG_TABLE,
        Key: { agentId },
      })
    );

    return {
      success: true,
      message: `Agent config ${agentId} deleted successfully`,
    };
  } catch (error) {
    console.error('Error deleting agent config:', error);
    return {
      success: false,
      message: `Failed to delete agent config: ${error}`,
    };
  }
}
