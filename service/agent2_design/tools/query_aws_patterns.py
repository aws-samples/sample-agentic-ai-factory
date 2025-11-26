import requests
import json


def read_aws_documentation(url: str) -> str:
    """
    Read AWS documentation from a specific URL.
    
    Args:
        url: AWS documentation URL to read
        
    Returns:
        Documentation content in markdown format
    """
    try:
        # AWS Knowledge MCP Server endpoint
        mcp_url = "https://knowledge-mcp.global.api.aws"
        
        # Prepare JSON-RPC request
        mcp_payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "aws___read_documentation",
                "arguments": {
                    "url": url
                }
            }
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        # Make JSON-RPC request
        response = requests.post(
            mcp_url,
            headers=headers,
            json=mcp_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            mcp_result = response.json()
            
            # Parse JSON-RPC response
            if isinstance(mcp_result, dict) and 'result' in mcp_result:
                return json.dumps({
                    'url': url,
                    'status': 'success',
                    'content': mcp_result['result'],
                    'source': 'AWS Knowledge MCP Server'
                }, indent=2)
            else:
                return json.dumps({
                    'url': url,
                    'status': 'error',
                    'error': 'Invalid JSON-RPC response format',
                    'content': None
                }, indent=2)
            
        else:
            return json.dumps({
                'url': url,
                'status': 'error',
                'error': f"HTTP {response.status_code}: {response.text}",
                'content': None
            }, indent=2)
            
    except requests.exceptions.Timeout:
        return json.dumps({
            'url': url,
            'status': 'error',
            'error': 'Request timeout - AWS Knowledge MCP server did not respond',
            'content': None
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            'url': url,
            'status': 'error',
            'error': f"Error reading AWS documentation: {str(e)}",
            'content': None
        }, indent=2)


def search_aws_patterns(query: str) -> str:
    """
    Search AWS knowledge MCP server for solution patterns and architectural guidance.
    
    Args:
        query: Search query for AWS patterns, architectures, or best practices
        
    Returns:
        Relevant AWS documentation and patterns
    """
    try:
        # AWS Knowledge MCP Server endpoint
        mcp_url = "https://knowledge-mcp.global.api.aws"
        
        # Prepare JSON-RPC request
        mcp_payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "aws___search_documentation",
                "arguments": {
                    "search_phrase": query
                }
            }
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        # Make JSON-RPC request
        response = requests.post(
            mcp_url,
            headers=headers,
            json=mcp_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            mcp_result = response.json()
            
            # Parse JSON-RPC response
            if isinstance(mcp_result, dict) and 'result' in mcp_result:
                return json.dumps({
                    'query': query,
                    'status': 'success',
                    'results': mcp_result['result'],
                    'source': 'AWS Knowledge MCP Server'
                }, indent=2)
            else:
                return json.dumps({
                    'query': query,
                    'status': 'error',
                    'error': 'Invalid JSON-RPC response format',
                    'results': []
                }, indent=2)
            
        else:
            return json.dumps({
                'query': query,
                'status': 'error',
                'error': f"HTTP {response.status_code}: {response.text}",
                'results': []
            }, indent=2)
            
    except requests.exceptions.Timeout:
        return json.dumps({
            'query': query,
            'status': 'error',
            'error': 'Request timeout - AWS Knowledge MCP server did not respond',
            'results': []
        }, indent=2)
        
    except Exception as e:
        return json.dumps({
            'query': query,
            'status': 'error',
            'error': f"Error querying AWS patterns: {str(e)}",
            'results': []
        }, indent=2)
