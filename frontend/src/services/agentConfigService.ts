import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export interface AgentConfig {
  agentId: string;
  config: any;
  state: 'active' | 'inactive' | 'maintenance';
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const listAgentConfigsQuery = `
  query ListAgentConfigs {
    listAgentConfigs {
      agentId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const getAgentConfigQuery = `
  query GetAgentConfig($agentId: String!) {
    getAgentConfig(agentId: $agentId) {
      agentId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const createAgentConfigMutation = `
  mutation CreateAgentConfig($input: CreateAgentConfigInput!) {
    createAgentConfig(input: $input) {
      agentId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const updateAgentConfigMutation = `
  mutation UpdateAgentConfig($input: UpdateAgentConfigInput!) {
    updateAgentConfig(input: $input) {
      agentId
      config
      state
      categories
      createdAt
      updatedAt
    }
  }
`;

const deleteAgentConfigMutation = `
  mutation DeleteAgentConfig($agentId: String!) {
    deleteAgentConfig(agentId: $agentId) {
      success
      message
    }
  }
`;

export const agentConfigService = {
  async listAgentConfigs(): Promise<AgentConfig[]> {
    try {
      const response: any = await client.graphql({
        query: listAgentConfigsQuery,
      });
      
      return (response.data.listAgentConfigs || []).map((agent: any) => ({
        ...agent,
        config: typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config,
      }));
    } catch (error) {
      console.error('Error listing agent configs:', error);
      throw error;
    }
  },

  async getAgentConfig(agentId: string): Promise<AgentConfig | null> {
    try {
      const response: any = await client.graphql({
        query: getAgentConfigQuery,
        variables: { agentId },
      });
      
      const agent = response.data.getAgentConfig;
      if (!agent) return null;
      
      return {
        ...agent,
        config: typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config,
      };
    } catch (error) {
      console.error('Error getting agent config:', error);
      throw error;
    }
  },

  async createAgentConfig(input: {
    agentId: string;
    config: any;
    state?: 'active' | 'inactive' | 'maintenance';
    categories?: string[];
  }): Promise<AgentConfig> {
    try {
      const response: any = await client.graphql({
        query: createAgentConfigMutation,
        variables: {
          input: {
            ...input,
            config: JSON.stringify(input.config),
          },
        },
      });
      
      const agent = response.data.createAgentConfig;
      return {
        ...agent,
        config: typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config,
      };
    } catch (error) {
      console.error('Error creating agent config:', error);
      throw error;
    }
  },

  async updateAgentConfig(input: {
    agentId: string;
    config?: any;
    state?: 'active' | 'inactive' | 'maintenance';
    categories?: string[];
  }): Promise<AgentConfig> {
    try {
      const response: any = await client.graphql({
        query: updateAgentConfigMutation,
        variables: {
          input: {
            ...input,
            config: input.config ? JSON.stringify(input.config) : undefined,
          },
        },
      });
      
      const agent = response.data.updateAgentConfig;
      return {
        ...agent,
        config: typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config,
      };
    } catch (error) {
      console.error('Error updating agent config:', error);
      throw error;
    }
  },

  async deleteAgentConfig(agentId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response: any = await client.graphql({
        query: deleteAgentConfigMutation,
        variables: { agentId },
      });
      
      return response.data.deleteAgentConfig;
    } catch (error) {
      console.error('Error deleting agent config:', error);
      throw error;
    }
  },
};
