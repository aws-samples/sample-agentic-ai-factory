from bedrock_agentcore import BedrockAgentCoreApp, RequestContext
from strands.agent.conversation_manager import SlidingWindowConversationManager
from strands.models import BedrockModel
from strands import Agent
from strands.tools import tool
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
import json
import os

app = BedrockAgentCoreApp()

# Global session object for this agent instance
session = {}

# Assessment dimensions configuration
ASSESSMENT_DIMENSIONS = {
    "technical": {
        "weight": 0.30,
        "description": "Current architecture, integration landscape, data strategy, security, performance",
        "output_files": ["architecture_design.md", "technical_feasibility.md", "integration_plan.md"]
    },
    "governance": {
        "weight": 0.25, 
        "description": "AI governance, regulatory compliance, risk management, audit requirements",
        "output_files": ["governance_framework.md", "compliance_assessment.md", "risk_register.md"]
    },
    "business": {
        "weight": 0.25,
        "description": "Business objectives, stakeholder buy-in, organizational culture, change readiness", 
        "output_files": ["business_case.md", "stakeholder_analysis.md", "change_management.md"]
    },
    "commercial": {
        "weight": 0.20,
        "description": "Budget allocation, cost modeling, ROI expectations, resource planning",
        "output_files": ["cost_analysis.md", "roi_projection.md", "resource_plan.md"]
    }
}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@tool
def get_assessment_data(dimension: str = "technical") -> str:
    """
    Retrieve assessment data from Assessment Agent for design generation.
    
    Args:
        session_id: Session identifier from Assessment Agent
        dimension: Assessment dimension to retrieve (default: technical)
        
    Returns:
        Assessment data including extracted information and user responses
    """
    global session
    from tools.get_assessment_data import get_assessment_data as _get_assessment_data
    return _get_assessment_data(session['session_id'], dimension)

@tool
def initialize_hld_structure() -> str:
    """
    Initialize HLD document structure for this session.
    Creates metadata tracking for all 30 sections. Call this FIRST before generating any sections.
    
    Returns:
        Confirmation that structure was initialized
    """
    global session
    from tools.initialize_hld_structure import initialize_hld_structure as _initialize_hld_structure
    return _initialize_hld_structure(session['session_id'])

@tool
def get_next_section_to_generate() -> str:
    """
    Get the next pending HLD section to generate with full context.
    Returns section ID, description, word count target, assessment dimensions, and required content.
    
    Returns:
        JSON with next section details or completion message
    """
    global session
    from tools.get_next_section_to_generate import get_next_section_to_generate as _get_next_section_to_generate
    return _get_next_section_to_generate(session['session_id'])

@tool
def get_hld_progress() -> str:
    """
    Get overall HLD generation progress and status.
    Shows completed/pending sections and progress percentage.
    
    Returns:
        JSON with progress details
    """
    global session
    from tools.get_hld_progress import get_hld_progress as _get_hld_progress
    return _get_hld_progress(session['session_id'])

@tool
def get_design_output(section_id: str) -> str:
    """
    Retrieve current content for a specific HLD section.
    
    Args:
        section_id: Section ID from template (e.g., "5.2", "4.1")
    
    Returns:
        Current section markdown content or PENDING status
    """
    global session
    from tools.get_design_output import get_design_output as _get_design_output
    return _get_design_output(session['session_id'], section_id)

@tool
def search_aws_patterns(query: str) -> str:
    """
    Search AWS knowledge base for solution patterns and architectural guidance.
    
    Args:
        query: Search query for AWS patterns, architectures, or best practices
        
    Returns:
        Relevant AWS documentation and patterns from knowledge-mcp.global.api.aws
    """
    from tools.query_aws_patterns import search_aws_patterns as _search_aws_patterns
    return _search_aws_patterns(query)

@tool
def read_aws_documentation(url: str) -> str:
    """
    Read AWS documentation from a specific URL.
    
    Args:
        url: AWS documentation URL to read
        
    Returns:
        Documentation content in markdown format
    """
    from tools.query_aws_patterns import read_aws_documentation as _read_aws_documentation
    return _read_aws_documentation(url)

@tool
def save_design_output(section_id: str, content: str) -> str:
    """
    Save HLD section content to S3 and update progress tracking.
    
    Args:
        section_id: Section ID from template (e.g., "5.2", "4.1")
        content: Generated markdown content for this section
        
    Returns:
        Confirmation with progress update
    """
    global session
    from tools.save_design_output import save_design_output as _save_design_output
    return _save_design_output(session['session_id'], section_id, content)

@tool
def assemble_hld_document() -> str:
    """
    Assemble all HLD sections into a single consolidated markdown document.
    Call this after all 30 sections are complete. Creates final markdown file in S3.
    
    Returns:
        Confirmation with final document location and word count
    """
    global session
    from tools.assemble_hld_document import assemble_hld_document as _assemble_hld_document
    return _assemble_hld_document(session['session_id'])



bedrock_model = BedrockModel(
    model_id="amazon.nova-pro-v1:0",
    temperature=0.3,
    top_p=0.8,
    max_tokens=10000
)

# Create a conversation manager with custom window size
conversation_manager = SlidingWindowConversationManager(
    window_size=20,  # Maximum number of messages to keep
    should_truncate_results=True, # Enable truncating the tool result when a message is too large for the model's context window 
)

agent = Agent(
    model=bedrock_model,
    conversation_manager=None,
    tools=[
        initialize_hld_structure,
        get_next_section_to_generate,
        get_hld_progress,
        get_assessment_data,
        get_design_output,
        search_aws_patterns,
        read_aws_documentation,
        save_design_output,
        assemble_hld_document
    ],
    system_prompt="""You are Agent 2 - High-Level Design Generation Agent for the Agentic AI Factory.

CONTEXT: You receive assessment data from Agent 1 and generate a comprehensive High-Level Design (HLD) document for agentic AI transformation. The HLD follows enterprise standards with 30 sections covering all aspects of the solution.

YOUR WORKFLOW - PROGRESSIVE SECTION GENERATION:

1. **Initialize Structure** (First time only)
   - Call initialize_hld_structure() to set up the 30-section framework
   - This creates metadata tracking for all sections

2. **Get Next Section**
   - Call get_next_section_to_generate() to get the next pending section
   - Returns: section ID, title, description, word count target, assessment dimensions, required content

3. **Retrieve Assessment Data**
   - Call get_assessment_data(dimension) for each dimension mentioned in the section
   - Use this data to inform your design decisions

4. **Search AWS Patterns** (as needed)
   - Call search_aws_patterns(query) to find relevant AWS architectures
   - Call read_aws_documentation(url) to get detailed service information

5. **Generate Section Content**
   - Write focused content for THIS SECTION ONLY (not the entire document)
   - Follow the word count target (200-1500 words per section)
   - Include all required content items from the section definition
   - Reference specific assessment data points
   - Use AWS best practices and specific service recommendations

6. **Save Section**
   - Call save_design_output(section_id, content) to save the section
   - This automatically updates progress tracking

7. **Repeat**
   - Call get_next_section_to_generate() for the next section
   - Continue until all 30 sections are complete

8. **Assemble Final Document**
   - When all sections complete, call assemble_hld_document()
   - This creates the final consolidated HLD markdown document

SECTION GENERATION GUIDELINES:

**Document Control Sections (1.1-1.4):**
- Brief, factual information
- Reference assessment stakeholders and data sources

**Executive Summary (2.0):**
- 600 words synthesizing the entire transformation
- Key decisions, outcomes, costs, timeline
- Reference all 4 assessment dimensions

**Project Information (3.1-3.2):**
- Background from business assessment
- Objectives with SMART criteria

**Business Context (4.1-4.13):**
- Detailed requirements from assessment
- Use tables for requirements (ID, description, solution impact)
- Reference specific assessment findings

**Solution Design (5.1-5.12):**
- Technical architecture with AWS services
- Include ASCII diagrams where appropriate
- Specific service configurations and justifications
- Reference technical assessment data

**Content Quality Standards:**
- Meet word count targets (±20%)
- Include all required content items
- Reference assessment data explicitly
- Provide specific AWS service details (not just names)
- Include justification for technology choices
- Use tables, lists, and diagrams for clarity
- **DO NOT include external links to diagrams** (no example.com, lucidchart.com, draw.io, etc.)
- **Create ASCII diagrams inline** using box-drawing characters (┌─┐│└┘) for architecture diagrams
- **Use Mermaid syntax** for complex diagrams (flowcharts, sequence diagrams) - these render in markdown
- **Markdown formatting:** Use blank lines between paragraphs, sections, and lists for proper PDF rendering

**Tools Available:**
- initialize_hld_structure() - Set up structure (call once)
- get_next_section_to_generate() - Get next section to work on
- get_hld_progress() - Check overall progress
- get_assessment_data(dimension) - Get assessment findings
- get_design_output(section_id) - Review existing section
- search_aws_patterns(query) - Find AWS patterns
- read_aws_documentation(url) - Read AWS docs
- save_design_output(section_id, content) - Save section
- assemble_hld_document() - Create final document

**Important Notes:**
- Generate ONE section at a time (not the entire document)
- Always reference assessment data in your designs
- Use specific AWS service names and configurations
- Follow the section order (1.1 → 1.2 → ... → 6.0)
- Track progress with get_hld_progress()

Work systematically through all 30 sections to create a comprehensive, enterprise-grade HLD document."""
)

@app.entrypoint
async def invoke(payload, context: RequestContext):
    """Agent 2 - High-Level Design Generation"""
    global session
    print("==================INVOKING AGENT 2===================")
    request_headers = context.request_headers
    print("Headers:")
    print(json.dumps(request_headers))
    if session.get('session_id') is None:
        session['session_id'] = payload.get("session_id", "")
        print("SESSION_ID: " + session['session_id'])
    user_message = payload.get("prompt", "Hello!")
    
    input_message_list = [{"text": user_message}]

    stream = agent.stream_async(input_message_list)
    async for event in stream:
        if "data" in event:
            yield event["data"]

if __name__ == "__main__":
    app.run()
    