# Agentic AI Factory - Frontend

This is the frontend application for the Agentic AI Factory platform, built with React, Vite, and AWS Amplify.

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Generate AWS Configuration

```bash
npm run generate-aws-exports
```

---

## Table of Contents

- [Authentication](#authentication)
- [Configuration](#configuration)
- [Services](#services)
- [Project Structure](#project-structure)

---

## Authentication

The frontend application uses AWS Cognito for authentication through AWS Amplify.

### Configuration

The app automatically loads configuration from either:

1. **aws-exports.json** (in `/public` directory) - Used in production
2. **Environment variables** - Used in development

### Development Setup

Create a `.env` file in the frontend directory:

```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_APPSYNC_ENDPOINT=https://xxxxxxxxxxxxxxxxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql
VITE_APPSYNC_REGION=us-east-1
VITE_APPSYNC_AUTH_TYPE=AMAZON_COGNITO_USER_POOLS
```

### Production Setup

For production deployments, create `public/aws-exports.json`:

```json
{
  "aws_project_region": "us-east-1",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_xxxxxxxxx",
  "aws_user_pools_web_client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "aws_cognito_identity_pool_id": "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "aws_appsync_graphqlEndpoint": "https://xxxxxxxxxxxxxxxxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql",
  "aws_appsync_region": "us-east-1",
  "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS"
}
```

Generate this file automatically:

```bash
npm run generate-aws-exports
```

### Authentication Features

#### Sign Up

- Users can create new accounts with first name, last name, email, and password
- First name and last name are stored as Cognito `given_name` and `family_name` attributes
- Password must be at least 8 characters
- Email verification is required via confirmation code sent to email
- Users must enter the 6-digit code to verify their email address

#### Sign In

- Users sign in with email and password
- Session is maintained across page refreshes
- Automatic redirect to projects page on successful login

#### Sign Out

- Users can sign out from the projects page
- Clears all session data and redirects to login

#### Session Management

- Automatic session check on app load
- Persistent authentication across page refreshes
- Secure token management via AWS Amplify

### Using Authentication in Components

#### Using the Auth Hook (Recommended)

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, signIn, signOut, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
```

#### Using the Service Directly

```typescript
import { serverService } from "@/services";

// Sign up with name attributes
const signUpResult = await serverService.signUp({
  username: "user@example.com",
  password: "password123",
  email: "user@example.com",
  attributes: {
    given_name: "John",
    family_name: "Doe",
  },
});

// Confirm sign up with verification code
await serverService.confirmSignUp("user@example.com", "123456");

// Resend confirmation code if needed
await serverService.resendConfirmationCode("user@example.com");

// Sign in
const result = await serverService.signIn({
  username: "user@example.com",
  password: "password123",
});

// Get current user
const user = await serverService.getCurrentUser();

// Sign out
await serverService.signOut();
```

### Security Notes

- Never commit `.env` files or `aws-exports.json` to version control
- Use environment-specific configurations
- Rotate credentials regularly
- Enable MFA in Cognito for production users
- Configure appropriate password policies in Cognito User Pool

### Troubleshooting

#### "No AWS configuration found"

- Ensure either `.env` file or `aws-exports.json` exists
- Check that all required variables are set
- Verify the configuration is loaded before the app renders

#### "User not authenticated"

- Check Cognito User Pool settings
- Verify user exists and is confirmed
- Check browser console for detailed error messages

#### Sign-in fails

- Verify credentials are correct
- Check if user needs to verify email
- Ensure Cognito User Pool is accessible
- Check network connectivity to AWS services

---

## Configuration

### Amplify Configuration

The `src/config/amplify.ts` file handles AWS Amplify initialization and configuration loading.

#### Configuration Priority

1. **aws-exports.json** (Production) - Loaded from `/public/aws-exports.json`
2. **Environment Variables** (Development) - Loaded from `.env` file

#### How It Works

The `initializeAmplify()` function is called in `main.tsx` before the React app renders. It:

1. Attempts to fetch `aws-exports.json` from the public directory
2. If not found, falls back to environment variables
3. Configures the `serverService` with the loaded configuration
4. Returns `true` if configuration was successful, `false` otherwise

#### Manual Configuration

If you need to reconfigure Amplify at runtime:

```typescript
import { serverService } from "@/services";

serverService.configure({
  region: "us-east-1",
  userPoolId: "us-east-1_xxxxxxxxx",
  userPoolClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  appsyncEndpoint: "https://xxx.appsync-api.us-east-1.amazonaws.com/graphql",
  appsyncRegion: "us-east-1",
  appsyncAuthenticationType: "AMAZON_COGNITO_USER_POOLS",
});
```

### Environment Variables

#### Required Variables

```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_APPSYNC_ENDPOINT=https://xxx.appsync-api.us-east-1.amazonaws.com/graphql
VITE_APPSYNC_REGION=us-east-1
VITE_APPSYNC_AUTH_TYPE=AMAZON_COGNITO_USER_POOLS
```

#### Optional Variables

```env
VITE_COGNITO_IDENTITY_POOL_ID=us-east-1:xxx-xxx-xxx
VITE_APPSYNC_API_KEY=da2-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Services

The `src/services` folder contains service integrations for the frontend application.

### Server Service

The `server.ts` file provides integration with AWS AppSync (GraphQL API) and AWS Cognito (Authentication) using AWS Amplify SDK.

### Usage Examples

#### GraphQL Queries

```typescript
import { serverService } from "@/services";

// Execute a query
const query = `
  query GetProject($id: ID!) {
    getProject(id: $id) {
      id
      name
      description
    }
  }
`;

const data = await serverService.query(query, { id: "123" });
```

#### GraphQL Mutations

```typescript
import { serverService } from "@/services";

// Execute a mutation
const mutation = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
    }
  }
`;

const result = await serverService.mutate(mutation, {
  input: {
    name: "My Project",
    description: "Project description",
  },
});
```

#### GraphQL Subscriptions

```typescript
import { serverService } from "@/services";

// Subscribe to real-time updates
const subscription = `
  subscription OnProjectUpdate($id: ID!) {
    onProjectUpdate(id: $id) {
      id
      name
      status
    }
  }
`;

const sub = serverService.subscribe(subscription, { id: "123" });

sub.subscribe({
  next: (data) => console.log("Update received:", data),
  error: (error) => console.error("Subscription error:", error),
});
```

---

## Project Structure

```
frontend/
├── src/
│   ├── components/             # React components
│   │   ├── ui/                # Reusable UI components
│   │   ├── AuthScreen.tsx     # Authentication screen
│   │   ├── ProjectsList.tsx   # Projects list view
│   │   ├── CreateProject.tsx  # Create project form
│   │   ├── AssessmentChat.tsx # Assessment chat interface
│   │   └── ProjectDashboard.tsx
│   ├── config/                 # Configuration files
│   │   └── amplify.ts         # Amplify initialization
│   ├── hooks/                  # Custom React hooks
│   │   └── useAuth.ts         # Authentication hook
│   ├── services/               # API and service integrations
│   │   ├── server.ts          # AppSync & Cognito service
│   │   └── index.ts           # Service exports
│   ├── styles/                 # Global styles
│   ├── App.tsx                 # Main app component
│   ├── main.tsx               # App entry point
│   ├── vite-env.d.ts          # Vite environment types
│   └── index.css              # Global CSS
├── .env.example                # Example environment variables
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json               # TypeScript configuration
├── tsconfig.node.json
├── vite.config.ts             # Vite configuration
└── README.md

```

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **AWS Amplify** - AWS service integration
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible UI components
- **Lucide React** - Icons

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run generate-aws-exports` - Generate AWS configuration file

---

## Original Design

This project is based on the AWS-branded UI design available at:
https://www.figma.com/design/FNnUnA9EQtOSgPrBcp1wj8/Create-AWS-branded-UI
