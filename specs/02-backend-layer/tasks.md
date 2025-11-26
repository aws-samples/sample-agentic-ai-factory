# Implementation Plan

## Overview

This implementation plan breaks down the backend layer build into discrete, manageable tasks. Each task builds incrementally on previous work, with clear objectives and traceability to requirements. The plan follows a logical progression: CDK infrastructure setup → authentication → GraphQL API → Lambda resolvers → event handlers → frontend hosting → testing → deployment.

## Task List

- [ ] 1. Set up CDK project infrastructure and configuration
  - Initialize CDK TypeScript project with proper structure
  - Configure tsconfig.json and package.json with dependencies
  - Set up build scripts for TypeScript and Lambda bundling
  - Create environment configuration files (.env.example)
  - _Requirements: 21.1, 21.2_

- [ ] 1.1 Create CDK app entry point
  - Create bin/app.ts with CDK app initialization
  - Configure environment variables and context
  - Set up stack instantiation order
  - Add stack dependencies and cross-stack references
  - _Requirements: 21.1, 21.2_

- [ ] 1.2 Configure TypeScript and build tools
  - Set up tsconfig.json for CDK and Lambda
  - Configure esbuild for Lambda function bundling
  - Add build scripts to package.json
  - Set up watch mode for development
  - _Requirements: 21.1_

- [ ] 1.3 Install CDK dependencies
  - Install aws-cdk-lib and constructs
  - Install AppSync alpha construct
  - Install Lambda Python alpha construct
  - Install AWS SDK v3 clients
  - Install development dependencies (TypeScript, Jest, ESLint)
  - _Requirements: 21.1_

- [ ] 2. Implement Cognito authentication stack
  - Create User Pool with email sign-in
  - Configure password policies and MFA
  - Create user groups for RBAC
  - Create User Pool Client with OAuth configuration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.1 Create Cognito User Pool
  - Define User Pool with email sign-in aliases
  - Configure auto-verify for email
  - Set standard attributes (email, givenName, familyName)
  - Add custom attributes (role, organization)
  - Configure password policy (min 8 chars, mixed case, numbers, symbols)
  - _Requirements: 2.1, 2.4_

- [ ] 2.2 Create user groups for RBAC
  - Create admin group with full access description
  - Create project_manager group
  - Create architect group
  - Create developer group
  - _Requirements: 2.2_

- [ ] 2.3 Create User Pool Client
  - Configure client with no secret (public client)
  - Enable SRP and password auth flows
  - Configure OAuth with authorization code and implicit grants
  - Set token validity (1h access, 1h ID, 30d refresh)
  - Add OAuth scopes (email, openid, profile)
  - _Requirements: 2.3_

- [ ] 2.4 Create admin user seeding Lambda
  - Create Python Lambda for custom resource
  - Implement AdminCreateUser with environment variables
  - Set permanent password with AdminSetUserPassword
  - Add user to admin group
  - Handle idempotency for stack updates
  - _Requirements: 18.3_

- [ ] 2.5 Create organizations seeding Lambda
  - Create Python Lambda for custom resource
  - Seed default organizations to DynamoDB
  - Handle idempotency for stack updates
  - _Requirements: 18.2_

- [ ] 3. Create DynamoDB tables for backend data
  - Create Projects table with GSI
  - Create Conversations table
  - Create Agent Status table
  - Create Organizations table
  - Create Agent Config table
  - Create Tools Config table
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 6.1, 9.5, 10.1, 11.1_

- [ ] 3.1 Create Projects table
  - Define partition key (id)
  - Add GSI for organization queries (organization, createdAt)
  - Enable DynamoDB Streams (NEW_AND_OLD_IMAGES)
  - Configure on-demand billing
  - Enable point-in-time recovery
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.2 Create Conversations table
  - Define partition key (projectId) and sort key (timestamp)
  - Configure on-demand billing
  - Enable point-in-time recovery
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3.3 Create Agent Status table
  - Define partition key (projectId) and sort key (agentId)
  - Configure on-demand billing
  - Enable point-in-time recovery
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3.4 Create Organizations table
  - Define partition key (orgId)
  - Configure on-demand billing
  - Enable point-in-time recovery
  - _Requirements: 9.5, 18.2_

- [ ] 3.5 Create Agent Config table
  - Define partition key (agentId)
  - Configure on-demand billing
  - Enable point-in-time recovery
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 3.6 Create Tools Config table
  - Define partition key (toolId)
  - Configure on-demand billing
  - Enable point-in-time recovery
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 4. Create EventBridge event bus for agent coordination
  - Create event bus with environment-specific name
  - Configure event archive for replay capability
  - Set up CloudWatch logging for events
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5. Create GraphQL schema definition
  - Define Query type with all query operations
  - Define Mutation type with all mutation operations
  - Define Subscription type with real-time subscriptions
  - Define all GraphQL types (Project, AgentStatus, ConversationMessage, etc.)
  - Define input types for mutations
  - Define enums for status values
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 6. Create AWS AppSync GraphQL API
  - Create AppSync API with schema file
  - Configure Cognito User Pool authentication
  - Add IAM authentication as additional mode
  - Enable X-Ray tracing
  - Configure CloudWatch logging with field-level detail
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 7. Implement Project Management Lambda resolver
  - Create project-resolver.ts with handler
  - Implement createProject mutation logic
  - Implement updateProject mutation logic
  - Implement getProject query logic
  - Implement listProjects query with filtering and pagination
  - Add Cognito user enrichment (AdminGetUser)
  - Publish project lifecycle events to EventBridge
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7.1 Implement createProject logic
  - Generate unique project ID
  - Extract owner from Cognito identity
  - Store project in DynamoDB with timestamps
  - Initialize progress tracking
  - Return created project
  - _Requirements: 3.1_

- [ ] 7.2 Implement updateProject logic
  - Validate project ownership or admin role
  - Update project fields in DynamoDB
  - Update timestamps
  - Return updated project
  - _Requirements: 3.2, 3.5_

- [ ] 7.3 Implement getProject logic
  - Retrieve project from DynamoDB
  - Validate access permissions
  - Return project with all fields
  - _Requirements: 3.2, 3.5_

- [ ] 7.4 Implement listProjects logic
  - Query projects table with optional filters
  - Support pagination with nextToken
  - Filter by status, owner, date range
  - Return project connection with items and nextToken
  - _Requirements: 3.2, 3.5_

- [ ] 8. Implement Conversation Management Lambda resolver
  - Create conversation-resolver.ts with handler
  - Implement sendMessage mutation logic
  - Implement sendMessageToAgent mutation logic
  - Implement getConversationHistory query logic
  - Implement publishConversationMessage mutation (IAM auth)
  - Publish EventBridge events for agent messages
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8.1 Implement sendMessage logic
  - Generate message ID and timestamp
  - Store message in Conversations table
  - Return message with confirmation
  - _Requirements: 4.1_

- [ ] 8.2 Implement sendMessageToAgent logic
  - Store user message in Conversations table
  - Publish "message.sent_to_agent" event to EventBridge
  - Return message with correlation ID
  - _Requirements: 4.2_

- [ ] 8.3 Implement getConversationHistory logic
  - Query Conversations table by projectId
  - Sort by timestamp descending
  - Support pagination
  - Return message array
  - _Requirements: 4.4_

- [ ] 8.4 Implement publishConversationMessage logic
  - Store agent response in Conversations table
  - Trigger GraphQL subscription update
  - Return message confirmation
  - _Requirements: 4.3, 4.5_

- [ ] 9. Implement Agent Status Lambda resolver
  - Create agent-resolver.ts with handler
  - Implement getAgentStatus query logic
  - Implement updateAgentStatus mutation logic
  - Trigger subscription updates on status changes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9.1 Implement getAgentStatus logic
  - Query Agent Status table by projectId and agentId
  - Return current status with all fields
  - _Requirements: 6.5_

- [ ] 9.2 Implement updateAgentStatus logic
  - Update status in Agent Status table
  - Update progress percentage and current task
  - Store error messages if status is ERROR
  - Trigger subscription update
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Implement Document Upload Lambda resolver
  - Create document-upload-resolver.ts with handler
  - Implement generateDocumentUploadUrl mutation logic
  - Generate pre-signed S3 URLs with 15-minute expiration
  - Use session-scoped S3 paths
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Implement Agent Config Lambda resolver
  - Create agent-config-resolver.ts with handler
  - Implement listAgentConfigs query logic
  - Implement getAgentConfig query logic
  - Implement createAgentConfig mutation logic
  - Implement updateAgentConfig mutation logic
  - Implement deleteAgentConfig mutation logic
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Implement Tool Config Lambda resolver
  - Create tool-config-resolver.ts with handler
  - Implement listToolConfigs query logic
  - Implement getToolConfig query logic
  - Implement createToolConfig mutation logic
  - Implement updateToolConfig mutation logic
  - Implement deleteToolConfig mutation logic
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 13. Implement Fabricator Request Lambda resolver
  - Create fabricator-request-resolver.ts with handler
  - Implement requestAgentCreation mutation logic
  - Send messages to SQS fabricator queue
  - Return request ID and confirmation
  - _Requirements: 12.1, 12.2_

- [ ] 14. Implement Task Runner Lambda resolver
  - Create task-runner-resolver.ts with handler
  - Implement submitTask mutation logic
  - Publish "task.request" events to EventBridge
  - Return orchestration ID and confirmation
  - _Requirements: 13.1_

- [ ] 15. Implement User Management Lambda resolver
  - Create user-management-resolver.ts with handler
  - Implement listUsers query logic (Cognito ListUsers)
  - Implement getUser query logic (Cognito AdminGetUser)
  - Implement getCurrentUserProfile query logic
  - Implement assignUserRole mutation logic (AdminAddUserToGroup)
  - Implement removeUserRole mutation logic (AdminRemoveUserFromGroup)
  - Implement listAvailableRoles query logic
  - Implement listOrganizations query logic
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 16. Implement Agent Message Handler Lambda
  - Create agent-message-handler.ts with handler
  - Subscribe to EventBridge "message.sent_to_agent" events
  - Retrieve agent config from SSM Parameter Store
  - Invoke Bedrock AgentCore Runtime InvokeAgent API
  - Store agent responses in Conversations table
  - Publish GraphQL mutations for subscription updates
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 16.1 Implement SSM parameter retrieval
  - Get agent configuration from SSM
  - Parse AgentCore Runtime ARN
  - Extract region and configuration
  - _Requirements: 5.2_

- [ ] 16.2 Implement AgentCore invocation
  - Build InvokeAgent request with session ID
  - Call Bedrock AgentCore Runtime API
  - Handle streaming responses
  - Parse agent output
  - _Requirements: 5.3_

- [ ] 16.3 Implement response storage
  - Store agent response in Conversations table
  - Set messageType to AGENT_RESPONSE
  - Include correlation ID for traceability
  - _Requirements: 5.4_

- [ ] 16.4 Implement subscription publishing
  - Call AppSync GraphQL API with IAM auth
  - Publish publishConversationMessage mutation
  - Trigger real-time subscription updates
  - _Requirements: 5.5_

- [ ] 17. Implement Project Progress Updater Lambda
  - Create project-progress-updater.ts with handler
  - Subscribe to EventBridge progress events
  - Update Projects table with new progress percentages
  - Calculate overall progress from dimensions/sections
  - _Requirements: 8.4, 15.3, 16.3_

- [ ] 18. Implement Assessment Completion Notifier Lambda
  - Create assessment-completion-notifier.ts with handler
  - Subscribe to EventBridge "assessment.completed" events
  - Publish GraphQL subscription updates
  - Trigger onAssessmentCompleted subscription
  - _Requirements: 8.1, 15.4, 15.5_

- [ ] 19. Implement Design Progress Notifier Lambda
  - Create design-progress-notifier.ts with handler
  - Subscribe to EventBridge "design.progress.updated" events
  - Publish GraphQL subscription updates
  - Trigger onDesignProgress subscription
  - _Requirements: 8.2, 16.2, 16.4_

- [ ] 20. Implement Assessment Progress Resolver Lambda
  - Create assessment-progress-resolver.ts with handler
  - Implement getAssessmentProgress query logic
  - Query Session Memory table from Services Stack
  - Return dimension-specific completion percentages
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 21. Implement Report Download Resolver Lambda
  - Create generate-report-url.ts with handler
  - Implement generateReportDownloadUrl query logic
  - Check S3 for report existence
  - Generate pre-signed URLs with 1-hour expiration
  - Enforce project-based access control
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 22. Create AppSync data sources and resolvers
  - Create DynamoDB data sources for all tables
  - Create Lambda data sources for all resolver functions
  - Create resolvers for all queries
  - Create resolvers for all mutations
  - Configure subscription resolvers
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 22.1 Create DynamoDB data sources
  - Add Projects table data source
  - Add Conversations table data source
  - Add Agent Status table data source
  - Grant read/write permissions
  - _Requirements: 1.2_

- [ ] 22.2 Create Lambda data sources
  - Add data source for each Lambda resolver
  - Configure request/response mapping templates
  - Use lambdaRequest() and lambdaResult() templates
  - _Requirements: 1.2_

- [ ] 22.3 Create query resolvers
  - Map getProject to Project Lambda data source
  - Map listProjects to Project Lambda data source
  - Map getAgentStatus to Agent Lambda data source
  - Map getConversationHistory to Conversation Lambda data source
  - Map all other queries to respective data sources
  - _Requirements: 1.2_

- [ ] 22.4 Create mutation resolvers
  - Map createProject to Project Lambda data source
  - Map updateProject to Project Lambda data source
  - Map sendMessageToAgent to Conversation Lambda data source
  - Map all other mutations to respective data sources
  - _Requirements: 1.3_

- [ ] 22.5 Configure subscription resolvers
  - Configure onAgentStatusUpdate subscription
  - Configure onConversationMessage subscription
  - Configure onProjectProgress subscription
  - Configure onAssessmentCompleted subscription
  - Configure onDesignProgress subscription
  - _Requirements: 1.4_

- [ ] 23. Create EventBridge rules and targets
  - Create rule for "message.sent_to_agent" events
  - Create rule for "assessment.completed" events
  - Create rule for progress update events
  - Create rule for design progress events
  - Add Lambda targets with retry configuration
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 23.1 Create message routing rule
  - Define event pattern for "message.sent_to_agent"
  - Add Agent Message Handler as target
  - Configure 2 retries with 2-hour max age
  - _Requirements: 8.2, 8.5_

- [ ] 23.2 Create assessment completion rule
  - Define event pattern for "assessment.completed"
  - Add Assessment Completion Notifier as target
  - Configure retry policy
  - _Requirements: 8.1, 8.5_

- [ ] 23.3 Create progress update rule
  - Define event pattern for progress events
  - Add Project Progress Updater as target
  - Configure retry policy
  - _Requirements: 8.3, 8.5_

- [ ] 23.4 Create design progress rule
  - Define event pattern for "design.progress.updated"
  - Add Design Progress Notifier as target
  - Configure retry policy
  - _Requirements: 8.2, 8.5_

- [ ] 24. Implement Frontend Hosting Stack
  - Create S3 bucket for frontend build files
  - Create CloudFront distribution with OAI
  - Configure cache behaviors for S3 and AppSync
  - Set up custom error responses for SPA routing
  - Deploy frontend build files
  - Generate aws-exports.json configuration
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 24.1 Create S3 bucket
  - Configure bucket with versioning
  - Block all public access
  - Enable S3-managed encryption
  - Set removal policy for dev environments
  - _Requirements: 14.1_

- [ ] 24.2 Create CloudFront distribution
  - Create Origin Access Identity
  - Configure S3 origin with OAI
  - Configure AppSync origin for API proxy
  - Set default cache behavior for S3
  - Set API cache behavior for /api/* path
  - Configure custom error responses (404/403 → index.html)
  - _Requirements: 14.2, 14.3, 14.5_

- [ ] 24.3 Deploy frontend build
  - Create BucketDeployment construct
  - Deploy from ../frontend/build directory
  - Generate aws-exports.json with AppSync and Cognito config
  - Invalidate CloudFront cache on deployment
  - _Requirements: 14.3_

- [ ] 25. Implement Arbiter Stack for multi-agent orchestration
  - Create Orchestration and Worker State tables
  - Create Supervisor Agent Lambda
  - Create Worker Agent Wrapper Lambda
  - Create Fabricator Agent Lambda
  - Create SQS queues for worker and fabricator
  - Create Code Bucket for dynamic agent code
  - Seed agent configurations
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 25.1 Create orchestration tables
  - Create Orchestration table with orchestrationId PK
  - Create Worker State table with requestId PK
  - Configure on-demand billing
  - _Requirements: 13.2_

- [ ] 25.2 Create Supervisor Agent Lambda
  - Implement Python Lambda for task orchestration
  - Subscribe to task.request and task.completion events
  - Store orchestration state in DynamoDB
  - Send messages to worker queue
  - _Requirements: 13.1, 13.2_

- [ ] 25.3 Create Worker Agent Wrapper Lambda
  - Implement Python Lambda for worker execution
  - Subscribe to SQS worker queue
  - Load agent code from S3
  - Invoke Bedrock models for cognition
  - Publish completion events
  - _Requirements: 13.4_

- [ ] 25.4 Create Fabricator Agent Lambda
  - Implement Python Lambda for agent creation
  - Subscribe to SQS fabricator queue
  - Generate agent code based on specifications
  - Store code in S3 Code Bucket
  - Update Agent Config table
  - _Requirements: 12.3, 12.4, 12.5_

- [ ] 25.5 Create SQS queues
  - Create worker queue with 15-minute visibility timeout
  - Create fabricator queue with 15-minute visibility timeout
  - Configure 7-day message retention
  - _Requirements: 12.2, 13.4_

- [ ] 25.6 Create Code Bucket
  - Create S3 bucket for agent code storage
  - Block public access
  - Grant read to worker wrapper
  - Grant write to fabricator
  - _Requirements: 12.4_

- [ ] 25.7 Seed agent configurations
  - Create Python Lambda for custom resource
  - Seed default agent configs to Agent Config table
  - Include queue URLs in configuration
  - Handle idempotency
  - _Requirements: 18.4_

- [ ] 26. Configure IAM roles and permissions
  - Create execution roles for all Lambda functions
  - Grant DynamoDB permissions (least-privilege)
  - Grant S3 permissions (resource-level)
  - Grant EventBridge permissions
  - Grant Cognito permissions for user management
  - Grant Bedrock permissions for agent invocation
  - Grant SSM permissions for parameter access
  - _Requirements: 19.2, 19.3_

- [ ] 27. Set up monitoring and observability
  - Configure CloudWatch log groups with retention
  - Enable X-Ray tracing for AppSync and Lambda
  - Create CloudWatch dashboards
  - Configure CloudWatch alarms
  - Set up SNS topics for alerts
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 27.1 Configure CloudWatch logging
  - Set log retention (7 days dev, 30 days prod)
  - Enable structured JSON logging
  - Configure log group permissions
  - _Requirements: 20.1_

- [ ] 27.2 Enable X-Ray tracing
  - Enable for AppSync API
  - Enable for all Lambda functions
  - Configure sampling rules
  - _Requirements: 20.2_

- [ ] 27.3 Create CloudWatch dashboards
  - Create API health dashboard
  - Create Lambda performance dashboard
  - Create database health dashboard
  - Add widgets for key metrics
  - _Requirements: 20.4_

- [ ] 27.4 Configure CloudWatch alarms
  - Create alarm for API error rate > 5%
  - Create alarm for Lambda error rate > 1%
  - Create alarm for DynamoDB throttling
  - Create alarm for Lambda timeouts
  - Configure SNS notifications
  - _Requirements: 20.5_

- [ ] 28. Create CDK stack outputs
  - Output GraphQL API URL
  - Output GraphQL API ID
  - Output User Pool ID
  - Output User Pool Client ID
  - Output EventBridge Event Bus Name
  - Output CloudFront Distribution URL
  - Export values for cross-stack references
  - _Requirements: 21.2, 21.4_

- [ ]* 29. Write unit tests for Lambda resolvers
  - Test project resolver functions
  - Test conversation resolver functions
  - Test agent resolver functions
  - Test user management functions
  - Test event handler functions
  - Mock AWS SDK calls
  - Achieve 80% code coverage
  - _Requirements: All resolver requirements_

- [ ]* 30. Perform integration testing
  - Test end-to-end GraphQL operations
  - Test real-time subscription delivery
  - Test EventBridge event processing
  - Test Cognito authentication flows
  - Test cross-stack integration
  - Validate security controls
  - _Requirements: All requirements_

- [ ] 31. Deploy to production
  - Deploy all CDK stacks to production
  - Validate production deployment
  - Configure production monitoring
  - Set up production alerting
  - Document production runbooks
  - _Requirements: 21.3, 21.4, 21.5_

- [ ] 31.1 Deploy production infrastructure
  - Deploy KnowledgeBaseStack
  - Deploy ServicesStack
  - Deploy BackendStack
  - Deploy ArbiterStack
  - Deploy FrontendStack
  - Verify all resources created successfully
  - _Requirements: 21.3_

- [ ] 31.2 Validate production deployment
  - Test GraphQL API endpoints
  - Test authentication flows
  - Test real-time subscriptions
  - Verify monitoring and logging
  - Check performance metrics
  - _Requirements: 21.4_

- [ ] 31.3 Configure production monitoring
  - Set up production CloudWatch dashboards
  - Configure production alarms with SNS
  - Enable production X-Ray tracing
  - Verify log aggregation
  - _Requirements: 20.1, 20.2, 20.4, 20.5_

- [ ] 31.4 Create production runbooks
  - Document deployment procedures
  - Create troubleshooting guides
  - Document rollback procedures
  - Create incident response playbooks
  - _Requirements: 21.5_
