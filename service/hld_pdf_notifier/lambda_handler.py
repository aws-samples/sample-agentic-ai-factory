import boto3
import json
import os
from datetime import datetime

eventbridge = boto3.client('events')
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']

def handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        parts = key.split('/')
        if len(parts) < 3 or not key.endswith('/design/high_level_design.pdf'):
            continue
        
        session_id = parts[0]
        
        eventbridge.put_events(
            Entries=[{
                'Source': 'hld.pdf.generator',
                'DetailType': 'hld.pdf.created',
                'Detail': json.dumps({
                    'sessionId': session_id,
                    'pdfUrl': f"s3://{bucket}/{key}",
                    'bucket': bucket,
                    'key': key,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                }),
                'EventBusName': EVENT_BUS_NAME,
            }]
        )
    
    return {'statusCode': 200}
