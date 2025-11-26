/**
 * Document Service
 * Handles document uploads via pre-signed URLs
 */

import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export interface GenerateUploadUrlInput {
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface DocumentUploadUrl {
  uploadUrl: string;
  documentKey: string;
  expiresIn: number;
}

// GraphQL Mutation
const generateDocumentUploadUrlMutation = /* GraphQL */ `
  mutation GenerateDocumentUploadUrl($input: GenerateUploadUrlInput!) {
    generateDocumentUploadUrl(input: $input) {
      uploadUrl
      documentKey
      expiresIn
    }
  }
`;

/**
 * Generate a pre-signed URL for uploading a document
 */
export async function generateUploadUrl(
  input: GenerateUploadUrlInput
): Promise<DocumentUploadUrl> {
  try {
    const response: any = await client.graphql({
      query: generateDocumentUploadUrlMutation,
      variables: { input },
    });

    return response.data.generateDocumentUploadUrl as DocumentUploadUrl;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
}

/**
 * Upload a file to S3 using a pre-signed URL
 */
export async function uploadFileToS3(
  file: File,
  uploadUrl: string
): Promise<void> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Complete document upload flow
 */
export async function uploadDocument(
  projectId: string,
  file: File
): Promise<string> {
  // Generate pre-signed URL
  const { uploadUrl, documentKey } = await generateUploadUrl({
    projectId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  // Upload file to S3
  await uploadFileToS3(file, uploadUrl);

  // Return document key
  return documentKey;
}
