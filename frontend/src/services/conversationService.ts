/**
 * Conversation Service
 * Handles real-time messaging with agents via AppSync subscriptions
 */

import { generateClient } from "aws-amplify/api";
import type { GraphQLSubscription } from "@aws-amplify/api";

const client = generateClient();

export interface ConversationMessage {
  id: string;
  projectId: string;
  agentId: string;
  message: string;
  messageType:
    | "USER_INPUT"
    | "AGENT_RESPONSE"
    | "SYSTEM_NOTIFICATION"
    | "PROGRESS_UPDATE";
  timestamp: string;
  metadata?: string;
  correlationId?: string;
}

// GraphQL Queries
const getConversationHistory = /* GraphQL */ `
  query GetConversationHistory($projectId: ID!) {
    getConversationHistory(projectId: $projectId) {
      id
      projectId
      agentId
      message
      messageType
      timestamp
      metadata
      correlationId
    }
  }
`;

// GraphQL Mutations
const sendMessage = /* GraphQL */ `
  mutation SendMessage($projectId: ID!, $message: ConversationMessageInput!) {
    sendMessage(projectId: $projectId, message: $message) {
      id
      projectId
      agentId
      message
      messageType
      timestamp
      metadata
      correlationId
    }
  }
`;

// GraphQL Subscriptions
const onConversationMessage = /* GraphQL */ `
  subscription OnConversationMessage($projectId: ID!) {
    onConversationMessage(projectId: $projectId) {
      id
      projectId
      agentId
      message
      messageType
      timestamp
      metadata
      correlationId
    }
  }
`;

/**
 * Send a message to an agent
 */
export async function sendMessageToAgent(
  projectId: string,
  agentId: string,
  message: string,
  metadata?: Record<string, any>
): Promise<ConversationMessage> {
  try {
    const response: any = await client.graphql({
      query: sendMessage,
      variables: {
        projectId,
        message: {
          agentId,
          message,
          messageType: "USER_INPUT",
          ...(metadata && { metadata: JSON.stringify(metadata) }),
        },
      },
    });

    return response.data.sendMessage as ConversationMessage;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Get conversation history for a project
 */
export async function getConversationHistoryForProject(
  projectId: string
): Promise<ConversationMessage[]> {
  try {
    const response: any = await client.graphql({
      query: getConversationHistory,
      variables: { projectId },
    });

    return (
      (response.data.getConversationHistory as ConversationMessage[]) || []
    );
  } catch (error) {
    console.error("Error getting conversation history:", error);
    throw error;
  }
}

/**
 * Subscribe to conversation messages for a project
 * Returns an unsubscribe function
 */
export function subscribeToConversation(
  projectId: string,
  onMessage: (message: ConversationMessage) => void,
  onError?: (error: any) => void
): () => void {
  const subscription = client
    .graphql<
      GraphQLSubscription<{ onConversationMessage: ConversationMessage }>
    >({
      query: onConversationMessage,
      variables: { projectId },
    })
    .subscribe({
      next: ({ data }: any) => {
        if (data?.onConversationMessage) {
          onMessage(data.onConversationMessage);
        }
      },
      error: (error: any) => {
        console.error("Subscription error:", error);
        if (onError) {
          onError(error);
        }
      },
    });

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Parse metadata from JSON string
 */
export function parseMetadata(
  metadata?: string
): Record<string, any> | undefined {
  if (!metadata) return undefined;

  try {
    return JSON.parse(metadata);
  } catch (error) {
    console.error("Error parsing metadata:", error);
    return undefined;
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
