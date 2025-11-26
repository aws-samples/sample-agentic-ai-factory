import boto3
import json
import os


def get_assessment_data(session_id: str, dimension: str) -> str:
    """
    Retrieve assessment data from Assessment Agent's S3 storage.
    
    Args:
        session_id: Session identifier from Assessment Agent
        dimension: Assessment dimension to retrieve
        
    Returns:
        JSON string with assessment data for design generation
    """
    try:
        session_bucket = os.environ['SESSION_BUCKET']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        s3 = boto3.client('s3', region_name=region)
        
        # Load assessment file from Assessment Agent
        s3_key = f"{session_id}/assessment/{dimension}/output.json"
        
        try:
            response = s3.get_object(Bucket=session_bucket, Key=s3_key)
            assessment_data = json.loads(response['Body'].read())
            
            # Return structured data for Agent 2 analysis
            return json.dumps({
                'session_id': session_id,
                'dimension': dimension,
                'status': 'found',
                'assessment_data': assessment_data.get('inference_result', {}),
                'metadata': assessment_data.get('_metadata', {}),
                'field_sources': assessment_data.get('_metadata', {}).get('field_sources', {}),
                'last_updated': assessment_data.get('_metadata', {}).get('last_updated', 'unknown')
            }, indent=2, default=str)
            
        except s3.exceptions.NoSuchKey:
            return json.dumps({
                'session_id': session_id,
                'dimension': dimension,
                'status': 'not_found',
                'message': f'No assessment data found for {dimension} dimension in session {session_id}',
                'assessment_data': {}
            }, indent=2)
        
    except Exception as e:
        return json.dumps({
            'session_id': session_id,
            'dimension': dimension,
            'status': 'error',
            'error': f"Error retrieving assessment data: {str(e)}",
            'assessment_data': {}
        }, indent=2)
