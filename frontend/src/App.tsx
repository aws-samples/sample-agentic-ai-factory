import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Team } from './pages/Team';
import { IntakeRequests } from './pages/IntakeRequests';
import { AgentCatalog } from './pages/AgentCatalog';
import { Tools } from './pages/AgentTools';
import { Integrations } from './pages/Integrations';
import { DataStores } from './pages/DataStores';
import { AgenticStudio } from './pages/AgenticStudio';
import { serverService } from './services';
import { OrganizationProvider } from './contexts/OrganizationContext';

type View =
  | 'auth'
  | 'dashboard'
  | 'intake-requests'
  | 'agent-catalog'
  | 'agentic-studio'
  | 'integrations'
  | 'tools'
  | 'data-stores'
  | 'team'

function App() {
  const [view, setView] = useState<View>('auth');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState<string>('dashboard');

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await serverService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setView('dashboard');
        setActiveNavItem('dashboard');
      }
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setView('dashboard');
    setActiveNavItem('dashboard');
  };

  const handleLogout = async () => {
    try {
      await serverService.signOut();
      setCurrentUser(null);
      setView('auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigate = (targetView: string) => {
    setActiveNavItem(targetView);

    // Map navigation items to views
    const viewMap: { [key: string]: View } = {
      'dashboard': 'dashboard',
      'intake-requests': 'intake-requests',
      'agent-catalog': 'agent-catalog',
      'agentic-studio': 'agentic-studio',
      'integrations': 'integrations',
      'tools': 'tools',
      'data-stores': 'data-stores',
      'team': 'team',
    };

    const mappedView = viewMap[targetView];
    if (mappedView) {
      setView(mappedView);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen without layout
  if (view === 'auth') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // All authenticated views use AppLayout
  let content;

  switch (view) {
    case 'dashboard':
      content = <Dashboard />;
      break;
    case 'intake-requests':
      content = <IntakeRequests />;
      break;
    case 'agent-catalog':
      content = <AgentCatalog />;
      break;
    case 'agentic-studio':
      content = <AgenticStudio />;
      break;
    case 'integrations':
      content = <Integrations />;
      break;
    case 'tools':
      content = <Tools />;
      break;
    case 'data-stores':
      content = <DataStores />;
      break;
    case 'team':
      content = <Team />;
      break;
    default:
      content = <Dashboard />;
  }

  return (
    <OrganizationProvider>
      <AppLayout
        currentUser={currentUser}
        onLogout={handleLogout}
        activeItem={activeNavItem}
        onNavigate={handleNavigate}
      >
        {content}
      </AppLayout>
    </OrganizationProvider>
  );
}

export default App;
