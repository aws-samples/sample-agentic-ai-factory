import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
  ListGroupsCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USER_POOL_ID = process.env.USER_POOL_ID!;
const ORGANISATION_TABLE = process.env.ORGANISATION_TABLE!;

interface AssignUserRoleInput {
  userId: string;
  role: string;
  organization?: string;
}

interface User {
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

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const fieldName = event.info.fieldName;

  try {
    switch (fieldName) {
      case 'listUsers':
        return await listUsers();
      case 'getUser':
        return await getUser(event.arguments.userId);
      case 'getCurrentUserProfile':
        return await getCurrentUserProfile(event);
      case 'listAvailableRoles':
        return await listAvailableRoles();
      case 'listOrganizations':
        return await listOrganizations();
      case 'assignUserRole':
        return await assignUserRole(event.arguments.input);
      case 'removeUserRole':
        return await removeUserRole(event.arguments.userId, event.arguments.role);
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

async function listUsers(): Promise<User[]> {
  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
    })
  );

  const users: User[] = [];

  for (const user of response.Users || []) {
    const attributes = user.Attributes || [];
    const email = attributes.find((attr) => attr.Name === 'email')?.Value || '';
    const givenName = attributes.find((attr) => attr.Name === 'given_name')?.Value || '';
    const familyName = attributes.find((attr) => attr.Name === 'family_name')?.Value || '';
    const organization = attributes.find((attr) => attr.Name === 'custom:organization')?.Value;

    // Get user's groups (roles)
    const groupsResponse = await cognitoClient.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.Username!,
      })
    );

    const role = groupsResponse.Groups?.[0]?.GroupName;

    users.push({
      userId: user.Username!,
      email,
      name: `${givenName} ${familyName}`.trim(),
      givenName,
      familyName,
      role,
      organization,
      status: user.UserStatus || 'UNKNOWN',
      createdAt: user.UserCreateDate?.toISOString() || new Date().toISOString(),
      enabled: user.Enabled || false,
    });
  }

  return users;
}

async function getUser(userId: string): Promise<User> {
  const response = await cognitoClient.send(
    new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    })
  );

  const attributes = response.UserAttributes || [];
  const email = attributes.find((attr) => attr.Name === 'email')?.Value || '';
  const givenName = attributes.find((attr) => attr.Name === 'given_name')?.Value || '';
  const familyName = attributes.find((attr) => attr.Name === 'family_name')?.Value || '';
  const organization = attributes.find((attr) => attr.Name === 'custom:organization')?.Value;

  // Get user's groups (roles)
  const groupsResponse = await cognitoClient.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    })
  );

  const role = groupsResponse.Groups?.[0]?.GroupName;

  return {
    userId: response.Username!,
    email,
    name: `${givenName} ${familyName}`.trim(),
    givenName,
    familyName,
    role,
    organization,
    status: response.UserStatus || 'UNKNOWN',
    createdAt: response.UserCreateDate?.toISOString() || new Date().toISOString(),
    enabled: response.Enabled || false,
  };
}

async function getCurrentUserProfile(event: any): Promise<User> {
  // Extract username from the Cognito identity
  const username = event.identity?.username || event.identity?.claims?.username;
  
  if (!username) {
    throw new Error('Unable to determine current user from request context');
  }

  return await getUser(username);
}

async function assignUserRole(input: AssignUserRoleInput) {
  const { userId, role, organization } = input;

  console.log(`Assigning role ${role} and organization ${organization} to user ${userId}`);

  // Get current groups to remove user from old role
  const groupsResponse = await cognitoClient.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    })
  );

  // Remove user from all existing groups
  for (const group of groupsResponse.Groups || []) {
    await cognitoClient.send(
      new AdminRemoveUserFromGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        GroupName: group.GroupName!,
      })
    );
  }

  // Add user to new role group
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      GroupName: role,
    })
  );

  // Update organization custom attribute if provided
  if (organization) {
    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        UserAttributes: [
          {
            Name: 'custom:organization',
            Value: organization,
          },
        ],
      })
    );
  }

  console.log(`Successfully assigned role ${role} and organization ${organization} to user ${userId}`);

  return {
    success: true,
    message: `User ${userId} assigned to role ${role}${organization ? ` and organization ${organization}` : ''}`,
  };
}

async function removeUserRole(userId: string, role: string) {
  await cognitoClient.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      GroupName: role,
    })
  );

  return {
    success: true,
    message: `User ${userId} removed from role ${role}`,
  };
}

async function listAvailableRoles(): Promise<string[]> {
  const response = await cognitoClient.send(
    new ListGroupsCommand({
      UserPoolId: USER_POOL_ID,
    })
  );

  return (response.Groups || [])
    .map(group => group.GroupName)
    .filter((name): name is string => !!name)
    .sort();
}

async function listOrganizations() {
  const response = await dynamoClient.send(
    new ScanCommand({
      TableName: ORGANISATION_TABLE,
    })
  );

  return (response.Items || []).map(item => {
    console.log('Raw item from DynamoDB:', JSON.stringify(item));
    
    // Ensure createdAt is in proper ISO 8601 format for AppSync
    let createdAt = item.createdAt;
    console.log('Original createdAt:', createdAt, 'Type:', typeof createdAt);
    
    if (createdAt && typeof createdAt === 'string') {
      // Remove microseconds if present
      const parts = createdAt.split('.');
      if (parts.length > 1) {
        // Has microseconds, take only the date/time part
        createdAt = parts[0];
        console.log('After removing microseconds:', createdAt);
      }
      // Ensure it ends with 'Z' (but don't add if already present)
      if (!createdAt.endsWith('Z')) {
        createdAt = createdAt + 'Z';
        console.log('Added Z:', createdAt);
      } else {
        console.log('Already has Z, not adding');
      }
    }
    
    console.log('Final createdAt:', createdAt);
    
    return {
      orgId: item.orgId,
      name: item.name || item.orgId,
      description: item.description,
      createdAt: createdAt,
    };
  });
}
