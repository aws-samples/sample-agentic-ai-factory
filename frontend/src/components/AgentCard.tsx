import { Pause, Play, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AgentConfig } from '../services/agentConfigService';

interface AgentCardProps {
  agent: AgentConfig;
  onToggleState: (agent: AgentConfig) => void;
  onConfigure: (agentId: string) => void;
}

export function AgentCard({ agent, onToggleState, onConfigure }: AgentCardProps) {
  // Parse config if it's a string
  const config = typeof agent.config === 'string' 
    ? JSON.parse(agent.config) 
    : agent.config;

  return (
    <Card 
      key={agent.agentId}
      className="transition-all overflow-hidden"
      style={{
        backgroundColor: '#000000ff',
        border: '1px solid #2a2a2a',
        padding: '15px',
        paddingTop: '20px'
      }}
    >
      <CardHeader className="p-0 pb-3">
        <div className="flex items-start justify-between mb-3"></div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-white" style={{ fontSize: '16px', fontWeight: 600 }}>
              {config?.name || agent.agentId}
            </CardTitle>
            <div className="flex items-center gap-2">
              {agent.categories?.includes('built-in') && (
                <Badge variant="outline" className="border-[#f90] text-[#f90]">
                  Built-in
                </Badge>
              )}
              {agent.categories?.includes('worker') && (
                <Badge variant="outline" className="border-[#f90] text-[#f90]">
                  Worker
                </Badge>
              )}
              <Badge
                variant={agent.state === 'active' ? 'default' : 'secondary'}
                className={
                  agent.state === 'active'
                    ? 'bg-green-500/20 text-green-500 border-green-500'
                    : 'bg-[#2a3142] text-[#6b7280]'
                }
              >
                {agent.state}
              </Badge>
            </div>
        </div>
        <CardDescription 
        className="text-sm leading-relaxed" 
        style={{ 
          color: '#8b8b8b', 
          fontSize: '13px', 
          height: '75px',
          overflow: 'hidden',
          wordWrap: 'break-word', 
          whiteSpace: 'normal' 
          }}>
          {config?.description || 'No description available'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-0">
        {/* Version and Stats */}
        <div className="flex items-center justify-between text-sm pb-2">
          <span style={{ color: '#6b7280', fontSize: '13px' }}>Version {config?.version || 'v0.0.0'}</span>
          <span style={{ color: '#6b7280', fontSize: '13px' }}>ID: {agent.agentId}</span>
        </div>
        
        {/* Schema Info */}
        {config?.schema && (
          <div className="space-y-2 pt-1">
            <span className="text-sm font-semibold text-white" style={{ fontSize: '13px' }}>Schema Properties</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(config.schema.properties || {}).slice(0, 3).map((prop, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5 border-0 rounded font-medium"
                  style={{
                    backgroundColor: '#0a0a0a',
                    color: '#8b8b8b',
                    fontSize: '11px'
                  }}
                >
                  {prop}
                </Badge>
              ))}
              {Object.keys(config.schema.properties || {}).length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 border-0 rounded font-medium"
                  style={{
                    backgroundColor: '#0a0a0a',
                    color: '#8b8b8b',
                    fontSize: '11px'
                  }}
                >
                  +{Object.keys(config.schema.properties || {}).length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Type */}
        {config?.action && (
          <div className="text-xs">
            <span className="text-sm font-semibold text-white" style={{ fontSize: '13px' }}>Action Type: {config.action.type}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3">
        {agent.state === 'active' ? (
          <Button
            variant="outline"
            className="flex-1 border-[#2a3142] text-white hover:bg-[#2a3142]"
            onClick={() => onToggleState(agent)}
          >
            <Pause className="w-4 h-4" />
            Deactivate
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1 border-[#2a3142] text-white hover:bg-[#2a3142]"
            onClick={() => onToggleState(agent)}
          >
            <Play className="w-4 h-4" />
            Activate
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1 border-[#2a3142] text-white hover:bg-[#2a3142]"
          onClick={() => onConfigure(agent.agentId)}
        >
          <Settings className="w-4 h-4" />
          Config
        </Button>
      </CardFooter>
    </Card>
  );
}
