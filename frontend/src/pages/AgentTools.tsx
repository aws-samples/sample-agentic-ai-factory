import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Wrench, Code, Database, Cloud, Pause, Settings, Play, Download, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toolConfigService, ToolConfig } from '../services/toolConfigService';

// Icon mapping for categories
const categoryIcons: { [key: string]: any } = {
  integration: Cloud,
  database: Database,
  utility: Wrench,
  development: Code,
  default: Wrench,
};

export function Tools() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await toolConfigService.listToolConfigs();
      console.log('Loaded tools:', data);
      setTools(data);
    } catch (err: any) {
      console.error('Failed to load tools:', err);
      setError(err.message || 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleState = async (tool: ToolConfig) => {
    try {
      setError(null);
      const newState = tool.state === 'active' ? 'inactive' : 'active';
      await toolConfigService.updateToolConfig({
        toolId: tool.toolId,
        state: newState,
      });
      await loadTools();
    } catch (err: any) {
      setError(err.message || 'Failed to update tool state');
    }
  };

  // Generate categories from tools
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    tools.forEach((tool) => {
      if (tool.categories && tool.categories.length > 0) {
        tool.categories.forEach((cat) => {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
      }
    });

    const categoryList = [
      { id: 'all', label: 'All Tools', icon: Wrench, count: tools.length },
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
  }, [tools]);

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const config = typeof tool.config === 'string' 
        ? JSON.parse(tool.config) 
        : tool.config;
      
      const matchesSearch = searchQuery === '' || 
        tool.toolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config?.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' ||
        (tool.categories && tool.categories.includes(selectedCategory));
      
      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0f1319]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Tools</h2>
            <p className="text-[#9ca3af] text-sm">
              Available tools and utilities for your agents
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-white text-[#0f1319] hover:bg-[#f2f3f3]"
              onClick={() => alert('Create tool coming soon!')}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Tool
            </Button>
            <Button 
              variant="outline"
              className="border-[#2a3142] text-white hover:bg-[#2a3142]"
              onClick={() => alert('Import tool coming soon!')}
            >
              <Download className="w-4 h-4 mr-2" />
              Import Tool
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f2e] border-[#2a3142] text-white placeholder:text-[#6b7280] focus:border-[#f90] focus:ring-[#f90]"
            />
          </div>
          <Button variant="outline" className="border-[#2a3142] text-white hover:bg-[#2a3142]">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;

            return (
              <Button
                key={category.id}
                variant="outline"
                className={`flex items-center gap-2 whitespace-nowrap border-[#2a3142] ${
                  isActive
                    ? 'bg-[#2a3142] text-white'
                    : 'text-[#9ca3af] hover:bg-[#2a3142] hover:text-white'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon className="w-4 h-4" />
                {category.label}
                <Badge variant="secondary" className="ml-1 bg-[#1a1f2e] text-[#9ca3af]">
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
              <p className="text-[#9ca3af]">Loading tools...</p>
            </div>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9ca3af] mb-4">No tools found</p>
            <Button 
              className="bg-white text-[#0f1319] hover:bg-[#f2f3f3]"
              onClick={() => alert('Create tool coming soon!')}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Tool
            </Button>
          </div>
        ) : (
          /* Tool Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const config = typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config;
              
              return (
                <Card key={tool.toolId} className="bg-[#1a1f2e] border-[#2a3142] hover:border-[#f90] transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-white text-lg">{config?.name || tool.toolId}</CardTitle>
                      <Badge
                        variant={tool.state === 'active' ? 'default' : 'secondary'}
                        className={
                          tool.state === 'active'
                            ? 'bg-green-500/20 text-green-500 border-green-500'
                            : 'bg-[#2a3142] text-[#6b7280]'
                        }
                      >
                        {tool.state}
                      </Badge>
                    </div>
                    <CardDescription className="text-[#9ca3af] line-clamp-2">
                      {config?.description || 'No description available'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-[#6b7280]">Version</span>
                        <p className="text-white font-medium">{config?.version || 'v0.0.0'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[#6b7280] text-xs">ID:</span>
                        <span className="text-[#9ca3af] text-xs">{tool.toolId}</span>
                      </div>
                    </div>

                    {/* Categories */}
                    {tool.categories && tool.categories.length > 0 && (
                      <div>
                        <h4 className="text-[#9ca3af] text-xs font-medium mb-2">Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {tool.categories.map((cat, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-[#0f1319] text-[#9ca3af] border-[#2a3142]"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    {tool.state === 'active' ? (
                      <Button
                        variant="outline"
                        className="flex-1 border-[#2a3142] text-white hover:bg-[#2a3142]"
                        onClick={() => handleToggleState(tool)}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="flex-1 border-[#2a3142] text-white hover:bg-[#2a3142]"
                        onClick={() => handleToggleState(tool)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="flex-1 border-[#2a3142] text-white hover:bg-[#2a3142]"
                      onClick={() => alert('Tool config coming soon!')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Config
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
