import boto3
import json
import os


def assemble_hld_document(session_id: str) -> str:
    """
    Assemble all HLD sections into a single consolidated markdown document.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Confirmation that document was assembled with S3 location
    """
    try:
        session_bucket = os.environ.get('SESSION_BUCKET', 'agentic-ai-factory-sessions-dev')
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        projects_table_name = os.environ.get('PROJECTS_TABLE_NAME')
        
        s3 = boto3.client('s3', region_name=region)
        dynamodb = boto3.resource('dynamodb', region_name=region)
        
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
            return "Error: HLD structure not initialized"
        
        # Check if all sections are complete
        incomplete_count = sum(1 for s in metadata['sections'].values() if s['status'] != 'COMPLETE')
        if incomplete_count > 0:
            return f"Warning: {incomplete_count} sections are still pending. Generate all sections before assembling."
        
        # Get project name
        project_name = "Project"
        if projects_table_name:
            try:
                projects_table = dynamodb.Table(projects_table_name)
                response = projects_table.get_item(Key={'id': session_id})
                if 'Item' in response:
                    project_name = response['Item'].get('name', 'Project')
            except Exception as e:
                print(f"Could not fetch project name: {e}")
        
        # Assemble document with project name in title
        document_title = f"{metadata['document_title']} - {project_name}"
        document_parts = [f"# {document_title}\n\n"]
        document_parts.append(f"**Version:** {metadata['version']}\n\n")
        document_parts.append("---\n\n")
        
        # Read and concatenate all sections in order
        for section_id in template['section_order']:
            section = next(s for s in template['sections'] if s['id'] == section_id)
            s3_key = f"{session_id}/design/hld/{section['folder']}/{section['filename']}"
            
            try:
                response = s3.get_object(Bucket=session_bucket, Key=s3_key)
                content = response['Body'].read().decode('utf-8')
                
                # Add section with separator
                document_parts.append(f"## {section['id']} {section['title']}\n\n")
                document_parts.append(content)
                document_parts.append("\n\n---\n\n")
                
            except s3.exceptions.NoSuchKey:
                document_parts.append(f"## {section['id']} {section['title']}\n\n")
                document_parts.append(f"*Section not found*\n\n")
                document_parts.append("---\n\n")
        
        # Combine all parts
        full_document = ''.join(document_parts)
        word_count = len(full_document.split())
        
        # Save assembled markdown document
        md_output_key = f"{session_id}/design/high_level_design.md"
        s3.put_object(
            Bucket=session_bucket,
            Key=md_output_key,
            Body=full_document,
            ContentType='text/markdown'
        )
        
        return f"✅ HLD markdown assembled! Total: {word_count} words across {metadata['total_sections']} sections.\nMarkdown: s3://{session_bucket}/{md_output_key}"
        
    except Exception as e:
        return f"Error assembling HLD document: {str(e)}"
