import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TOOLS_CONFIG_TABLE = process.env.TOOLS_CONFIG_TABLE!;

interface ToolConfig {
  toolId: string;
  config: any;
  state: 'active' | 'inactive' | 'maintenance';
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const fieldName = event.info.fieldName;

  try {
    switch (fieldName) {
      case 'listToolConfigs':
        return await listToolConfigs();
      
      case 'getToolConfig':
        return await getToolConfig(event.arguments.toolId);
      
      case 'createToolConfig':
        return await createToolConfig(event.arguments.input);
      
      case 'updateToolConfig':
        return await updateToolConfig(event.arguments.input);
      
      case 'deleteToolConfig':
        return await deleteToolConfig(event.arguments.toolId);
      
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

async function listToolConfigs(): Promise<ToolConfig[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TOOLS_CONFIG_TABLE,
    })
  );

  return (result.Items || []).map(item => ({
    toolId: item.toolId,
    // AWSJSON type expects a JSON string, so ensure it's stringified
    config: typeof item.config === 'string' ? item.config : JSON.stringify(item.config),
    state: item.state || 'active',
    categories: item.categories || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

async function getToolConfig(toolId: string): Promise<ToolConfig | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TOOLS_CONFIG_TABLE,
      Key: { toolId },
    })
  );

  if (!result.Item) {
    return null;
  }

  return {
    toolId: result.Item.toolId,
    // AWSJSON type expects a JSON string, so ensure it's stringified
    config: typeof result.Item.config === 'string' ? result.Item.config : JSON.stringify(result.Item.config),
    state: result.Item.state || 'active',
    categories: result.Item.categories || [],
    createdAt: result.Item.createdAt,
    updatedAt: result.Item.updatedAt,
  };
}

async function createToolConfig(input: any): Promise<ToolConfig> {
  const now = new Date().toISOString();
  const config = typeof input.config === 'string' ? JSON.parse(input.config) : input.config;

  const toolConfig: ToolConfig = {
    toolId: input.toolId,
    config,
    state: input.state || 'active',
    categories: input.categories || [],
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TOOLS_CONFIG_TABLE,
      Item: toolConfig,
    })
  );

  return {
    ...toolConfig,
    config: JSON.stringify(config),
  };
}

async function updateToolConfig(input: any): Promise<ToolConfig> {
  const existing = await getToolConfig(input.toolId);
  if (!existing) {
    throw new Error(`Tool config not found: ${input.toolId}`);
  }

  const now = new Date().toISOString();
  const existingConfig = typeof existing.config === 'string' ? JSON.parse(existing.config) : existing.config;
  const newConfig = input.config 
    ? (typeof input.config === 'string' ? JSON.parse(input.config) : input.config)
    : existingConfig;

  const updatedConfig: ToolConfig = {
    toolId: input.toolId,
    config: newConfig,
    state: input.state || existing.state,
    categories: input.categories !== undefined ? input.categories : existing.categories,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TOOLS_CONFIG_TABLE,
      Item: updatedConfig,
    })
  );

  return {
    ...updatedConfig,
    config: JSON.stringify(newConfig),
  };
}

async function deleteToolConfig(toolId: string): Promise<{ success: boolean; message?: string }> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TOOLS_CONFIG_TABLE,
        Key: { toolId },
      })
    );

    return {
      success: true,
      message: `Tool config ${toolId} deleted successfully`,
    };
  } catch (error) {
    console.error('Error deleting tool config:', error);
    return {
      success: false,
      message: `Failed to delete tool config: ${error}`,
    };
  }
}
