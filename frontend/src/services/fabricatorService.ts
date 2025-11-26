import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export interface CreateAgentRequest {
  agentName: string;
  taskDescription: string;
  tools?: string[];
  integrations?: string[];
  dataStores?: string[];
}

export interface AgentCreationResponse {
  success: boolean;
  requestId: string;
  message?: string;
}

const requestAgentCreationMutation = `
  mutation RequestAgentCreation($input: CreateAgentRequestInput!) {
    requestAgentCreation(input: $input) {
      success
      requestId
      message
    }
  }
`;

export const fabricatorService = {
  async requestAgentCreation(input: CreateAgentRequest): Promise<AgentCreationResponse> {
    try {
      console.log('Sending agent creation request to Fabricator:', input);
      
      const response: any = await client.graphql({
        query: requestAgentCreationMutation,
        variables: { input },
      });
      
      console.log('Fabricator response:', response.data.requestAgentCreation);
      return response.data.requestAgentCreation;
    } catch (error) {
      console.error('Error requesting agent creation:', error);
      throw error;
    }
  },
};
