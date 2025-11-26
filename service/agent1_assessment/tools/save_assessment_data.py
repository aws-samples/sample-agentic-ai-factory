import boto3
import json
import time
import os
from typing import Dict, Any
from datetime import datetime


def save_assessment_data(session_id: str, dimension: str, data: Dict[str, Any]) -> str:
    """
    Save assessment responses and session state to DynamoDB with latest state and timestamped snapshots.
    Also updates the consolidated S3 file with smart merging.
    
    Args:
        session_id: Unique session identifier
        dimension: Assessment dimension being evaluated
        data: Assessment data to save
        
    Returns:
        Confirmation of data saved
    """
    try:
        table_name = os.environ['SESSION_MEMORY_TABLE']
        session_bucket = os.environ['SESSION_BUCKET']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        dynamodb = boto3.resource('dynamodb', region_name=region)
        s3 = boto3.client('s3', region_name=region)
        table = dynamodb.Table(table_name)
        
        timestamp = int(time.time())
        
        # Update S3 file with intelligent merging FIRST
        s3_key = f"{session_id}/assessment/{dimension}/output.json"
        
        try:
            # Load existing S3 file
            response = s3.get_object(Bucket=session_bucket, Key=s3_key)
            existing_data = json.loads(response['Body'].read())
        except s3.exceptions.NoSuchKey:
            # No existing file, create new structure
            existing_data = {
                'inference_result': {},
                'explainability_info': [{}],
                '_metadata': {'created': timestamp}
            }
        
        # Simple merge: combine existing and new data
        existing_inference = existing_data.get('inference_result', {})
        merged_inference = {**existing_inference, **data}

        # Track field sources for all fields in merged data
        field_sources = existing_data.get('_metadata', {}).get('field_sources', {})
        for field_name in merged_inference.keys():
            if field_name in data:
                # Field came from or was updated by user input
                field_sources[field_name] = {
                    'source': 'user_input_enriched',
                    'timestamp': timestamp,
                    'confidence': 1.0  # User input = high confidence
                }
            elif field_name not in field_sources:
                # Field from extraction, preserve existing source info
                field_sources[field_name] = {
                    'source': 'extraction',
                    'timestamp': existing_data.get('_metadata', {}).get('last_updated', timestamp),
                    'confidence': 0.8  # Default extraction confidence
                }

        # Create updated data structure
        updated_data = {
            **existing_data,
            'inference_result': merged_inference,
            '_metadata': {
                **existing_data.get('_metadata', {}),
                'last_updated': timestamp,
                'field_sources': field_sources,
                'gap_filling_active': True
            }
        }
        
        # Calculate completion percentage based on filled fields
        total_fields = len(merged_inference)
        if total_fields == 0:
            completion_percentage = 0
        else:
            filled_fields = sum(
                1 for value in merged_inference.values() 
                if value and (not isinstance(value, str) or value.strip())
            )
            completion_percentage = int((filled_fields / total_fields) * 100)
        
        # Save updated file to S3
        s3.put_object(
            Bucket=session_bucket,
            Key=s3_key,
            Body=json.dumps(updated_data, indent=2),
            ContentType='application/json'
        )
        
        # Save timestamped snapshot to DynamoDB
        table.put_item(
            Item={
                'p_key': session_id,
                's_key': f'assessment:{dimension}:{timestamp}',
                'dimension': dimension,
                'data': data,
                'timestamp': timestamp,
                'record_type': 'snapshot',
                'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days TTL
            }
        )
        
        # Save/update latest state in DynamoDB
        table.put_item(
            Item={
                'p_key': session_id,
                's_key': f'assessment:{dimension}:latest',
                'dimension': dimension,
                'data': data,
                'timestamp': timestamp,
                'last_updated': timestamp,
                'completion_percentage': completion_percentage,
                'record_type': 'latest',
                'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days TTL
            }
        )
        
        # Publish progress event to EventBridge
        event_bus_name = os.environ.get('EVENT_BUS_NAME')
        if event_bus_name:
            try:
                events_client = boto3.client('events', region_name=region)
                
                # Calculate overall progress (each dimension = 25%)
                dimensions = ['technical', 'business', 'commercial', 'governance']
                completed_count = 0
                for dim in dimensions:
                    try:
                        resp = table.get_item(Key={'p_key': session_id, 's_key': f'assessment:{dim}:latest'})
                        if 'Item' in resp and resp['Item'].get('completion_percentage', 0) >= 100:
                            completed_count += 1
                    except:
                        pass
                
                overall_percentage = completed_count * 25
                
                events_client.put_events(
                    Entries=[{
                        'Source': 'agent1.assessment',
                        'DetailType': 'assessment.progress.updated',
                        'Detail': json.dumps({
                            'sessionId': session_id,
                            'completionPercentage': overall_percentage,
                            'timestamp': datetime.now().isoformat()
                        }),
                        'EventBusName': event_bus_name
                    }]
                )
            except Exception as e:
                print(f"Failed to publish progress event: {e}")
        
        return f"Assessment data saved for {dimension} dimension. Completion: {completion_percentage}% ({filled_fields}/{total_fields} fields filled)."
        
    except Exception as e:
        return f"Error saving assessment data: {str(e)}"
