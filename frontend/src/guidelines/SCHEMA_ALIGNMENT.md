# Schema Alignment - Frontend to Backend

## Overview

Updated the frontend `projectService` to align with the backend GraphQL schema field names and structure.

## Issue

The frontend was requesting fields that didn't exist in the backend schema:
- Frontend used: `lastModified`, `userId`
- Backend uses: `updatedAt`, `owner`

Error: `Field 'lastModified' in type 'Project' is undefined`

## Changes Made

### 1. Updated Project Interface

**Before:**
```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'in-progress' | 'completed';
  createdAt: string;
  lastModified: string;
  userId?: string;
}
```

**After:**
```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  owner?: string;
  // Legacy field for backward compatibility
  lastModified?: string;
  userId?: string;
}
```

### 2. Updated GraphQL Queries

**LIST_PROJECTS - Before:**
```graphql
query ListProjects {
  listProjects {
    items {
      id
      name
      description
      status
      createdAt
      lastModified  # ❌ Doesn't exist
      userId        # ❌ Doesn't exist
    }
  }
}
```

**LIST_PROJECTS - After:**
```graphql
query ListProjects {
  listProjects {
    items {
      id
      name
      description
      status
      createdAt
      updatedAt     # ✅ Correct field
      owner         # ✅ Correct field
    }
  }
}
```

### 3. Updated GraphQL Mutations

**UPDATE_PROJECT - Before:**
```graphql
mutation UpdateProject($input: UpdateProjectInput!) {
  updateProject(input: $input) {
    # ...
  }
}
```

**UPDATE_PROJECT - After:**
```graphql
mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
  updateProject(id: $id, input: $input) {
    # ...
  }
}
```

### 4. Added Field Mapping

All service methods now map backend fields to frontend interface:

```typescript
return {
  ...response.createProject,
  userId: response.createProject.owner || response.createProject.userId,
  lastModified: response.createProject.updatedAt, // For backward compatibility
};
```

### 5. Removed userId from CreateProjectInput

The backend automatically sets `owner` based on the authenticated user, so we remove `userId` from the input:

```typescript
async createProject(input: CreateProjectInput): Promise<Project> {
  // Remove userId from input as backend doesn't accept it
  const { userId, ...projectInput } = input;
  
  const response = await serverService.mutate<{ createProject: Project }>(
    CREATE_PROJECT,
    { input: projectInput }
  );
  
  // Map owner to userId for frontend compatibility
  return {
    ...response.createProject,
    userId: response.createProject.owner,
    lastModified: response.createProject.updatedAt,
  };
}
```

## Field Mapping

| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `id` | `id` | Same |
| `name` | `name` | Same |
| `description` | `description` | Same |
| `status` | `status` | Same |
| `createdAt` | `createdAt` | Same |
| `updatedAt` | `updatedAt` | Primary field |
| `lastModified` | `updatedAt` | Mapped for backward compatibility |
| `owner` | `owner` | Primary field |
| `userId` | `owner` | Mapped for backward compatibility |

## Backend Schema Reference

```graphql
type Project {
  id: ID!
  name: String!
  status: ProjectStatus!
  currentModule: Module!
  progress: ProjectProgress!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!      # ✅ Use this, not lastModified
  owner: String!               # ✅ Use this, not userId
  description: String
  requirements: String
  agents: [AgentStatus]
}

input CreateProjectInput {
  name: String!
  description: String
  requirements: String
  # Note: No userId/owner - set automatically by backend
}

input UpdateProjectInput {
  name: String
  description: String
  requirements: String
  status: ProjectStatus
}

type Mutation {
  createProject(input: CreateProjectInput!): Project
  updateProject(id: ID!, input: UpdateProjectInput!): Project  # ✅ id is separate parameter
}
```

## Backward Compatibility

The service maintains backward compatibility by:

1. **Providing both field names**: `updatedAt` (primary) and `lastModified` (legacy)
2. **Mapping owner to userId**: Components can use either field
3. **No breaking changes**: Existing components continue to work

### Example

```typescript
// Both work:
console.log(project.updatedAt);    // ✅ New way
console.log(project.lastModified); // ✅ Still works (mapped from updatedAt)

console.log(project.owner);        // ✅ New way
console.log(project.userId);       // ✅ Still works (mapped from owner)
```

## Status Enum Mapping

The backend uses different status values:

**Backend:**
```graphql
enum ProjectStatus {
  CREATED
  IN_PROGRESS
  ASSESSMENT_COMPLETE
  DESIGN_COMPLETE
  PLANNING_COMPLETE
  IMPLEMENTATION_READY
  COMPLETED
  ERROR
}
```

**Frontend (Current):**
```typescript
status: 'in-progress' | 'completed'
```

**Note:** The frontend currently uses simplified status values. This may need to be expanded to match the backend enum in the future.

## Testing

### Verify Field Mapping

```typescript
const project = await projectService.createProject({
  name: 'Test Project',
  description: 'Test',
});

// Both should work
console.log(project.updatedAt);    // ISO date string
console.log(project.lastModified); // Same ISO date string
console.log(project.owner);        // User ID
console.log(project.userId);       // Same User ID
```

### Verify GraphQL Queries

```typescript
// Should not throw "Field undefined" errors
const projects = await projectService.listProjects();
const project = await projectService.getProject('id');
const created = await projectService.createProject({ name: 'Test' });
const updated = await projectService.updateProject({ id: 'id', name: 'Updated' });
```

## Migration Checklist

- [x] Update Project interface with correct fields
- [x] Update all GraphQL queries to use correct field names
- [x] Update all GraphQL mutations to match backend signature
- [x] Add field mapping in all service methods
- [x] Maintain backward compatibility
- [x] Remove userId from CreateProjectInput
- [x] Update updateProject to pass id separately
- [x] Test all CRUD operations
- [ ] Update status enum to match backend (future)
- [ ] Update components to use new field names (optional)

## Future Improvements

1. **Status Enum**: Expand frontend status type to match backend
2. **Field Names**: Gradually migrate components to use `updatedAt` and `owner` directly
3. **Type Safety**: Create stricter types that match backend exactly
4. **Code Generation**: Consider using GraphQL code generation tools

## Conclusion

The frontend projectService now correctly aligns with the backend GraphQL schema while maintaining backward compatibility with existing components. All CRUD operations should work without "Field undefined" errors.
