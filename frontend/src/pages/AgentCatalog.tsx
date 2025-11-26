import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, BarChart3, Palette, Code, FileText, Eye, Briefcase, Download, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { agentConfigService, AgentConfig } from '../services/agentConfigService';
import { AgentDetails } from '../components/AgentDetails';
import { CreateAgentWizard } from '../components/CreateAgentWizard';
import { AgentCard } from '../components/AgentCard';

type SubView = 'catalog' | 'details' | 'create';

// Icon mapping for categories
const categoryIcons: { [key: string]: any } = {
  analytics: BarChart3,
  design: Palette,
  development: Code,
  nlp: FileText,
  vision: Eye,
  business: Briefcase,
  default: FileText,
};

export function AgentCatalog() {
  const [subView, setSubView] = useState<SubView>('catalog');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('built-in');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentConfigService.listAgentConfigs();
      console.log('Loaded agents:', data);
      console.log('First agent config:', data[0]?.config);
      console.log('First agent config type:', typeof data[0]?.config);
      setAgents(data);
    } catch (err: any) {
      console.error('Failed to load agents:', err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleState = async (agent: AgentConfig) => {
    try {
      setError(null);
      const newState = agent.state === 'active' ? 'inactive' : 'active';
      await agentConfigService.updateAgentConfig({
        agentId: agent.agentId,
        state: newState,
      });
      await loadAgents();
    } catch (err: any) {
      setError(err.message || 'Failed to update agent state');
    }
  };

  const handleConfigureAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setSubView('details');
  };

  const handleCreateAgent = () => {
    setSelectedAgentId(null);
    setSubView('create');
  };

  const handleImportAgent = () => {
    // TODO: Implement import functionality
    // This could open a file picker or a modal to paste JSON
    console.log('Import agent clicked');
    alert('Import functionality coming soon!');
  };

  const handleBackToCatalog = () => {
    setSelectedAgentId(null);
    setSubView('catalog');
    loadAgents(); // Refresh the list
  };

  // Generate categories from agents (must be before early returns)
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    agents.forEach((agent) => {
      if (agent.categories && agent.categories.length > 0) {
        agent.categories.forEach((cat) => {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
      }
    });

    const categoryList = [
      { id: 'all', label: 'All Agents', icon: FileText, count: agents.length },
    ];

    Array.from(categoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, count]) => {
        categoryList.push({
          id: category,
          label: category.charAt(0).toUpperCase() + category.slice(1),
          icon: categoryIcons[category.toLowerCase()] || categoryIcons.default,
          count,
        });
      });

    return categoryList;
  }, [agents]);

  // Filter agents based on search and category (must be before early returns)
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Parse config if it's a string
      const config = typeof agent.config === 'string' 
        ? JSON.parse(agent.config) 
        : agent.config;
      
      const matchesSearch = searchQuery === '' || 
        agent.agentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' ||
      (agent.categories && agent.categories.includes(selectedCategory));
    
      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  // Render sub-pages (after all hooks)
  if (subView === 'details' && selectedAgentId) {
    return (
      <AgentDetails
        agentId={selectedAgentId}
        onBack={handleBackToCatalog}
        onSave={handleBackToCatalog}
      />
    );
  }

  if (subView === 'create') {
    return (
      <CreateAgentWizard
        onBack={handleBackToCatalog}
        onComplete={handleBackToCatalog}
      />
    );
  }

  return (
    <div className="space-y-6" style={{margin:"15px"}}>

      {/* AI Agents Section */}
      {/* <div className="p-6"> */}
        <div className="flex items-center justify-between px-2">
          <div>
            <h1 className="text-2xl font-semibold text-white" style={{ fontWeight: 600 }}>AI Agents</h1>
            <p className="text-sm mt-1" style={{ color: '#8b8b8b' }}>
              Discover, deploy, and manage AI agents for your workflows
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
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
              onClick={handleCreateAgent}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Worker
            </Button>
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
              onClick={handleImportAgent}
            >
              <Download className="w-4 h-4 mr-2" />
              Import Agent
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 10 }}>
              <Search className="h-4 w-4" style={{ color: '#6b7280' }} />
            </div>
            <Input
              type="text"
              placeholder="Search agents..."
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #3a3a3a',
                color: 'white',
                fontSize: '14px',
                paddingLeft: '36px'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
              onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
            />
          </div>
          <Button 
            variant="outline" 
            className="gap-2 h-10 px-4 font-medium rounded-md inline-flex items-center transition-colors"
            style={{
                backgroundColor: 'transparent',
                border: '1px solid #3a3a3a',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2" style={{marginTop:"20px"}}>
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;

            return (
              <Button
                key={category.id}
                variant="outline"
                className="gap-2 h-9 px-3 font-medium rounded-md inline-flex items-center transition-all"
                style={{
                  backgroundColor: isActive ? '#ffffff' : '#1a1a1a',
                  color: isActive ? '#000000' : '#8b8b8b',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={() => setSelectedCategory(category.id)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
                <Badge 
                  variant="secondary" 
                  className="ml-1 text-xs px-1.5 py-0.5 font-semibold rounded"
                  style={{
                    backgroundColor: isActive ? '#000000' : '#0a0a0a',
                    color: isActive ? '#ffffff' : '#6b7280',
                    fontSize: '11px',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}
                >
                  {category.count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f90] mx-auto mb-4"></div>
              <p className="text-[#9ca3af]">Loading agents...</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9ca3af] mb-4">No agents found</p>
            <div className="flex gap-2 justify-center">
              <Button 
                className="bg-white text-[#0f1319] hover:bg-[#f2f3f3]"
                onClick={handleCreateAgent}
              >
                <Save className="w-4 h-4 mr-2" />
                Create Worker
              </Button>
              <Button 
                variant="outline"
                className="border-[#2a3142] text-white hover:bg-[#2a3142]"
                onClick={handleImportAgent}
              >
                <Download className="w-4 h-4 mr-2" />
                Import Agent
              </Button>
            </div>
          </div>
        ) : (
          /* Agent Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                onToggleState={handleToggleState}
                onConfigure={handleConfigureAgent}
              />
            ))}
          </div>
        )}
      {/* </div> */}
    </div>
  );
}
