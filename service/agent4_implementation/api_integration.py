"""
API Integration layer for Agent 4 - Implementation Execution
Provides REST API endpoints for UI integration
"""

import json
import boto3
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import uuid
import os

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

class Agent4APIIntegration:
    """API Integration class for Agent 4 with UI layer"""
    
    def __init__(self, agent_arn: str, region: str = "ap-southeast-2"):
        self.agent_arn = agent_arn
        self.region = region
        self.bedrock_client = boto3.client('bedrock-agentcore', region_name=region)
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.s3_client = boto3.client('s3', region_name=region)
        
        # Tables for storing implementation data
        self.tasks_table = self.dynamodb.Table(os.environ.get('TASKS_TABLE', 'implementation-tasks'))
        self.results_table = self.dynamodb.Table(os.environ.get('RESULTS_TABLE', 'implementation-results'))
        
        # S3 buckets for artifacts and deployments
        self.artifacts_bucket = os.environ.get('ARTIFACTS_BUCKET', 'implementation-artifacts')
        self.deployments_bucket = os.environ.get('DEPLOYMENTS_BUCKET', 'deployment-packages')
    
    def execute_implementation_task(self, task_request: Dict[str, Any]) -> APIResponse:
        """Execute a specific implementation task"""
        
        try:
            task_id = str(uuid.uuid4())
            
            # Store task in DynamoDB
            task_data = {
                'task_id': task_id,
                'session_id': task_request.get('session_id'),
                'task_type': task_request.get('task_type'),
                'task_name': task_request.get('task_name'),
                'description': task_request.get('description'),
                'status': 'in_progress',
                'execution_mode': task_request.get('execution_mode', 'guided'),
                'target_environment': task_request.get('target_environment', 'development'),
                'priority': task_request.get('priority', 'normal'),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            self.tasks_table.put_item(Item=task_data)
            
            # Prepare payload for agent
            payload = {
                'execution_request': task_request,
                'assessment_results': task_request.get('assessment_results', {}),
                'planning_results': task_request.get('planning_results', {}),
                'support_artifacts': task_request.get('support_artifacts', {}),
                'task_id': task_id
            }
            
            # Invoke Agent 4 via Bedrock AgentCore
            response = self.bedrock_client.invoke_agent_runtime(
                agentArn=self.agent_arn,
                payload=json.dumps(payload)
            )
            
            # Parse response
            result = json.loads(response['payload'])
            
            # Store result in DynamoDB
            result_data = {
                'result_id': str(uuid.uuid4()),
                'task_id': task_id,
                'execution_result': result,
                'status': result.get('status', 'completed'),
                'artifacts_created': result.get('artifacts_created', []),
                'validation_results': result.get('validation_results', {}),
                'created_at': datetime.utcnow().isoformat()
            }
            
            self.results_table.put_item(Item=result_data)
            
            # Update task status
            self.tasks_table.update_item(
                Key={'task_id': task_id},
                UpdateExpression='SET #status = :status, updated_at = :timestamp, completion_time = :timestamp',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': result.get('status', 'completed'),
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
            return APIResponse(
                success=True,
                data={
                    'task_id': task_id,
                    'execution_result': result,
                    'status': result.get('status', 'completed')
                }
            )
            
        except Exception as e:
            logger.error(f"Error executing implementation task: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def get_implementation_status(self, task_id: Optional[str] = None, 
                                session_id: Optional[str] = None) -> APIResponse:
        """Get implementation status for a task or session"""
        
        try:
            if task_id:
                # Get specific task status
                task_response = self.tasks_table.get_item(Key={'task_id': task_id})
                
                if 'Item' not in task_response:
                    return APIResponse(success=False, error="Task not found")
                
                task_data = task_response['Item']
                
                # Get associated results
                results_response = self.results_table.query(
                    IndexName='task-index',
                    KeyConditionExpression='task_id = :task_id',
                    ExpressionAttributeValues={':task_id': task_id}
                )
                
                results = results_response.get('Items', [])
                
                return APIResponse(
                    success=True,
                    data={
                        'task': task_data,
                        'results': results,
                        'result_count': len(results)
                    }
                )
            
            elif session_id:
                # Get all tasks for session
                tasks_response = self.tasks_table.query(
                    IndexName='session-index',
                    KeyConditionExpression='session_id = :session_id',
                    ExpressionAttributeValues={':session_id': session_id}
                )
                
                tasks = tasks_response.get('Items', [])
                
                # Calculate overall progress
                total_tasks = len(tasks)
                completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
                in_progress_tasks = len([t for t in tasks if t.get('status') == 'in_progress'])
                failed_tasks = len([t for t in tasks if t.get('status') == 'failed'])
                
                progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
                
                return APIResponse(
                    success=True,
                    data={
                        'session_id': session_id,
                        'total_tasks': total_tasks,
                        'completed_tasks': completed_tasks,
                        'in_progress_tasks': in_progress_tasks,
                        'failed_tasks': failed_tasks,
                        'progress_percentage': progress_percentage,
                        'tasks': tasks
                    }
                )
            
            else:
                return APIResponse(success=False, error="Either task_id or session_id must be provided")
                
        except Exception as e:
            logger.error(f"Error getting implementation status: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def get_implementation_artifacts(self, task_id: str) -> APIResponse:
        """Get implementation artifacts for a specific task"""
        
        try:
            # Get task results
            results_response = self.results_table.query(
                IndexName='task-index',
                KeyConditionExpression='task_id = :task_id',
                ExpressionAttributeValues={':task_id': task_id}
            )
            
            if not results_response.get('Items'):
                return APIResponse(success=False, error="No results found for task")
            
            result = results_response['Items'][0]
            artifacts_created = result.get('artifacts_created', [])
            
            # Get artifact URLs from S3
            artifact_urls = []
            for artifact in artifacts_created:
                try:
                    # Generate presigned URL for artifact
                    url = self.s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': self.artifacts_bucket, 'Key': f"{task_id}/{artifact}"},
                        ExpiresIn=3600  # 1 hour
                    )
                    artifact_urls.append({
                        'name': artifact,
                        'url': url,
                        'type': self._get_artifact_type(artifact)
                    })
                except Exception as e:
                    logger.warning(f"Could not generate URL for artifact {artifact}: {str(e)}")
            
            return APIResponse(
                success=True,
                data={
                    'task_id': task_id,
                    'artifacts': artifact_urls,
                    'artifact_count': len(artifact_urls),
                    'execution_result': result.get('execution_result', {})
                }
            )
            
        except Exception as e:
            logger.error(f"Error getting implementation artifacts: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def deploy_to_environment(self, deployment_request: Dict[str, Any]) -> APIResponse:
        """Deploy implementation to specified environment"""
        
        try:
            deployment_id = str(uuid.uuid4())
            
            # Prepare deployment payload
            payload = {
                'execution_request': {
                    'task_type': 'deployment',
                    'deployment_id': deployment_id,
                    'target_environment': deployment_request.get('target_environment'),
                    'deployment_strategy': deployment_request.get('deployment_strategy', 'blue_green'),
                    'components': deployment_request.get('components', []),
                    'validation_required': deployment_request.get('validation_required', True)
                },
                'deployment_spec': deployment_request.get('deployment_spec', {}),
                'rollback_plan': deployment_request.get('rollback_plan', {})
            }
            
            # Invoke Agent 4 for deployment
            response = self.bedrock_client.invoke_agent_runtime(
                agentArn=self.agent_arn,
                payload=json.dumps(payload)
            )
            
            result = json.loads(response['payload'])
            
            # Store deployment result
            deployment_data = {
                'deployment_id': deployment_id,
                'target_environment': deployment_request.get('target_environment'),
                'status': result.get('status', 'completed'),
                'deployment_result': result,
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Store in results table with deployment prefix
            self.results_table.put_item(Item={
                'result_id': f"deployment_{deployment_id}",
                'task_id': f"deployment_{deployment_id}",
                **deployment_data
            })
            
            return APIResponse(
                success=True,
                data={
                    'deployment_id': deployment_id,
                    'deployment_result': result,
                    'status': result.get('status', 'completed')
                }
            )
            
        except Exception as e:
            logger.error(f"Error deploying to environment: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def monitor_implementation_progress(self, session_id: str) -> APIResponse:
        """Monitor overall implementation progress for a session"""
        
        try:
            # Get all tasks for session
            tasks_response = self.tasks_table.query(
                IndexName='session-index',
                KeyConditionExpression='session_id = :session_id',
                ExpressionAttributeValues={':session_id': session_id}
            )
            
            tasks = tasks_response.get('Items', [])
            
            # Prepare monitoring payload
            payload = {
                'execution_request': {
                    'task_type': 'monitoring',
                    'session_id': session_id
                },
                'task_list': tasks,
                'progress_tracking': {
                    'session_id': session_id,
                    'last_updated': datetime.utcnow().isoformat()
                }
            }
            
            # Invoke Agent 4 for monitoring
            response = self.bedrock_client.invoke_agent_runtime(
                agentArn=self.agent_arn,
                payload=json.dumps(payload)
            )
            
            result = json.loads(response['payload'])
            
            return APIResponse(
                success=True,
                data=result
            )
            
        except Exception as e:
            logger.error(f"Error monitoring implementation progress: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def rollback_implementation(self, task_id: str, rollback_reason: str) -> APIResponse:
        """Rollback a specific implementation task"""
        
        try:
            # Get task details
            task_response = self.tasks_table.get_item(Key={'task_id': task_id})
            
            if 'Item' not in task_response:
                return APIResponse(success=False, error="Task not found")
            
            task_data = task_response['Item']
            
            # Prepare rollback payload
            payload = {
                'execution_request': {
                    'task_type': 'rollback',
                    'task_id': task_id,
                    'rollback_reason': rollback_reason
                },
                'original_task': task_data
            }
            
            # Invoke Agent 4 for rollback
            response = self.bedrock_client.invoke_agent_runtime(
                agentArn=self.agent_arn,
                payload=json.dumps(payload)
            )
            
            result = json.loads(response['payload'])
            
            # Update task status
            self.tasks_table.update_item(
                Key={'task_id': task_id},
                UpdateExpression='SET #status = :status, rollback_reason = :reason, updated_at = :timestamp',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'rolled_back',
                    ':reason': rollback_reason,
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
            return APIResponse(
                success=True,
                data={
                    'task_id': task_id,
                    'rollback_result': result,
                    'status': 'rolled_back'
                }
            )
            
        except Exception as e:
            logger.error(f"Error rolling back implementation: {str(e)}")
            return APIResponse(success=False, error=str(e))
    
    def _get_artifact_type(self, artifact_name: str) -> str:
        """Determine artifact type based on file extension"""
        
        if artifact_name.endswith('.yaml') or artifact_name.endswith('.yml'):
            return 'infrastructure'
        elif artifact_name.endswith('.py'):
            return 'code'
        elif artifact_name.endswith('.json'):
            return 'configuration'
        elif artifact_name.endswith('.zip'):
            return 'package'
        elif artifact_name.endswith('.html'):
            return 'report'
        else:
            return 'unknown'

# Lambda handler for API Gateway integration
def lambda_handler(event, context):
    """AWS Lambda handler for API Gateway integration"""
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        query_params = event.get('queryStringParameters') or {}
        
        # Get agent ARN from environment variables
        agent_arn = os.environ.get('AGENT_ARN')
        if not agent_arn:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Agent ARN not configured'})
            }
        
        # Initialize API integration
        api = Agent4APIIntegration(agent_arn)
        
        # Route requests
        if path == '/implementation/execute' and http_method == 'POST':
            response = api.execute_implementation_task(body)
        
        elif path == '/implementation/status' and http_method == 'GET':
            task_id = query_params.get('task_id')
            session_id = query_params.get('session_id')
            response = api.get_implementation_status(task_id, session_id)
        
        elif path == '/implementation/artifacts' and http_method == 'GET':
            task_id = query_params.get('task_id')
            if not task_id:
                response = APIResponse(success=False, error="task_id parameter required")
            else:
                response = api.get_implementation_artifacts(task_id)
        
        elif path == '/implementation/deploy' and http_method == 'POST':
            response = api.deploy_to_environment(body)
        
        elif path == '/implementation/monitor' and http_method == 'GET':
            session_id = query_params.get('session_id')
            if not session_id:
                response = APIResponse(success=False, error="session_id parameter required")
            else:
                response = api.monitor_implementation_progress(session_id)
        
        elif path == '/implementation/rollback' and http_method == 'POST':
            response = api.rollback_implementation(
                task_id=body.get('task_id'),
                rollback_reason=body.get('rollback_reason', 'User requested rollback')
            )
        
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