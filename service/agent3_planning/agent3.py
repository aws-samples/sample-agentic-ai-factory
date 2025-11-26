"""
Agent 3 - Implementation Planning Agent
Part of the Agentic AI Factory system for generating implementation roadmaps and timelines
"""

from bedrock_agentcore import BedrockAgentCoreApp
from strands import Agent, tool
from typing import Dict, List, Any, Optional
import json
import logging
import time
import random
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = BedrockAgentCoreApp()

class PlanningPhase(Enum):
    FOUNDATION = "foundation"
    PILOT = "pilot"
    SCALE = "scale"
    OPTIMIZE = "optimize"

class TaskPriority(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class AgentRole(Enum):
    SUPERVISOR = "supervisor"
    WORKER = "worker"
    EVALUATOR = "evaluator"
    GENERATOR = "generator"

@dataclass
class UserStory:
    story_id: str
    title: str
    description: str
    acceptance_criteria: List[str]
    priority: TaskPriority
    story_points: int
    dependencies: List[str]
    tags: List[str]

@dataclass
class Epic:
    epic_id: str
    title: str
    description: str
    user_stories: List[UserStory]
    business_value: str
    success_metrics: List[str]

@dataclass
class AISpecification:
    spec_id: str
    component_name: str
    prompt_template: str
    constraints: List[str]
    expected_output: str
    validation_criteria: List[str]
    model_requirements: Dict[str, Any]

@dataclass
class AgentDefinition:
    agent_id: str
    agent_name: str
    role: AgentRole
    capabilities: List[str]
    communication_patterns: List[str]
    deployment_config: Dict[str, Any]
    resource_requirements: Dict[str, Any]

@dataclass
class WorkflowDefinition:
    workflow_id: str
    workflow_name: str
    trigger_events: List[str]
    agent_sequence: List[str]
    orchestration_logic: Dict[str, Any]
    error_handling: Dict[str, Any]

@dataclass
class ImplementationArtifacts:
    artifacts_id: str
    implementation_path: str
    epics: List[str] = None
    ai_specifications: List[str] = None
    agent_definitions: List[str] = None
    workflow_definitions: List[str] = None
    integration_points: List[Dict[str, Any]] = None

def exponential_backoff_retry(func, max_retries=5, base_delay=1, max_delay=60):
    """Execute function with exponential backoff retry logic for production use"""
    
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            error_str = str(e).lower()
            
            # Check if it's a retryable error
            if any(term in error_str for term in ['throttling', 'rate limit', 'too many', 'service unavailable', 'timeout', 'internal error']):
                if attempt < max_retries - 1:
                    # Calculate delay with exponential backoff and jitter
                    delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
                    logger.warning(f"Rate limited/throttled. Retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"Max retries ({max_retries}) exceeded for rate limiting")
                    raise e
            else:
                # Non-retryable error, raise immediately
                raise e
    
    raise Exception("Max retries exceeded")

class ImplementationSupportAgent:
    def __init__(self):
        self.agent = Agent(
            model="au.anthropic.claude-sonnet-4-5-20250929-v1:0",
            system_prompt="""You are an expert implementation support agent for the Agentic AI Factory.
            Your role is to bridge planning into execution by generating structured development artifacts.
            
            You support three implementation paths:
            
            Path A - Development Task Breakdown:
            - Generate hierarchical task structures (Epics → Features → User Stories)
            - Create clear acceptance criteria and priority rankings
            - Ensure agile methodology alignment
            - Prepare artifacts for project management tools
            
            Path B - AI-Assisted Specifications:
            - Create structured prompts for code generation tools
            - Define architecture constraints and requirements
            - Generate machine-readable specification formats
            - Optimize for AI-assisted development workflows
            
            Path C - Agent Fabrication & Workflow Integration:
            - Design agent creation and deployment workflows
            - Define communication patterns and orchestration logic
            - Create platform capability provisioning specifications
            - Enable automated agent lifecycle management
            
            Focus on practical, implementable artifacts that accelerate development and ensure quality.""",
            tools=[]
        )
    

    def generate_implementation_artifacts(self, context: Dict[str, Any]) -> ImplementationArtifacts:
        """Generate implementation artifacts based on chosen path"""
        
        logger.info("Starting implementation artifact generation")
        
        # Extract context information
        implementation_plan = context.get("implementation_plan", {})
        implementation_path = context.get("implementation_path", ImplementationPath.DEVELOPMENT_BREAKDOWN.value)
        requirements = context.get("requirements", {})
        
        # Build support prompt
        support_prompt = self._build_support_prompt(implementation_plan, implementation_path, requirements)
        
        # Run support through agent with retry logic
        def invoke_support():
            return self.agent(support_prompt)
        
        result = exponential_backoff_retry(invoke_support, max_retries=5, base_delay=2)
        
        # Parse and structure results
        artifacts = self._parse_support_results(result, implementation_path, implementation_plan)
        
        logger.info(f"Implementation artifacts generated for path: {implementation_path}")
        
        return artifacts
    
    def _build_support_prompt(self, implementation_plan: Dict, implementation_path: str, 
                             requirements: Dict) -> str:
        """Build comprehensive support prompt"""
        
        prompt = f"""
        Generate implementation artifacts for the Agentic AI Factory based on:
        
        Implementation Plan:
        - Timeline: {implementation_plan.get('timeline_months', 'N/A')} months
        - Architecture: {implementation_plan.get('recommended_architecture', 'N/A')}
        - Phases: {len(implementation_plan.get('phases', []))} phases
        
        Implementation Path: {implementation_path}
        
        Requirements:
        - Development Approach: {requirements.get('development_approach', 'Agile')}
        - Team Size: {requirements.get('team_size', 'Medium')}
        - Integration Needs: {requirements.get('integration_needs', [])}
        
        Based on the selected path, please generate:
        
        Path A (Development Breakdown):
        - Hierarchical task structure (Epics → User Stories)
        - Clear acceptance criteria and priorities
        - Agile methodology alignment
        
        Path B (AI Specifications):
        - Structured prompts for code generation
        - Architecture constraints and requirements
        - Machine-readable specifications
        
        Path C (Agent Fabrication):
        - Agent definitions and capabilities
        - Workflow orchestration logic
        - Integration point specifications
        """
        
        return prompt
    
    def _parse_support_results(self, agent_response, implementation_path: str, 
                              implementation_plan: Dict) -> ImplementationArtifacts:
        """Parse agent response into structured implementation artifacts"""
        
        artifacts_id = f"artifacts_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        path_enum = ImplementationPath(implementation_path)
        
        if path_enum == ImplementationPath.DEVELOPMENT_BREAKDOWN:
            # Sample epics and user stories (would be parsed from agent response)
            epics = [
                Epic(
                    epic_id="EP-001",
                    title="Infrastructure Foundation",
                    description="Establish core AWS infrastructure",
                    user_stories=[
                        UserStory(
                            story_id="US-001",
                            title="Set up AWS infrastructure",
                            description="Provision core AWS resources",
                            acceptance_criteria=["Infrastructure deployed", "Security configured"],
                            priority=TaskPriority.CRITICAL,
                            story_points=8,
                            dependencies=[],
                            tags=["infrastructure", "aws"]
                        )
                    ],
                    business_value="Provides foundation for all capabilities",
                    success_metrics=["Deployment time < 30 min", "99.9% uptime"]
                )
            ]
            
            return ImplementationArtifacts(
                artifacts_id=artifacts_id,
                implementation_path=path_enum,
                epics=epics
            )
        
        elif path_enum == ImplementationPath.AI_SPECIFICATIONS:
            # Sample AI specifications
            ai_specs = [
                AISpecification(
                    spec_id="AI-SPEC-001",
                    component_name="Assessment Agent",
                    prompt_template="Generate assessment agent implementation...",
                    constraints=["Use AWS services only", "Follow security best practices"],
                    expected_output="Complete Python module",
                    validation_criteria=["Tests pass", "Security scan clean"],
                    model_requirements={"model": "claude-4.5", "temperature": 0.1}
                )
            ]
            
            return ImplementationArtifacts(
                artifacts_id=artifacts_id,
                implementation_path=path_enum,
                ai_specifications=ai_specs
            )
        
        elif path_enum == ImplementationPath.AGENT_FABRICATION:
            # Sample agent and workflow definitions
            agents = [
                AgentDefinition(
                    agent_id="supervisor-001",
                    agent_name="Workflow Supervisor",
                    role=AgentRole.SUPERVISOR,
                    capabilities=["Orchestration", "Monitoring"],
                    communication_patterns=["Command-control", "Event-driven"],
                    deployment_config={"runtime": "agentcore", "memory": "1GB"},
                    resource_requirements={"cpu": "0.5", "memory": "1GB"}
                )
            ]
            
            workflows = [
                WorkflowDefinition(
                    workflow_id="assessment-wf-001",
                    workflow_name="Assessment Workflow",
                    trigger_events=["assessment.started"],
                    agent_sequence=["supervisor-001", "assessment-001"],
                    orchestration_logic={"type": "state_machine"},
                    error_handling={"retry": 3, "fallback": "human_escalation"}
                )
            ]
            
            return ImplementationArtifacts(
                artifacts_id=artifacts_id,
                implementation_path=path_enum,
                agent_definitions=agents,
                workflow_definitions=workflows
            )

# Initialize the implementation support agent
support_agent = ImplementationSupportAgent()

@app.entrypoint
def invoke(payload):
    """Main entrypoint for Agent 3 - Implementation Support"""
    
    try:
        logger.info("Agent 3 invoked with payload")
        
        # Extract context from payload
        context = {
            "implementation_plan": payload.get("implementation_plan", {}),
            "implementation_path": payload.get("implementation_path", "path_a"),
            "requirements": payload.get("requirements", {}),
            "session_id": payload.get("session_id", ""),
            "user_id": payload.get("user_id", "")
        }
        
        # Generate implementation artifacts
        artifacts = support_agent.generate_implementation_artifacts(context)
        
        # Format response for UI integration
        response = {
            "agent_id": "agent3_support",
            "status": "success",
            "implementation_artifacts": {
                "artifacts_id": artifacts.artifacts_id,
                "implementation_path": artifacts.implementation_path.value,
                "epics": [
                    {
                        "epic_id": epic.epic_id,
                        "title": epic.title,
                        "description": epic.description,
                        "business_value": epic.business_value,
                        "success_metrics": epic.success_metrics,
                        "user_stories": [
                            {
                                "story_id": story.story_id,
                                "title": story.title,
                                "description": story.description,
                                "acceptance_criteria": story.acceptance_criteria,
                                "priority": story.priority.value,
                                "story_points": story.story_points,
                                "dependencies": story.dependencies,
                                "tags": story.tags
                            }
                            for story in epic.user_stories
                        ]
                    }
                    for epic in (artifacts.epics or [])
                ],
                "ai_specifications": [
                    {
                        "spec_id": spec.spec_id,
                        "component_name": spec.component_name,
                        "prompt_template": spec.prompt_template,
                        "constraints": spec.constraints,
                        "expected_output": spec.expected_output,
                        "validation_criteria": spec.validation_criteria,
                        "model_requirements": spec.model_requirements
                    }
                    for spec in (artifacts.ai_specifications or [])
                ],
                "agent_definitions": [
                    {
                        "agent_id": agent.agent_id,
                        "agent_name": agent.agent_name,
                        "role": agent.role.value,
                        "capabilities": agent.capabilities,
                        "communication_patterns": agent.communication_patterns,
                        "deployment_config": agent.deployment_config,
                        "resource_requirements": agent.resource_requirements
                    }
                    for agent in (artifacts.agent_definitions or [])
                ],
                "workflow_definitions": [
                    {
                        "workflow_id": workflow.workflow_id,
                        "workflow_name": workflow.workflow_name,
                        "trigger_events": workflow.trigger_events,
                        "agent_sequence": workflow.agent_sequence,
                        "orchestration_logic": workflow.orchestration_logic,
                        "error_handling": workflow.error_handling
                    }
                    for workflow in (artifacts.workflow_definitions or [])
                ]
            },
            "ui_integration": {
                "progress_indicator": "implementation_ready",
                "next_module": "deployment",
                "save_state": True,
                "display_components": [
                    "task_kanban" if artifacts.implementation_path == ImplementationPath.DEVELOPMENT_BREAKDOWN else None,
                    "spec_editor" if artifacts.implementation_path == ImplementationPath.AI_SPECIFICATIONS else None,
                    "workflow_designer" if artifacts.implementation_path == ImplementationPath.AGENT_FABRICATION else None,
                    "export_options"
                ]
            }
        }
        
        logger.info("Implementation artifacts generated successfully")
        return response
        
    except Exception as e:
        logger.error(f"Error in Agent 3 support: {str(e)}")
        return {
            "agent_id": "agent3_support",
            "status": "error",
            "error": str(e),
            "ui_integration": {
                "display_error": True,
                "retry_available": True
            }
        }

if __name__ == "__main__":
    app.run()