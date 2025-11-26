import boto3
import json
import os


def get_next_section_to_generate(session_id: str) -> str:
    """
    Get the next pending HLD section to generate with full context.
    Returns section details including description, required content, and assessment dimensions.
    
    Args:
        session_id: Session identifier
        
    Returns:
        JSON with next section details or completion message
    """
    try:
        session_bucket = os.environ.get('SESSION_BUCKET', 'agentic-ai-factory-sessions-dev')
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        s3 = boto3.client('s3', region_name=region)
        
        # Load template
        template_path = os.path.join(os.path.dirname(__file__), '..', 'hld_template.json')
        with open(template_path, 'r') as f:
            template = json.load(f)
        
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
        
        # Find next pending section in order
        for section_id in template['section_order']:
            if metadata['sections'][section_id]['status'] == 'PENDING':
                # Get full section details from template
                section_details = next(s for s in template['sections'] if s['id'] == section_id)
                
                return json.dumps({
                    'status': 'next_section_found',
                    'section_id': section_id,
                    'title': section_details['title'],
                    'description': section_details['description'],
                    'word_count_target': section_details['word_count_target'],
                    'assessment_dimensions': section_details['assessment_dimensions'],
                    'required_content': section_details['required_content'],
                    'folder': section_details['folder'],
                    'filename': section_details['filename'],
                    'progress': {
                        'completed': metadata['completed_sections'],
                        'total': metadata['total_sections'],
                        'percentage': int((metadata['completed_sections'] / metadata['total_sections']) * 100)
                    }
                }, indent=2)
        
        # All sections complete
        return json.dumps({
            'status': 'all_complete',
            'message': f"All {metadata['total_sections']} sections are complete! Ready to assemble final HLD document.",
            'completed_sections': metadata['completed_sections'],
            'total_sections': metadata['total_sections']
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            'status': 'error',
            'error': f"Error getting next section: {str(e)}"
        }, indent=2)
