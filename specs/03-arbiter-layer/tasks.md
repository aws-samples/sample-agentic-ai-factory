# Implementation Plan

## Overview

This implementation plan breaks down the arbiter layer build into discrete, manageable tasks. Each task builds incrementally on previous work, with clear objectives and traceability to requirements. The plan follows a logical progression: DynamoDB tables → SQS queues → S3 bucket → Supervisor Agent → Fabricator Agent → Worker Wrapper → seeding → testing → deployment.

## Task List

- [ ] 1. Create DynamoDB tables for arbiter state management
  - Create Orchestration table for conversation history
  - Create Worker State table for parallel task tracking
  - Configure on-demand billing and point-in-time recovery
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 1.1 Create Orchestration table
  - Define partition key (orchestrationId)
  - Configure on-demand billing mode
  - Enable point-in-time recovery
  - Set removal policy for dev environments
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 1.2 Create Worker State table
  - Define partition key (requestId)
  - Configure on-demand billing mode
  - Enable point-in-time recovery
  - Set removal policy for dev environments
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2. Create SQS queues for asynchronous agent invocation
  - Create worker queue with 15-minute visibility timeout
  - Create fabricator queue with 15-minute visibility timeout
  - Configure 7-day message retention
  - Set up dead-letter queues
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2.1 Create worker agent queue
  - Set visibility timeout to 15 minutes
  - Configure message retention period to 7 days
  - Create dead-letter queue for failed messages
  - Set max receive count to 3
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 2.2 Create fabricator agent queue
  - Set visibility timeout to 15 minutes
  - Configure message retention period to 7 days
  - Create dead-letter queue for failed messages
  - Set max receive count to 3
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 3. Create S3 Code Bucket for agent and tool storage
  - Create bucket with environment-specific naming
  - Block all public access
  - Enable S3-managed encryption
  - Set removal policy and auto-delete for dev
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 4. Implement Supervisor Agent Lambda function
  - Create Python Lambda with supervisor/index.py
  - Implement orchestration creation and management
  - Implement agent config loading from DynamoDB
  - Implement Bedrock Converse API integration
  - Implement task delegation to SQS queues
  - Implement workflow tracking and result aggregation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 4.1 Create orchestration management functions
  - Implement create_orchestration() to initialize conversation
  - Implement save_orchestration() to persist to DynamoDB
  - Implement load_orchestration() to retrieve by ID
  - Handle Decimal parsing from DynamoDB
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 4.2 Implement agent configuration loader
  - Create agent_config.py module
  - Implement load_config_from_dynamodb() to scan active agents
  - Implement create_agent_specs() to convert to Bedrock tool specs
  - Implement parse_decimals() for DynamoDB type conversion
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 4.3 Integrate Bedrock Converse API
  - Configure Claude 3.5 Sonnet v2 model
  - Implement system prompt for autonomous behavior
  - Configure inference config (maxTokens: 2048, temperature: 0)
  - Configure tool config with auto tool choice
  - Pass conversation history for multi-turn interactions
  - _Requirements: 1.2, 1.3, 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 4.4 Implement task delegation logic
  - Implement process_agent_call() to send SQS messages
  - Extract tool use from Bedrock responses
  - Build message payload with orchestration context
  - Send messages to agent-specific SQS queues
  - _Requirements: 1.4_

- [ ] 4.5 Implement workflow tracking
  - Implement create_workflow_tracking_record() for parallel tasks
  - Implement update_workflow_tracking() to mark completion
  - Check if all tasks complete and return aggregated results
  - Store task results in data field
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.6 Implement result aggregation
  - Implement update_orchestration_with_results() to format tool results
  - Convert task results to tool result messages
  - Append tool results to conversation
  - Continue orchestration with updated conversation
  - _Requirements: 1.5, 20.4, 20.5_

- [ ] 4.7 Implement event handler
  - Handle task.request events for new orchestrations
  - Handle task.completion events for workflow continuation
  - Extract event details and invoke orchestration
  - Log all events and operations
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 5. Implement Fabricator Agent Lambda function
  - Create Python Lambda with fabricator/index.py
  - Implement Strands Agent with comprehensive system prompt
  - Implement custom tools for S3 upload and DynamoDB storage
  - Implement tool config loading
  - Implement event publishing for completion
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 5.1 Create Fabricator system prompt
  - Implement get_sys_prompt() function
  - Load tool configs from DynamoDB
  - Generate tool descriptions for prompt
  - Define agent generation rules and output format
  - Include Strands tools list and Worker tools list
  - _Requirements: 2.2, 12.1, 12.2, 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 5.2 Implement S3 upload tools
  - Create upload_to_s3() helper function
  - Implement upload_agent_to_s3() tool with @tool decorator
  - Implement upload_tool_to_s3() tool with @tool decorator
  - Upload to agents/ and tools/ folders respectively
  - _Requirements: 2.4, 9.1, 11.2_

- [ ] 5.3 Implement DynamoDB storage tools
  - Implement store_agent_config_dynamo() tool
  - Implement store_tool_config_dynamo() tool
  - Store config with schema, description, action, state
  - Handle JSON parsing if schema is string
  - _Requirements: 2.4, 6.1, 7.1, 11.3_

- [ ] 5.4 Implement tool retrieval
  - Implement get_worker_tool() tool
  - Download tool code from S3 tools/ folder
  - Return tool code as string for inclusion in agents
  - Handle S3 errors gracefully
  - _Requirements: 7.4, 11.4, 19.5_

- [ ] 5.5 Implement completion event publishing
  - Create complete_task() tool with @tool decorator
  - Publish task.completion for orchestration workflows
  - Publish agent.fabricated for direct UI requests
  - Include orchestration ID and agent use ID
  - _Requirements: 2.5, 10.2, 10.3_

- [ ] 5.6 Implement Fabricator agent initialization
  - Configure Bedrock model with 40,000 max tokens
  - Set read timeout to 3600 seconds
  - Initialize Strands Agent with all tools
  - Set system prompt from get_sys_prompt()
  - _Requirements: 2.2, 2.3_

- [ ] 5.7 Implement SQS event handler
  - Implement lambda_handler() for SQS events
  - Parse message body from SQS records
  - Extract agent_input, orchestration_id, agent_use_id, node
  - Invoke process_event() for each message
  - _Requirements: 2.1, 8.3_

- [ ] 5.8 Create tools configuration module
  - Create tools_config.py module
  - Implement load_config_from_dynamodb() for tools
  - Implement create_tool_specs() for Bedrock format
  - Implement create_tool_desc() for prompt generation
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 6. Implement Worker Wrapper Lambda function
  - Create Python Lambda with workerWrapper/index.py
  - Implement agent config loading from DynamoDB
  - Implement code download from S3
  - Implement dynamic module loading and execution
  - Implement result publishing to EventBridge
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.1 Implement configuration loader
  - Implement load_config_from_dynamodb() by agentId
  - Extract filename from config
  - Parse JSON config if stored as string
  - _Requirements: 3.1, 6.2_

- [ ] 6.2 Implement code loader
  - Implement load_file_from_s3_into_tmp() function
  - Download from S3 agents/ folder to /tmp/loaded_module.py
  - Handle S3 download errors with retries
  - _Requirements: 3.2, 9.2_

- [ ] 6.3 Implement dynamic module execution
  - Use importlib.util.spec_from_file_location()
  - Load module from /tmp/loaded_module.py
  - Add module to sys.modules
  - Execute spec.loader.exec_module()
  - Invoke handler(**request) with task parameters
  - _Requirements: 3.3_

- [ ] 6.4 Implement result publishing
  - Implement post_task_complete() function
  - Publish task.completion events to EventBridge
  - Include orchestration ID, agent use ID, node name
  - Include execution results or error messages
  - _Requirements: 3.4, 10.2_

- [ ] 6.5 Implement error handling
  - Wrap handler invocation in try-except
  - Capture exceptions and log with stack trace
  - Return graceful error messages
  - Publish completion event even on errors
  - _Requirements: 3.5, 15.3_

- [ ] 6.6 Implement SQS event handler
  - Implement lambda_handler() for SQS events
  - Parse message body from SQS records
  - Invoke process_event() for each message
  - _Requirements: 3.1, 8.3_

- [ ] 7. Create configuration seeding Lambda
  - Create Python Lambda with seedConfig/index.py
  - Implement CloudFormation custom resource handler
  - Seed fabricator agent configuration
  - Handle Create, Update, Delete events
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 7.1 Implement custom resource handler
  - Import cfnresponse module
  - Handle RequestType (Create, Update, Delete)
  - Send success/failure responses to CloudFormation
  - _Requirements: 14.4, 14.5_

- [ ] 7.2 Implement fabricator agent seeding
  - Create fabricator agent config with schema
  - Set action type to SQS with fabricator queue URL
  - Set state to "active"
  - Set categories to ["built-in", "developer"]
  - Store in Agent Config DynamoDB table
  - _Requirements: 14.2, 14.3_

- [ ] 8. Configure EventBridge rules and targets
  - Create rule for task.request events
  - Create rule for task.completion events
  - Add Supervisor Lambda as target for both rules
  - Configure retry policy (2 retries, 2-hour max age)
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ] 8.1 Create task request rule
  - Define event pattern for source "task.request"
  - Add Supervisor Lambda as target
  - Configure retry attempts and max event age
  - _Requirements: 10.1, 10.5_

- [ ] 8.2 Create task completion rule
  - Define event pattern for source "task.completion"
  - Add Supervisor Lambda as target
  - Configure retry attempts and max event age
  - _Requirements: 10.2, 10.5_

- [ ] 9. Configure IAM roles and permissions
  - Create execution role for Supervisor Lambda
  - Create execution role for Fabricator Lambda
  - Create execution role for Worker Wrapper Lambda
  - Grant least-privilege permissions
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 9.1 Configure Supervisor Lambda role
  - Grant Bedrock InvokeModel permissions
  - Grant SQS SendMessage to worker and fabricator queues
  - Grant DynamoDB read/write to orchestration, worker state, agent config tables
  - Grant EventBridge PutEvents permissions
  - _Requirements: 1.2, 1.3, 1.4, 16.3_

- [ ] 9.2 Configure Fabricator Lambda role
  - Grant Bedrock InvokeModel and InvokeModelWithResponseStream
  - Grant S3 PutObject to agents/ and tools/ folders
  - Grant S3 GetObject to tools/ folder
  - Grant DynamoDB PutItem to agent config and tools config tables
  - Grant EventBridge PutEvents permissions
  - _Requirements: 2.2, 2.4, 11.2, 11.3, 16.3_

- [ ] 9.3 Configure Worker Wrapper Lambda role
  - Grant S3 GetObject to agents/ folder
  - Grant DynamoDB GetItem to agent config table
  - Grant EventBridge PutEvents permissions
  - _Requirements: 3.2, 3.4, 16.3_

- [ ] 10. Set up monitoring and observability
  - Configure CloudWatch log groups with retention
  - Enable structured logging in all Lambda functions
  - Create CloudWatch dashboards
  - Configure CloudWatch alarms
  - Set up SNS topics for alerts
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 10.1 Configure CloudWatch logging
  - Set log retention (7 days dev, 30 days prod)
  - Enable structured JSON logging with orchestration IDs
  - Configure log group permissions
  - _Requirements: 17.1, 17.2_

- [ ] 10.2 Create CloudWatch dashboards
  - Create orchestration dashboard (invocations, duration, errors)
  - Create SQS dashboard (messages sent/received, DLQ depth)
  - Create DynamoDB dashboard (read/write capacity, throttles)
  - Add widgets for key metrics
  - _Requirements: 17.4_

- [ ] 10.3 Configure CloudWatch alarms
  - Create alarm for Lambda error rate > 5%
  - Create alarm for SQS DLQ depth > 0
  - Create alarm for Lambda timeout rate > 1%
  - Create alarm for DynamoDB throttling
  - Configure SNS notifications
  - _Requirements: 17.5_

- [ ] 11. Create CDK stack outputs
  - Output Orchestration table name and ARN
  - Output Worker State table name and ARN
  - Output Worker queue URL and ARN
  - Output Fabricator queue URL and ARN
  - Output Code Bucket name and ARN
  - _Requirements: 4.1, 5.1, 8.1, 9.1_

- [ ] 12. Create Custom Resource for seeding
  - Create Custom Resource construct
  - Link to seeding Lambda function
  - Pass Agent Config table name and queue URLs
  - Add dependencies on tables and queues
  - _Requirements: 14.1, 14.4, 14.5_

- [ ]* 13. Write unit tests for arbiter components
  - Test Supervisor orchestration logic
  - Test agent config loading and parsing
  - Test workflow tracking updates
  - Test Fabricator system prompt generation
  - Test Worker code loading and execution
  - Mock AWS SDK calls
  - _Requirements: All requirements_

- [ ]* 13.1 Test Supervisor Agent
  - Test orchestration creation and management
  - Test agent config loading from DynamoDB
  - Test tool spec generation
  - Test workflow tracking and aggregation
  - Mock Bedrock and SQS calls
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 13.2 Test Fabricator Agent
  - Test system prompt generation
  - Test tool config loading
  - Test S3 upload tools
  - Test DynamoDB storage tools
  - Test event publishing
  - Mock Bedrock, S3, and DynamoDB calls
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 13.3 Test Worker Wrapper
  - Test config loading
  - Test code download from S3
  - Test dynamic module loading
  - Test handler execution
  - Test result publishing
  - Mock S3, DynamoDB, and EventBridge calls
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 14. Perform integration testing
  - Test end-to-end orchestration with multiple agents
  - Test parallel task execution and aggregation
  - Test agent fabrication and immediate invocation
  - Test error handling and retry logic
  - Test EventBridge event processing
  - Validate security controls
  - _Requirements: All requirements_

- [ ]* 14.1 Test end-to-end orchestration
  - Submit task request via EventBridge
  - Verify Supervisor creates orchestration
  - Verify agents are invoked via SQS
  - Verify results are aggregated
  - Verify workflow completes successfully
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 14.2 Test agent fabrication flow
  - Request fabrication via Supervisor
  - Verify Fabricator generates agent code
  - Verify code is uploaded to S3
  - Verify config is stored in DynamoDB
  - Verify new agent can be invoked immediately
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 14.3 Test parallel task execution
  - Submit task requiring multiple agents
  - Verify all agents invoked in parallel
  - Verify workflow tracking created
  - Verify results aggregated when all complete
  - Verify orchestration continues
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 14.4 Test error handling
  - Test Lambda timeout scenarios
  - Test SQS retry logic
  - Test agent execution failures
  - Test DynamoDB operation failures
  - Verify graceful error handling
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 15. Deploy to production
  - Deploy ArbiterStack to production
  - Validate production deployment
  - Configure production monitoring
  - Set up production alerting
  - Document production runbooks
  - _Requirements: All requirements_

- [ ] 15.1 Deploy production infrastructure
  - Deploy DynamoDB tables
  - Deploy SQS queues
  - Deploy S3 Code Bucket
  - Deploy Lambda functions
  - Deploy EventBridge rules
  - Verify all resources created successfully
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 8.1, 9.1_

- [ ] 15.2 Seed production configurations
  - Execute seeding Custom Resource
  - Verify fabricator agent config created
  - Verify agent state is "active"
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 15.3 Validate production deployment
  - Test Supervisor orchestration
  - Test agent fabrication
  - Test worker execution
  - Verify monitoring and logging
  - Check performance metrics
  - _Requirements: All requirements_

- [ ] 15.4 Configure production monitoring
  - Set up production CloudWatch dashboards
  - Configure production alarms with SNS
  - Verify log aggregation
  - Test alert notifications
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 15.5 Create production runbooks
  - Document deployment procedures
  - Create troubleshooting guides
  - Document rollback procedures
  - Create incident response playbooks
  - Document agent fabrication process
  - _Requirements: All requirements_
