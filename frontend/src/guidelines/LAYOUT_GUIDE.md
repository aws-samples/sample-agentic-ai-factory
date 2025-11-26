# Layout Component Guide

## Overview

The `Layout` component provides a consistent header, navigation, and footer for all authenticated pages in the application. This creates a unified user experience and reduces code duplication.

## Architecture

### Component Hierarchy

```
App
├── AuthScreen (no layout)
└── Layout (for authenticated views)
    ├── Header (logo, navigation, user info, logout)
    ├── Main Content (children)
    └── Footer
```

### Benefits

1. **Consistency**: All authenticated pages share the same header and footer
2. **DRY Principle**: No need to repeat header/footer code in each page
3. **Centralized Navigation**: Easy to add new menu items in one place
4. **User Context**: Current user and logout always available
5. **Easy Maintenance**: Update header/footer in one location

## Usage

### In App.tsx

```typescript
import { Layout } from './components/Layout';

// Authenticated views use the Layout
return (
  <Layout
    currentUser={currentUser}
    onLogout={handleLogout}
    currentView={view}
    onNavigate={handleNavigate}
  >
    {/* Page content goes here */}
    <ProjectsList ... />
  </Layout>
);
```

### Layout Props

```typescript
interface LayoutProps {
  children: ReactNode;           // Page content to render
  currentUser?: any;             // Current authenticated user
  onLogout?: () => void;         // Logout handler
  currentView?: 'projects' | 'create' | 'assessment' | 'dashboard';
  onNavigate?: (view: 'projects') => void;  // Navigation handler
}
```

## Header Elements

### Logo and Title
- Consistent branding across all pages
- Always visible in top-left corner
- Clickable to return to home (future enhancement)

### Navigation Menu
- Shows when `onNavigate` prop is provided
- Currently includes:
  - **Projects**: Navigate to projects list
- Highlights current view
- Easy to extend with new menu items

### User Info
- Displays username or user ID
- Shows user icon
- Only visible when `currentUser` is provided

### Logout Button
- Always accessible from any page
- Calls `onLogout` handler
- Only visible when `onLogout` is provided

## Footer

- Displays branding message
- Consistent across all pages
- Sticky to bottom of viewport

## Page Components

Page components no longer need to include headers or footers. They should focus only on their content:

### Before (with header)
```typescript
export function ProjectsList({ ... }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-secondary">
        {/* Header code */}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content */}
      </div>
    </div>
  );
}
```

### After (content only)
```typescript
export function ProjectsList({ ... }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Content */}
    </div>
  );
}
```

## Adding New Navigation Items

To add a new menu item:

1. **Update Layout.tsx**:
```typescript
<nav className="flex items-center gap-2">
  <Button
    variant={currentView === 'projects' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => onNavigate('projects')}
  >
    <FolderOpen className="h-4 w-4" />
    Projects
  </Button>
  
  {/* Add new item */}
  <Button
    variant={currentView === 'settings' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => onNavigate('settings')}
  >
    <Settings className="h-4 w-4" />
    Settings
  </Button>
</nav>
```

2. **Update View Type in App.tsx**:
```typescript
type View = 'auth' | 'projects' | 'create' | 'assessment' | 'dashboard' | 'settings';
```

3. **Add Navigation Handler**:
```typescript
const handleNavigate = (targetView: 'projects' | 'settings') => {
  if (targetView === 'projects') {
    handleBackToProjects();
  } else if (targetView === 'settings') {
    setView('settings');
  }
};
```

## Styling

### Header
- Sticky positioning: `sticky top-0 z-50`
- Background: `bg-secondary`
- Border: `border-b border-border`
- Max width: `max-w-7xl mx-auto`

### Main Content
- Flexible height to fill viewport
- Background: `bg-background`

### Footer
- Background: `bg-secondary`
- Border: `border-t border-border`
- Centered text

## Responsive Design

The layout is fully responsive:
- Mobile: Stacked navigation, compact user info
- Tablet: Horizontal navigation
- Desktop: Full navigation with all elements

## Future Enhancements

### Potential Additions

1. **Breadcrumbs**: Show navigation path
2. **Search Bar**: Global search functionality
3. **Notifications**: Bell icon with notification count
4. **User Menu**: Dropdown with profile, settings, help
5. **Theme Toggle**: Dark/light mode switcher
6. **Quick Actions**: Floating action button
7. **Project Context**: Show current project in header
8. **Progress Indicator**: Show assessment progress

### Example: Adding Breadcrumbs

```typescript
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <Home className="h-4 w-4" />
  <ChevronRight className="h-4 w-4" />
  <span>Projects</span>
  {selectedProject && (
    <>
      <ChevronRight className="h-4 w-4" />
      <span>{selectedProject.name}</span>
    </>
  )}
</div>
```

## Best Practices

1. **Keep Layout Simple**: Don't overload with too many elements
2. **Consistent Spacing**: Use Tailwind spacing utilities
3. **Accessible**: Ensure keyboard navigation works
4. **Performance**: Avoid heavy computations in Layout
5. **Prop Drilling**: Consider Context API if props get complex

## Testing

When testing pages:
- Test with and without Layout
- Verify navigation works correctly
- Check responsive behavior
- Test logout functionality
- Verify user info displays correctly

## Migration Checklist

When converting a page to use Layout:

- [ ] Remove header section from component
- [ ] Remove footer section from component
- [ ] Remove `min-h-screen` wrapper
- [ ] Update props (remove onLogout, currentUser if present)
- [ ] Test navigation to/from the page
- [ ] Verify styling looks correct
- [ ] Check responsive behavior
