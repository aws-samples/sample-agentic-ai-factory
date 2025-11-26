import os


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
        category: Optional specific category within dimension (currently not used, returns full guidelines)
        
    Returns:
        Formatted guidelines including points to extract from documents/conversations and sample questions
        to ask users. Use this to ensure comprehensive coverage of assessment requirements.
    """
    try:
        # Map dimension to filename
        dimension_files = {
            'technical': 'technical.md',
            'governance': 'governance.md',
            'business': 'business.md',
            'commercial': 'commercial.md'
        }
        
        if dimension not in dimension_files:
            return f"Error: Invalid dimension '{dimension}'. Must be one of: technical, governance, business, commercial"
        
        # Read from local guidelines file
        guidelines_path = os.path.join('/app/guidelines', dimension_files[dimension])
        
        if not os.path.exists(guidelines_path):
            return f"Error: Guidelines file not found at {guidelines_path}"
        
        with open(guidelines_path, 'r') as f:
            content = f.read()
        
        # If category is specified, optionally filter content (for now, return full content)
        # Future enhancement: could search for category within content
        
        return content
            
    except Exception as e:
        return f"Error reading assessment guidelines: {str(e)}"
