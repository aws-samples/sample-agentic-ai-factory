from decimal import Decimal
import os
from typing import Any
import boto3

CONFIG_TABLE = os.environ.get('AGENT_CONFIG_TABLE')
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
    print(CONFIG_TABLE)
    table = dynamodb.Table(CONFIG_TABLE)
    response = table.scan()
    items = response['Items']
    configs = []
    for item in items:
        # Only load agents with state 'active'
        if item.get('state') == 'active':
            configs.append(item['config'])
    print(f"Loaded {len(configs)} active agents")
    print(configs)
    return {'agents': configs}


def create_agent_specs(agents_config):
    return [{
        "toolSpec": {
            "name": agent["name"],
            "description": agent["description"],
            "inputSchema": {"json": parse_decimals(agent["schema"])}
        }
    } for agent in agents_config["agents"]]