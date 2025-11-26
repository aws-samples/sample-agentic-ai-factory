import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export interface ToolConfig {
  toolId: string;
  config: any;
  state: 'active' | 'inactive' | 'maintenance';
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const listToolConfigsQuery = `
  query ListToolConfigs {
    listToolConfigs {
      toolId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const getToolConfigQuery = `
  query GetToolConfig($toolId: String!) {
    getToolConfig(toolId: $toolId) {
      toolId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const createToolConfigMutation = `
  mutation CreateToolConfig($input: CreateToolConfigInput!) {
    createToolConfig(input: $input) {
      toolId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const updateToolConfigMutation = `
  mutation UpdateToolConfig($input: UpdateToolConfigInput!) {
    updateToolConfig(input: $input) {
      toolId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const deleteToolConfigMutation = `
  mutation DeleteToolConfig($toolId: String!) {
    deleteToolConfig(toolId: $toolId) {
      success
      message
    }
  }
`;

export const toolConfigService = {
  async listToolConfigs(): Promise<ToolConfig[]> {
    try {
      const response: any = await client.graphql({
        query: listToolConfigsQuery,
      });
      
      return (response.data.listToolConfigs || []).map((tool: any) => ({
        ...tool,
        config: typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config,
      }));
    } catch (error) {
      console.error('Error listing tool configs:', error);
      throw error;
    }
  },

  async getToolConfig(toolId: string): Promise<ToolConfig | null> {
    try {
      const response: any = await client.graphql({
        query: getToolConfigQuery,
        variables: { toolId },
      });
      
      const tool = response.data.getToolConfig;
      if (!tool) return null;
      
      return {
        ...tool,
        config: typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config,
      };
    } catch (error) {
      console.error('Error getting tool config:', error);
      throw error;
    }
  },

  async createToolConfig(input: {
    toolId: string;
    config: any;
    state?: 'active' | 'inactive' | 'maintenance';
    categories?: string[];
  }): Promise<ToolConfig> {
    try {
      const response: any = await client.graphql({
        query: createToolConfigMutation,
        variables: {
          input: {
            ...input,
            config: JSON.stringify(input.config),
          },
        },
      });
      
      const tool = response.data.createToolConfig;
      return {
        ...tool,
        config: typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config,
      };
    } catch (error) {
      console.error('Error creating tool config:', error);
      throw error;
    }
  },

  async updateToolConfig(input: {
    toolId: string;
    config?: any;
    state?: 'active' | 'inactive' | 'maintenance';
    categories?: string[];
  }): Promise<ToolConfig> {
    try {
      const response: any = await client.graphql({
        query: updateToolConfigMutation,
        variables: {
          input: {
            ...input,
            config: input.config ? JSON.stringify(input.config) : undefined,
          },
        },
      });
      
      const tool = response.data.updateToolConfig;
      return {
        ...tool,
        config: typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config,
      };
    } catch (error) {
      console.error('Error updating tool config:', error);
      throw error;
    }
  },

  async deleteToolConfig(toolId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response: any = await client.graphql({
        query: deleteToolConfigMutation,
        variables: { toolId },
      });
      
      return response.data.deleteToolConfig;
    } catch (error) {
      console.error('Error deleting tool config:', error);
      throw error;
    }
  },
};
