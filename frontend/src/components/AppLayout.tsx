import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
  currentUser?: any;
  onLogout?: () => void;
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

export function AppLayout({
  children,
  currentUser,
  onLogout,
  activeItem,
  onNavigate,
}: AppLayoutProps) {
  return (
    <div className="h-screen bg-[#0a0a0a] flex" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <AppSidebar activeItem={activeItem} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0, maxWidth: 'calc(100% - 200px)' }}>
        {/* Header */}
        <AppHeader currentUser={currentUser} onLogout={onLogout} />

        {/* Page Content */}
        <main className="flex-1 bg-[#0a0a0a]" style={{ minWidth: 0, overflowY: 'auto', overflowX: 'hidden' }}>{children}</main>
      </div>
    </div>
  );
}
