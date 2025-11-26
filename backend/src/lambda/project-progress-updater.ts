import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  console.log('Progress event:', JSON.stringify(event));
  
  const { sessionId, completionPercentage } = event.detail;
  const source = event.source; // 'agent1.assessment' or 'agent2.design'
  const projectsTable = process.env.PROJECTS_TABLE!;
  
  // Map source to progress field
  const progressField = source === 'agent1.assessment' ? 'assessment' : 'design';
  
  try {
    // Get current project to read existing progress values
    const getResult = await client.send(new GetCommand({
      TableName: projectsTable,
      Key: { id: sessionId }
    }));
    
    const currentProgress = getResult.Item?.progress || {};
    const assessment = progressField === 'assessment' ? completionPercentage : (currentProgress.assessment || 0);
    const design = progressField === 'design' ? completionPercentage : (currentProgress.design || 0);
    const planning = currentProgress.planning || 0;
    const implementation = currentProgress.implementation || 0;
    
    // Calculate overall as average of all dimensions
    const overall = Math.round((assessment + design + planning + implementation) / 4);
    
    // Determine currentPhase based on all progress values
    let currentPhase = 'CREATED';
    if (design === 100) {
      currentPhase = 'DESIGN_COMPLETE';
    } else if (design > 0) {
      currentPhase = 'DESIGN_IN_PROGRESS';
    } else if (assessment === 100) {
      currentPhase = 'ASSESSMENT_COMPLETE';
    } else if (assessment > 0) {
      currentPhase = 'ASSESSMENT_IN_PROGRESS';
    }
    
    await client.send(new UpdateCommand({
      TableName: projectsTable,
      Key: { id: sessionId },
      UpdateExpression: 'SET progress.#field = :pct, progress.#overall = :overall, progress.currentPhase = :phase, updatedAt = :now',
      ExpressionAttributeNames: {
        '#field': progressField,
        '#overall': 'overall'
      },
      ExpressionAttributeValues: {
        ':pct': completionPercentage,
        ':overall': overall,
        ':phase': currentPhase,
        ':now': new Date().toISOString()
      }
    }));
    
    console.log(`Updated project ${sessionId} progress.${progressField} to ${completionPercentage}%, overall to ${overall}%, currentPhase to ${currentPhase}`);
  } catch (error) {
    console.error('Failed to update project:', error);
    throw error;
  }
};
