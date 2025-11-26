import boto3
import json
import os
from tools.query_assessment_guidelines import query_assessment_guidelines


def analyze_document_gaps(session_id: str, dimension: str) -> str:
    """
    Analyze gaps between extracted document content and assessment requirements using Claude Sonnet.
    
    Args:
        session_id: Unique session identifier
        dimension: Assessment dimension (technical, business, commercial, governance)
        
    Returns:
        Gap analysis with prioritized follow-up questions
    """
    try:
        session_bucket = os.environ['SESSION_BUCKET']
        region = os.environ.get('AWS_REGION', 'ap-southeast-2')
        
        # Initialize clients
        s3 = boto3.client('s3', region_name=region)
        bedrock = boto3.client('bedrock-runtime', region_name=region)
        
        # Get assessment guidelines
        guidelines = query_assessment_guidelines(dimension)
        
        # Load extracted document data from S3
        document_key = f"{session_id}/assessment/{dimension}/output.json"
        
        try:
            response = s3.get_object(Bucket=session_bucket, Key=document_key)
            extracted_data = json.loads(response['Body'].read())
        except s3.exceptions.NoSuchKey:
            return f"No extracted document found for {dimension} dimension in session {session_id}"
        
        # Get inference result and metadata
        inference_result = extracted_data.get('inference_result', {})
        explainability_info = extracted_data.get('explainability_info', [{}])[0]
        
        # Calculate field statistics
        total_fields = len(inference_result)
        empty_fields = sum(1 for value in inference_result.values() if not value or (isinstance(value, str) and value.strip() == ""))
        filled_fields = total_fields - empty_fields
        
        # Calculate confidence metrics
        confidence_values = []
        for field_data in explainability_info.values():
            if isinstance(field_data, dict) and 'confidence' in field_data:
                confidence_values.append(field_data['confidence'])
        
        min_confidence = min(confidence_values) if confidence_values else 0
        avg_confidence = sum(confidence_values) / len(confidence_values) if confidence_values else 0
        
        # Prepare prompt for Claude Sonnet
        prompt = f"""You are an expert assessment gap analyzer. Perform a comprehensive analysis of document extraction completeness for {dimension} assessment.

ASSESSMENT GUIDELINES:
{guidelines}

EXTRACTED DOCUMENT DATA:
{json.dumps(inference_result, indent=2)}

EXTRACTION CONFIDENCE DATA:
{json.dumps(explainability_info, indent=2)}

EXTRACTION METADATA:
- Total fields: {total_fields}
- Filled fields: {filled_fields}
- Empty fields: {empty_fields}
- Confidence range: {min_confidence:.4f} - {avg_confidence:.4f}

ANALYSIS REQUIRED:
Analyze the extracted data against the assessment guidelines and provide:

1. **Critical Missing Information**: Key requirements from guidelines not found in extracted data
2. **Low Confidence Extractions**: Fields with confidence < 0.7 that need verification
3. **Incomplete Responses**: Fields that are partially filled or unclear
4. **Follow-up Questions**: Prioritized questions to fill gaps (high/medium/low priority). 
    **VERY Important**: Max 2 questions per low confidence or missing area
5. **Completeness Assessment**: Overall percentage and readiness for next phase

Return your analysis in this JSON structure:
{{
    "critical_missing": ["list of missing critical fields"],
    "low_confidence_fields": ["fields needing verification"],
    "incomplete_responses": ["partially filled fields"],
    "follow_up_questions": {{
        "high_priority": ["urgent questions"],
        "medium_priority": ["important questions"],
        "low_priority": ["nice-to-have questions"]
    }},
    "completeness_percentage": 85,
    "readiness_assessment": "description of current state and next steps"
}}

Focus on actionable insights that will help complete the {dimension} assessment."""

        # Call Nova Pro
        response = bedrock.invoke_model(
            modelId='amazon.nova-pro-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": prompt}
                        ]
                    }
                ],
                "inferenceConfig": {
                    "max_new_tokens": 512,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        gap_analysis = response_body["output"]["message"]["content"][0]["text"]
        
        return gap_analysis
        
    except Exception as e:
        return f"Error analyzing document gaps: {str(e)}"
