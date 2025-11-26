import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { randomUUID } from 'crypto';

const eventBridgeClient = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.AGENT_EVENT_BUS_NAME!;

interface SubmitTaskInput {
  taskDetails: string;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const fieldName = event.info.fieldName;

  try {
    if (fieldName === 'submitTask') {
      return await submitTask(event.arguments.input);
    }

    throw new Error(`Unknown field: ${fieldName}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

async function submitTask(input: SubmitTaskInput) {
  const orchestrationId = randomUUID();

  console.log('Submitting task to Supervisor:', {
    orchestrationId,
    taskDetails: input.taskDetails,
  });

  try {
    // Send event to EventBridge for the Supervisor agent
    // The supervisor expects the detail to contain the task information
    // which it will pass to orchestrate() as initial_message
    await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'task.request',
            DetailType: 'task.request',
            EventBusName: EVENT_BUS_NAME,
            Detail: JSON.stringify({
              task: input.taskDetails,
              orchestrationId: orchestrationId,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      })
    );

    console.log('Task submitted successfully to EventBridge');

    return {
      success: true,
      orchestrationId,
      message: 'Task submitted to Supervisor successfully',
    };
  } catch (error) {
    console.error('Error submitting task to EventBridge:', error);
    throw new Error(`Failed to submit task: ${error}`);
  }
}
