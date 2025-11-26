# Project Service Guide

## Overview

The `projectService` provides a clean API for managing projects through AWS AppSync GraphQL. It handles all CRUD operations and abstracts away the GraphQL query/mutation details.

## Architecture

```
App Component
     │
     ├─── Uses projectService
     │
     ▼
projectService
     │
     ├─── Uses serverService
     │
     ▼
serverService (AWS Amplify)
     │
     ├─── GraphQL API
     │
     ▼
AWS AppSync
     │
     ▼
DynamoDB / Backend
```

## Project Interface

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  status: "in-progress" | "completed";
  createdAt: string;
  lastModified: string;
  userId?: string;
}
```

## Available Methods

### List Projects

Get all projects for the current user.

```typescript
const projects = await projectService.listProjects();
```

**Returns:** `Promise<Project[]>`

**GraphQL Query:**

```graphql
query ListProjects {
  listProjects {
    items {
      id
      name
      description
      status
      createdAt
      lastModified
      userId
    }
  }
}
```

### Get Project

Get a single project by ID.

```typescript
const project = await projectService.getProject("project-id-123");
```

**Parameters:**

- `id: string` - The project ID

**Returns:** `Promise<Project>`

**GraphQL Query:**

```graphql
query GetProject($id: ID!) {
  getProject(id: $id) {
    id
    name
    description
    status
    createdAt
    lastModified
    userId
  }
}
```

### Create Project

Create a new project.

```typescript
const newProject = await projectService.createProject({
  name: "My New Project",
  description: "Project description",
});
```

**Parameters:**

```typescript
interface CreateProjectInput {
  name: string;
  description?: string;
  userId?: string;  // Optional - auto-populated from current user if not provided
}
```

**Returns:** `Promise<Project>`

**Note:** The `userId` is automatically populated from the current authenticated user if not provided.

**GraphQL Mutation:**

```graphql
mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    description
    status
    createdAt
    lastModified
    userId
  }
}
```

### Update Project

Update an existing project.

```typescript
const updatedProject = await projectService.updateProject({
  id: "project-id-123",
  name: "Updated Name",
  description: "Updated description",
  status: "completed",
});
```

**Parameters:**

```typescript
interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  status?: "in-progress" | "completed";
}
```

**Returns:** `Promise<Project>`

**GraphQL Mutation:**

```graphql
mutation UpdateProject($input: UpdateProjectInput!) {
  updateProject(input: $input) {
    id
    name
    description
    status
    createdAt
    lastModified
    userId
  }
}
```

### Delete Project

Delete a project.

```typescript
await projectService.deleteProject("project-id-123");
```

**Parameters:**

- `id: string` - The project ID

**Returns:** `Promise<void>`

**GraphQL Mutation:**

```graphql
mutation DeleteProject($id: ID!) {
  deleteProject(id: $id) {
    id
  }
}
```

### Complete Project

Mark a project as completed (convenience method).

```typescript
const completedProject = await projectService.completeProject("project-id-123");
```

**Parameters:**

- `id: string` - The project ID

**Returns:** `Promise<Project>`

**Note:** This is a wrapper around `updateProject` that sets `status: 'completed'`

### Reopen Project

Mark a project as in-progress (convenience method).

```typescript
const reopenedProject = await projectService.reopenProject("project-id-123");
```

**Parameters:**

- `id: string` - The project ID

**Returns:** `Promise<Project>`

**Note:** This is a wrapper around `updateProject` that sets `status: 'in-progress'`

## Usage in Components

### In App.tsx

```typescript
import { projectService, type Project } from "./services";

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects
  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const projectsList = await projectService.listProjects();
      setProjects(projectsList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create project
  const handleCreateProject = async (name: string, description: string) => {
    try {
      const newProject = await projectService.createProject({
        name,
        description,
      });
      setProjects([newProject, ...projects]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Complete project
  const handleCompleteProject = async (id: string) => {
    try {
      const updated = await projectService.completeProject(id);
      setProjects(projects.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      setError(err.message);
    }
  };
}
```

### In a Custom Hook

```typescript
import { useState, useEffect } from "react";
import { projectService, type Project } from "../services";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await projectService.listProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (input: CreateProjectInput) => {
    const newProject = await projectService.createProject(input);
    setProjects([newProject, ...projects]);
    return newProject;
  };

  const updateProject = async (input: UpdateProjectInput) => {
    const updated = await projectService.updateProject(input);
    setProjects(projects.map((p) => (p.id === input.id ? updated : p)));
    return updated;
  };

  const deleteProject = async (id: string) => {
    await projectService.deleteProject(id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  return {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
```

## Error Handling

All methods throw errors that should be caught and handled:

```typescript
try {
  const projects = await projectService.listProjects();
} catch (error) {
  if (error instanceof Error) {
    console.error("Error:", error.message);
    // Show error to user
  }
}
```

### Common Errors

| Error                      | Cause                              | Solution                                  |
| -------------------------- | ---------------------------------- | ----------------------------------------- |
| "Failed to load projects"  | Network issue or auth problem      | Check connection and auth status          |
| "Failed to create project" | Invalid input or permissions       | Validate input and check permissions      |
| "Failed to update project" | Project not found or no permission | Verify project exists and user has access |
| "Failed to delete project" | Project not found or no permission | Verify project exists and user has access |

## Date Handling

The service automatically handles date conversions:

- **From API**: ISO string dates are kept as strings
- **In Components**: Convert to Date objects when needed for display

```typescript
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};
```

## GraphQL Schema Requirements

The backend AppSync API must implement these types:

```graphql
type Project {
  id: ID!
  name: String!
  description: String
  status: ProjectStatus!
  createdAt: AWSDateTime!
  lastModified: AWSDateTime!
  userId: String
}

enum ProjectStatus {
  IN_PROGRESS
  COMPLETED
}

input CreateProjectInput {
  name: String!
  description: String
}

input UpdateProjectInput {
  id: ID!
  name: String
  description: String
  status: ProjectStatus
}

type Query {
  listProjects: ProjectConnection!
  getProject(id: ID!): Project
}

type Mutation {
  createProject(input: CreateProjectInput!): Project!
  updateProject(input: UpdateProjectInput!): Project!
  deleteProject(id: ID!): Project!
}

type ProjectConnection {
  items: [Project!]!
}
```

## Testing

### Unit Tests

```typescript
import { projectService } from "./projectService";
import { serverService } from "./server";

jest.mock("./server");

describe("projectService", () => {
  it("should list projects", async () => {
    const mockProjects = [{ id: "1", name: "Test", status: "in-progress" }];

    (serverService.query as jest.Mock).mockResolvedValue({
      listProjects: { items: mockProjects },
    });

    const result = await projectService.listProjects();
    expect(result).toEqual(mockProjects);
  });

  it("should create project", async () => {
    const input = { name: "New Project", description: "Test" };
    const mockProject = { id: "1", ...input, status: "in-progress" };

    (serverService.mutate as jest.Mock).mockResolvedValue({
      createProject: mockProject,
    });

    const result = await projectService.createProject(input);
    expect(result).toEqual(mockProject);
  });
});
```

### Integration Tests

```typescript
describe("projectService integration", () => {
  it("should create and retrieve project", async () => {
    // Create
    const created = await projectService.createProject({
      name: "Integration Test",
      description: "Test project",
    });

    expect(created.id).toBeDefined();

    // Retrieve
    const retrieved = await projectService.getProject(created.id);
    expect(retrieved.name).toBe("Integration Test");

    // Cleanup
    await projectService.deleteProject(created.id);
  });
});
```

## Best Practices

1. **Always Handle Errors**: Wrap service calls in try-catch
2. **Show Loading States**: Use loading flags for better UX
3. **Optimistic Updates**: Update UI before API call completes
4. **Cache Results**: Store projects in state to avoid repeated calls
5. **Validate Input**: Check data before sending to service
6. **Use TypeScript**: Leverage type safety for inputs/outputs

## Performance Considerations

- **Pagination**: For large lists, implement pagination
- **Caching**: Cache project list to reduce API calls
- **Debouncing**: Debounce search/filter operations
- **Lazy Loading**: Load project details only when needed

## Future Enhancements

- Add pagination support
- Add search/filter capabilities
- Add batch operations
- Add project sharing/permissions
- Add project templates
- Add project archiving
- Add project tags/categories
