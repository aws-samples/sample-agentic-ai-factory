# Agent 2: High-Level Design Generation - Detailed Design

## Agent Overview
**Name**: High-Level Design Generation Agent  
**Module**: Module 2 (High-Level Design)  
**Primary Function**: Generate comprehensive High-Level Design (HLD) document from Agent 1 assessment data. Transform assessment findings into enterprise-grade architectural documentation using AWS best practices and solution patterns.

## Implementation Status
✅ **Fully Implemented** - Agent deployed on Amazon Bedrock AgentCore Runtime with progressive section-based HLD generation, AWS Knowledge MCP integration, and automatic PDF generation.

## Functional Requirements

### Core Capabilities
- ✅ **Progressive HLD Generation**: Section-by-section generation of 30-section enterprise HLD document
- ✅ **Assessment Data Integration**: Retrieves and references Agent 1 assessment data across all 4 dimensions
- ✅ **AWS Pattern Matching**: Searches AWS Knowledge MCP for relevant solution patterns
- ✅ **Documentation Research**: Reads specific AWS documentation for detailed service guidance
- ✅ **Architecture Documentation**: Generates comprehensive markdown with ASCII/Mermaid diagrams
- ✅ **Automatic PDF Generation**: Converts final markdown to PDF using pandoc
- ✅ **Progress Tracking**: Real-time section completion tracking with metadata

### HLD Document Structure (30 Sections)

#### Section 1: Document Control (4 subsections)
- 1.1 Document Purpose
- 1.2 Revision History
- 1.3 Stakeholders
- 1.4 References

#### Section 2: Executive Summary (1 section)
- 2.0 Executive Summary (600 words)

#### Section 3: Project Information (2 subsections)
- 3.1 Project Background
- 3.2 Project Objectives

#### Section 4: Business Context (13 subsections)
- 4.1 Business Process and Functional Requirements
- 4.2 Non-Functional Requirements
- 4.3 Security Requirements
- 4.4 Analytics Requirements
- 4.5 Integration Requirements
- 4.6 Operational Requirements
- 4.7 Decommissioning Requirements
- 4.8 Scope Exclusions
- 4.9 Assumptions, Constraints, and Dependencies
- 4.10 Change Management
- 4.11 Delivery Strategy and Deployment Model
- 4.12 Key Decisions
- 4.13 Outstanding Items

#### Section 5: High Level Solution Design (12 subsections)
- 5.1 Solution Overview
- 5.2 Technical Architecture
- 5.3 Technical Solution Design
- 5.4 Functional Solution Design
- 5.5 Infrastructure Architecture
- 5.6 Data Architecture
- 5.7 Integration Architecture
- 5.8 Analytics and Information Management Architecture
- 5.9 Security Architecture
- 5.10 User Management
- 5.11 Solution Deployment
- 5.12 Solution Operations

#### Section 6: Appendix (1 section)
- 6.0 Appendix and Attachments

### Assessment Dimensions Integration

Agent 2 receives assessment data from Agent 1 across four dimensions and maps them to HLD sections:

#### Technical (30% Weight) → Sections 5.2-5.7
**Input**: Current architecture, infrastructure, integration, data strategy, performance requirements  
**Output Sections**: Technical Architecture, Infrastructure, Data Architecture, Integration Architecture

#### Governance (25% Weight) → Sections 4.3, 5.9-5.10
**Input**: Regulatory requirements, risk tolerance, governance framework, audit requirements  
**Output Sections**: Security Requirements, Security Architecture, User Management

#### Business (25% Weight) → Sections 3, 4.1-4.2, 4.10
**Input**: Value alignment, user adoption, organizational culture, stakeholder buy-in  
**Output Sections**: Project Information, Business Context, Change Management

#### Commercial (20% Weight) → Sections 3.2, 4.11
**Input**: Budget constraints, ROI expectations, operational costs, resource allocation  
**Output Sections**: Project Objectives, Delivery Strategy

## Technical Architecture

### Core Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Agent 1 Output  │───▶│   Design Engine  │───▶│  HLD Document   │
│ (Assessment)    │    │  (Agent 2 Core)  │    │  (30 Sections)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ AWS Knowledge   │    │ Section-by-      │    │ PDF Generation  │
│  MCP Server     │    │ Section Storage  │    │    (Pandoc)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Sliding Window  │    │   DynamoDB       │    │   CloudWatch    │
│ Conversation    │    │ Progress Track   │    │    Logging      │
│ Manager (20msg) │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### AWS Services Integration
- ✅ **Amazon Bedrock AgentCore Runtime**: Agent hosting with auto-scaling
- ✅ **Amazon Nova Pro**: Design generation model (temperature 0.3, max_tokens 10000)
- ✅ **Sliding Window Conversation Manager**: Token management with 20-message window and result truncation
- ✅ **Amazon S3**: Section-based storage with metadata tracking
- ✅ **Amazon DynamoDB**: Progress tracking and design state management
- ✅ **AWS Knowledge MCP Server**: External AWS documentation access (knowledge-mcp.global.api.aws)
- ✅ **Pandoc + XeLaTeX**: PDF generation from markdown

### Design Generation Workflow
1. ✅ **Initialize Structure**: Create 30-section framework with metadata.json
2. ✅ **Get Next Section**: Retrieve next pending section with context from template
3. ✅ **Retrieve Assessment Data**: Load Agent 1 data for relevant dimensions
4. ✅ **Search AWS Patterns**: Find relevant AWS solution architectures
5. ✅ **Read AWS Documentation**: Get detailed service information
6. ✅ **Generate Section Content**: Create 200-1500 word section with diagrams
7. ✅ **Save Section**: Store to S3 and update progress metadata
8. ✅ **Repeat**: Continue until all 30 sections complete
9. ✅ **Assemble Document**: Concatenate all sections into final HLD
10. ✅ **Generate PDF**: Convert markdown to PDF with table of contents

## Data Models

### HLD Template Structure (hld_template.json)
```json
{
  "document_title": "High Level Design Document",
  "version": "1.0",
  "total_sections": 30,
  "sections": [
    {
      "id": "5.2",
      "title": "Technical Architecture",
      "folder": "5_solution_design",
      "filename": "5.2_technical_architecture.md",
      "description": "Detailed technical architecture with AWS services...",
      "word_count_target": 1500,
      "assessment_dimensions": ["technical"],
      "required_content": [...]
    }
  ],
  "section_order": ["1.1", "1.2", ..., "6.0"]
}
```

### Metadata Structure (S3)
```json
{
  "session_id": "uuid",
  "total_sections": 30,
  "completed_sections": 15,
  "sections": {
    "5.2": {
      "status": "COMPLETE",
      "title": "Technical Architecture",
      "path": "5_solution_design/5.2_technical_architecture.md",
      "word_count": 1450,
      "completed_at": 1234567890
    }
  },
  "last_updated": 1234567890
}
```

### DynamoDB Progress Tracking
```json
{
  "p_key": "session_id",
  "s_key": "design:hld:latest",
  "section_id": "5.2",
  "section_title": "Technical Architecture",
  "word_count": 1450,
  "completion_percentage": 50,
  "timestamp": 1234567890,
  "record_type": "latest",
  "s3_location": "s3://bucket/session/design/hld/5_solution_design/5.2_technical_architecture.md"
}
```

## Tool Implementation

### 1. initialize_hld_structure()
- ✅ **Template Loading**: Reads hld_template.json with 30 section definitions
- ✅ **Metadata Creation**: Creates metadata.json in S3 with all sections marked PENDING
- ✅ **Progress Initialization**: Sets up tracking for 30-section generation

### 2. get_next_section_to_generate()
- ✅ **Section Selection**: Returns next PENDING section in order
- ✅ **Context Provision**: Provides description, word count target, assessment dimensions, required content
- ✅ **Progress Reporting**: Shows completed/total sections and percentage

### 3. get_assessment_data(dimension)
- ✅ **Agent 1 Integration**: Retrieves assessment data from Agent 1's S3 storage
- ✅ **Dimension-Specific**: Gets data for technical, business, commercial, or governance
- ✅ **Structured Output**: Returns inference_result, metadata, field_sources

### 4. search_aws_patterns(query)
- ✅ **AWS Knowledge MCP**: Searches AWS documentation via JSON-RPC
- ✅ **Pattern Discovery**: Finds relevant solution architectures and best practices
- ✅ **Timeout Handling**: 30-second timeout with error handling

### 5. read_aws_documentation(url)
- ✅ **Documentation Retrieval**: Reads specific AWS doc URLs via MCP
- ✅ **Markdown Format**: Returns documentation in markdown format
- ✅ **Service Details**: Gets detailed implementation guidance

### 6. save_design_output(section_id, content)
- ✅ **S3 Storage**: Saves section to structured path
- ✅ **Metadata Update**: Updates section status to COMPLETE with word count
- ✅ **Progress Calculation**: Recalculates completion percentage
- ✅ **DynamoDB Logging**: Records section completion with timestamp

### 7. get_design_output(section_id)
- ✅ **Section Retrieval**: Gets existing section content for review/iteration
- ✅ **Status Check**: Returns PENDING status if section not yet generated

### 8. assemble_hld_document(generate_pdf)
- ✅ **Section Concatenation**: Combines all 30 sections in order
- ✅ **Markdown Assembly**: Creates final high_level_design.md
- ✅ **PDF Generation**: Runs pandoc with xelatex engine
- ✅ **S3 Upload**: Saves both .md and .pdf to S3

### 9. get_hld_progress()
- ✅ **Progress Overview**: Shows completed vs pending sections
- ✅ **Section List**: Lists all sections with status and word counts
- ✅ **Percentage Calculation**: Overall completion percentage

## Environment Configuration

### Required Environment Variables
```bash
# AWS Configuration
AWS_REGION=ap-southeast-2

# Storage
SESSION_BUCKET=agentic-ai-factory-sessions-dev
SESSION_MEMORY_TABLE=agentic-ai-factory-session-memory-dev


```

### System Dependencies (for PDF generation)
```bash
# Required for pandoc PDF generation
pandoc
texlive-xetex
texlive-fonts-recommended
```

## Processing Logic

### Progressive Section Generation
```python
# Global session state
session = {
    'session_id': 'from_payload'
}

# Conversation manager for token efficiency
conversation_manager = SlidingWindowConversationManager(
    window_size=20,  # Maximum 20 messages
    should_truncate_results=True  # Truncate large tool results
)

# Bedrock model configuration
bedrock_model = BedrockModel(
    model_id="amazon.nova-pro-v1:0",
    temperature=0.3,
    top_p=0.8,
    max_tokens=10000
)

# 1. Initialize structure
initialize_hld_structure()

# 2. Loop through all 30 sections
while sections_remaining:
    # Get next section with context
    section = get_next_section_to_generate()
    
    # Retrieve assessment data for relevant dimensions
    for dimension in section.assessment_dimensions:
        assessment_data = get_assessment_data(dimension)
    
    # Research AWS patterns
    patterns = search_aws_patterns(section.title)
    
    # Read specific AWS documentation
    for url in relevant_urls:
        docs = read_aws_documentation(url)
    
    # Generate section content (200-1500 words)
    content = generate_section(section, assessment_data, patterns, docs)
    
    # Save section and update progress
    save_design_output(section.id, content)

# 3. Assemble final document
assemble_hld_document(generate_pdf=True)
```

### Content Quality Standards
- ✅ **Word Count Targets**: 200-1500 words per section (20,000 total)
- ✅ **Required Content**: All checklist items from template included
- ✅ **Assessment References**: Explicit references to Agent 1 data
- ✅ **AWS Service Details**: Specific configurations, not just service names
- ✅ **No External Links**: No example.com or external diagram URLs
- ✅ **ASCII/Mermaid Diagrams**: Inline diagrams using box-drawing characters
- ✅ **Markdown Formatting**: Blank lines between paragraphs for PDF rendering

## Integration Points

### Input Interfaces
- ✅ **Agent 1 Assessment Data**: S3-based assessment results per dimension
- ✅ **Session Context**: Conversation state and session ID
- ✅ **HLD Template**: Static template with 30 section definitions

### Output Interfaces
- ✅ **Agent 3 Design Handoff**: Complete HLD document (markdown + PDF)
- ✅ **Progress Tracking**: Real-time section completion status
- ✅ **S3 Artifacts**: Individual sections + assembled document

## Quality Assurance

### Design Validation
- ✅ **Template Compliance**: All sections follow template structure
- ✅ **Assessment Integration**: Designs reference specific Agent 1 findings
- ✅ **AWS Documentation**: All services backed by current AWS docs
- ✅ **Completeness**: All 30 sections generated before assembly

### Content Quality
- ✅ **Comprehensive Coverage**: Detailed explanations for all decisions
- ✅ **Visual Clarity**: ASCII/Mermaid diagrams enhance understanding
- ✅ **Actionable Guidance**: Clear implementation steps for Agent 3
- ✅ **Professional Format**: Enterprise-grade documentation standards

## Performance Considerations

### Design Optimization
- ✅ **Section-Based Generation**: Manageable 200-1500 word chunks
- ✅ **Template-Driven**: Consistent structure and quality
- ✅ **Progress Tracking**: Real-time visibility into generation status
- ✅ **Resume Capability**: Can pause and resume generation

### Scalability
- ✅ **Session Isolation**: Each session generates independently
- ✅ **S3 Storage**: Scalable section-based storage
- ✅ **Metadata Efficiency**: Lightweight JSON tracking
- ✅ **Concurrent Sessions**: Multiple HLD generations in parallel

## Security & Compliance

### Data Protection
- ✅ **S3 Encryption**: Server-side encryption for all sections
- ✅ **DynamoDB Encryption**: Encrypted progress tracking
- ✅ **Session Isolation**: Design data isolated by session ID
- ✅ **TTL Cleanup**: Automatic data expiration after 90 days

### Design Integrity
- ✅ **Version Control**: Timestamped section saves
- ✅ **Source Attribution**: Links to AWS documentation sources
- ✅ **Audit Trail**: Complete generation history in DynamoDB

## Monitoring & Observability

### Key Metrics
- ✅ **Section Completion Rate**: Sections completed per session
- ✅ **AWS Documentation Usage**: MCP call frequency and success rate
- ✅ **Generation Time**: Time per section and total HLD generation
- ✅ **PDF Generation Success**: Pandoc conversion success rate
- ✅ **Conversation Window**: Token management and message truncation effectiveness

### Alerting
- ✅ **Incomplete Designs**: Alert when HLD remains unfinished
- ✅ **MCP Connectivity**: Alert for AWS Knowledge MCP issues
- ✅ **PDF Generation Failures**: Alert for pandoc errors
- ✅ **Quality Degradation**: Alert when word counts or quality decline

## Testing & Validation

### Test Coverage
- ✅ **Section Generation**: Individual section generation testing
- ✅ **Template Compliance**: Validation against hld_template.json
- ✅ **Assessment Integration**: Verify Agent 1 data retrieval
- ✅ **PDF Generation**: End-to-end markdown to PDF conversion

### Validation Tools
- ✅ **Local Testing**: Run agent locally with test session IDs
- ✅ **Progress Monitoring**: Check metadata.json and DynamoDB state
- ✅ **Document Review**: Validate assembled HLD quality
- ✅ **PDF Verification**: Ensure proper formatting and rendering
