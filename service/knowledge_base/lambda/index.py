import json
import boto3
import urllib3
import time
import hashlib
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

def lambda_handler(event, context):
    try:
        collection_endpoint = event['ResourceProperties']['CollectionEndpoint']
        region = event['ResourceProperties']['Region']
        
        index_mapping = {
            "settings": {
                "index": {
                    "knn": True
                }
            },
            "mappings": {
                "properties": {
                    "vector": {
                        "type": "knn_vector",
                        "dimension": 1024,
                        "method": {"name": "hnsw", "space_type": "l2", "engine": "faiss"}
                    },
                    "text": {"type": "text"},
                    "metadata": {"type": "text"}
                }
            }
        }
        
        session = boto3.Session()
        credentials = session.get_credentials()
        http = urllib3.PoolManager()
        
        for index_name in ["file-sources-index", "integrations-index", "web-sources-index"]:
            # Retry logic for 403 errors
            for attempt in range(6):  # 6 attempts = 5 minutes total
                try:
                    url = f"{collection_endpoint}/{index_name}"
                    print(f"Creating index at: {url}")
                    
                    body_bytes = json.dumps(index_mapping).encode('utf-8')
                    request = AWSRequest(method='PUT', url=url, data=body_bytes)
                    request.headers['Content-Type'] = 'application/json'
                    request.headers['x-amz-content-sha256'] = hashlib.sha256(body_bytes).hexdigest()
                    
                    SigV4Auth(credentials, 'aoss', region).add_auth(request)
                    
                    response = http.request('PUT', url, 
                                          headers=dict(request.headers),
                                          body=request.body)
                    
                    if response.status in [200, 201]:
                        print(f"Successfully created {index_name}")
                        break
                    elif response.status == 403 and attempt < 5:
                        print(f"403 error for {index_name}, retrying in 60s (attempt {attempt+1}/6)")
                        time.sleep(60)
                        continue
                    else:
                        raise Exception(f"Failed to create {index_name}: {response.data}")
                except Exception as e:
                    if attempt < 5:
                        print(f"Error creating {index_name}, retrying: {str(e)}")
                        time.sleep(60)
                        continue
                    else:
                        raise
        
        # Wait 60 seconds after all indices are created
        print(f"Waiting 60 seconds for Opensearch indexes to propagate...")
        time.sleep(60)
        
        return {
            'statusCode': 200,
            'body': json.dumps('Successfully created all indices')
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
