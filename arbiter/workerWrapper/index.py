
import json
import os
import boto3
import importlib.util
import sys

CONFIG_TABLE = os.environ.get('AGENT_CONFIG_TABLE')
dynamodb = boto3.resource('dynamodb')

def load_file_from_s3_into_tmp(bucket_name, file_name):
    import boto3
    s3 = boto3.client('s3')
    s3.download_file(bucket_name, f"agents/{file_name}", "/tmp/loaded_module.py")

def load_config_from_dynamodb(agent_name: str):
    print(CONFIG_TABLE)
    table = dynamodb.Table(CONFIG_TABLE)
    response = table.get_item(
        Key={
            'agentId': agent_name
        }
    )
    print(response)
    return response['Item']

def post_task_complete(response, agent_use_id, tool_name, orchestration_id):
    client = boto3.client('events')
    
    COMPLETION_BUS_NAME = os.environ.get('COMPLETION_BUS_NAME')
    event = {
        'Source': 'task.completion',
        'DetailType': 'task.completion',
        'EventBusName': COMPLETION_BUS_NAME,
        'Detail': json.dumps({
            'orchestration_id': orchestration_id,
            'data': f"Task completed, details: {response}",
            'agent_use_id': agent_use_id,
            'node': agent_name
        })
    }
    print(f"posting event, {json.dumps(event)}")
    response = client.put_events(
        Entries=[
            event
        ]
    )
    print(f"event posted: {response}")
    return f"event posted: {event}"


def process_event(event, context):
    print("processing...")
    orchestration_id = event["orchestration_id"]
    agent_use_id = event["agent_use_id"]
    request = event["agent_input"]
    agent_name = event['node']

    agent = load_config_from_dynamodb(agent_name)
    config = tool['config']

    if isinstance(config, str):
        config = json.loads(config)

    fileName = config['filename']
    print("loading file from s3...")
    load_file_from_s3_into_tmp(os.environ["AGENT_BUCKET_NAME"], fileName)

    print("importing module...")
    spec = importlib.util.spec_from_file_location("module.name", "/tmp/loaded_module.py")
    foo = importlib.util.module_from_spec(spec)
    sys.modules["module.name"] = foo
    spec.loader.exec_module(foo)
    try:
        print("attempting to use module")
        response = foo.handler(**request)
        print(f"response: {response}")
    except Exception as e:
        print(f"error running module: {e}")
        response = "The task could not be completed, this agent has issues, please ignore for now."

    post_task_complete(response, agent_use_id, agent_name, orchestration_id)


def lambda_handler(event, context):
    print(f"processing event {event}")
    for record in event['Records']:
        message_body = json.loads(record['body'])
        process_event(message_body, context)

if __name__ == "__main__":
    lambda_handler(
        # Grab a record from your lambda and invoke, configuration will vary drastically
        {'Records': []}        ,{}
    )