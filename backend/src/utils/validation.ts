import { ProjectStatus, AgentStatusEnum, MessageType } from '../types';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateProjectInput(input: any): void {
  if (!input.name || typeof input.name !== 'string') {
    throw new ValidationError('Project name is required and must be a string', 'name');
  }

  if (input.name.length < 1 || input.name.length > 100) {
    throw new ValidationError('Project name must be between 1 and 100 characters', 'name');
  }

  if (input.description && typeof input.description !== 'string') {
    throw new ValidationError('Description must be a string', 'description');
  }

  if (input.description && input.description.length > 1000) {
    throw new ValidationError('Description must be less than 1000 characters', 'description');
  }

  if (input.requirements && typeof input.requirements !== 'string') {
    throw new ValidationError('Requirements must be a string', 'requirements');
  }

  if (input.requirements && input.requirements.length > 5000) {
    throw new ValidationError('Requirements must be less than 5000 characters', 'requirements');
  }
}

export function validateProjectStatus(status: string): boolean {
  return Object.values(ProjectStatus).includes(status as ProjectStatus);
}

export function validateAgentStatus(status: string): boolean {
  return Object.values(AgentStatusEnum).includes(status as AgentStatusEnum);
}

export function validateMessageType(messageType: string): boolean {
  return Object.values(MessageType).includes(messageType as MessageType);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();

  return sanitized.substring(0, maxLength);
}

export function validatePaginationInput(input: any): void {
  if (input.limit && (typeof input.limit !== 'number' || input.limit < 1 || input.limit > 100)) {
    throw new ValidationError('Limit must be a number between 1 and 100', 'limit');
  }

  if (input.nextToken && typeof input.nextToken !== 'string') {
    throw new ValidationError('NextToken must be a string', 'nextToken');
  }
}

export function validateS3Object(s3Object: any): void {
  if (!s3Object.bucket || typeof s3Object.bucket !== 'string') {
    throw new ValidationError('S3 bucket is required and must be a string', 'bucket');
  }

  if (!s3Object.key || typeof s3Object.key !== 'string') {
    throw new ValidationError('S3 key is required and must be a string', 'key');
  }

  if (!s3Object.region || typeof s3Object.region !== 'string') {
    throw new ValidationError('S3 region is required and must be a string', 'region');
  }

  // Validate S3 key format
  const keyRegex = /^[a-zA-Z0-9!_.*'()-\/]+$/;
  if (!keyRegex.test(s3Object.key)) {
    throw new ValidationError('Invalid S3 key format', 'key');
  }
}