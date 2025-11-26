import boto3
import json
import os


def get_hld_progress(session_id: str) -> str:
    """
    Get overall HLD generation progress and status.
    Shows which sections are complete, pending, and overall completion percentage.
    
    Args:
        session_id: Session identifier
        
    Returns:
        JSON with progress details and section statuses
    """
    try:
        session_bucket = os.environ.get('SESSION_BUCKET', 'agentic-ai-factory-sessions-dev')
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        s3 = boto3.client('s3', region_name=region)
        
        # Load metadata
        metadata_key = f"{session_id}/design/hld/metadata.json"
        try:
            response = s3.get_object(Bucket=session_bucket, Key=metadata_key)
            metadata = json.loads(response['Body'].read())
        except s3.exceptions.NoSuchKey:
            return json.dumps({
                'status': 'not_initialized',
                'message': 'HLD structure not initialized. Call initialize_hld_structure() first.'
            }, indent=2)
        
        # Organize sections by status
        complete_sections = []
        pending_sections = []
        
        for section_id, section_data in metadata['sections'].items():
            section_info = {
                'id': section_id,
                'title': section_data['title']
            }
            if section_data['status'] == 'COMPLETE':
                section_info['word_count'] = section_data.get('word_count', 0)
                complete_sections.append(section_info)
            else:
                pending_sections.append(section_info)
        
        progress_pct = int((metadata['completed_sections'] / metadata['total_sections']) * 100)
        
        return json.dumps({
            'status': 'success',
            'session_id': session_id,
            'document_title': metadata['document_title'],
            'progress': {
                'completed_sections': metadata['completed_sections'],
                'total_sections': metadata['total_sections'],
                'percentage': progress_pct
            },
            'complete_sections': complete_sections,
            'pending_sections': pending_sections,
            'last_updated': metadata.get('last_updated', 'unknown')
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            'status': 'error',
            'error': f"Error getting HLD progress: {str(e)}"
        }, indent=2)
