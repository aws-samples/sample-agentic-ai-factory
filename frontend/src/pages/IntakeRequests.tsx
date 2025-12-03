import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Search, Code, Repeat, CheckCircle2, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { CreateProject } from '../components/CreateProject';
import { AssessmentChat } from '../components/AssessmentChat';
import { ProjectDashboard } from '../components/ProjectDashboard';
import { ProjectCard } from '../components/ProjectCard';
import { projectService, type Project } from '../services';


type SubView = 'list' | 'create' | 'assessment' | 'dashboard';

export function IntakeRequests() {
  const [subView, setSubView] = useState<SubView>('list');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    
    // Poll for updates every 5 seconds when viewing the list (silent mode)
    const interval = setInterval(() => {
      if (subView === 'list') {
        loadProjects(true);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [subView]);

  const loadProjects = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const projectsList = await projectService.listProjects();
      // Only update if data actually changed
      const hasChanged = JSON.stringify(projectsList) !== JSON.stringify(projects);
      if (hasChanged) {
        setProjects(projectsList);
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleCreateProject = () => {
    setSubView('create');
  };

  const handleCreateProjectSubmit = async (name: string, description: string) => {
    setError(null);
    
    try {
      const newProject = await projectService.createProject({
        name,
        description,
      });
      
      setProjects([newProject, ...projects]);
      setSelectedProject(newProject);
      setSubView('assessment');
    } catch (err: any) {
      console.error('Failed to create request:', err);
      setError(err.message || 'Failed to create project');
    }
  };

  const handleSelectAssess = (project: Project) => {
    setSelectedProject(project);
    if (project.progress?.assessment === 100) {
      setSubView('dashboard');
    } else {
      setSubView('assessment');
    }
  };

  const handleSelectPlan = (project: Project) => {
    setSelectedProject(project);
    
    // If assessment is complete but design is not, go to assessment page to generate report
    if (project.progress?.assessment === 100 && project.progress?.design !== 100) {
      setSubView('assessment');
    }
    // If both assessment and design are complete, go to dashboard
    else if (project.progress?.assessment === 100 && project.progress?.design === 100) {
      setSubView('dashboard');
    }
  };

  const handleSelectImplement = (project: Project) => {
    setSelectedProject(project);

    console.log('Implement phase clicked');
    alert('Implement functionality coming soon!');
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setSubView('list');
    loadProjects(); // Refresh the list
  };

  const handleCompleteAssessment = async () => {
    if (!selectedProject) return;
    
    setError(null);
    
    try {
      const wasTriggered = await projectService.generateDesign(selectedProject.id);
      
      if (!wasTriggered) {
        // Design already complete, navigate to dashboard
        setSubView('dashboard');
      }

      // Otherwise stay on assessment page - design progress bar will show generation progress

    } catch (err: any) {
      console.error('Failed to complete request:', err);
      setError(err.message || 'Failed to complete request');
    }
  };

  // Render sub-pages
  if (subView === 'create') {
    return (
      <CreateProject
        onBack={handleBackToList}
        onCreate={handleCreateProjectSubmit}
      />
    );
  }

  if (subView === 'assessment' && selectedProject) {
    return (
      <AssessmentChat
        project={selectedProject}
        onBack={handleBackToList}
        onComplete={handleCompleteAssessment}
      />
    );
  }

  if (subView === 'dashboard' && selectedProject) {
    return (
      <ProjectDashboard
        project={selectedProject}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a]" style={{margin:"15px"}}>
      {/* Hero Banner */}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="mb-6">
              <h2 className="text-white text-2xl font-bold"  style={{marginTop:"15px"}}>Request Pipeline</h2>
              <p className="text-[#9ca3af] text-sm">
                Track requests through Assess → Plan → Implement → Iterate stages
              </p>
            </div>
            <Button 
              variant="outline"
              className="gap-2 px-4 py-2 rounded-md font-medium inline-flex items-center transition-colors"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                height: '38px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              onClick={handleCreateProject} 
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              New Intake Request
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Pipeline Stats Cards */}
        <div className="flex gap-4 mb-4">
          {/* Assess */}
          <div className="flex-1 rounded-lg p-4 border border-[#3b82f6]/30" style={{backgroundColor: "rgba(59, 130, 246, 0.1)"}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm">Assess</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-[#3b82f6]" />
              </div>
            </div>
            <p className="text-white text-3xl font-bold">2</p>
          </div>

          {/* Plan */}
          <div className="flex-1 rounded-lg p-4 border border-[#8B5CF6]/30" style={{backgroundColor: "rgba(139, 92, 246, 0.1)"}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm">Plan</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-[#8B5CF6]" />
              </div>
            </div>
            <p className="text-white text-3xl font-bold">1</p>
          </div>

          {/* Implement */}
          <div className="flex-1 rounded-lg p-4 border border-[#FF9900]/30" style={{backgroundColor: "rgba(255, 153, 0, 0.1)"}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm">Implement</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code className="w-6 h-6 text-[#FF9900]" />
              </div>
            </div>
            <p className="text-white text-3xl font-bold">1</p>
          </div>

          {/* Iterate */}
          {/* <div className="flex-1 rounded-lg p-4 border border-[#06b6d4]/30" style={{backgroundColor: "rgba(6, 182, 212, 0.1)"}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm">Iterate</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Repeat className="w-6 h-6 text-[#06b6d4]" />
              </div>
            </div>
            <p className="text-white text-3xl font-bold">1</p>
          </div> */}

          {/* Completed */}
          <div className="flex-1 rounded-lg p-4 border border-[#00C896]/30" style={{backgroundColor: "rgba(0, 200, 150, 0.1)"}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm">Completed</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#00C896]" />
              </div>
            </div>
            <p className="text-white text-3xl font-bold">1</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mb-2 rounded-lg p-1" style={{backgroundColor: "rgb(37 37 37)", width:"22%", padding:"5px"}}>
          <button className="px-3 py-3 text-white text-base font-semibold rounded-lg transition-colors" style={{fontSize:"10px"}}>
            All (6)
          </button>
          <button className="px-3 py-3 text-[#6b7280] text-base font-medium hover:text-white transition-colors" style={{fontSize:"10px"}}>
            Active (4)
          </button>
          <button className="px-3 py-3 text-[#6b7280] text-base font-medium hover:text-white transition-colors" style={{fontSize:"10px"}}>
            Completed (1)
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading requests...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-foreground mb-2">No intake requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first request to begin an agentic AI assessment
                </p>
                <Button onClick={handleCreateProject} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id}
                project={project} 
                onSelectAssess={handleSelectAssess} 
                onSelectPlan={handleSelectPlan}
                onSelectImplement={handleSelectImplement}
                />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
