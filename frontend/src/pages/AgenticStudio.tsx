import { useState } from 'react';
import { Settings, GitBranch, Play } from 'lucide-react';
import { AgentBlueprints } from '../components/AgentBlueprints';
import { TaskRunner } from '../components/TaskRunner';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';

type SubSection = 'task-runner' | 'agent-blueprints';

export function AgenticStudio() {
  const [activeSection, setActiveSection] = useState<SubSection>('task-runner');

  const sections = [
    { id: 'task-runner' as SubSection, label: 'Task Runner', icon: Play },
    { id: 'agent-blueprints' as SubSection, label: 'Agent Blueprints', icon: GitBranch },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation tabs */}
      <div className="border-b border-[#1f1f1f] bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'gap-2 text-sm font-medium transition-colors',
                    activeSection === section.id
                      ? 'bg-[#1f1f1f] text-white border-b-2 border-blue-500 rounded-b-none'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'task-runner' && <TaskRunner />}
        {activeSection === 'agent-blueprints' && <AgentBlueprints />}
      </div>
    </div>
  );
}
