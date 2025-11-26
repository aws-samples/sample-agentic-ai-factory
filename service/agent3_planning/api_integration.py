"""
API Integration layer for Agent 1 - Assessment & Evaluation
Provides REST API endpoints for UI integration
"""

import json
import boto3
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

@dataclass
class APIResponse:
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str = None
    request_id: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()
        if self.request_id is None:
            self.request_id = str(uuid.uuid4())

class Agent1APIIntegration:
    """API Integration class for Agent 1 with UI layer"""
    
    def __init__(self, agent_arn: str, region: str = "ap-southeast-2"):
        self.agent_arn = agent_arn
        self.region = region
        self.bedrock_client = boto3.client('bedrock-agentcore', region_name=region)
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        
        # Table for storing assessment sessions
        self.sessions_table = self.dynamodb.Table('assessment-sessions')
    
    def start_assessment_session(self, user_id: str, project_name: str, 
                                context: Dict[str, Any]) -> APIResponse:
        """Start a new assessment session"""
        
        try:
            session_id = str(uuid.uuid4())
            
            # Store session in DynamoDB
            session_data = {
                'session_id': session_id,
                'user_id': user_id,
                'project_name': project_name,
                'status': 'started',
                'context': context,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            self.sessions_table.put_item(Item=session_data)
            
            return APIResponse(
                success=True,
                data={
                    'session_id': session_id,
                    'status': 'started',
                    'next_step': 'technical_assessment',
                    'progress': 0
                }
            )
            
        except Exception as e:
            logger.error(f"Error starting assessment session: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def invoke_assessment(self, session_id: str, prompt: str, 
                         documents: Optional[list] = None) -> APIResponse:
        """Invoke Agent 1 for assessment"""
        
        try:
            # Get session data
            session_response = self.sessions_table.get_item(
                Key={'session_id': session_id}
            )
            
            if 'Item' not in session_response:
                return APIResponse(success=False, error="Session not found")
            
            session_data = session_response['Item']
            
            # Prepare payload for agent
            payload = {
                'prompt': prompt,
                'session_id': session_id,
                'user_id': session_data['user_id'],
                'documents': documents or [],
                'conversation_history': session_data.get('conversation_history', [])
            }
            
            # Invoke Agent 1 via Bedrock AgentCore
            response = self.bedrock_client.invoke_agent_runtime(
                agentArn=self.agent_arn,
                payload=json.dumps(payload)
            )
            
            # Parse response
            result = json.loads(response['payload'])
            
            # Update session with conversation history
            conversation_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'user_input': prompt,
                'agent_response': result
            }
            
            # Update session in DynamoDB
            self.sessions_table.update_item(
                Key={'session_id': session_id},
                UpdateExpression='SET conversation_history = list_append(if_not_exists(conversation_history, :empty_list), :new_entry), updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':new_entry': [conversation_entry],
                    ':empty_list': [],
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
            return APIResponse(
                success=True,
                data=result
            )
            
        except Exception as e:
            logger.error(f"Error invoking assessment: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def get_assessment_progress(self, session_id: str) -> APIResponse:
        """Get current assessment progress"""
        
        try:
            session_response = self.sessions_table.get_item(
                Key={'session_id': session_id}
            )
            
            if 'Item' not in session_response:
                return APIResponse(success=False, error="Session not found")
            
            session_data = session_response['Item']
            conversation_history = session_data.get('conversation_history', [])
            
            # Calculate progress based on conversation history and completed assessments
            progress = self._calculate_progress(conversation_history)
            
            return APIResponse(
                success=True,
                data={
                    'session_id': session_id,
                    'progress': progress,
                    'status': session_data['status'],
                    'conversation_count': len(conversation_history),
                    'last_updated': session_data.get('updated_at')
                }
            )
            
        except Exception as e:
            logger.error(f"Error getting assessment progress: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def save_assessment_state(self, session_id: str, state_data: Dict[str, Any]) -> APIResponse:
        """Save current assessment state for resume capability"""
        
        try:
            self.sessions_table.update_item(
                Key={'session_id': session_id},
                UpdateExpression='SET assessment_state = :state, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':state': state_data,
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
            return APIResponse(
                success=True,
                data={'message': 'Assessment state saved successfully'}
            )
            
        except Exception as e:
            logger.error(f"Error saving assessment state: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def resume_assessment_session(self, session_id: str) -> APIResponse:
        """Resume a previously saved assessment session"""
        
        try:
            session_response = self.sessions_table.get_item(
                Key={'session_id': session_id}
            )
            
            if 'Item' not in session_response:
                return APIResponse(success=False, error="Session not found")
            
            session_data = session_response['Item']
            
            return APIResponse(
                success=True,
                data={
                    'session_id': session_id,
                    'project_name': session_data['project_name'],
                    'assessment_state': session_data.get('assessment_state', {}),
                    'conversation_history': session_data.get('conversation_history', []),
                    'progress': self._calculate_progress(session_data.get('conversation_history', []))
                }
            )
            
        except Exception as e:
            logger.error(f"Error resuming assessment session: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def complete_assessment(self, session_id: str) -> APIResponse:
        """Mark assessment as complete and prepare for next module"""
        
        try:
            # Update session status
            self.sessions_table.update_item(
                Key={'session_id': session_id},
                UpdateExpression='SET #status = :status, completed_at = :timestamp, updated_at = :timestamp',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
            return APIResponse(
                success=True,
                data={
                    'message': 'Assessment completed successfully',
                    'next_module': 'implementation_planning',
                    'session_id': session_id
                }
            )
            
        except Exception as e:
            logger.error(f"Error completing assessment: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def _calculate_progress(self, conversation_history: list) -> int:
        """Calculate assessment progress percentage"""
        
        # Simple progress calculation based on conversation count
        # In a real implementation, this would be more sophisticated
        conversation_count = len(conversation_history)
        
        if conversation_count == 0:
            return 0
        elif conversation_count < 5:
            return 25
        elif conversation_count < 10:
            return 50
        elif conversation_count < 15:
            return 75
        else:
            return 100

# Lambda handler for API Gateway integration
def lambda_handler(event, context):
    """AWS Lambda handler for API Gateway integration"""
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Get agent ARN from environment variables
        agent_arn = os.environ.get('AGENT_ARN')
        if not agent_arn:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Agent ARN not configured'})
            }
        
        # Initialize API integration
        api = Agent1APIIntegration(agent_arn)
        
        # Route requests
        if path == '/assessment/start' and http_method == 'POST':
            response = api.start_assessment_session(
                user_id=body.get('user_id'),
                project_name=body.get('project_name'),
                context=body.get('context', {})
            )
        
        elif path == '/assessment/invoke' and http_method == 'POST':
            response = api.invoke_assessment(
                session_id=body.get('session_id'),
                prompt=body.get('prompt'),
                documents=body.get('documents')
            )
        
        elif path == '/assessment/progress' and http_method == 'GET':
            session_id = event.get('queryStringParameters', {}).get('session_id')
            response = api.get_assessment_progress(session_id)
        
        elif path == '/assessment/save' and http_method == 'POST':
            response = api.save_assessment_state(
                session_id=body.get('session_id'),
                state_data=body.get('state_data')
            )
        
        elif path == '/assessment/resume' and http_method == 'POST':
            response = api.resume_assessment_session(body.get('session_id'))
        
        elif path == '/assessment/complete' and http_method == 'POST':
            response = api.complete_assessment(body.get('session_id'))
        
        else:
            response = APIResponse(success=False, error="Endpoint not found")
        
        # Return HTTP response
        return {
            'statusCode': 200 if response.success else 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(asdict(response))
        }
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }