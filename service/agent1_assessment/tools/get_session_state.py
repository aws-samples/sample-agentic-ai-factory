import boto3
import json
import os


def get_session_state(session_id: str) -> str:
    """
    Retrieve all session records from DynamoDB for agent analysis.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        JSON string with all session records for agent interpretation
    """
    try:
        table_name = os.environ['SESSION_MEMORY_TABLE']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        # Get all assessment records for this session
        response = table.query(
            KeyConditionExpression='p_key = :pk AND begins_with(s_key, :sk)',
            ExpressionAttributeValues={
                ':pk': session_id,
                ':sk': 'assessment:'
            },
            ScanIndexForward=False  # Most recent first
        )
        
        session_records = response.get('Items', [])
        
        # Return raw data as JSON for agent analysis
        return json.dumps({
            'session_id': session_id,
            'total_records': len(session_records),
            'records': session_records
        }, indent=2, default=str)
        
    except Exception as e:
        return json.dumps({
            'session_id': session_id,
            'error': f"Error retrieving session state: {str(e)}",
            'records': []
        }, indent=2)
