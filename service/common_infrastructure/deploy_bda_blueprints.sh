#!/bin/bash

set -e

REGION="ap-southeast-2"
BLUEPRINT_NAME="aifactory-technical-extraction"

echo "Deploying Bedrock Data Automation Blueprint: $BLUEPRINT_NAME"

# Create the technical blueprint schema
TECHNICAL_SCHEMA='{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "description": "Assessment of technical readiness and capability to implement agentic AI solutions",
  "class": "Technical Feasibility Assessment",
  "type": "object",
  "definitions": {},
  "properties": {
    "Functional Description":{
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Functional description of the system"
  
    },
    "Existing System Architecture": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Description of the current system architecture (monolithic, microservices, serverless)"
    },
    "Core Platforms and Technologies": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "List of core platforms and technologies in use"
    },
    "Cloud Maturity Level": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Level of cloud maturity (on-premise, hybrid, cloud-native)"
    },
    "System Integration Patterns": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Integration patterns currently employed"
    },
    "API Landscape": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Description of the API landscape and API management approach"
    },
    "Number and Types of Systems Requiring Integration": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Number and types of systems that need to integrate with the agentic AI solution"
    },
    "Integration Protocols": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Integration protocols in use (REST, GraphQL, gRPC, message queues)"
    },
    "Event-driven Architecture Capabilities": {
      "type": "boolean",
      "inferenceType": "explicit",
      "instruction": "Whether the system currently uses event-driven patterns or message queues"
    },
    "Real-time vs Batch Processing Requirements": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Real-time or batch processing requirements for invoice processing"
    },
    "Critical SLAs and Performance Requirements": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Critical service level agreements and performance requirements"
    },
    "Data Sources and Locations": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Sources and locations of critical business data"
    },
    "Data Quality and Governance Maturity": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Assessment of data quality and governance practices"
    },
    "Data Classification and Sensitivity Levels": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Classification and sensitivity levels of data (PII, PHI, PCI)"
    },
    "Data Residency and Sovereignty Requirements": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Data residency and sovereignty requirements"
    },
    "Existing Data Lakes, Warehouses, or Knowledge Bases": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Existing data lakes, warehouses, or knowledge bases"
    },
    "Vector Database or Semantic Search Capabilities": {
      "type": "boolean",
      "inferenceType": "explicit",
      "instruction": "Experience with vector databases or semantic search"
    },
    "Identity and Access Management Approach": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Approach to identity and access management"
    },
    "Authentication and Authorization Mechanisms": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Mechanisms for authentication and authorization"
    },
    "Encryption Standards": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Encryption standards for data at rest, in transit, and in use"
    },
    "Network Security Posture": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Network security posture (VPCs, firewalls, segmentation)"
    },
    "Security Monitoring and Incident Response Capabilities": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Capabilities for security monitoring and incident response"
    },
    "Secrets Management Approach": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Approach to managing application secrets and credentials"
    },
    "Logging and Monitoring Infrastructure": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Tools and infrastructure for logging and monitoring"
    },
    "Distributed Tracing Capabilities": {
      "type": "boolean",
      "inferenceType": "explicit",
      "instruction": "Whether distributed tracing is implemented"
    },
    "Alerting and Incident Management Processes": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Processes for handling alerts and incidents"
    },
    "Performance Monitoring and APM Tools": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Tools for performance monitoring and application performance management"
    },
    "Operational Automation Level": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Level of operational automation"
    },
    "Current AIML Capabilities and Experience": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Current capabilities and experience with AI/ML"
    },
    "Foundation Models in Use or Evaluated": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Foundation models that have been evaluated or used"
    },
    "Model Deployment and Serving Infrastructure": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Infrastructure for model deployment and serving"
    },
    "MLOps Maturity and Practices": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Maturity and practices of MLOps"
    },
    "Model Governance and Versioning Approach": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Approach to model governance and versioning"
    },
    "Prompt Engineering and Management Capabilities": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Capabilities for prompt engineering and management"
    },
    "Expected Transaction Volumes and Growth Projections": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Expected transaction volumes and growth projections"
    },
    "Peak Load Patterns and Seasonality": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Peak load patterns and seasonality"
    },
    "Auto-scaling Capabilities and Experience": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Auto-scaling capabilities and experience"
    },
    "Performance Benchmarks and Targets": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Performance benchmarks and targets (latency, throughput)"
    },
    "Disaster Recovery and Business Continuity Requirements": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Disaster recovery and business continuity requirements"
    },
    "CICD Pipeline Maturity": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Maturity of CI/CD pipelines"
    },
    "Infrastructure as Code Adoption": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Adoption of Infrastructure as Code (Terraform, CloudFormation)"
    },
    "Testing Practices": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Testing practices followed (unit, integration, E2E)"
    },
    "Deployment Strategies": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Deployment strategies used (blue-green, canary, rolling)"
    },
    "Environment Management": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Management of environments (dev, staging, prod)"
    },
    "Version Control and Branching Strategies": {
      "type": "string",
      "inferenceType": "explicit",
      "instruction": "Version control system and branching strategies used"
    }
  }
}'

# Create the blueprint
echo "Creating blueprint..."
aws bedrock-data-automation create-blueprint \
  --blueprint-name "$BLUEPRINT_NAME" \
  --type "DOCUMENT" \
  --schema "$TECHNICAL_SCHEMA" \
  --region "$REGION"

echo "Blueprint created successfully: $BLUEPRINT_NAME"
echo "Use 'aws bedrock-data-automation get-blueprint --blueprint-arn <arn>' to verify"
