import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Wrench, Cloud, Database, HelpCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Modal, ModalButton } from './ui/modal';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toolConfigService, ToolConfig } from '../services/toolConfigService';
import { fabricatorService } from '../services/fabricatorService';
import './CreateAgentWizard.css';

interface CreateAgentWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'details' | 'tools' | 'integrations' | 'datastores' | 'review';

export function CreateAgentWizard({ onBack, onComplete }: CreateAgentWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToolsInfoModal, setShowToolsInfoModal] = useState(false);

  // Form data
  const [agentName, setAgentName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [selectedDataStores, setSelectedDataStores] = useState<string[]>([]);

  // Available options
  const [availableTools, setAvailableTools] = useState<ToolConfig[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<any[]>([]);
  const [availableDataStores, setAvailableDataStores] = useState<any[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      // Load tools from the tools config table
      const tools = await toolConfigService.listToolConfigs();
      setAvailableTools(tools.filter(t => t.state === 'active'));

      // TODO: Load integrations and datastores when those services are implemented
      // For now, using placeholder data
      setAvailableIntegrations([
        { id: 'aws-s3', name: 'AWS S3', description: 'Object storage service' },
        { id: 'aws-dynamodb', name: 'AWS DynamoDB', description: 'NoSQL database' },
        { id: 'slack', name: 'Slack', description: 'Team communication' },
      ]);

      setAvailableDataStores([
        { id: 'vector-db', name: 'Vector Database', description: 'Semantic search' },
        { id: 'document-store', name: 'Document Store', description: 'Document storage' },
        { id: 'cache', name: 'Cache', description: 'In-memory cache' },
      ]);
    } catch (err: any) {
      console.error('Failed to load options:', err);
      setError(err.message || 'Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'details', label: 'Agent Details', icon: Check },
    { id: 'tools', label: 'Select Tools', icon: Wrench },
    { id: 'integrations', label: 'Integrations', icon: Cloud },
    { id: 'datastores', label: 'Data Stores', icon: Database },
    { id: 'review', label: 'Review & Create', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id as Step);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id as Step);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Send request to Fabricator agent via AppSync
      const response = await fabricatorService.requestAgentCreation({
        agentName,
        taskDescription,
        tools: selectedTools,
        integrations: selectedIntegrations,
        dataStores: selectedDataStores,
      });

      console.log('Fabricator response:', response);

      if (response.success) {
        alert(`Agent creation request sent successfully!\n\nRequest ID: ${response.requestId}\n\nThe Fabricator agent will process your request and create the agent based on your specifications.`);
        onComplete();
      } else {
        setError(response.message || 'Failed to send request to Fabricator');
      }
    } catch (err: any) {
      console.error('Failed to create agent:', err);
      setError(err.message || 'Failed to send request to Fabricator');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string, list: string[], setList: (list: string[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'details':
        return agentName.trim() !== '' && taskDescription.trim() !== '';
      case 'tools':
      case 'integrations':
      case 'datastores':
        return true; // Optional selections
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="create-agent-wizard">
      {/* Tools Info Modal */}
      <Modal
              isOpen={showToolsInfoModal}
              onClose={() => setShowToolsInfoModal(false)}
              title="Community Tools"
              footer={
                <>
                  <ModalButton variant="primary" onClick={() => setShowToolsInfoModal(false)}>
                    Got it
                  </ModalButton>
                </>
              }
            >
                <div className="space-y-4 text-[#9ca3af]">
                  <p>
                    All agents automatically have access to the <strong className="text-white">Strand Community Tools Package</strong>, which includes a comprehensive set of built-in tools for common tasks.
                  </p>
                  <p>
                    The tools you select here are <strong className="text-white">additional custom tools</strong> that extend your agent's capabilities beyond the community package.
                  </p>
                  <div className="bg-[#0f1319] border border-[#2a3142] rounded p-4 mt-4">
                    <p className="text-sm mb-2">
                      <strong className="text-white">Community tools include:</strong>
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>File operations</li>
                      <li>Web search and browsing</li>
                      <li>Code execution</li>
                      <li>Data processing</li>
                      <li>And many more...</li>
                    </ul>
                  </div>
                  <a
                    href="https://strandsagents.com/latest/documentation/docs/user-guide/concepts/tools/community-tools-package/#available-tools"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm mt-2"
                  >
                    View full list of community tools →
                  </a>
                </div>
            
            </Modal>

      {/* Header */}
      <div className="wizard-header">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>
        <h1 className="wizard-title">Create New Agent</h1>
      </div>

      {/* Progress Steps */}
      <div className="wizard-steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;

          return (
            <div
              key={step.id}
              className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-icon">
                <Icon className="h-4 w-4" />
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="wizard-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step Content */}
      <div className="wizard-content">
        {currentStep === 'details' && (
          <div className="step-content">
            <h2 className="step-title">Agent Details</h2>
            <p className="step-description">
              Provide a name and describe what you want your agent to accomplish
            </p>

            <div className="form-group">
              <label className="form-label">Agent Name *</label>
              <Input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., Customer Support Agent"
                className="bg-[#1a1f2e] border-[#2a3142] text-white"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Description *</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe what this agent should do, what problems it should solve, and how it should behave..."
                className="form-textarea bg-[#1a1f2e] border-[#2a3142] text-white"
                rows={8}
              />
              <p className="form-hint">
                Be specific about the agent's purpose, expected inputs, outputs, and any special requirements.
              </p>
            </div>
          </div>
        )}

        {currentStep === 'tools' && (
          <div className="step-content">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="step-title">Select Tools</h2>
              <button
                onClick={() => setShowToolsInfoModal(true)}
                className="text-[#9ca3af] hover:text-white transition-colors"
                title="Learn about community tools"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="step-description">
              Choose the tools your agent will have access to (optional)
            </p>

            <div className="selection-grid">
              {availableTools.map((tool) => {
                const config = typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config;
                const isSelected = selectedTools.includes(tool.toolId);

                return (
                  <Card
                    key={tool.toolId}
                    className={`selection-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(tool.toolId, selectedTools, setSelectedTools)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-white text-base">
                          {config?.name || tool.toolId}
                        </CardTitle>
                        {isSelected && (
                          <Badge className="bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-[#9ca3af] text-sm">
                        {config?.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {availableTools.length === 0 && (
              <div className="empty-state">
                <p className="text-[#9ca3af]">No tools available</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'integrations' && (
          <div className="step-content">
            <h2 className="step-title">Select Integrations</h2>
            <p className="step-description">
              Choose external services your agent should integrate with (optional)
            </p>

            <div className="selection-grid">
              {availableIntegrations.map((integration) => {
                const isSelected = selectedIntegrations.includes(integration.id);

                return (
                  <Card
                    key={integration.id}
                    className={`selection-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(integration.id, selectedIntegrations, setSelectedIntegrations)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-white text-base">
                          {integration.name}
                        </CardTitle>
                        {isSelected && (
                          <Badge className="bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-[#9ca3af] text-sm">
                        {integration.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 'datastores' && (
          <div className="step-content">
            <h2 className="step-title">Select Data Stores</h2>
            <p className="step-description">
              Choose data storage options for your agent (optional)
            </p>

            <div className="selection-grid">
              {availableDataStores.map((dataStore) => {
                const isSelected = selectedDataStores.includes(dataStore.id);

                return (
                  <Card
                    key={dataStore.id}
                    className={`selection-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(dataStore.id, selectedDataStores, setSelectedDataStores)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-white text-base">
                          {dataStore.name}
                        </CardTitle>
                        {isSelected && (
                          <Badge className="bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-[#9ca3af] text-sm">
                        {dataStore.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="step-content">
            <h2 className="step-title">Review & Create</h2>
            <p className="step-description">
              Review your selections before sending to the Fabricator
            </p>

            <div className="review-section">
              <h3 className="review-heading">Agent Details</h3>
              <div className="review-item">
                <span className="review-label">Name:</span>
                <span className="review-value">{agentName}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Task Description:</span>
                <p className="review-value">{taskDescription}</p>
              </div>
            </div>

            <div className="review-section">
              <h3 className="review-heading">Selected Tools ({selectedTools.length})</h3>
              {selectedTools.length > 0 ? (
                <div className="review-badges">
                  {selectedTools.map(toolId => (
                    <Badge key={toolId} variant="secondary" className="bg-[#1a1f2e] text-white">
                      {toolId}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="review-empty">No tools selected</p>
              )}
            </div>

            <div className="review-section">
              <h3 className="review-heading">Selected Integrations ({selectedIntegrations.length})</h3>
              {selectedIntegrations.length > 0 ? (
                <div className="review-badges">
                  {selectedIntegrations.map(id => (
                    <Badge key={id} variant="secondary" className="bg-[#1a1f2e] text-white">
                      {id}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="review-empty">No integrations selected</p>
              )}
            </div>

            <div className="review-section">
              <h3 className="review-heading">Selected Data Stores ({selectedDataStores.length})</h3>
              {selectedDataStores.length > 0 ? (
                <div className="review-badges">
                  {selectedDataStores.map(id => (
                    <Badge key={id} variant="secondary" className="bg-[#1a1f2e] text-white">
                      {id}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="review-empty">No data stores selected</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-footer">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
          className="border-[#2a3142] text-white hover:bg-[#2a3142]"
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep !== 'review' ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="bg-white text-[#0f1319] hover:bg-[#f2f3f3]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {loading ? 'Creating...' : 'Create Agent'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
