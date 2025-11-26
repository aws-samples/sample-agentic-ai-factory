from bedrock_agentcore import BedrockAgentCoreApp, RequestContext
from strands.agent.conversation_manager import SummarizingConversationManager
from strands import Agent
from strands.tools import tool
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
import json

app = BedrockAgentCoreApp()

# Global session object for this agent instance
session = {}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

import os

@tool
def query_assessment_guidelines(dimension: str, category: str = None) -> str:
    """
    Retrieve structured assessment guidelines for conducting readiness evaluations across four dimensions.
    Use this tool to get specific points to extract and sample questions for each assessment area.
    
    Available dimensions:
    - technical: Current architecture, integration landscape, data strategy, security, performance (30% weight)
    - governance: AI governance, regulatory compliance, risk management, audit requirements (25% weight)  
    - business: Business objectives, stakeholder buy-in, organizational culture, change readiness (25% weight)
    - commercial: Budget allocation, cost modeling, ROI expectations, resource planning (20% weight)
    
    Args:
        dimension: Assessment dimension to query (technical, governance, business, commercial)
        category: Optional specific category within dimension (e.g., "Current Architecture & Systems")
                 If not provided, returns overview of all categories in the dimension
        
    Returns:
        Formatted guidelines including points to extract from documents/conversations and sample questions
        to ask users. Use this to ensure comprehensive coverage of assessment requirements.
    """
    from tools.query_assessment_guidelines import query_assessment_guidelines as _query_assessment_guidelines
    return _query_assessment_guidelines(dimension, category)

@tool
def extract_document_content(dimension: str) -> str:
    """
    Extract and analyze structured content from uploaded documents using Bedrock Data Automation.
    
    This tool processes documents that have been uploaded to the current session using specialized
    blueprints for different assessment dimensions. It uses Amazon Bedrock Data Automation to
    extract structured information based on predefined schemas for technical, business, commercial,
    or governance assessments.
    
    The tool automatically:
    - Uses the last uploaded document from the current session
    - Selects the appropriate blueprint based on document_type
    - Processes the document through Bedrock Data Automation
    - Stores full extracted data in SESSION_BUCKET at {session_id}/assessment/{document_type}/output.json
    - Returns summary with key findings and confidence metrics
    
    Args:
        dimension: Type of assessment analysis to perform. Must be one of:
                      - "technical": Extract technical architecture, systems, and infrastructure data
                      - "business": Extract business objectives, stakeholder, and organizational data  
                      - "commercial": Extract budget, cost, ROI, and economic feasibility data
                      - "governance": Extract compliance, risk management, and governance data
        
    Returns:
        Summary response containing:
        - status: Success/error status
        - summary: Brief description of extraction results
        - storage_location: S3 path where full data is stored
        - key_findings: Explainability info with field values and confidence scores
        - min_confidence: Lowest confidence score across all extracted fields
        - avg_confidence: Average confidence score across all extracted fields
        - document_key: Original document identifier
        - session_id: Current session identifier
        
    Example:
        extract_document_content(document_type="technical")
        # Returns summary with confidence metrics, full data stored in S3
        
    Note:
        - Requires a document to have been uploaded in the current session
        - Blueprint ARNs must be configured via environment variables
        - Full extracted data is stored separately to avoid token limits
        - Confidence scores help assess extraction quality
    """
    from tools.extract_document_content import extract_document_content as _extract_document_content
    global session
    print("SESSION")
    print(session)
    return _extract_document_content(session['last_document_upload_key'], session['session_id'], dimension)

@tool
def save_assessment_data(dimension: str, data: Dict[str, Any]) -> str:
    """
    Save assessment responses and extracted information to S3.
    
    Args:
        dimension: Assessment dimension being evaluated
        data: Assessment data to save
        
    Returns:
        Confirmation of data saved with S3 key
    """
    from tools.save_assessment_data import save_assessment_data as _save_assessment_data
    global session
    return _save_assessment_data(session['session_id'], dimension, data)

@tool
def get_assessment_data(dimension: str) -> str:
    """
    Retrieve current assessment data from S3 for a specific dimension.
    
    This tool provides access to the current state of assessment data that has been collected
    and intelligently merged for a specific dimension. Use this to understand what information
    has already been gathered, what fields are populated, and what data sources contributed.
    
    The tool returns the complete assessment data including:
    - All extracted document fields and user-provided responses
    - Field source tracking (extraction vs user input)
    - Metadata about data completeness and last updates
    - Field count and completion status
    
    Args:
        dimension: Assessment dimension to retrieve data for. Must be one of:
                  - "technical": Technical architecture and systems data
                  - "business": Business objectives and organizational data
                  - "commercial": Budget, ROI, and economic data
                  - "governance": Compliance, risk, and governance data
        
    Returns:
        JSON structure containing:
        - status: 'found', 'not_found', or 'error'
        - inference_result: All assessment fields and their current values
        - metadata: Field sources, timestamps, and completion tracking
        - field_count: Number of populated fields
        - last_updated: Timestamp of most recent update
        
    Example:
        get_assessment_data(dimension="technical")
        # Returns complete technical assessment data with all fields and metadata
        
    Use Cases:
        - Review what data has been collected before asking new questions
        - Understand which fields came from document extraction vs user input
        - Check completeness before proceeding to gap analysis
        - Avoid asking for information that's already been provided
        - Resume interrupted assessment sessions with full context
        
    Note:
        - Returns empty structure if no data exists for the dimension
        - Includes both extracted document data and user-provided responses
        - Shows intelligent merging results from Nova Pro LLM
    """
    from tools.get_assessment_data import get_assessment_data as _get_assessment_data
    global session
    return _get_assessment_data(session['session_id'], dimension)

@tool
def get_session_state() -> str:
    """
    Retrieve current session state and progress from DynamoDB session memory.
    
    This tool provides comprehensive visibility into the current assessment session,
    including completion status, extraction results, and recent activity. Use this
    to understand what has already been accomplished and what still needs attention.
    
    The tool automatically:
    - Retrieves latest assessment progress and completion percentages
    - Shows extraction status for all four assessment dimensions
    - Displays recent session activity and timestamps
    - Calculates overall progress across all dimensions
    - Identifies which areas need attention or completion
    
    Returns:
        Formatted session state summary containing:
        - Overall progress percentage and dimensions completed
        - Extraction status per dimension (technical, business, commercial, governance)
        - Field completion statistics and confidence scores
        - Latest assessment activity and timestamps
        - Recent session activity log
        - Recommendations for next steps
        
    Example:
        get_session_state()
        # Returns comprehensive session overview with progress tracking
        
    Use Cases:
        - "Let me check what we've covered so far..."
        - Resume interrupted sessions with full context
        - Identify incomplete dimensions needing attention
        - Show progress to users during long assessment sessions
        - Prioritize remaining work based on completion status
        
    Note:
        - Accesses DynamoDB session memory for real-time state
        - Shows both extraction and assessment completion data
        - Provides actionable insights for session continuation
        - Helps avoid redundant questions and work
    """
    from tools.get_session_state import get_session_state as _get_session_state
    global session
    return _get_session_state(session['session_id'])


@tool
def mark_dimension_complete(dimension: str) -> str:
    """
    Mark an assessment dimension as complete and allow progression to the next dimension.
    
    This is a checkpoint tool that should be called when:
    - User explicitly requests to move to the next dimension
    - User confirms they have provided all available information
    - User wants to proceed despite incomplete data (< 100% completion)
    
    Once marked complete, the dimension is considered finished and the assessment
    can progress to the next dimension or to Agent 2 for design generation.
    
    Args:
        dimension: Assessment dimension to mark as complete (technical, business, commercial, governance)
        
    Returns:
        Confirmation message indicating the dimension is complete and what comes next
        
    Example:
        mark_dimension_complete(dimension="technical")
        # Returns: "✅ Technical dimension marked as complete (67% filled). Ready to proceed to business dimension."
        
    Use Cases:
        - User says "Let's move on to the next dimension"
        - User confirms "I don't have any more information for this section"
        - User wants to skip remaining questions and proceed
        - All critical information has been gathered even if not 100% complete
        
    Note:
        - Can be called even if completion_percentage < 100%
        - Sets is_complete=true flag in DynamoDB
        - Guides user to next dimension or Agent 2
    """
    from tools.mark_dimension_complete import mark_dimension_complete as _mark_dimension_complete
    global session
    return _mark_dimension_complete(session['session_id'], dimension)


@tool
def analyze_document_gaps(dimension: str) -> str:
    """
    Analyze gaps between extracted document content and assessment requirements using Claude Sonnet.
    
    This tool performs comprehensive gap analysis by comparing extracted document data against
    current assessment guidelines. It uses a dedicated Claude Sonnet 3.5 model to provide
    expert-level analysis of what information is missing, incomplete, or needs verification.
    
    The tool automatically:
    - Retrieves current assessment guidelines for the specified dimension
    - Loads extracted document data from the session's S3 storage
    - Analyzes field completeness and confidence scores
    - Uses Claude Sonnet to identify critical gaps and generate targeted questions
    - Returns structured analysis with prioritized follow-up actions
    
    Args:
        dimension: Assessment dimension to analyze. Must be one of:
                  - "technical": Analyze technical architecture and systems gaps
                  - "business": Analyze business objectives and stakeholder gaps
                  - "commercial": Analyze budget, ROI, and economic gaps
                  - "governance": Analyze compliance, risk, and governance gaps
        
    Returns:
        Structured JSON analysis containing:
        - critical_missing: Key requirements not found in extracted data
        - low_confidence_fields: Fields with confidence < 0.7 needing verification
        - incomplete_responses: Partially filled or unclear fields
        - follow_up_questions: Prioritized questions (high/medium/low priority)
        - completeness_percentage: Overall assessment completion score
        - readiness_assessment: Current state and recommended next steps
        
    Example:
        analyze_document_gaps(dimension="technical")
        # Returns comprehensive gap analysis with prioritized questions for technical assessment
        
    Note:
        - Requires extracted document data to exist for the specified dimension
        - Uses Claude Sonnet 3.5 for sophisticated reasoning and analysis
        - Compares against current assessment guidelines from Confluence
        - Provides actionable insights for completing the assessment
    """
    from tools.analyze_document_gaps import analyze_document_gaps as _analyze_document_gaps
    global session
    return _analyze_document_gaps(session['session_id'], dimension)






agent = Agent(
    model="amazon.nova-pro-v1:0",
    conversation_manager=None,
    tools=[query_assessment_guidelines, extract_document_content, save_assessment_data, analyze_document_gaps, get_session_state, get_assessment_data, mark_dimension_complete],
    system_prompt="""You are Agent 1 - Document Review & Information Gathering Agent for the Agentic AI Factory.

CONTEXT: The Agentic AI Factory is a transformation system that helps organizations migrate FROM traditional applications TO agentic AI-powered solutions. Most organizations are starting with traditional systems and want to understand how to transform them into agentic AI workflows. You are NOT assessing existing AI capabilities - you are gathering information about their current traditional systems and business requirements to design their future agentic AI transformation.

Your primary role is to conduct comprehensive readiness assessments across four weighted dimensions:
- Technical Feasibility (30% weight) - Current traditional architecture, systems, data, integration needs
- Governance, Risk & Compliance (25% weight) - Current policies, compliance requirements, risk management
- Business Feasibility (25% weight) - Business objectives, stakeholder alignment, organizational readiness for AI transformation
- Commercial & Economics (20% weight) - Budget, ROI expectations, resource planning for transformation

IMPORTANT: Focus on their CURRENT traditional systems and business context, NOT their existing AI knowledge or capabilities. Ask about:
- Current architecture and systems they want to transform
- Business processes that could benefit from agentic AI
- Data sources and integration requirements
- Compliance and governance needs
- Organizational readiness for AI transformation
- Budget and timeline expectations

DO NOT ask about their existing AI expertise, prompt engineering knowledge, or current AI implementations.

Assessment Workflow:
1. **Session State Check**: IMMEDIATELY use get_session_state() to check existing progress and resume appropriately - if assessments exist, proceed with gap analysis and additional information gathering without requiring document re-upload
2. **Guidelines Retrieval**: Use query_assessment_guidelines(dimension) to retrieve current assessment requirements for relevant dimensions
3. **Document Upload & Extraction**: Only if no existing extraction data - when a user uploads a document, extract structured information using extract_document_content(dimension) where dimension is one of: technical, business, commercial, governance
4. **AUTOMATIC Gap Analysis**: IMMEDIATELY after successful extraction, call analyze_document_gaps(dimension) for the same dimension to get completion percentage and gap priorities
5. **Save Gap Analysis**: Use save_assessment_data() to persist gap analysis results with dimension "gap_analysis_{dimension}" including completion percentage
6. **Interactive Gap Filling**: Query the user with targeted questions to fill identified gaps based on current guidelines and gap analysis priorities
7. **IMMEDIATE Data Persistence**: ALWAYS use save_assessment_data() immediately after receiving any user response or information - this is critical for maintaining session state
8. **Dimension Completion Checkpoint**: When user confirms they have provided all available information OR explicitly requests to move to next dimension, call mark_dimension_complete(dimension) to set is_complete=true flag
9. **Complete All Dimensions**: Continue assessment process until ALL FOUR dimensions (technical, business, commercial, governance) are marked complete
10. **Final Readiness Calculation**: Once all dimensions are marked complete, inform user that assessment is ready for Agent 2 (Design) to generate high-level architecture

Key capabilities:
1. **Session State Awareness**: Check current progress and completion status to provide contextual interactions
2. **Document Analysis**: Extract structured content using Bedrock Data Automation with confidence scoring
3. **Gap Identification**: Analyze what's missing from extracted data vs. assessment requirements using Nova Pro for expert-level reasoning
4. **Adaptive Questioning**: Generate contextual questions based on gaps and confidence scores to complete dimension requirements
5. **Information Synthesis**: Structure gathered information for downstream agents
6. **Progress Tracking**: Save assessment data incrementally as information is gathered
7. **Unknown Response Handling**: Explicitly confirm and record when users don't know specific information, saving these as documented gaps

Document Processing Steps:
1. IMMEDIATELY check session state using get_session_state() to understand existing progress
2. If extraction data exists for any dimension, proceed directly to gap analysis and questioning - NO need to re-upload documents
3. If no extraction data exists, ask user which dimension they want to assess (technical, business, commercial, governance)
4. For new uploads: Use extract_document_content(dimension) with the appropriate dimension parameter
5. **MANDATORY AFTER EXTRACTION**: Immediately after extract_document_content() completes successfully, AUTOMATICALLY call analyze_document_gaps(dimension) for the same dimension to get gap analysis and completion percentage
6. **SAVE GAP ANALYSIS RESULTS**: After analyze_document_gaps(), use save_assessment_data() to persist the gap analysis results including completion percentage with dimension "gap_analysis_{dimension}"
7. For existing or new extractions: Retrieve assessment guidelines using query_assessment_guidelines(dimension) for the relevant dimension
8. Review extraction results and confidence scores against the retrieved guidelines
9. Ask targeted questions to fill gaps based on the gap analysis and guidelines
10. **CRITICAL**: Immediately after receiving ANY user response, use save_assessment_data() to persist the information with the session_id, dimension, user's response data, and completion_percentage (estimate based on remaining gaps)
11. Continue asking follow-up questions and saving responses until dimension is complete
12. **REPEAT FOR ALL DIMENSIONS**: Once one dimension is complete, move to the next incomplete dimension until all four are finished

Question Guidelines:
- IMMEDIATELY check session state with get_session_state() to understand what's already completed
- If extraction data exists, proceed directly with gap analysis - do not ask for document re-upload
- Retrieve current assessment guidelines before asking questions or discussing requirements
- Use analyze_document_gaps(dimension) to get Nova Pro-powered analysis of missing information and priorities
- Prioritize questions for fields with confidence scores < 0.7 that need verification
- Start with critical missing information identified in the gap analysis
- Ask follow-up questions based on document gaps and missing requirements
- **MANDATORY**: After receiving ANY user response with information, IMMEDIATELY call save_assessment_data() with the session_id, dimension, response data, and completion_percentage (estimate 0-100% based on gaps filled)
- **HANDLE UNKNOWNS**: If user says they don't know something, ask for explicit confirmation (e.g., "Should I record that [specific field] is currently unknown?") then save the response as "Unknown - confirmed by user" using save_assessment_data() and INCREMENT the completion_percentage as if the question was answered - this allows progress to continue
- **UNKNOWN = PROGRESS**: Treat confirmed unknowns as valid responses that contribute to completion percentage - the goal is to gather what's available, not to block on missing information
- Use retrieved assessment guidelines to ensure comprehensive coverage
- Focus on critical gaps that impact readiness scoring and preparation for high-level design phase
- Track progress across all four dimensions and guide user toward completion

Completion Criteria:
- All four dimensions (technical, business, commercial, governance) have extraction data OR conversational data
- Each dimension is marked complete using mark_dimension_complete(dimension) - this sets is_complete=true
- User confirms readiness to proceed to design phase
- Note: Dimensions can be marked complete even if completion_percentage < 100% if user has provided all available information

Once all dimensions are marked complete, inform the user: "Assessment complete across all four dimensions. Your readiness data is now available for Agent 2 to generate high-level architecture designs."

Always maintain a conversational, consultative tone while ensuring thorough information gathering. Leverage document extraction to minimize user burden while ensuring complete assessment coverage across all dimensions."""
)

@app.entrypoint
async def invoke(payload, context: RequestContext):
    """Agent 1 - Document Review & Information Gathering"""
    global session
    print("==================INVOKING AGENT 1===================")

    print(context)
    print(payload)
    if session.get('session_id') is None:
        session['session_id'] = payload.get("session_id", "")
    user_message = payload.get("prompt", "Hello!")
    
    input_message_list = [{"text": user_message}]

    # Check for document_upload_key in metadata
    session_attrs = payload.get('sessionAttributes', {})
    metadata = session_attrs.get('metadata', {})
    document_key = metadata.get('document_upload_key')


    if document_key:
        input_message_list = input_message_list + [{"text": "Uploaded document to :" + document_key}]
        session['last_document_upload_key'] = document_key
        print("Last doc key updated: " + document_key)

    stream = agent.stream_async(input_message_list)
    async for event in stream:
        if "data" in event:
            yield event["data"]

if __name__ == "__main__":
    app.run()
 
