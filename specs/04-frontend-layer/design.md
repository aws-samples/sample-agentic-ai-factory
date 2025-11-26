# Design Document

## Overview

The Agentic AI Factory Frontend is a modern React 18 single-page application built with TypeScript, Vite, and AWS Amplify. The application provides a comprehensive user interface for AI transformation workflows, integrating with AWS AppSync GraphQL API for data operations and AWS Cognito for authentication. The frontend uses Radix UI for accessible components, Tailwind CSS for styling, and implements real-time updates through GraphQL subscriptions.

### Design Principles

1. **Component-Based Architecture**: Modular, reusable components with clear responsibilities
2. **Service Layer Pattern**: Encapsulate API logic in service classes separate from UI components
3. **Type Safety**: Full TypeScript coverage for compile-time error detection
4. **Real-time First**: GraphQL subscriptions for live updates without polling
5. **Accessibility**: Radix UI primitives ensure WCAG compliance
6. **Performance**: Code splitting, lazy loading, and optimized builds

## Architecture

### Application Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI primitives (Radix UI)
│   │   ├── AuthScreen.tsx  # Authentication UI
│   │   ├── AppLayout.tsx   # Main layout wrapper
│   │   ├── AppHeader.tsx   # Header with user menu
│   │   ├── AppSidebar.tsx  # Navigation sidebar
│   │   ├── ProjectCard.tsx # Project list item
│   │   ├── AssessmentChat.tsx # Chat interface
│   │   └── ...
│   ├── pages/              # Page-level components
│   │   ├── Dashboard.tsx
│   │   ├── IntakeRequests.tsx
│   │   ├── AgentCatalog.tsx
│   │   ├── AgenticStudio.tsx
│   │   ├── Team.tsx
│   │   └── ...
│   ├── services/           # API and business logic
│   │   ├── server.ts       # Core AWS Amplify service
│   │   ├── projectService.ts
│   │   ├── conversationService.ts
│   │   ├── agentConfigService.ts
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.ts
│   ├── contexts/           # React contexts
│   │   └── OrganizationContext.tsx
│   ├── config/             # Configuration
│   │   └── amplify.ts      # AWS Amplify initialization
│   ├── styles/             # Global styles
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
│   └── aws-exports.json    # AWS configuration (production)
├── .env                    # Environment variables (development)
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Components and Interfaces

### Core Service Layer

**server.ts** - AWS Amplify Integration:
- Singleton ServerService class
- Configures AWS Amplify with Cognito and AppSync
- Provides query(), mutate(), subscribe() methods
- Handles authentication (signUp, signIn, signOut, getCurrentUser)
- Manages GraphQL client lifecycle

**projectService.ts** - Project Management:
- CRUD operations for projects
- GraphQL queries: listProjects, getProject
- GraphQL mutations: createProject, updateProject, deleteProject
- Subscriptions: onProjectProgress, onAssessmentCompleted, onDesignProgress
- Type-safe interfaces for Project, ProjectProgress

**conversationService.ts** - Messaging:
- Send messages to agents
- Retrieve conversation history
- Subscribe to real-time message updates
- Handle correlation IDs and message types

**agentConfigService.ts** - Agent Management:
- List, get, create, update, delete agent configurations
- Manage agent state (active, inactive, maintenance)
- Handle agent schemas and action configurations

**toolConfigService.ts** - Tool Management:
- List, get, create, update, delete tool configurations
- Manage tool state and categories
- Handle tool schemas for fabrication

**fabricatorService.ts** - Agent Fabrication:
- Request agent creation with specifications
- Subscribe to fabrication completion events
- Handle fabrication errors and retries

**taskRunnerService.ts** - Task Orchestration:
- Submit tasks for multi-agent workflows
- Track orchestration status
- Subscribe to task completion events

**userManagementService.ts** - User Administration:
- List users and view profiles
- Assign and remove user roles
- Query current user profile
- List available roles and organizations

### Authentication Flow

```
1. App loads → main.tsx
2. initializeAmplify() loads config
3. App.tsx checks auth status
4. If not authenticated → AuthScreen
5. User signs in → Cognito authentication
6. JWT tokens stored by Amplify
7. Redirect to Dashboard
8. All API calls include auth tokens
```

### Component Hierarchy

```
App.tsx
├── AuthScreen (unauthenticated)
└── AppLayout (authenticated)
    ├── AppHeader
    │   └── User menu, logout
    ├── AppSidebar
    │   └── Navigation items
    └── Content Area
        ├── Dashboard
        ├── IntakeRequests
        ├── AgentCatalog
        ├── AgenticStudio
        ├── Team
        └── ...
```

## Data Models

### Project Interface
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  status: "CREATED" | "IN_PROGRESS" | "ASSESSMENT_COMPLETE" | 
          "DESIGN_COMPLETE" | "PLANNING_COMPLETE" | 
          "IMPLEMENTATION_READY" | "COMPLETED" | "ERROR";
  createdAt: string;
  updatedAt: string;
  owner: string;
  progress: ProjectProgress;
}

interface ProjectProgress {
  overall: number;
  assessment: number;
  design: number;
  planning: number;
  implementation: number;
  currentPhase: string;
  estimatedCompletion?: string;
}
```

### Configuration Loading

**Priority**: aws-exports.json → environment variables

**aws-exports.json** (Production):
```json
{
  "aws_project_region": "us-east-1",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_xxx",
  "aws_user_pools_web_client_id": "xxx",
  "aws_appsync_graphqlEndpoint": "https://xxx.appsync-api.us-east-1.amazonaws.com/graphql",
  "aws_appsync_region": "us-east-1",
  "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS"
}
```

**.env** (Development):
```
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxx
VITE_COGNITO_USER_POOL_CLIENT_ID=xxx
VITE_APPSYNC_ENDPOINT=https://xxx.appsync-api.us-east-1.amazonaws.com/graphql
VITE_APPSYNC_REGION=us-east-1
VITE_APPSYNC_AUTH_TYPE=AMAZON_COGNITO_USER_POOLS
```

## Technology Stack

- **React 18**: UI framework with concurrent features
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build tool with HMR
- **AWS Amplify 6**: AWS service integration
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **React Hook Form**: Form management
- **Sonner**: Toast notifications

## Error Handling

**Service Layer**:
- Try-catch blocks in all service methods
- User-friendly error messages
- Detailed console logging for debugging
- Throw typed errors for component handling

**Component Layer**:
- Error boundaries for crash recovery
- Loading states during async operations
- Toast notifications for user feedback
- Retry mechanisms for failed operations

## Testing Strategy

**Unit Testing**:
- Jest for test runner
- React Testing Library for component tests
- Mock AWS Amplify services
- Test service layer logic

**Integration Testing**:
- Test GraphQL integration with mock server
- Test authentication flows
- Test real-time subscriptions

## Security Architecture

**Authentication**:
- Cognito JWT tokens in Authorization headers
- Secure token storage via Amplify
- Automatic token refresh
- Session timeout handling

**Data Protection**:
- Never log sensitive data
- HTTPS only in production
- Content Security Policy headers
- XSS protection via React

## Performance Optimization

**Build Optimization**:
- Code splitting by route
- Tree shaking unused code
- Minification and compression
- Asset optimization

**Runtime Optimization**:
- React.memo for expensive components
- useMemo/useCallback for expensive computations
- Virtual scrolling for long lists
- Lazy loading for routes

## Deployment Strategy

**Build Process**:
1. `npm run build` → Vite builds to build/
2. Static files optimized and bundled
3. Source maps generated for debugging

**Deployment**:
1. Upload build/ to S3 bucket
2. Set proper content types
3. Invalidate CloudFront cache
4. Serve via HTTPS with CDN

**Environment Configuration**:
- Development: .env file
- Production: aws-exports.json generated by backend deployment

## Monitoring and Observability

**Client-Side Logging**:
- Console logs for development
- Error tracking service integration (optional)
- Performance metrics via Web Vitals

**User Analytics**:
- Page view tracking
- User interaction events
- Error rate monitoring

## Cost Optimization

**CloudFront**:
- Cache static assets (CSS, JS, images)
- Compress responses
- Use edge locations for low latency

**S3**:
- Lifecycle policies for old builds
- Versioning for rollback capability

**Estimated Monthly Costs**:
- S3: $1-5 (storage and requests)
- CloudFront: $10-30 (data transfer)
- Total: $11-35/month
