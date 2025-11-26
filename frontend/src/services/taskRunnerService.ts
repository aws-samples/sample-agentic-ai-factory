import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const SUBMIT_TASK = `
  mutation SubmitTask($input: SubmitTaskInput!) {
    submitTask(input: $input) {
      success
      orchestrationId
      message
    }
  }
`;

export interface SubmitTaskInput {
  taskDetails: string;
}

export interface TaskSubmissionResponse {
  success: boolean;
  orchestrationId: string;
  message?: string;
}

export const taskRunnerService = {
  async submitTask(input: SubmitTaskInput): Promise<TaskSubmissionResponse> {
    try {
      const response: any = await client.graphql({
        query: SUBMIT_TASK,
        variables: { input },
      });

      return response.data.submitTask;
    } catch (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
  },
};
