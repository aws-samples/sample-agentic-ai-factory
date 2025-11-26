from decimal import Decimal
import os
from typing import Any
import boto3

CONFIG_TABLE = os.environ.get('TOOLS_CONFIG_TABLE')
dynamodb = boto3.resource('dynamodb')

# Needed because DDB likes to throw decimals in
def parse_decimals(data: Any) -> Any:
    """Recursively converts Decimal instances to int (if whole) or float."""
    if isinstance(data, Decimal):
        return int(data) if data % 1 == 0 else float(data)
    elif isinstance(data, dict):
        return {k: parse_decimals(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [parse_decimals(item) for item in data]
    else:
        return data



def load_config_from_dynamodb():
    if CONFIG_TABLE is None:
        print("Warning: TOOLS_CONFIG_TABLE environment variable not set, returning empty tools list")
        return {'tools': []}
    
    print(f"Loading tools from table: {CONFIG_TABLE}")
    table = dynamodb.Table(CONFIG_TABLE)
    response = table.scan()
    items = response['Items']
    configs = []
    for item in items:
        # Only load agents with state 'active'
        if item.get('state') == 'active':
            configs.append(item['config'])
    print(f"Loaded {len(configs)} active tools")
    print(configs)
    return {'tools': configs}


def create_tool_specs(tools_config):
    return [{
        "toolSpec": {
            "name": tool["name"],
            "description": tool["description"],
            "inputSchema": {"json": parse_decimals(tool["schema"])}
        }
    } for tool in tools_config.get("tools", [])]


def create_tool_desc(tools_config):
    return [
        f"{tool['name']} | {tool['description']}"
        for tool in tools_config.get("tools", [])
    ]