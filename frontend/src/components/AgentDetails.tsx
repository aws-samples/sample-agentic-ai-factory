import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { agentConfigService, AgentConfig } from '../services/agentConfigService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import './AgentDetails.css';

interface AgentDetailsProps {
  agentId?: string;
  isCreating?: boolean;
  onBack: () => void;
  onSave?: () => void;
}

export const AgentDetails: React.FC<AgentDetailsProps> = ({
  agentId,
  isCreating = false,
  onBack,
  onSave,
}) => {
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(!isCreating);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(isCreating);
  const [formData, setFormData] = useState({
    agentId: '',
    config: {} as any,
  });

  useEffect(() => {
    if (agentId && !isCreating) {
      loadAgent();
    } else if (isCreating) {
      // Initialize form for creating new agent
      const initialConfig = {
        name: '',
        description: '',
        schema: {
          type: 'object',
          properties: {},
          required: [],
        },
        version: '0',
        action: {
          type: 'sqs',
          target: '',
        },
      };
      console.log('Initializing create form with config:', initialConfig);
      setFormData({
        agentId: '',
        config: initialConfig,
      });
    }
  }, [agentId, isCreating]);

  const loadAgent = async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await agentConfigService.getAgentConfig(agentId);
      if (data) {
        console.log('Loaded agent data:', data);
        console.log('Config type:', typeof data.config);
        console.log('Config value:', data.config);
        
        // Ensure config is an object, not a string
        let config = data.config;
        if (typeof config === 'string') {
          console.log('Parsing config from string');
          config = JSON.parse(config);
        }
        console.log('Final config:', config);
        console.log('Final config type:', typeof config);
        
        // Store agent with parsed config
        const agentWithParsedConfig = {
          ...data,
          config: config || {},
        };
        
        setAgent(agentWithParsedConfig);
        setFormData({
          agentId: agentWithParsedConfig.agentId,
          config: agentWithParsedConfig.config,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (isCreating) {
        await agentConfigService.createAgentConfig({
          agentId: formData.agentId,
          config: formData.config,
          state: 'active',
        });
      } else if (agent) {
        await agentConfigService.updateAgentConfig({
          agentId: agent.agentId,
          config: formData.config,
        });
      }

      setIsEditing(false);
      if (onSave) {
        onSave();
      }
      if (!isCreating) {
        await loadAgent();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save agent config');
    }
  };

  const updateConfigField = (path: string[], value: any) => {
    setFormData((prev) => {
      const newConfig = JSON.parse(JSON.stringify(prev.config));
      let current = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return { ...prev, config: newConfig };
    });
  };

  const renderConfigField = (key: string, value: any, path: string[] = []): JSX.Element | null => {
    const currentPath = [...path, key];
    const fieldId = currentPath.join('.');

    // Skip if value is undefined or null
    if (value === undefined || value === null) {
      return null;
    }

    const valueType = typeof value;
    const isArray = Array.isArray(value);
    const isObject = valueType === 'object' && !isArray;

    console.log('Rendering field:', { 
      key, 
      valueType, 
      isArray, 
      isObject,
      valuePreview: isObject ? Object.keys(value) : (isArray ? `Array(${value.length})` : value)
    });

    // Handle nested objects (but not arrays)
    if (isObject) {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        // Empty object - show as JSON input
        return (
          <div key={fieldId} className="config-field-group">
            <label className="config-field-label">{key}</label>
            <Input
              type="text"
              value={JSON.stringify(value)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateConfigField(currentPath, parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              disabled={!isEditing && !isCreating}
              className="bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-sm"
              placeholder="{}"
            />
          </div>
        );
      }

      return (
        <div key={fieldId} className="config-field-group">
          <label className="config-field-label">{key}</label>
          <div className="config-nested-fields">
            {entries.map(([nestedKey, nestedValue]) =>
              renderConfigField(nestedKey, nestedValue, currentPath)
            )}
          </div>
        </div>
      );
    }

    // Handle arrays
    if (isArray) {
      return (
        <div key={fieldId} className="config-field-group">
          <label className="config-field-label">{key}</label>
          <div className="config-array-field">
            <Input
              type="text"
              value={JSON.stringify(value)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateConfigField(currentPath, parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              disabled={!isEditing && !isCreating}
              className="bg-[#1a1f2e] border-[#2a3142] text-white font-mono text-sm"
              placeholder="[]"
            />
          </div>
        </div>
      );
    }

    // Handle primitive values (string, number, boolean)
    return (
      <div key={fieldId} className="config-field-group">
        <label className="config-field-label" htmlFor={fieldId}>
          {key}
        </label>
        <Input
          id={fieldId}
          type="text"
          value={value.toString()}
          onChange={(e) => updateConfigField(currentPath, e.target.value)}
          disabled={!isEditing && !isCreating}
          className="bg-[#1a1f2e] border-[#2a3142] text-white"
          placeholder={`Enter ${key}`}
        />
      </div>
    );
  };

  const handleDelete = async () => {
    if (!agent) return;
    if (!window.confirm(`Are you sure you want to delete agent "${agent.agentId}"?`)) {
      return;
    }

    try {
      setError(null);
      await agentConfigService.deleteAgentConfig(agent.agentId);
      if (onSave) {
        onSave();
      }
      onBack();
    } catch (err: any) {
      setError(err.message || 'Failed to delete agent');
    }
  };

  const handleToggleState = async () => {
    if (!agent) return;

    try {
      setError(null);
      const newState = agent.state === 'active' ? 'inactive' : 'active';
      await agentConfigService.updateAgentConfig({
        agentId: agent.agentId,
        state: newState,
      });
      await loadAgent();
      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update agent state');
    }
  };

  if (loading) {
    return (
      <div className="agent-details-container">
        <div className="agent-details-loading">Loading agent details...</div>
      </div>
    );
  }

  return (
    <div className="agent-details-container">
      {/* Header */}
      <div className="agent-details-page-header">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="agent-details-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Content */}
      <div className="agent-details-content">
        <div className="agent-details-header">
          <div>
            <h2 className="agent-details-title">
              {isCreating ? 'Create New Agent' : agent?.agentId}
            </h2>
            {agent && !isCreating && (
              <div className="agent-details-meta">
                <Badge
                  variant={agent.state === 'active' ? 'default' : 'secondary'}
                  className={
                    agent.state === 'active'
                      ? 'bg-green-500/20 text-green-500 border-green-500'
                      : 'bg-gray-500/20 text-gray-400'
                  }
                >
                  {agent.state}
                </Badge>
              </div>
            )}
          </div>

          <div className="agent-details-actions">
            {!isCreating && !isEditing && (
              <>
                <Button
                  variant="outline"
                  onClick={handleToggleState}
                  className="border-[#2a3142] text-white hover:bg-[#2a3142]"
                >
                  {agent?.state === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="border-[#2a3142] text-white hover:bg-[#2a3142]"
                >
                  Edit
                </Button>
                {!agent?.categories?.includes('built-in') && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
            {(isEditing || isCreating) && (
              <>
                <Button
                  onClick={handleSave}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (isCreating) {
                      onBack();
                    } else if (agent) {
                      setFormData({
                        agentId: agent.agentId,
                        config: agent.config,
                      });
                    }
                  }}
                  className="border-[#2a3142] text-white hover:bg-[#2a3142]"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="agent-details-form">
          <div className="form-group">
            <label className="form-label">Agent ID</label>
            <Input
              type="text"
              value={formData.agentId}
              onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
              disabled={!isCreating}
              className="bg-[#1a1f2e] border-[#2a3142] text-white"
            />
          </div>

          {/* Dynamic Configuration Fields */}
          <div className="config-fields-container">
            <h3 className="config-section-title">Configuration</h3>
            {formData.config && typeof formData.config === 'object' && !Array.isArray(formData.config) ? (
              Object.entries(formData.config).map(([key, value]) =>
                renderConfigField(key, value)
              )
            ) : (
              <div className="config-error">
                <p>Invalid configuration format. Expected an object.</p>
                <pre>{JSON.stringify(formData.config, null, 2)}</pre>
              </div>
            )}
          </div>

          {agent && !isEditing && !isCreating && (
            <div className="agent-details-metadata">
              <p>
                <strong>Created:</strong>{' '}
                {agent.createdAt
                  ? new Date(agent.createdAt).toLocaleString()
                  : 'N/A'}
              </p>
              <p>
                <strong>Updated:</strong>{' '}
                {agent.updatedAt
                  ? new Date(agent.updatedAt).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
