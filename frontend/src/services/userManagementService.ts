import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const LIST_USERS = `
  query ListUsers {
    listUsers {
      userId
      email
      name
      givenName
      familyName
      role
      organization
      status
      createdAt
      enabled
    }
  }
`;

const GET_USER = `
  query GetUser($userId: String!) {
    getUser(userId: $userId) {
      userId
      email
      name
      givenName
      familyName
      role
      organization
      status
      createdAt
      enabled
    }
  }
`;

const ASSIGN_USER_ROLE = `
  mutation AssignUserRole($input: AssignUserRoleInput!) {
    assignUserRole(input: $input) {
      success
      message
    }
  }
`;

const REMOVE_USER_ROLE = `
  mutation RemoveUserRole($userId: String!, $role: String!) {
    removeUserRole(userId: $userId, role: $role) {
      success
      message
    }
  }
`;

const GET_CURRENT_USER_PROFILE = `
  query GetCurrentUserProfile {
    getCurrentUserProfile {
      userId
      email
      name
      givenName
      familyName
      role
      organization
      status
      createdAt
      enabled
    }
  }
`;

const LIST_AVAILABLE_ROLES = `
  query ListAvailableRoles {
    listAvailableRoles
  }
`;

const LIST_ORGANIZATIONS = `
  query ListOrganizations {
    listOrganizations {
      orgId
      name
      description
      createdAt
    }
  }
`;

export interface User {
  userId: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  role?: string;
  organization?: string;
  status: string;
  createdAt: string;
  enabled: boolean;
}

export interface AssignUserRoleInput {
  userId: string;
  role: string;
  organization?: string;
}

export interface UserManagementResponse {
  success: boolean;
  message?: string;
}

export interface Organization {
  orgId: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export const userManagementService = {
  async listUsers(): Promise<User[]> {
    try {
      const response: any = await client.graphql({
        query: LIST_USERS,
      });

      return response.data.listUsers;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  },

  async getUser(userId: string): Promise<User> {
    try {
      const response: any = await client.graphql({
        query: GET_USER,
        variables: { userId },
      });

      return response.data.getUser;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async assignUserRole(input: AssignUserRoleInput): Promise<UserManagementResponse> {
    try {
      const response: any = await client.graphql({
        query: ASSIGN_USER_ROLE,
        variables: { input },
      });

      return response.data.assignUserRole;
    } catch (error) {
      console.error('Error assigning user role:', error);
      throw error;
    }
  },

  async removeUserRole(userId: string, role: string): Promise<UserManagementResponse> {
    try {
      const response: any = await client.graphql({
        query: REMOVE_USER_ROLE,
        variables: { userId, role },
      });

      return response.data.removeUserRole;
    } catch (error) {
      console.error('Error removing user role:', error);
      throw error;
    }
  },

  async getCurrentUserProfile(): Promise<User> {
    try {
      const response: any = await client.graphql({
        query: GET_CURRENT_USER_PROFILE,
      });

      return response.data.getCurrentUserProfile;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  },

  async listAvailableRoles(): Promise<string[]> {
    try {
      const response: any = await client.graphql({
        query: LIST_AVAILABLE_ROLES,
      });

      return response.data.listAvailableRoles;
    } catch (error) {
      console.error('Error listing available roles:', error);
      throw error;
    }
  },

  async listOrganizations(): Promise<Organization[]> {
    try {
      const response: any = await client.graphql({
        query: LIST_ORGANIZATIONS,
      });

      return response.data.listOrganizations;
    } catch (error) {
      console.error('Error listing organizations:', error);
      throw error;
    }
  },
};
