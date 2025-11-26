import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AwsBanner } from "@/components/ui/aws-banner";
import { 
  Plug,
  Search,
  Settings,
  CheckCircle,
  AlertCircle,
  Globe,
  Database,
  MessageSquare,
  Mail,
  Calendar,
  Cloud,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  Shield,
  BookOpen,
  X,
  GitBranch,
  Workflow,
  Zap,
  Share2,
  Brain,
  Key,
  Lock,
  UserCheck
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  status: "connected" | "disconnected" | "error" | "configuring";
  icon: React.ComponentType<any>;
  isPopular: boolean;
  lastSync: string;
  features: string[];
  pricing: "free" | "paid" | "freemium";
  setupComplexity: "easy" | "medium" | "advanced";
  protocol?: string;
}

const mockIntegrations: Integration[] = [
  {
    id: "1",
    name: "Slack",
    description: "Send notifications and updates to Slack channels when workflows complete",
    category: "communication",
    provider: "Slack Technologies",
    status: "connected",
    icon: MessageSquare,
    isPopular: true,
    lastSync: "2 minutes ago",
    features: ["Real-time notifications", "Channel routing", "Custom messages", "Thread replies"],
    pricing: "free",
    setupComplexity: "easy",
    protocol: "REST"
  },
  {
    id: "2",
    name: "Google Workspace",
    description: "Access Gmail, Drive, Sheets, and other Google services for data processing",
    category: "productivity", 
    provider: "Google",
    status: "connected",
    icon: Mail,
    isPopular: true,
    lastSync: "5 minutes ago",
    features: ["Gmail API", "Drive storage", "Sheets integration", "Calendar sync"],
    pricing: "freemium",
    setupComplexity: "medium",
    protocol: "REST"
  },
  {
    id: "3",
    name: "Salesforce",
    description: "Sync customer data and automate CRM workflows with AI insights",
    category: "crm",
    provider: "Salesforce",
    status: "disconnected",
    icon: Users,
    isPopular: true,
    lastSync: "Never",
    features: ["Lead management", "Contact sync", "Opportunity tracking", "Custom fields"],
    pricing: "paid",
    setupComplexity: "advanced",
    protocol: "REST"
  },
  {
    id: "4",
    name: "Stripe",
    description: "Process payments and handle billing automation for AI services",
    category: "payments",
    provider: "Stripe",
    status: "configuring",
    icon: CreditCard,
    isPopular: false,
    lastSync: "Configuring",
    features: ["Payment processing", "Subscription billing", "Invoice generation", "Webhook events"],
    pricing: "paid",
    setupComplexity: "medium",
    protocol: "REST"
  },
  {
    id: "5",
    name: "AWS S3",
    description: "Store and retrieve files, documents, and processed data in cloud storage",
    category: "storage",
    provider: "Amazon Web Services",
    status: "connected",
    icon: Cloud,
    isPopular: true,
    lastSync: "1 hour ago",
    features: ["File storage", "Data backup", "CDN integration", "Encryption"],
    pricing: "paid",
    setupComplexity: "medium",
    protocol: "REST"
  },
  {
    id: "6",
    name: "Zapier",
    description: "Connect to 5000+ apps and services through Zapier's automation platform",
    category: "automation",
    provider: "Zapier",
    status: "error",
    icon: Settings,
    isPopular: true,
    lastSync: "Error",
    features: ["Multi-app workflows", "Trigger events", "Data transformation", "Conditional logic"],
    pricing: "freemium",
    setupComplexity: "easy",
    protocol: "REST"
  },
  {
    id: "7",
    name: "PostgreSQL",
    description: "Connect to PostgreSQL databases for data analysis and storage",
    category: "database",
    provider: "PostgreSQL Global Development Group",
    status: "disconnected",
    icon: Database,
    isPopular: false,
    lastSync: "Never",
    features: ["SQL queries", "Data export", "Real-time sync", "Custom schemas"],
    pricing: "free",
    setupComplexity: "advanced",
    protocol: "Direct API"
  },
  {
    id: "8",
    name: "Tableau",
    description: "Create interactive dashboards and visualizations from AI analysis results",
    category: "analytics",
    provider: "Tableau",
    status: "disconnected",
    icon: BarChart3,
    isPopular: false,
    lastSync: "Never",
    features: ["Data visualization", "Interactive dashboards", "Report generation", "Data blending"],
    pricing: "paid",
    setupComplexity: "medium",
    protocol: "REST"
  },
  {
    id: "9",
    name: "Canva MCP Server",
    description: "MCP protocol integration for Canva - access design tools, templates, and creative automation capabilities",
    category: "productivity",
    provider: "Canva (MCP Protocol)",
    status: "connected",
    icon: FileText,
    isPopular: true,
    lastSync: "3 minutes ago",
    features: ["Design templates", "Asset management", "Brand kit access", "Export automation", "Collaboration tools"],
    pricing: "freemium",
    setupComplexity: "medium",
    protocol: "MCP"
  },
  {
    id: "10",
    name: "Anthropic Claude",
    description: "Connect to Claude via MCP protocol for advanced conversational AI capabilities and code analysis",
    category: "ai-services",
    provider: "Anthropic",
    status: "connected",
    icon: Zap,
    isPopular: true,
    lastSync: "1 minute ago",
    features: ["Conversational AI", "Long context", "Tool use", "Agent capabilities", "Code analysis"],
    pricing: "paid",
    setupComplexity: "medium",
    protocol: "MCP"
  },
  {
    id: "11",
    name: "Atlassian Jira & Confluence",
    description: "MCP integration for Atlassian Jira issue tracking and Confluence documentation platform",
    category: "productivity",
    provider: "Atlassian",
    status: "connected",
    icon: FileText,
    isPopular: true,
    lastSync: "5 minutes ago",
    features: ["Issue tracking", "Documentation", "Project management", "Team collaboration", "Knowledge base"],
    pricing: "freemium",
    setupComplexity: "medium",
    protocol: "MCP"
  },
  {
    id: "12",
    name: "BitBucket",
    description: "MCP integration for Atlassian BitBucket - Git repository management and code collaboration",
    category: "productivity",
    provider: "Atlassian",
    status: "connected",
    icon: GitBranch,
    isPopular: true,
    lastSync: "8 minutes ago",
    features: ["Repository access", "Code review", "Branch management", "Pull requests", "Version control"],
    pricing: "freemium",
    setupComplexity: "medium",
    protocol: "MCP"
  },
  {
    id: "13",
    name: "Filesystem",
    description: "MCP integration for local and remote filesystem access - read, write, and manage files",
    category: "storage",
    provider: "MCP Protocol",
    status: "connected",
    icon: FileText,
    isPopular: false,
    lastSync: "3 minutes ago",
    features: ["File operations", "Directory management", "File search", "Path resolution", "File monitoring"],
    pricing: "free",
    setupComplexity: "easy",
    protocol: "MCP"
  },
  {
    id: "14",
    name: "GitHub",
    description: "API integration for GitHub - repository management, issues, pull requests, and actions",
    category: "productivity",
    provider: "GitHub",
    status: "connected",
    icon: GitBranch,
    isPopular: true,
    lastSync: "4 minutes ago",
    features: ["Repository management", "Issue tracking", "Pull requests", "Actions", "Webhooks", "Code search"],
    pricing: "freemium",
    setupComplexity: "medium",
    protocol: "REST"
  },
  {
    id: "15",
    name: "Atlassian Rovo Agent",
    description: "A2A protocol integration for Atlassian Rovo - AI-powered agent for knowledge discovery and team collaboration",
    category: "ai-services",
    provider: "Atlassian",
    status: "connected",
    icon: Brain,
    isPopular: true,
    lastSync: "2 minutes ago",
    features: ["Knowledge discovery", "Team collaboration", "Agent-to-Agent communication", "Context sharing", "Smart search"],
    pricing: "freemium",
    setupComplexity: "medium",
    protocol: "A2A"
  },
  {
    id: "16",
    name: "OAuth 2.0",
    description: "Industry-standard protocol for authorization - secure delegated access to user resources",
    category: "security",
    provider: "OAuth Foundation",
    status: "connected",
    icon: Key,
    isPopular: true,
    lastSync: "1 minute ago",
    features: ["Token-based authentication", "Delegated access", "Scope management", "Refresh tokens", "Client credentials"],
    pricing: "free",
    setupComplexity: "medium",
    protocol: "Identity"
  },
  {
    id: "17",
    name: "OpenID Connect (OIDC)",
    description: "Authentication layer on top of OAuth 2.0 - verify user identity and obtain profile information",
    category: "security",
    provider: "OpenID Foundation",
    status: "connected",
    icon: UserCheck,
    isPopular: true,
    lastSync: "3 minutes ago",
    features: ["Identity verification", "SSO support", "User profile claims", "ID tokens", "Session management"],
    pricing: "free",
    setupComplexity: "medium",
    protocol: "Identity"
  },
  {
    id: "18",
    name: "LDAP",
    description: "Lightweight Directory Access Protocol - access and manage directory information services",
    category: "security",
    provider: "IETF",
    status: "connected",
    icon: Users,
    isPopular: false,
    lastSync: "10 minutes ago",
    features: ["Directory services", "User authentication", "Group management", "Organizational hierarchy", "Attribute queries"],
    pricing: "free",
    setupComplexity: "advanced",
    protocol: "Identity"
  },
  {
    id: "19",
    name: "SAML",
    description: "Security Assertion Markup Language - XML-based standard for exchanging authentication and authorization data",
    category: "security",
    provider: "OASIS",
    status: "connected",
    icon: Lock,
    isPopular: false,
    lastSync: "5 minutes ago",
    features: ["Single Sign-On (SSO)", "Identity federation", "Cross-domain authentication", "Assertion-based", "Service provider integration"],
    pricing: "free",
    setupComplexity: "advanced",
    protocol: "Identity"
  }
];

const categories = [
  { id: "all", label: "All Integrations", icon: Plug, count: mockIntegrations.length },
  { id: "communication", label: "Communication", icon: MessageSquare, count: mockIntegrations.filter(i => i.category === "communication").length },
  { id: "productivity", label: "Productivity", icon: FileText, count: mockIntegrations.filter(i => i.category === "productivity").length },
  { id: "crm", label: "CRM", icon: Users, count: mockIntegrations.filter(i => i.category === "crm").length },
  { id: "payments", label: "Payments", icon: CreditCard, count: mockIntegrations.filter(i => i.category === "payments").length },
  { id: "storage", label: "Storage", icon: Cloud, count: mockIntegrations.filter(i => i.category === "storage").length },
  { id: "automation", label: "Automation", icon: Settings, count: mockIntegrations.filter(i => i.category === "automation").length },
  { id: "database", label: "Database", icon: Database, count: mockIntegrations.filter(i => i.category === "database").length },
  { id: "analytics", label: "Analytics", icon: BarChart3, count: mockIntegrations.filter(i => i.category === "analytics").length },
  { id: "ai-services", label: "AI Services", icon: Zap, count: mockIntegrations.filter(i => i.category === "ai-services").length },
  { id: "security", label: "Security & Identity", icon: Shield, count: mockIntegrations.filter(i => i.category === "security").length }
];

const statusColors = {
  connected: "bg-transparent text-green-400 border border-green-500/50",
  disconnected: "bg-transparent text-gray-400 border border-gray-500/50",
  error: "bg-transparent text-red-400 border border-red-500/50",
  configuring: "bg-transparent text-gray-400 border border-gray-500/50"
};

const statusIcons = {
  connected: CheckCircle,
  disconnected: Globe,
  error: AlertCircle,
  configuring: Settings
};

const pricingColors = {
  free: "bg-transparent text-green-400 border border-green-500/50",
  paid: "bg-transparent text-blue-400 border border-blue-500/50",
  freemium: "bg-transparent text-purple-400 border border-purple-500/50"
};

const complexityColors = {
  easy: "bg-transparent text-green-400 border border-green-500/50",
  medium: "bg-transparent text-yellow-400 border border-yellow-500/50",
  advanced: "bg-transparent text-red-400 border border-red-500/50"
};

const protocolColors = {
  "MCP": "bg-transparent text-blue-400 border border-blue-500/50",
  "REST": "bg-transparent text-green-400 border border-green-500/50",
  "A2A": "bg-transparent text-purple-400 border border-purple-500/50",
  "Direct API": "bg-transparent text-orange-400 border border-orange-500/50",
  "Identity": "bg-transparent text-cyan-400 border border-cyan-500/50"
};

export function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"connected" | "available" | "graph">("graph");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Atlassian MCP Config State
  const [atlassianConfig, setAtlassianConfig] = useState({
    baseUrl: "",
    apiKey: "",
    workspace: "",
    confluenceEnabled: true,
    jiraEnabled: true,
    bitbucketEnabled: true
  });

  const filteredIntegrations = mockIntegrations.filter(integration => {
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesView = viewMode === "connected" ? 
      integration.status === "connected" || integration.status === "configuring" || integration.status === "error" :
      viewMode === "available" ? true : true;
    
    return matchesCategory && matchesSearch && matchesView;
  });

  const connectedIntegrations = mockIntegrations.filter(i => i.status === "connected");

  return (
    <div className="flex flex-col" style={{ width: '100%', maxWidth: '100%', padding: '12px', boxSizing: 'border-box', minWidth: 0 }}>
      
      <div className="flex items-center justify-between flex-shrink-0 mb-3">
        <div>
          <h1 className="text-lg font-semibold mb-0">Integrations</h1>
          <p className="text-muted-foreground text-xs">
            Connect your AI workflows with external services and tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1 text-xs py-1 px-2 h-7">
            <Plug className="h-3 w-3" />
            Add Connectors
          </Button>
          <Button variant="outline" className="gap-1 text-xs py-1 px-2 h-7">
            <Shield className="h-3 w-3" />
            API Keys
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="flex-shrink-0">
        <TabsList className="flex-shrink-0 mb-2">
          <TabsTrigger value="graph" className="text-xs px-3 py-1">
            <Share2 className="h-3 w-3 mr-1" />
            Integration Graph
          </TabsTrigger>
          <TabsTrigger value="connected" className="text-xs px-3 py-1">
            Connected ({mockIntegrations.filter(i => i.status === "connected").length})
          </TabsTrigger>
          <TabsTrigger value="available" className="text-xs px-3 py-1">Available</TabsTrigger>
        </TabsList>

        <div style={{ minWidth: 0 }}>
          {/* Graph View */}
          <TabsContent value="graph" className="h-auto m-0 p-0">
            <div className="w-full rounded-lg" style={{
              backgroundColor: '#0f1419',
              border: '1px dashed rgba(59, 130, 246, 0.2)',
              backgroundImage: 'linear-gradient(to bottom, #0f1419, #1a1f2e)',
              padding: '32px 24px',
              boxSizing: 'border-box'
            }}>
              <div className="flex flex-col items-center justify-start w-full" style={{ gap: '32px', paddingBottom: '24px', maxWidth: '100%' }}>
                {/* Factory Core */}
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Pulse animation - behind the box */}
                    <div
                      className="absolute inset-0 rounded-2xl animate-ping"
                      style={{ backgroundColor: '#f97316', opacity: 0.3 }}
                    ></div>
                    {/* Main box */}
                    <div
                      className="relative rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        padding: '32px 48px',
                        boxShadow: '0 0 40px rgba(249, 115, 22, 0.5)'
                      }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="text-center">
                          <h3 className="font-bold text-lg" style={{ color: 'white' }}>AI Factory Core</h3>
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Multi-Agent System</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Protocol Sections */}
                <div style={{
                  width: '100%',
                  margin: '0 auto',
                  boxSizing: 'border-box',
                  minWidth: 0
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: '16px',
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0
                  }}>
                  {/* MCP Protocol */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden', alignItems: 'center', width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        fontSize: '11px',
                        fontWeight: '500',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        whiteSpace: 'nowrap'
                      }}>MCP Protocol</span>
                    </div>
                    {connectedIntegrations.filter(i => i.protocol === "MCP").map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="hover:shadow-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '2px solid #3b82f6',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setConfigDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Icon className="h-5 w-5" style={{ color: '#3b82f6' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ color: 'white', fontSize: '13px', fontWeight: '500', lineHeight: '1.3' }}>{integration.name}</p>
                              <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.3' }}>Connected</p>
                            </div>
                            <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* REST Protocol */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden', alignItems: 'center', width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#4ade80',
                        fontSize: '11px',
                        fontWeight: '500',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        whiteSpace: 'nowrap'
                      }}>REST API</span>
                    </div>
                    {connectedIntegrations.filter(i => i.protocol === "REST").slice(0, 3).map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="hover:shadow-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '2px solid #22c55e',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setConfigDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Icon className="h-5 w-5" style={{ color: '#22c55e' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ color: 'white', fontSize: '13px', fontWeight: '500', lineHeight: '1.3' }}>{integration.name}</p>
                              <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.3' }}>Connected</p>
                            </div>
                            <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                          </div>
                        </div>
                      );
                    })}
                    {connectedIntegrations.filter(i => i.protocol === "REST").length > 3 && (
                      <div className="text-center" style={{ color: '#94a3b8', fontSize: '12px' }}>
                        +{connectedIntegrations.filter(i => i.protocol === "REST").length - 3} more
                      </div>
                    )}
                  </div>

                  {/* A2A Protocol */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden', alignItems: 'center', width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        backgroundColor: 'rgba(168, 85, 247, 0.2)',
                        color: '#c084fc',
                        fontSize: '11px',
                        fontWeight: '500',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        whiteSpace: 'nowrap'
                      }}>A2A Protocol</span>
                    </div>
                    {connectedIntegrations.filter(i => i.protocol === "A2A").map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="hover:shadow-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '2px solid #a855f7',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setConfigDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Icon className="h-5 w-5" style={{ color: '#a855f7' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ color: 'white', fontSize: '13px', fontWeight: '500', lineHeight: '1.3' }}>{integration.name}</p>
                              <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.3' }}>Connected</p>
                            </div>
                            <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Direct API */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden', alignItems: 'center', width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        backgroundColor: 'rgba(249, 115, 22, 0.2)',
                        color: '#fb923c',
                        fontSize: '11px',
                        fontWeight: '500',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        whiteSpace: 'nowrap'
                      }}>Direct API</span>
                    </div>
                    {connectedIntegrations.filter(i => i.protocol === "Direct API").map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="hover:shadow-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '2px solid #f97316',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setConfigDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Icon className="h-5 w-5" style={{ color: '#f97316' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ color: 'white', fontSize: '13px', fontWeight: '500', lineHeight: '1.3' }}>{integration.name}</p>
                              <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.3' }}>Connected</p>
                            </div>
                            <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Identity Protocols */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, overflow: 'hidden', alignItems: 'center', width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.2)',
                        color: '#22d3ee',
                        fontSize: '11px',
                        fontWeight: '500',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        whiteSpace: 'nowrap'
                      }}>Identity Protocols</span>
                    </div>
                    {connectedIntegrations.filter(i => i.protocol === "Identity").map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="hover:shadow-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '2px solid #06b6d4',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setConfigDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Icon className="h-5 w-5" style={{ color: '#06b6d4' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ color: 'white', fontSize: '13px', fontWeight: '500', lineHeight: '1.3' }}>{integration.name}</p>
                              <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.3' }}>Connected</p>
                            </div>
                            <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm pt-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                    <span className="text-slate-300">MCP ({mockIntegrations.filter(i => i.protocol === "MCP").length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                    <span className="text-slate-300">REST ({mockIntegrations.filter(i => i.protocol === "REST").length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#a855f7' }}></div>
                    <span className="text-slate-300">A2A ({mockIntegrations.filter(i => i.protocol === "A2A").length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
                    <span className="text-slate-300">Direct API ({mockIntegrations.filter(i => i.protocol === "Direct API").length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#06b6d4' }}></div>
                    <span className="text-slate-300">Identity ({mockIntegrations.filter(i => i.protocol === "Identity").length})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol Description Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: '12px',
              marginTop: '16px',
              width: '100%'
            }}>
              {/* MCP Protocol Card */}
              <div style={{
                backgroundColor: '#0f1419',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>MCP Protocol</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>
                  Model Context Protocol for standardized AI integrations with context sharing
                </p>
              </div>

              {/* REST API Card */}
              <div style={{
                backgroundColor: '#0f1419',
                border: '2px solid #22c55e',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>REST API</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>
                  Standard RESTful APIs for traditional service integrations
                </p>
              </div>

              {/* A2A Protocol Card */}
              <div style={{
                backgroundColor: '#0f1419',
                border: '2px solid #a855f7',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#a855f7' }}></div>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>A2A Protocol</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>
                  Agent-to-Agent communication for distributed AI systems
                </p>
              </div>

              {/* Direct API Card */}
              <div style={{
                backgroundColor: '#0f1419',
                border: '2px solid #f97316',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Direct API</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>
                  Direct database and system connections for low-level access
                </p>
              </div>

              {/* Identity Protocols Card */}
              <div style={{
                backgroundColor: '#0f1419',
                border: '2px solid #06b6d4',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#06b6d4' }}></div>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Identity Protocols</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>
                  Authentication and authorization protocols (OAuth 2.0, OIDC, LDAP, SAML)
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Connected/Available Views */}
          <TabsContent value={viewMode} className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center gap-4" style={{ marginTop: '15px' }}>
              <div className="flex items-center flex-1 max-w-md h-10 px-3 rounded-lg" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e' }}>
                <Search className="h-4 w-4 text-slate-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-300 placeholder:text-slate-500 text-sm"
                  style={{ background: 'transparent' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
                    style={{
                      backgroundColor: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0f172a' : '#cbd5e1',
                      border: isActive ? '1px solid #ffffff' : '1px solid #475569'
                    }}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{category.label}</span>
                    <span
                      className="text-sm flex-shrink-0"
                      style={{
                        color: isActive ? '#0f172a' : '#94a3b8'
                      }}
                    >
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;
                const StatusIcon = statusIcons[integration.status];
                
                return (
                  <Card key={integration.id} className="hover:shadow-lg transition-shadow" style={{ backgroundColor: '#0f1419', border: '1px solid #2a2a3e' }}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <Icon className="h-6 w-6 text-slate-300" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2 text-white">
                              {integration.name}
                              {integration.isPopular && (
                                <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-200 border-0">
                                  Popular
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-xs text-slate-400">
                              by {integration.provider}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={`h-4 w-4 ${integration.status === 'connected' ? 'text-green-400' : integration.status === 'error' ? 'text-red-400' : 'text-slate-400'}`} />
                          <Badge className={statusColors[integration.status]} variant="secondary">
                            {integration.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <CardDescription className="text-slate-400">
                        {integration.description}
                      </CardDescription>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={pricingColors[integration.pricing]} variant="secondary">
                            {integration.pricing}
                          </Badge>
                          <Badge className={complexityColors[integration.setupComplexity]} variant="secondary">
                            {integration.setupComplexity} setup
                          </Badge>
                        </div>
                      </div>

                      {integration.protocol && (
                        <div>
                          <Badge className={protocolColors[integration.protocol]} variant="secondary">
                            {integration.protocol}
                          </Badge>
                        </div>
                      )}
                      
                      {integration.status === "connected" && (
                        <div className="text-xs text-slate-500">
                          Last sync: {integration.lastSync}
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-sm font-medium text-slate-300">Key Features</span>
                        <div className="flex flex-wrap gap-1">
                          {integration.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs text-slate-300 border-slate-600 bg-transparent">
                              {feature}
                            </Badge>
                          ))}
                          {integration.features.length > 3 && (
                            <Badge variant="outline" className="text-xs text-slate-400 border-slate-600 bg-transparent">
                              +{integration.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {integration.status === "connected" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setConfigDialogOpen(true);
                              }}
                            >
                              Configure
                            </Button>
                            <Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                              Disconnect
                            </Button>
                          </>
                        ) : integration.status === "configuring" ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-white text-slate-900 hover:bg-slate-100"
                            onClick={() => {
                              setSelectedIntegration(integration);
                              setConfigDialogOpen(true);
                            }}
                          >
                            Complete Setup
                          </Button>
                        ) : integration.status === "error" ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                            onClick={() => {
                              setSelectedIntegration(integration);
                              setConfigDialogOpen(true);
                            }}
                          >
                            Reconnect
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1 bg-white text-slate-900 hover:bg-slate-100"
                            onClick={() => {
                              setSelectedIntegration(integration);
                              setConfigDialogOpen(true);
                            }}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-12">
                <Plug className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-slate-300">No integrations found</h3>
                <p className="text-slate-500">
                  Try adjusting your search or category filters
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration?.icon && <selectedIntegration.icon className="h-5 w-5" />}
              Configure {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.id === "9" 
                ? "Set up your Atlassian MCP Server integration to connect Confluence, Jira, and Bitbucket"
                : `Configure ${selectedIntegration?.name} integration settings`}
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration?.id === "9" && (
            <div className="space-y-6 py-4">
              {/* MCP Protocol Badge */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">MCP Protocol Integration</span>
                <Badge variant="outline" className="ml-auto">Model Context Protocol</Badge>
              </div>

              {/* Configuration Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input 
                    id="baseUrl"
                    placeholder="https://your-workspace.atlassian.net"
                    value={atlassianConfig.baseUrl}
                    onChange={(e) => setAtlassianConfig({...atlassianConfig, baseUrl: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Atlassian instance URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input 
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Atlassian API key"
                    value={atlassianConfig.apiKey}
                    onChange={(e) => setAtlassianConfig({...atlassianConfig, apiKey: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate an API key from your Atlassian account settings
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace ID</Label>
                  <Input 
                    id="workspace"
                    placeholder="Enter your workspace identifier"
                    value={atlassianConfig.workspace}
                    onChange={(e) => setAtlassianConfig({...atlassianConfig, workspace: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Atlassian workspace or organization ID
                  </p>
                </div>
              </div>

              {/* Endpoint Configuration */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Enable Services</h4>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Confluence</p>
                      <p className="text-xs text-muted-foreground">Access documentation and knowledge bases</p>
                    </div>
                  </div>
                  <Switch 
                    checked={atlassianConfig.confluenceEnabled}
                    onCheckedChange={(checked) => setAtlassianConfig({...atlassianConfig, confluenceEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-sm">Jira</p>
                      <p className="text-xs text-muted-foreground">Query and manage issues, projects, and workflows</p>
                    </div>
                  </div>
                  <Switch 
                    checked={atlassianConfig.jiraEnabled}
                    onCheckedChange={(checked) => setAtlassianConfig({...atlassianConfig, jiraEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-sm">Bitbucket</p>
                      <p className="text-xs text-muted-foreground">Access repositories, pull requests, and code management</p>
                    </div>
                  </div>
                  <Switch 
                    checked={atlassianConfig.bitbucketEnabled}
                    onCheckedChange={(checked) => setAtlassianConfig({...atlassianConfig, bitbucketEnabled: checked})}
                  />
                </div>
              </div>

              {/* Information Box */}
              <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  MCP Integration Benefits
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs ml-6">
                  <li>Secure, standardized protocol for AI integrations</li>
                  <li>Real-time access to Confluence documentation</li>
                  <li>Query and update Jira issues programmatically</li>
                  <li>Access Bitbucket repositories and pull requests</li>
                  <li>Automatic synchronization with your workspace</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Handle connection logic here
                    setConfigDialogOpen(false);
                  }}
                >
                  <Plug className="h-4 w-4 mr-2" />
                  Connect via MCP
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Test connection logic
                  }}
                >
                  Test Connection
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setConfigDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Generic configuration for other integrations */}
          {selectedIntegration?.id !== "9" && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Configuration interface for {selectedIntegration?.name} will be displayed here.
              </p>
              {selectedIntegration?.protocol && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Protocol Information</p>
                  <Badge className={protocolColors[selectedIntegration.protocol]}>
                    {selectedIntegration.protocol}
                  </Badge>
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1">Save Configuration</Button>
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
