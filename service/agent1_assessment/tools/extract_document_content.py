import boto3
import os
import time
import json
from decimal import Decimal


def extract_document_content(document_key: str, session_id: str, dimension: str) -> dict:
    """
    Extract and analyze content from uploaded documents using Bedrock Data Automation.
    
    Args:
        document_key: S3 key of the uploaded document
        session_id: Unique session identifier
        dimension: Assessment dimension (technical, business, commercial, governance)
        
    Returns:
        Extracted structured data based on blueprint schema
    """
    try:
        bucket_name = os.environ['DOCUMENT_BUCKET']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        # Get blueprint ARN based on dimension
        blueprint_env_var = f'EXTRACT_BLUEPRINT_ARN_{dimension.upper()}'
        blueprint_arn = os.environ.get(blueprint_env_var)
        
        if not blueprint_arn:
            return {
                'error': f"Blueprint ARN not found for dimension '{dimension}'. Set environment variable '{blueprint_env_var}'",
                'document_key': document_key,
                'dimension': dimension
            }
        
        # Initialize clients
        bda = boto3.client('bedrock-data-automation-runtime', region_name=region)
        s3 = boto3.client('s3', region_name=region)
        sts = boto3.client('sts')
        
        # Get account ID
        account_id = sts.get_caller_identity()["Account"]
        
        # Configure URIs
        input_uri = f's3://{bucket_name}/{session_id}/{document_key}'
        output_uri = f's3://{bucket_name}/{session_id}/extracted/{document_key}'
        print(input_uri)
        data_automation_profile_name = "us.data-automation-v1"
        #change the profile based on region
        if region[0:2] == "ap":
            data_automation_profile_name = "apac.data-automation-v1"
        # Invoke data automation
        params = {
            "inputConfiguration": {"s3Uri": input_uri},
            "outputConfiguration": {"s3Uri": output_uri},
            "blueprints" :[
                {
                    'blueprintArn': blueprint_arn
                },
            ],
            "dataAutomationProfileArn": f"arn:aws:bedrock:{region}:{account_id}:data-automation-profile/{data_automation_profile_name}"
        }
        
        response = bda.invoke_data_automation_async(**params)
        invocation_arn = response["invocationArn"]
        
        # Wait for completion
        while True:
            status_resp = bda.get_data_automation_status(invocationArn=invocation_arn)
            status = status_resp["status"]
            
            if status not in ["Created", "InProgress"]:
                break
                
            time.sleep(10)
        
        if status != "Success":
            return {
                'error': f"Data automation job failed with status: {status}",
                'status_response': status_resp
            }
        
        # Get job metadata
        metadata_uri = status_resp["outputConfiguration"]["s3Uri"]
        metadata_bucket = metadata_uri.split("/")[2]
        metadata_key = "/".join(metadata_uri.split("/")[3:])
        
        metadata_obj = s3.get_object(Bucket=metadata_bucket, Key=metadata_key)
        metadata = json.loads(metadata_obj["Body"].read())
        
        # Extract custom output path
        custom_output_path = metadata["output_metadata"][0]["segment_metadata"][0]["custom_output_path"]
        
        # Get the actual extracted data
        result_bucket = custom_output_path.split("/")[2]
        result_key = "/".join(custom_output_path.split("/")[3:])
        
        result_obj = s3.get_object(Bucket=result_bucket, Key=result_key)
        extracted_data = json.loads(result_obj["Body"].read())
        
        # Check if existing assessment data exists and merge intelligently
        session_bucket = os.environ['SESSION_BUCKET']
        storage_key = f"{session_id}/assessment/{dimension}/output.json"
        
        existing_data = None
        try:
            existing_response = s3.get_object(Bucket=session_bucket, Key=storage_key)
            existing_data = json.loads(existing_response['Body'].read())
            print(f"Found existing data for {dimension}, performing intelligent merge...")
        except s3.exceptions.NoSuchKey:
            print(f"No existing data found for {dimension}, using new extraction as-is")
        
        # If existing data found, use Claude Sonnet for intelligent merging
        if existing_data:
            bedrock = boto3.client('bedrock-runtime', region_name=region)
            
            existing_inference = existing_data.get('inference_result', {})
            new_inference = extracted_data.get('inference_result', {})
            
            merge_prompt = f"""You are a data merging expert. Intelligently merge new document extraction with existing assessment data.

EXISTING ASSESSMENT DATA:
{json.dumps(existing_inference, indent=2)}

NEW DOCUMENT EXTRACTION:
{json.dumps(new_inference, indent=2)}

MERGE RULES:
1. PRESERVE user-provided responses (any field with "Unknown - confirmed by user" or clearly user-entered data)
2. UPDATE fields where new extraction provides better/more complete information
3. FILL empty or missing fields with new extraction data
4. KEEP existing data if new extraction is empty or low quality
5. For conflicts, prefer user data > high-confidence extraction > existing extraction

Return ONLY a JSON object with the merged inference_result:
{{
    "field_name": "merged_value",
    "another_field": "merged_value"
}}

Focus on preserving user effort while improving data completeness."""

            try:
                merge_response = bedrock.invoke_model(
                    modelId='amazon.nova-pro-v1:0',
                    body=json.dumps({
                        'messages': [
                            {
                                'role': 'user',
                                'content': merge_prompt
                            }
                        ]
                    })
                )
                
                merge_response_body = json.loads(merge_response['body'].read())
                merged_inference_text = merge_response_body['content'][0]['text']
                
                # Extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', merged_inference_text, re.DOTALL)
                if json_match:
                    merged_inference = json.loads(json_match.group())
                    extracted_data['inference_result'] = merged_inference
                    print("Successfully merged existing and new data using Claude Sonnet")
                else:
                    print("Could not parse merge result, using new extraction")
                    
            except Exception as e:
                print(f"Error during intelligent merge: {e}, using new extraction")
        
        # Store full extracted data in S3
        s3.put_object(
            Bucket=session_bucket,
            Key=storage_key,
            Body=json.dumps(extracted_data),
            ContentType='application/json'
        )
        
        # Get explainability info for summary
        explainability_info = extracted_data.get('explainability_info', [{}])[0]
        
        # Analyze inference_result for field completeness
        inference_result = extracted_data.get('inference_result', {})
        total_fields = len(inference_result)
        empty_fields = sum(1 for value in inference_result.values() if not value or (isinstance(value, str) and value.strip() == ""))
        filled_fields = total_fields - empty_fields
        
        # Calculate completion percentage based on filled fields
        if total_fields == 0:
            completion_percentage = 0
        else:
            completion_percentage = int((filled_fields / total_fields) * 100)
        
        # Calculate confidence metrics
        confidence_values = []
        for field_name, field_data in explainability_info.items():
            if isinstance(field_data, dict) and 'confidence' in field_data:
                confidence_values.append(field_data['confidence'])
        
        min_confidence = min(confidence_values) if confidence_values else 0
        avg_confidence = sum(confidence_values) / len(confidence_values) if confidence_values else 0
        
        # Write to DynamoDB
        table_name = os.environ['SESSION_MEMORY_TABLE']
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        timestamp = int(time.time())
        
        # Document extraction record
        extraction_record = {
            'document_key': document_key,
            'dimension': dimension,
            'total_fields': total_fields,
            'filled_fields': filled_fields,
            'empty_fields': empty_fields,
            'min_confidence': Decimal(str(round(min_confidence, 4))),
            'avg_confidence': Decimal(str(round(avg_confidence, 4))),
            'storage_location': f's3://{session_bucket}/{storage_key}',
            'extraction_timestamp': timestamp
        }
        
        # Save timestamped extraction record
        table.put_item(
            Item={
                'p_key': session_id,
                's_key': f'assessment:{dimension}:{timestamp}',
                'dimension': dimension,
                'document_key': document_key,
                'extraction_data': extraction_record,
                'timestamp': timestamp,
                'record_type': 'extraction',
                'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days TTL
            }
        )
        
        # Save/update latest extraction state
        table.put_item(
            Item={
                'p_key': session_id,
                's_key': f'assessment:{dimension}:latest',
                'dimension': dimension,
                'document_key': document_key,
                'extraction_data': extraction_record,
                'timestamp': timestamp,
                'last_updated': timestamp,
                'completion_percentage': completion_percentage,
                'record_type': 'extraction',
                'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days TTL
            }
        )
        
        return {
            'status': 'success',
            'summary': f'Extracted {total_fields} fields from document ({filled_fields} filled, {empty_fields} empty)',
            'storage_location': f's3://{session_bucket}/{storage_key}',
            'total_fields': total_fields,
            'filled_fields': filled_fields,
            'empty_fields': empty_fields,
            'min_confidence': round(min_confidence, 4),
            'avg_confidence': round(avg_confidence, 4),
            'document_key': document_key,
            'session_id': session_id
        }
        
    except Exception as e:
        return {
            'error': f"Error extracting document: {str(e)}",
            'document_key': document_key,
            'dimension': dimension
        }
