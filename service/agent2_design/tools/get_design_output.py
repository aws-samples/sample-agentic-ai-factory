import boto3
import os


def get_design_output(session_id: str, section_id: str) -> str:
    """
    Retrieve current HLD section content for this session.
    
    Args:
        session_id: Session identifier
        section_id: Section ID from hld_template.json (e.g., "5.2", "4.1")
        
    Returns:
        Current section markdown content or indication if section doesn't exist
    """
    try:
        session_bucket = os.environ['SESSION_BUCKET']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        s3 = boto3.client('s3', region_name=region)
        
        # Load template to get section details
        import json
        template_path = os.path.join(os.path.dirname(__file__), '..', 'hld_template.json')
        with open(template_path, 'r') as f:
            template = json.load(f)
        
        # Find section in template
        section = next((s for s in template['sections'] if s['id'] == section_id), None)
        if not section:
            return f"Error: Section ID '{section_id}' not found in HLD template"
        
        # Build S3 key
        s3_key = f"{session_id}/design/hld/{section['folder']}/{section['filename']}"
        
        try:
            response = s3.get_object(Bucket=session_bucket, Key=s3_key)
            content = response['Body'].read().decode('utf-8')
            return f"Section {section_id} - {section['title']}:\n\n{content}"
            
        except s3.exceptions.NoSuchKey:
            return f"Section {section_id} ({section['title']}) has not been generated yet. Status: PENDING"
            
    except Exception as e:
        return f"Error retrieving section {section_id}: {str(e)}"
