import boto3
import json
import os


def get_assessment_data(session_id: str, dimension: str) -> str:
    """
    Retrieve current assessment data from S3 for a specific dimension.
    
    Args:
        session_id: Unique session identifier
        dimension: Assessment dimension (technical, business, commercial, governance)
        
    Returns:
        JSON string with current assessment data including extracted and user-provided information
    """
    try:
        session_bucket = os.environ['SESSION_BUCKET']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        s3 = boto3.client('s3', region_name=region)
        
        # Load assessment file from S3
        s3_key = f"{session_id}/assessment/{dimension}/output.json"
        
        try:
            response = s3.get_object(Bucket=session_bucket, Key=s3_key)
            assessment_data = json.loads(response['Body'].read())
            
            # Return structured data for agent analysis
            return json.dumps({
                'session_id': session_id,
                'dimension': dimension,
                'status': 'found',
                'inference_result': assessment_data.get('inference_result', {}),
                'metadata': assessment_data.get('_metadata', {}),
                'field_count': len(assessment_data.get('inference_result', {})),
                'last_updated': assessment_data.get('_metadata', {}).get('last_updated', 'unknown')
            }, indent=2, default=str)
            
        except s3.exceptions.NoSuchKey:
            return json.dumps({
                'session_id': session_id,
                'dimension': dimension,
                'status': 'not_found',
                'message': f'No assessment data found for {dimension} dimension',
                'inference_result': {},
                'metadata': {},
                'field_count': 0
            }, indent=2)
        
    except Exception as e:
        return json.dumps({
            'session_id': session_id,
            'dimension': dimension,
            'status': 'error',
            'error': f"Error retrieving assessment data: {str(e)}",
            'inference_result': {},
            'metadata': {},
            'field_count': 0
        }, indent=2)
