# UserId Integration in Project Creation

## Overview

Updated the `projectService.createProject()` method to automatically include the `userId` from the currently authenticated user when creating new projects.

## Changes Made

### 1. Updated CreateProjectInput Interface

**Before:**
```typescript
export interface CreateProjectInput {
  name: string;
  description?: string;
}
```

**After:**
```typescript
export interface CreateProjectInput {
  name: string;
  description?: string;
  userId?: string;  // Optional - auto-populated if not provided
}
```

### 2. Updated createProject Method

**Before:**
```typescript
async createProject(input: CreateProjectInput): Promise<Project> {
  try {
    const response = await serverService.mutate<{ createProject: Project }>(
      CREATE_PROJECT,
      { input }
    );
    return response.createProject;
  } catch (error) {
    throw new Error('Failed to create project. Please try again.');
  }
}
```

**After:**
```typescript
async createProject(input: CreateProjectInput): Promise<Project> {
  try {
    // Get current user if userId not provided
    let projectInput = { ...input };
    
    if (!projectInput.userId) {
      const currentUser = await serverService.getCurrentUser();
      if (currentUser) {
        projectInput.userId = currentUser.userId || currentUser.username;
      }
    }

    const response = await serverService.mutate<{ createProject: Project }>(
      CREATE_PROJECT,
      { input: projectInput }
    );

    return {
      ...response.createProject,
      createdAt: response.createProject.createdAt,
      lastModified: response.createProject.lastModified,
    };
  } catch (error) {
    console.error('Failed to create project:', error);
    throw new Error('Failed to create project. Please try again.');
  }
}
```

## How It Works

### Automatic UserId Population

1. When `createProject()` is called, it checks if `userId` is provided in the input
2. If not provided, it fetches the current authenticated user via `serverService.getCurrentUser()`
3. Extracts the `userId` or falls back to `username` from the user object
4. Includes the `userId` in the GraphQL mutation input
5. The backend associates the project with the authenticated user

### Usage Examples

#### Automatic (Recommended)
```typescript
// userId is automatically added from current user
const project = await projectService.createProject({
  name: 'My Project',
  description: 'Project description',
});
```

#### Manual (Optional)
```typescript
// Explicitly provide userId (useful for admin operations)
const project = await projectService.createProject({
  name: 'My Project',
  description: 'Project description',
  userId: 'specific-user-id',
});
```

## Benefits

### 1. Security
- Projects are automatically associated with the authenticated user
- Prevents unauthorized project creation
- Ensures proper data ownership

### 2. Convenience
- Developers don't need to manually pass userId
- Reduces boilerplate code
- Less chance of errors

### 3. Flexibility
- Still allows manual userId specification when needed
- Useful for admin operations or testing
- Backward compatible

### 4. Data Integrity
- Every project has an owner
- Enables proper access control
- Supports multi-tenant architecture

## Backend Requirements

The AppSync API must:

1. **Accept userId in CreateProjectInput**
```graphql
input CreateProjectInput {
  name: String!
  description: String
  userId: String  # Required or auto-populated by resolver
}
```

2. **Store userId in Project**
```graphql
type Project {
  id: ID!
  name: String!
  description: String
  status: ProjectStatus!
  createdAt: AWSDateTime!
  lastModified: AWSDateTime!
  userId: String!  # Owner of the project
}
```

3. **Filter by userId in listProjects**
```graphql
query ListProjects {
  listProjects {
    items {
      # Only return projects where userId matches authenticated user
    }
  }
}
```

## Authorization Flow

```
User creates project
       │
       ▼
Frontend: projectService.createProject()
       │
       ├─── Get current user
       │
       ├─── Extract userId
       │
       └─── Include in mutation
       │
       ▼
AppSync: Receives mutation with userId
       │
       ├─── Validate user is authenticated
       │
       ├─── Verify userId matches auth token
       │
       └─── Create project with userId
       │
       ▼
DynamoDB: Store project with userId
       │
       ▼
Return created project to frontend
```

## Testing

### Test Cases

1. **Create project without userId**
   - Should auto-populate from current user
   - Project should be created successfully
   - userId should match authenticated user

2. **Create project with explicit userId**
   - Should use provided userId
   - Useful for admin operations
   - Should validate permissions

3. **Create project when not authenticated**
   - Should fail gracefully
   - Should show appropriate error message

4. **List projects**
   - Should only show user's own projects
   - Should filter by userId

### Example Test

```typescript
describe('projectService.createProject', () => {
  it('should auto-populate userId from current user', async () => {
    // Mock current user
    jest.spyOn(serverService, 'getCurrentUser').mockResolvedValue({
      userId: 'user-123',
      username: 'testuser',
    });

    // Create project without userId
    const project = await projectService.createProject({
      name: 'Test Project',
      description: 'Test',
    });

    // Verify userId was added
    expect(project.userId).toBe('user-123');
  });

  it('should use provided userId when specified', async () => {
    const project = await projectService.createProject({
      name: 'Test Project',
      description: 'Test',
      userId: 'custom-user-id',
    });

    expect(project.userId).toBe('custom-user-id');
  });
});
```

## Migration Notes

### Existing Code

No changes required in existing code! The userId is automatically added:

```typescript
// This still works exactly the same
const project = await projectService.createProject({
  name: 'My Project',
  description: 'Description',
});
// userId is now automatically included
```

### New Code

Can optionally specify userId:

```typescript
// For admin operations
const project = await projectService.createProject({
  name: 'My Project',
  description: 'Description',
  userId: adminSelectedUserId,
});
```

## Error Handling

### Scenarios

1. **User not authenticated**
   - `getCurrentUser()` throws error
   - Caught and re-thrown with user-friendly message
   - User should be redirected to login

2. **Invalid userId**
   - Backend validation fails
   - Error returned from AppSync
   - Displayed to user

3. **Permission denied**
   - User tries to create project for another user
   - Backend authorization fails
   - Error displayed to user

## Security Considerations

### Best Practices

1. **Backend Validation**
   - Always validate userId on backend
   - Ensure userId matches authenticated user
   - Don't trust frontend-provided userId

2. **Authorization Rules**
   - Implement proper IAM/Cognito rules
   - Restrict project creation to authenticated users
   - Validate ownership on all operations

3. **Data Isolation**
   - Filter queries by userId
   - Prevent cross-user data access
   - Implement row-level security

### Example Backend Validation

```typescript
// AppSync Resolver
export const createProject = async (event) => {
  const { input } = event.arguments;
  const authenticatedUserId = event.identity.sub;
  
  // Validate userId matches authenticated user
  if (input.userId && input.userId !== authenticatedUserId) {
    throw new Error('Cannot create project for another user');
  }
  
  // Use authenticated userId
  const project = {
    ...input,
    userId: authenticatedUserId,
  };
  
  return await dynamodb.put(project);
};
```

## Conclusion

The userId integration ensures:
- ✅ Automatic user association
- ✅ Improved security
- ✅ Better data organization
- ✅ Proper access control
- ✅ Multi-tenant support
- ✅ Backward compatibility

Projects are now automatically associated with their creators, enabling proper ownership and access control throughout the application.
