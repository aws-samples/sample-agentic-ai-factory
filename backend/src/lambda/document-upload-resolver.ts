/**
 * Document Upload Resolver Lambda
 * Generates pre-signed URLs for uploading documents to S3
 */

import { AppSyncResolverHandler } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { getUserId } from "../utils/appsync";

const s3Client = new S3Client({});
const DOCUMENT_BUCKET = process.env.DOCUMENT_BUCKET!;

interface GenerateUploadUrlInput {
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface UploadUrlResponse {
  uploadUrl: string;
  documentKey: string;
  expiresIn: number;
}

/**
 * Generate a pre-signed URL for uploading a document
 */
async function generateUploadUrl(
  input: GenerateUploadUrlInput,
  userId: string
): Promise<UploadUrlResponse> {
  const { projectId, fileName, fileType, fileSize } = input;

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileSize > maxSize) {
    throw new Error(
      `File size ${fileSize} exceeds maximum allowed size of ${maxSize} bytes (10MB)`
    );
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/plain",
    "text/markdown",
  ];

  if (!allowedTypes.includes(fileType)) {
    throw new Error(
      `File type ${fileType} is not allowed. Supported types: PDF, DOCX, TXT, MD`
    );
  }

  // Generate unique document key
  const docParts = fileName.split(".");
  const fileExtension = docParts.pop();
  const docName = docParts.at(0);
  //const documentId = uuidv4();
  const documentKey = `${projectId}/${docName}.${fileExtension}`;

  console.log("Generating upload URL:", {
    projectId,
    userId,
    fileName,
    fileType,
    fileSize,
    documentKey,
  });

  // Create S3 PutObject command
  const command = new PutObjectCommand({
    Bucket: DOCUMENT_BUCKET,
    Key: documentKey,
    ContentType: fileType,
    Metadata: {
      projectId,
      userId,
      originalFileName: fileName,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Generate pre-signed URL (valid for 15 minutes)
  const expiresIn = 900; // 15 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  console.log("Generated upload URL:", {
    documentKey,
    expiresIn,
  });

  return {
    uploadUrl,
    documentKey,
    expiresIn,
  };
}

/**
 * Lambda handler
 */
export const handler: AppSyncResolverHandler<any, any> = async (event) => {
  console.log(
    "Document upload resolver event:",
    JSON.stringify(event, null, 2)
  );

  const { info, arguments: args, identity } = event;
  const fieldName = info.fieldName;
  const userId = getUserId(identity);

  try {
    switch (fieldName) {
      case "generateDocumentUploadUrl":
        return await generateUploadUrl(args.input, userId);
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error("Document upload resolver error:", error);
    throw error;
  }
};
