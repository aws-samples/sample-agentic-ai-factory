#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
//import { KnowledgeBaseStack } from '../lib/knowledge-base-stack';
import { ServicesStack } from '../lib/services-stack';
import { BackendStack } from '../lib/backend-stack';
import { ArbiterStack } from '../lib/arbiter-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const environment = process.env.ENVIRONMENT || 'dev';
if (!environment) {
  throw new Error('ENVIRONMENT variable must be set (test, dev, staging, or prod)');
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2',
};

const stackProps = {
  env,
  environment: environment,
};



// Knowledge Base stack (deployed first)
/*
const knowledgeBaseStack = new KnowledgeBaseStack(app, `agentic-ai-factory-kb-${environment}`, {
  ...stackProps,
  description: `Knowledge Bases for Agentic AI Factory - ${environment}`,
});
*/
// Backend infrastructure stack (deployed first)
const backendStack = new BackendStack(app, `agentic-ai-factory-backend-${environment}`, {
  ...stackProps,
  description: `Backend infrastructure for Agentic AI Factory - ${environment}`,
});

// Services stack (depends on backend)
const servicesStack = new ServicesStack(app, `agentic-ai-factory-services-${environment}`, {
  ...stackProps,
  description: `Agent services for Agentic AI Factory - ${environment}`,
  complianceKnowledgeBaseId: "",//knowledgeBaseStack.complianceKnowledgeBaseId,
  integrationsKnowledgeBaseId: "",//knowledgeBaseStack.integrationsKnowledgeBaseId,
  fileSourcesKnowledgeBaseId: "",//knowledgeBaseStack.fileSourcesKnowledgeBaseId,
  agentEventBus: backendStack.agentEventBus,
  projectsTable: backendStack.projectsTable,
  conversationsTable: backendStack.conversationsTable,
  documentBucket: backendStack.documentBucket,
});

const arbiterStack = new ArbiterStack(app, `agentic-ai-factory-arbiter-${environment}`, {
  ...stackProps,
  description: `Arbiter infrastructure for Agentic AI Factory - ${environment}`,
  agentEventBus: backendStack.agentEventBus,
  agentConfigTable: backendStack.agentConfigTable,
})

// Frontend hosting stack
const frontendStack = new FrontendStack(app, `agentic-ai-factory-frontend-${environment}`, {
  ...stackProps,
  description: `Frontend hosting infrastructure - ${environment}`,
  appSyncApi: backendStack.appSyncApi,
  userPool: backendStack.userPool,
  userPoolClient: backendStack.userPoolClient
});

// Add dependencies
//backendStack.addDependency(knowledgeBaseStack);
servicesStack.addDependency(backendStack);
arbiterStack.addDependency(servicesStack);
frontendStack.addDependency(arbiterStack);