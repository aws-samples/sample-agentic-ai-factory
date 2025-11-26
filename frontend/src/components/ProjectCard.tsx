import { Search, Code, MapPin, MoreVertical, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { StatusCard } from './ui/status-card';
import { Project } from '../services';

interface ProjectCardProps {
  project: Project;
  onSelectAssess: (project: Project) => void;
  onSelectPlan: (project: Project) => void;
  onSelectImplement: (project: Project) => void;
}

export function ProjectCard({ project, onSelectAssess, onSelectPlan, onSelectImplement}: ProjectCardProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  };

  const handleSelect = () => {
    if (project.progress && project.progress.assessment < 100) {
      onSelectAssess(project);
    } else if (project.progress && project.progress.planning < 100) {
      onSelectPlan(project);
    } else {
        onSelectImplement(project);
    }
  };

  const selectPin = () => {
    let pin: any;
    if(project.progress && project.progress.assessment < 100){
      pin = <Search className="w-3 h-3 text-[#8B5CF6]" />;
    } else if (project.progress && project.progress.planning < 100){ 
      pin = <MapPin className="w-3 h-3 text-[#8B5CF6]" />;
    } else {
      pin = <Code className="w-3 h-3 text-[#8B5CF6]" />;
    }

    return pin;
    
  }

  return (
    <Card 
    className="hover:border-primary transition-colors"
    style={{
        backgroundColor: '#000000ff',
      }}
    >
      <CardHeader className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <CardTitle className="text-white text-xl font-semibold">{project.name}</CardTitle>
          <CardDescription className="text-[#9ca3af] text-sm mb-3">
            {project.description}
          </CardDescription>
          <div className="flex items-center gap-4 text-xs text-[#6b7280]">
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
        </div>
        <button className="text-[#9ca3af] hover:text-white transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.progress && (
            <>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#8B5CF6]/20 rounded-full">
                {selectPin()} 
                <span className="text-[#8B5CF6] text-sm font-medium">
                  {project.progress.currentPhase || 'In Progress'}
                </span>
                <span className="text-[#8B5CF6] text-sm">
                  <Badge
                    variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}
                    className={project.status === 'COMPLETED' ? 'bg-primary' : ''}
                  >
                    {project.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                  </Badge>
                </span>
              </div>
              <span className="text-[#9ca3af] text-sm">
                {Math.round(project.progress.overall)}% complete
              </span>
            </div>
            <Progress value={project.progress.overall} className="w-full rounded-full mb-6" style={{ backgroundColor: '#6b7280', height: '6px' }}  />
          </div>
        
          <div className="grid grid-cols-4 gap-4 mb-6" style={{display:"flex"}}>
            <StatusCard status={project.progress.assessment == 100 ? "completed" : "in_progress"} style={{ width: '33%' }} className="bg-[#0a0a0a] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-[#3B82F6]/20 flex items-center justify-center">
                  <Search className="w-3 h-3 text-[#3B82F6]" />
                </div>
                <h4 className="text-white text-sm font-semibold">Assess</h4>
              </div>
              <p className="text-[#3B82F6] text-xs font-medium mb-3">{project.progress.assessment}% complete</p>
                <button
                    onClick={() => onSelectAssess(project)} 
                    className="w-full px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white text-xs font-medium rounded transition-colors">
                Status & Details
                </button>
            </StatusCard>

            <StatusCard status={project.progress.assessment == 100 ? (project.progress.planning == 100 ? "completed" : "in_progress") : "pending"} style={{ width: '33%' }} className="bg-[#0a0a0a] rounded-lg p-4 opacity-60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-[#8B5CF6]/20 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-[#8B5CF6]" />
                </div>
                <h4 className="text-white text-sm font-semibold">Plan</h4>
              </div>
              <p className="text-[#9ca3af] text-xs font-medium mb-3">{project.progress.planning}% complete</p>
              <button 
                  onClick={() => onSelectPlan(project)} 
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#6b7280] text-xs font-medium rounded cursor-not-allowed">
                Status & Details
              </button>
            </StatusCard>

            <StatusCard status={project.progress.planning == 100 ? (project.progress.implementation == 100 ? "completed" : "in_progress") : "pending"} style={{ width: '33%' }} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 opacity-60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-[#FF9900]/20 flex items-center justify-center">
                  <Code className="w-3 h-3 text-[#FF9900]" />
                </div>
                <h4 className="text-white text-sm font-semibold">Implement</h4>
              </div>
              <p className="text-[#9ca3af] text-xs font-medium mb-3">{project.progress.implementation}% complete</p>
              <button 
                  onClick={() => onSelectImplement(project)} 
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#6b7280] text-xs font-medium rounded cursor-not-allowed">
                Status & Details
              </button>
            </StatusCard>
          
        </div>
        <div className="flex justify-end">
          <button 
          onClick={handleSelect} 
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] cursor-pointer hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white text-sm font-medium rounded transition-colors">
            <Play className="w-4 h-4" />
            Continue
          </button>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}