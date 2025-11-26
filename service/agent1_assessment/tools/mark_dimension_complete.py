import boto3
import os
import time
import json
from datetime import datetime
from decimal import Decimal


def decimal_to_int(obj):
    """Convert Decimal to int for JSON serialization"""
    if isinstance(obj, Decimal):
        return int(obj)
    raise TypeError


def calculate_overall_progress(session_id: str, table) -> dict:
    """
    Calculate overall assessment progress based on completed dimensions.
    Each dimension = 25% (4 dimensions total = 100%)
    
    Returns:
        dict with 'overallPercentage' and 'dimensions' list
    """
    dimensions = ['technical', 'business', 'commercial', 'governance']
    completed_count = 0
    dimension_details = []
    
    for dim in dimensions:
        try:
            response = table.get_item(
                Key={
                    'p_key': session_id,
                    's_key': f'assessment:{dim}:latest'
                }
            )
            
            if 'Item' in response:
                item = response['Item']
                completion_pct = int(item.get('completion_percentage', 0))
                is_complete = item.get('is_complete', False) or completion_pct >= 75
                
                dimension_details.append({
                    'dimension': dim,
                    'completionPercentage': completion_pct,
                    'isComplete': is_complete
                })
                
                if is_complete:
                    completed_count += 1
            else:
                dimension_details.append({
                    'dimension': dim,
                    'completionPercentage': 0,
                    'isComplete': False
                })
        except Exception as e:
            print(f"Error checking {dim}: {e}")
            dimension_details.append({
                'dimension': dim,
                'completionPercentage': 0,
                'isComplete': False
            })
    
    return {
        'overallPercentage': completed_count * 25,
        'dimensions': dimension_details
    }


def publish_progress_event(session_id: str, progress_data: dict):
    """Publish assessment progress event to EventBridge"""
    event_bus_name = os.environ.get('EVENT_BUS_NAME')
    if not event_bus_name:
        return  # Skip if not configured
    
    try:
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        events_client = boto3.client('events', region_name=region)
        
        events_client.put_events(
            Entries=[{
                'Source': 'agent1.assessment',
                'DetailType': 'assessment.progress.updated',
                'Detail': json.dumps({
                    'sessionId': session_id,
                    'completionPercentage': progress_data['overallPercentage'],
                    'dimensions': progress_data['dimensions'],
                    'timestamp': datetime.now().isoformat()
                }),
                'EventBusName': event_bus_name
            }]
        )
        print(f"Published progress event: {progress_data['overallPercentage']}%")
    except Exception as e:
        print(f"Failed to publish progress event: {e}")
        # Don't fail the main operation


def mark_dimension_complete(session_id: str, dimension: str) -> str:
    """
    Mark an assessment dimension as complete, allowing progression to the next dimension.
    This is a checkpoint that can be called even if completion percentage is less than 100%.
    
    Args:
        session_id: Unique session identifier
        dimension: Assessment dimension to mark as complete (technical, business, commercial, governance)
        
    Returns:
        Confirmation message with next steps
    """
    try:
        table_name = os.environ.get('SESSION_MEMORY_TABLE', 'agentic-ai-factory-session-memory-dev')
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        # Get current latest record for this dimension
        response = table.get_item(
            Key={
                'p_key': session_id,
                's_key': f'assessment:{dimension}:latest'
            }
        )
        
        if 'Item' not in response:
            return f"Error: No assessment data found for {dimension} dimension. Please complete the assessment first."
        
        current_item = response['Item']
        current_completion = current_item.get('completion_percentage', 0)
        
        # Update the record with is_complete flag
        timestamp = int(time.time())
        table.update_item(
            Key={
                'p_key': session_id,
                's_key': f'assessment:{dimension}:latest'
            },
            UpdateExpression='SET is_complete = :complete, last_updated = :timestamp',
            ExpressionAttributeValues={
                ':complete': True,
                ':timestamp': timestamp
            }
        )
        
        # Calculate overall progress and publish event
        progress_data = calculate_overall_progress(session_id, table)
        publish_progress_event(session_id, progress_data)
        
        # Check if ALL dimensions are complete
        all_complete = progress_data['overallPercentage'] == 100
        if all_complete:
            try:
                event_bus_name = os.environ.get('EVENT_BUS_NAME')
                if event_bus_name:
                    events_client = boto3.client('events', region_name=region)
                    events_client.put_events(
                        Entries=[{
                            'Source': 'agentic-ai-factory.assessment',
                            'DetailType': 'assessment.completed',
                            'Detail': json.dumps({
                                'sessionId': session_id,
                                'projectId': session_id,
                                'allDimensionsComplete': True,
                                'timestamp': datetime.now().isoformat()
                            }),
                            'EventBusName': event_bus_name
                        }]
                    )
                    print(f"Published assessment.completed event for session {session_id}")
            except Exception as e:
                print(f"Error publishing assessment.completed event: {str(e)}")
        
        # Determine next dimension
        dimensions = ['technical', 'business', 'commercial', 'governance']
        if dimension not in dimensions:
            return f"Error: Invalid dimension '{dimension}'"
        
        current_index = dimensions.index(dimension)
        
        if current_index < len(dimensions) - 1:
            next_dimension = dimensions[current_index + 1]
            return f"✅ {dimension.capitalize()} dimension marked as complete ({current_completion}% filled). Overall progress: {progress_data['overallPercentage']}%. Ready to proceed to {next_dimension} dimension."
        else:
            return f"✅ {dimension.capitalize()} dimension marked as complete ({current_completion}% filled). Overall progress: {progress_data['overallPercentage']}%. All four dimensions are now complete! Ready to proceed to Agent 2 for high-level design generation."
        
    except Exception as e:
        return f"Error marking dimension as complete: {str(e)}"
