import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Building2,
  Wand2,
  Plug,
  Wrench,
  Database,
  Users,
  Bell,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { useOrganization } from '../contexts/OrganizationContext';
import { useState } from 'react';

interface AppSidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'intake-requests', label: 'Intake Requests', icon: Inbox },
  { id: 'agentic-studio', label: 'Agentic Studio', icon: Wand2 },
  { id: 'agent-catalog', label: 'Agent Catalog', icon: FolderKanban },
  { id: 'tools', label: 'Agent Tools', icon: Wrench },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'data-stores', label: 'Data Stores', icon: Database },
  { id: 'team', label: 'Team', icon: Users },
];

export function AppSidebar({ activeItem = 'dashboard', onNavigate }: AppSidebarProps) {
  const { selectedOrganization, setSelectedOrganization, organizations, loading } = useOrganization();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  return (
    <div className="w-[200px] bg-[#0f0f0f] border-r border-[#1f1f1f] h-screen flex flex-col">
      {/* Organisation Selector */}
      <div className="p-3 border-b border-[#1f1f1f]">
        <Button
          variant="ghost"
          className="w-full justify-between text-left hover:bg-[#1a1a1a] text-white h-auto p-2"
          onClick={() => !loading && organizations.length > 0 && setIsOrgDropdownOpen(!isOrgDropdownOpen)}
          disabled={loading || organizations.length === 0}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1a1a1a] rounded flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#6b7280]" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-white">
                {loading ? 'Loading...' : selectedOrganization || 'No Org'}
              </span>
            </div>
          </div>
          {!loading && organizations.length > 1 && (
            <ChevronDown className="w-3 h-3 text-[#6b7280]" />
          )}
        </Button>

        {/* Dropdown Menu */}
        {isOrgDropdownOpen && organizations.length > 0 && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-lg z-50">
            {organizations.map((org) => (
              <button
                key={org}
                className={`w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-md last:rounded-b-md ${
                  org === selectedOrganization 
                    ? 'bg-[#2a2a2a] text-white' 
                    : 'text-[#9ca3af] hover:bg-[#2a2a2a] hover:text-white'
                }`}
                onClick={() => {
                  setSelectedOrganization(org);
                  setIsOrgDropdownOpen(false);
                }}
              >
                {org}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                className="w-full flex items-center justify-start gap-3 text-white h-10 px-3 text-sm font-normal rounded-md cursor-pointer"
                style={{
                  backgroundColor: isActive ? '#2a2a2a' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1f1f1f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => onNavigate?.(item.id)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-[#1f1f1f]">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white hover:bg-[#1f1f1f] h-10 px-3 text-sm rounded-md transition-colors"
        >
          <Wrench className="w-5 h-5" />
          <span>Settings</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white hover:bg-[#1f1f1f] h-10 px-3 text-sm rounded-md transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span>Help</span>
        </Button>
      </div>
    </div>
  );
}
