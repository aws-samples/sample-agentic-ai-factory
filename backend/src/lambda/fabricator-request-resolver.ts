import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

const sqsClient = new SQSClient({});
const FABRICATOR_QUEUE_URL = process.env.FABRICATOR_QUEUE_URL!;

interface CreateAgentRequest {
  agentName: string;
  taskDescription: string;
  tools?: string[];
  integrations?: string[];
  dataStores?: string[];
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const fieldName = event.info.fieldName;

  try {
    if (fieldName === 'requestAgentCreation') {
      return await requestAgentCreation(event.arguments.input);
    }

    throw new Error(`Unknown field: ${fieldName}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

async function requestAgentCreation(input: CreateAgentRequest) {
  const requestId = randomUUID();

  // Build the task details with all the information
  let taskDetails = `Create an agent with the following specifications:

Agent Name: ${input.agentName}

Task Description:
${input.taskDescription}`;

  if (input.tools && input.tools.length > 0) {
    taskDetails += `\n\nRequired Tools:\n${input.tools.map(t => `- ${t}`).join('\n')}`;
  }

  if (input.integrations && input.integrations.length > 0) {
    taskDetails += `\n\nRequired Integrations:\n${input.integrations.map(i => `- ${i}`).join('\n')}`;
  }

  if (input.dataStores && input.dataStores.length > 0) {
    taskDetails += `\n\nRequired Data Stores:\n${input.dataStores.map(d => `- ${d}`).join('\n')}`;
  }

  // Prepare the message in the format expected by process_event
  const fabricatorMessage = {
    orchestration_id: '0', // Direct request, not part of orchestration
    agent_use_id: requestId,
    node: 'fabricator',
    agent_input: {
      taskDetails,
    },
  };

  console.log('Sending message to Fabricator queue:', fabricatorMessage);

  try {
    // Send message to Fabricator SQS queue
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: FABRICATOR_QUEUE_URL,
        MessageBody: JSON.stringify(fabricatorMessage),
        MessageAttributes: {
          requestType: {
            DataType: 'String',
            StringValue: 'agent-creation',
          },
          requestId: {
            DataType: 'String',
            StringValue: requestId,
          },
        },
      })
    );

    console.log('Message sent successfully to Fabricator queue');

    return {
      success: true,
      requestId,
      message: 'Agent creation request sent to Fabricator successfully',
    };
  } catch (error) {
    console.error('Error sending message to Fabricator queue:', error);
    throw new Error(`Failed to send request to Fabricator: ${error}`);
  }
}
