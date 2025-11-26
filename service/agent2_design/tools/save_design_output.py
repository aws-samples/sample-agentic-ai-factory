import boto3
import json
import time
import os
from datetime import datetime


def publish_progress_event(session_id: str, section_id: str, completion_percentage: int):
    """Publish design progress event to EventBridge"""
    event_bus_name = os.environ.get('EVENT_BUS_NAME')
    if not event_bus_name:
        return  # Skip if not configured
    
    try:
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        events_client = boto3.client('events', region_name=region)
        
        events_client.put_events(
            Entries=[{
                'Source': 'agent2.design',
                'DetailType': 'design.progress.updated',
                'Detail': json.dumps({
                    'sessionId': session_id,
                    'sectionId': section_id,
                    'completionPercentage': completion_percentage,
                    'timestamp': datetime.now().isoformat()
                }),
                'EventBusName': event_bus_name
            }]
        )
        print(f"Published progress event: section {section_id} - {completion_percentage}%")
    except Exception as e:
        print(f"Failed to publish progress event: {e}")
        # Don't fail the main operation


def save_design_output(session_id: str, section_id: str, content: str) -> str:
    """
    Save HLD section content to S3 and update metadata tracking.
    
    Args:
        session_id: Session identifier
        section_id: Section ID from hld_template.json (e.g., "5.2", "4.1")
        content: Generated markdown content for this section
        
    Returns:
        Confirmation of saved section with progress update
    """
    try:
        session_bucket = os.environ['SESSION_BUCKET']
        table_name = os.environ['SESSION_MEMORY_TABLE']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        s3 = boto3.client('s3', region_name=region)
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        # Load template to get section details
        template_path = os.path.join(os.path.dirname(__file__), '..', 'hld_template.json')
        with open(template_path, 'r') as f:
            template = json.load(f)
        
        # Find section in template
        section = next((s for s in template['sections'] if s['id'] == section_id), None)
        if not section:
            return f"Error: Section ID '{section_id}' not found in HLD template"
        
        timestamp = int(time.time())
        
        # Build S3 key
        s3_key = f"{session_id}/design/hld/{section['folder']}/{section['filename']}"
        
        # Save section content to S3
        s3.put_object(
            Bucket=session_bucket,
            Key=s3_key,
            Body=content,
            ContentType='text/markdown'
        )
        
        # Load or create metadata
        metadata_key = f"{session_id}/design/hld/metadata.json"
        try:
            response = s3.get_object(Bucket=session_bucket, Key=metadata_key)
            metadata = json.loads(response['Body'].read())
        except s3.exceptions.NoSuchKey:
            # Initialize metadata if doesn't exist
            metadata = {
                'session_id': session_id,
                'total_sections': template['total_sections'],
                'completed_sections': 0,
                'sections': {}
            }
            for sec in template['sections']:
                metadata['sections'][sec['id']] = {
                    'status': 'PENDING',
                    'path': f"{sec['folder']}/{sec['filename']}",
                    'title': sec['title']
                }
        
        # Update section status
        metadata['sections'][section_id]['status'] = 'COMPLETE'
        metadata['sections'][section_id]['completed_at'] = timestamp
        metadata['sections'][section_id]['word_count'] = len(content.split())
        
        # Recalculate completed count
        metadata['completed_sections'] = sum(
            1 for s in metadata['sections'].values() if s['status'] == 'COMPLETE'
        )
        metadata['last_updated'] = timestamp
        
        # Save updated metadata
        s3.put_object(
            Bucket=session_bucket,
            Key=metadata_key,
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )
        
        # Log to DynamoDB
        table.put_item(
            Item={
                'p_key': session_id,
                's_key': f'design:hld:{section_id}:{timestamp}',
                'agent': 'agent2_design',
                'section_id': section_id,
                'section_title': section['title'],
                'word_count': len(content.split()),
                'timestamp': timestamp,
                'record_type': 'hld_section',
                's3_location': s3_key,
                'ttl': timestamp + (90 * 24 * 60 * 60)
            }
        )
        
        progress_pct = int((metadata['completed_sections'] / metadata['total_sections']) * 100)
        
        # Update latest state
        table.put_item(
            Item={
                'p_key': session_id,
                's_key': f'design:hld:latest',
                'agent': 'agent2_design',
                'section_id': section_id,
                'section_title': section['title'],
                'word_count': len(content.split()),
                'completion_percentage': progress_pct,
                'timestamp': timestamp,
                'last_updated': timestamp,
                'record_type': 'latest',
                's3_location': s3_key,
                'ttl': timestamp + (90 * 24 * 60 * 60)
            }
        )
        
        # Publish progress event to EventBridge
        publish_progress_event(session_id, section_id, progress_pct)
        
        # Update project status to DESIGN_COMPLETE if all sections are done
        if progress_pct == 100:
            try:
                projects_table_name = os.environ.get('PROJECTS_TABLE_NAME')
                if projects_table_name:
                    projects_table = dynamodb.Table(projects_table_name)
                    projects_table.update_item(
                        Key={'id': session_id},
                        UpdateExpression='SET #status = :status, #design = :design',
                        ExpressionAttributeNames={
                            '#status': 'status',
                            '#design': 'progress.design'
                        },
                        ExpressionAttributeValues={
                            ':status': 'DESIGN_COMPLETE',
                            ':design': 100
                        }
                    )
                    print(f"Updated project {session_id} status to DESIGN_COMPLETE")
            except Exception as e:
                print(f"Failed to update project status: {e}")
        
        return f"✅ Section {section_id} ({section['title']}) saved successfully. Progress: {metadata['completed_sections']}/{metadata['total_sections']} sections ({progress_pct}%). S3: {s3_key}"
        
    except Exception as e:
        return f"Error saving section {section_id}: {str(e)}"
