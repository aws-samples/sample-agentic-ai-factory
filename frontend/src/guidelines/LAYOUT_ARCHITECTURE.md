# Layout Architecture

## Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         LAYOUT COMPONENT                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                          HEADER                             │ │
│ │ ┌──────────┬──────────────┬─────────────────┬─────────────┐ │ │
│ │ │   Logo   │  Navigation  │   User Info     │   Logout    │ │ │
│ │ │  & Title │    Menu      │  (username)     │   Button    │ │ │
│ │ └──────────┴──────────────┴─────────────────┴─────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                      MAIN CONTENT                           │ │
│ │                      (children prop)                        │ │
│ │                                                             │ │
│ │  ┌───────────────────────────────────────────────────────┐ │ │
│ │  │                                                       │ │ │
│ │  │              PAGE COMPONENT                           │ │ │
│ │  │                                                       │ │ │
│ │  │  • ProjectsList                                       │ │ │
│ │  │  • CreateProject                                      │ │ │
│ │  │  • AssessmentChat                                     │ │ │
│ │  │  • ProjectDashboard                                   │ │ │
│ │  │                                                       │ │ │
│ │  └───────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                          FOOTER                             │ │
│ │              Powered by Amazon Bedrock and AWS              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.tsx
│
├─── AuthScreen (no layout)
│    └─── Standalone authentication page
│
└─── Layout
     ├─── Header
     │    ├─── Logo & Title
     │    ├─── Navigation Menu
     │    │    └─── Projects Button
     │    ├─── User Info
     │    │    ├─── User Icon
     │    │    └─── Username
     │    └─── Logout Button
     │
     ├─── Main Content (children)
     │    ├─── ProjectsList
     │    │    ├─── Project Cards
     │    │    └─── Create Button
     │    │
     │    ├─── CreateProject
     │    │    └─── Project Form
     │    │
     │    ├─── AssessmentChat
     │    │    ├─── Chat Messages
     │    │    ├─── Input Field
     │    │    └─── Document Upload
     │    │
     │    └─── ProjectDashboard
     │         ├─── Assessment Summary
     │         ├─── Technical Readiness
     │         └─── Recommendations
     │
     └─── Footer
          └─── Branding Message
```

## Data Flow

```
┌──────────────┐
│   App.tsx    │
│              │
│ State:       │
│ • view       │
│ • user       │
│ • projects   │
└──────┬───────┘
       │
       │ Props
       ▼
┌──────────────────────────────┐
│         Layout               │
│                              │
│ Props:                       │
│ • currentUser                │
│ • onLogout                   │
│ • currentView                │
│ • onNavigate                 │
│ • children                   │
└──────┬───────────────────────┘
       │
       │ Renders
       ▼
┌──────────────────────────────┐
│      Page Component          │
│                              │
│ Props:                       │
│ • Page-specific props        │
│ • No layout props needed     │
└──────────────────────────────┘
```

## Navigation Flow

```
User Action
    │
    ▼
┌─────────────────┐
│  Click Menu     │
│  Item in Header │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  onNavigate()   │
│  in Layout      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ handleNavigate()│
│  in App.tsx     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  setView()      │
│  Update State   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Re-render      │
│  with New Page  │
└─────────────────┘
```

## Props Flow Diagram

```
                    App.tsx
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   currentUser    onLogout      currentView
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
                    Layout
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
     Header         children       Footer
        │
        ├─── Logo
        ├─── Navigation (uses currentView)
        ├─── User Info (uses currentUser)
        └─── Logout (uses onLogout)
```

## State Management

```
┌─────────────────────────────────────────┐
│              App.tsx State              │
├─────────────────────────────────────────┤
│                                         │
│  view: 'projects' | 'create' | ...      │
│  currentUser: User | null               │
│  projects: Project[]                    │
│  selectedProject: Project | null        │
│  loading: boolean                       │
│                                         │
└─────────────────────────────────────────┘
         │                    │
         │ Passed to          │ Passed to
         │ Layout             │ Page Components
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  Layout Props    │  │  Page Props      │
├──────────────────┤  ├──────────────────┤
│ • currentUser    │  │ • projects       │
│ • onLogout       │  │ • onCreateProject│
│ • currentView    │  │ • onSelectProject│
│ • onNavigate     │  │ • etc.           │
└──────────────────┘  └──────────────────┘
```

## Responsive Breakpoints

```
Mobile (< 640px)
┌─────────────────┐
│ Logo  User  ⋮   │
├─────────────────┤
│                 │
│   Content       │
│                 │
└─────────────────┘

Tablet (640px - 1024px)
┌──────────────────────────┐
│ Logo  Nav  User  Logout  │
├──────────────────────────┤
│                          │
│      Content             │
│                          │
└──────────────────────────┘

Desktop (> 1024px)
┌────────────────────────────────────┐
│ Logo  Navigation  User  Logout     │
├────────────────────────────────────┤
│                                    │
│          Content                   │
│                                    │
└────────────────────────────────────┘
```

## Event Flow

### Logout Flow
```
User clicks Logout
       │
       ▼
Layout.onLogout()
       │
       ▼
App.handleLogout()
       │
       ├─── serverService.signOut()
       │
       ├─── setCurrentUser(null)
       │
       ├─── setView('auth')
       │
       └─── setSelectedProject(null)
       │
       ▼
Re-render AuthScreen
```

### Navigation Flow
```
User clicks Projects
       │
       ▼
Layout.onNavigate('projects')
       │
       ▼
App.handleNavigate('projects')
       │
       ├─── setSelectedProject(null)
       │
       └─── setView('projects')
       │
       ▼
Re-render ProjectsList
```

## CSS Class Structure

```
Layout
├─── min-h-screen bg-background
│
├─── Header
│    ├─── border-b border-border bg-secondary
│    ├─── sticky top-0 z-50
│    └─── max-w-7xl mx-auto px-4 py-4
│
├─── Main
│    └─── (children render here)
│
└─── Footer
     ├─── border-t border-border bg-secondary
     └─── max-w-7xl mx-auto px-4 py-4
```

## Future Architecture

```
┌─────────────────────────────────────────┐
│              Layout v2.0                │
├─────────────────────────────────────────┤
│                                         │
│  Header                                 │
│  ├─── Logo                              │
│  ├─── Breadcrumbs (new)                │
│  ├─── Search Bar (new)                 │
│  ├─── Notifications (new)              │
│  ├─── User Menu (enhanced)             │
│  └─── Theme Toggle (new)               │
│                                         │
│  Sidebar (new)                          │
│  ├─── Navigation                        │
│  ├─── Quick Actions                     │
│  └─── Recent Projects                   │
│                                         │
│  Main Content                           │
│  └─── Page Components                   │
│                                         │
│  Footer                                 │
│  └─── Links & Info                      │
│                                         │
└─────────────────────────────────────────┘
```

## Performance Considerations

```
Render Cycle
    │
    ├─── Layout (lightweight)
    │    └─── ~5ms
    │
    ├─── Header (static)
    │    └─── ~3ms
    │
    ├─── Page Content (dynamic)
    │    └─── ~20-50ms
    │
    └─── Footer (static)
         └─── ~2ms

Total: ~30-60ms per render
```

## Memory Footprint

```
Component Tree
├─── Layout: ~2KB
├─── Header: ~1KB
├─── Page: ~5-20KB (varies)
└─── Footer: ~0.5KB

Total: ~8.5-23.5KB
```
