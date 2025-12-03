
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

import json
from typing import Any
import boto3
import os
from agent_config import load_config_from_dynamodb, create_agent_specs, parse_decimals
import uuid
import time

MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"

sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')


ORCHESTRATION_TABLE = os.environ.get('ORCHESTRATION_TABLE')
WORKER_STATE_TABLE = os.environ.get('WORKER_STATE_TABLE')

SYSTEM_PROMPT = [{
    "text": """You are the Supervisor Agent responsible for autonomously coordinating and completing workflows on behalf of the user. Your role is to translate user requests into actionable plans, delegate tasks to the most suitable agents, and ensure successful end-to-end delivery — even when all required steps are not known upfront.

Your responsibilities:

1. Interpret & Plan
   - Convert the user’s request into a clear objective and a structured execution plan.
   - If key details are missing, infer reasonable assumptions rather than asking the user.
   - Break work into parallel tasks whenever possible to optimise speed and efficiency.

2. Delegate & Orchestrate
   - Select the most appropriate agents for each task based on their capabilities.
   - Issue multiple agent calls in parallel when tasks are independent.
   - If an agent requires information that the user did not provide, you must generate or infer the required input yourself.

3. Monitor & Adapt
   - Track progress, validate outputs, and handle failure or ambiguity autonomously.
   - If a task returns unclear or incomplete results, refine the task or re-delegate.
   - Adjust the plan as new information emerges—tasks may be iterative or exploratory.

4. Quality & Completion**
   - Ensure final output meets the user’s intent and quality expectations.
   - Compile results, summarise outcomes, and deliver a coherent final response to the user.

Rules of Engagement:
- Do not ask the user follow-up questions after their initial request, unless clarification is absolutely required for safety or correctness.
- Prefer autonomy, initiative, and inference over user re-engagement.
- Use agents as the primary mechanism for action—not yourself.
- Always aim to complete the request in the fewest number of interaction rounds.
- If no agent exists for a required step, propose a workaround or simulated execution.

Your goal is to behave as a highly autonomous supervisory system that can manage uncertainty, discover required tasks on the fly, and drive efficient, agent-based execution to fulfill the user's intent."""
}]


def create_workflow_tracking_record(nodes: list[str]):
    request_id = str(uuid.uuid4())
    if len(nodes) == 0:
        return

    item = {
        "requestId": request_id,
    }

    data = {}

    for node in nodes:
        item[node] = False
        data[node] = None

    item['data'] = data

    table = dynamodb.Table(WORKER_STATE_TABLE)
    table.put_item(
        TableName=WORKER_STATE_TABLE,
        Item=item
    )

    return request_id


def update_workflow_tracking(node: str, request_id: str, data: Any) -> bool:
    table = dynamodb.Table(WORKER_STATE_TABLE)

    response = table.update_item(
        Key={
            "requestId": request_id
        },
        UpdateExpression="SET #node = :completed, #data.#node = :node_data",
        ExpressionAttributeNames={
            "#node": node,
            "#data": "data"
        },
        ExpressionAttributeValues={
            ":completed": True,
            ":node_data": data
        },
        ReturnValues="ALL_NEW"
    )

    updated_item = response.get("Attributes", {})
    all_completed = True

    for key, value in updated_item.items():
        if key not in ["requestId", "data"] and value is False:
            all_completed = False
            break

    return all_completed, response


def create_orchestration(conversation):
    instance = int(time.time())

    item = {
        'orchestrationId': str(uuid.uuid4()),
        'instance': instance,
        'conversation': conversation,
    }
    return item


def save_orchestration(orchestration):
    table = dynamodb.Table(ORCHESTRATION_TABLE)
    table.put_item(
        TableName=ORCHESTRATION_TABLE,
        Item=orchestration
    )


def load_orchestration(orchestration_id=None):
    if orchestration_id is None:
        return None
    else:
        table = dynamodb.Table(ORCHESTRATION_TABLE)
        response = table.get_item(Key={'orchestrationId': orchestration_id})
        return response['Item']


def process_agent_call(agents_config, orchestration, agent_name, agent_input, agent_use_id):
    agent_config = next(
        (agent for agent in agents_config['agents'] if agent['name'] == agent_name), None)

    if agent_config is None:
        print(f"Agent {agent_name} not found in configuration.")
        return

    action = agent_config["action"]
    action_type = action["type"]
    target = action["target"]
    payload = {
        "agent_input": agent_input,
        "orchestration_id": orchestration["orchestrationId"],
        "agent_use_id": agent_use_id,
        "node": agent_name
    }

    print(f"Sending payload to {action_type} queue: {target}")
    print(f"Payload: {json.dumps(payload, default=str)}")

    # Publish to EventBridge for chatter visibility
    event_bus_name = os.environ.get('EVENT_BUS_NAME')
    if event_bus_name:
        try:
            events_client = boto3.client('events')
            events_client.put_events(
                Entries=[
                    {
                        'Source': 'supervisor',
                        'DetailType': 'chatter',
                        'Detail': json.dumps({
                            'action': 'agent_call',
                            'agent_name': agent_name,
                            'agent_input': agent_input,
                            'orchestration_id': orchestration["orchestrationId"],
                            'agent_use_id': agent_use_id,
                            'target': target,
                            'timestamp': time.time()
                        }, default=str),
                        'EventBusName': event_bus_name
                    }
                ]
            )
            print(f"Published supervisor message to EventBridge")
        except Exception as e:
            print(f"Error publishing to EventBridge: {e}")

    if action_type == "sqs":
        response = sqs.send_message(
            QueueUrl=target,
            MessageBody=json.dumps(payload)
        )
        print(f"SQS send_message response: {json.dumps(response, default=str)}")
        return response


def invoke_agents_from_conversation(orchestration, agents_config):
    agent_ids = []
    output_message = orchestration["conversation"][-1]
    text_response = None

    print(f'Invoking agents from message: {json.dumps(output_message, default=str)}')
    print(f'Message content: {output_message.get("content", [])}')

    for content in output_message.get('content', []):
        print(f'Processing content item: {json.dumps(content, default=str)}')
        if 'toolUse' in content:
            tool_use = content['toolUse']
            print(f'Found toolUse: {json.dumps(tool_use, default=str)}')
            agent_ids.append(tool_use['name'])
            result = process_agent_call(
                agents_config,
                orchestration,
                tool_use['name'],
                tool_use['input'],
                tool_use['toolUseId']
            )
            print(f'Agent call result: {result}')
        elif 'text' in content:
            text_response = content['text']
            print(f"Text response from model: {text_response}")

    print(f'Total agents invoked: {len(agent_ids)}')
    print(f'Agent IDs: {agent_ids}')

    if len(agent_ids) > 0:
        request_id = create_workflow_tracking_record(agent_ids)
        orchestration["request_id"] = request_id
        print(f'Created workflow tracking with request_id: {request_id}')
    else:
        print('No agents were invoked - model may have responded with text only')
        # Publish supervisor feedback to EventBridge for chatter visibility
        event_bus_name = os.environ.get('EVENT_BUS_NAME')
        if event_bus_name and text_response:
            try:
                events_client = boto3.client('events')
                events_client.put_events(
                    Entries=[
                        {
                            'Source': 'supervisor',
                            'DetailType': 'supervisor.feedback',
                            'Detail': json.dumps({
                                'action': 'direct_response',
                                'message': text_response,
                                'orchestration_id': orchestration["orchestrationId"],
                                'timestamp': time.time()
                            }, default=str),
                            'EventBusName': event_bus_name
                        }
                    ]
                )
                print(f"Published supervisor feedback to EventBridge")
            except Exception as e:
                print(f"Error publishing supervisor feedback to EventBridge: {e}")


def update_orchestration_with_results(results, orchestration):
    tool_results = []
    data_to_save = results['Attributes']['data']

    for key in data_to_save:
        data = data_to_save[key]
        tool_result = {
            "toolResult": {
                "toolUseId": data['agent_use_id'],
                "content": [{"json": {'data': data['data']}}],
            }
        }
        tool_results.append(tool_result)

    orchestration["conversation"].append({
        "role": "user",
        "content": tool_results
    })


def orchestrate(initial_message=None, orchestration=None):
    if orchestration is None:
        orchestration = create_orchestration(conversation=[{
                "role": "user",
                "content": [{"text": initial_message}],
            }])

    agent_configs = load_config_from_dynamodb()
    print(f"Agent configs loaded: {json.dumps(agent_configs, default=str)}")
    
    agent_specs = create_agent_specs(agent_configs)
    print(f"Agent specs created: {json.dumps(agent_specs, default=str)}")

    print(f"Calling Bedrock with conversation: {json.dumps(orchestration['conversation'], default=str)}")

    response = bedrock.converse(
        modelId=MODEL_ID,
        messages=orchestration["conversation"],
        system=SYSTEM_PROMPT,
        inferenceConfig={
            "maxTokens": 2048,
            "temperature": 0,
        },
        toolConfig={
            "tools": agent_specs,
            # Allow model to automatically select tools
            "toolChoice": {"auto": {}}
        }
    )

    print(f"Bedrock response: {json.dumps(response, default=str)}")
    print(f"Response output message: {json.dumps(response['output']['message'], default=str)}")

    orchestration["conversation"].append(response['output']['message'])

    invoke_agents_from_conversation(
        orchestration, agent_configs
    )

    save_orchestration(orchestration=orchestration)



def handler(event, lambda_context):
    print(f"Received event: {json.dumps(event)}")
    
    # Check if this is a task completion event from a worker agent
    if 'source' in event and event['source'] == 'task.completion':
        orchestration_id = event['detail']['orchestration_id']
        try:
            orchestration = load_orchestration(orchestration_id)
        except Exception as e:
            print(f"Error loading orchestration: {e}")
            return
        request_id = orchestration['request_id']
        print(f"request id: {request_id}")
        node = event['detail']['node']
        all_completed, results = update_workflow_tracking(
            node, request_id, event['detail'])

        if (all_completed):
            update_orchestration_with_results(
                results=results, orchestration=orchestration)
            orchestrate(orchestration=parse_decimals(orchestration))
    
    # Check if this is a new task request
    elif 'source' in event and event['source'] == 'task.request':
        print("Processing new task request")
        task_details = event['detail'].get('task', '')
        if task_details:
            orchestrate(initial_message=task_details)
        else:
            print("No task details found in event")
    
    # Fallback for other event types with detail
    elif 'detail' in event:
        print("Processing generic detail event")
        orchestrate(initial_message=json.dumps(event["detail"]))


if __name__ == "__main__":
    handler({
        "source": "task.request",
        "DetailType": "System-Task",
        "detail": "{\"orderId\": \"12345\", \"customerId\": \"C-1234\", \"items\": [\"cheesecake\"]}",
        "EventBusName": "orchestration-bus"
    }, {})