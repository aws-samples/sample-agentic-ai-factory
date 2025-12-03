import { useEffect, useRef } from 'react';
import { Radio, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface ChatterMessage {
  id: string;
  timestamp: string;
  source: string;
  detailType: string;
  detail: any;
}

interface AgentChatterProps {
  isActive: boolean;
  messages: ChatterMessage[];
}

export function AgentChatter({ isActive, messages }: AgentChatterProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'agentic-ai-factory': 'text-blue-400',
      'agent1.assessment': 'text-green-400',
      'agent2.design': 'text-purple-400',
      'agent3.planning': 'text-yellow-400',
      'agent4.implementation': 'text-orange-400',
      'agentic-ai-factory.assessment': 'text-green-400',
      'supervisor': 'text-cyan-400',
    };
    return colors[source] || 'text-gray-400';
  };

  const getDetailTypeColor = (detailType: string) => {
    if (detailType.includes('completed')) return 'bg-green-500/20 text-green-300';
    if (detailType.includes('progress')) return 'bg-blue-500/20 text-blue-300';
    if (detailType.includes('error')) return 'bg-red-500/20 text-red-300';
    if (detailType.includes('started')) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-gray-500/20 text-gray-300';
  };

  return (
    <Card className="bg-[#1a1f2e] border-[#2a3142] h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#f90]" />
          Agent Communication
          {isActive && (
            <span className="flex items-center gap-1 text-xs text-green-400 font-normal">
              <Activity className="w-3 h-3 animate-pulse" />
              Live
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-[#9ca3af]">
          Real-time messages between Supervisor and Worker agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[500px] max-h-[700px] overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-[500px] text-[#6b7280]">
              <div className="text-center">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {isActive ? 'Listening for agent messages...' : 'No active tasks'}
                </p>
                <p className="text-xs mt-1">
                  {isActive ? 'Messages will appear here in real-time' : 'Submit a task to see agent communication'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                // Parse detail if it's a JSON string
                let detailObj = message.detail;
                if (typeof message.detail === 'string') {
                  try {
                    detailObj = JSON.parse(message.detail);
                  } catch (e) {
                    detailObj = message.detail;
                  }
                }
                
                return (
                  <div
                    key={`${message.id}-${index}`}
                    className="p-3 bg-[#0f1319] border border-[#2a3142] rounded-lg hover:border-[#3a4152] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-xs font-mono font-semibold ${getSourceColor(message.source)} truncate`}>
                          {message.source}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getDetailTypeColor(message.detailType)}`}>
                          {message.detailType}
                        </span>
                      </div>
                      <span className="text-xs text-[#6b7280] whitespace-nowrap">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-[#9ca3af] font-mono">
                      <pre className="whitespace-pre-wrap break-words text-xs">
                        {JSON.stringify(detailObj, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
