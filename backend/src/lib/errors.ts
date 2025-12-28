/**
 * Standardized error handling for the Seattle Driver Optimizer
 */

export enum ErrorCode {
  // API Errors (1000-1999)
  API_KEY_MISSING = 1000,
  API_RATE_LIMITED = 1001,
  API_UNAVAILABLE = 1002,
  API_INVALID_RESPONSE = 1003,
  
  // Data Errors (2000-2999)
  DATA_VALIDATION_FAILED = 2000,
  DATA_NOT_FOUND = 2001,
  DATA_PARSE_ERROR = 2002,
  
  // Service Errors (3000-3999)
  SERVICE_UNAVAILABLE = 3000,
  SERVICE_TIMEOUT = 3001,
  SERVICE_CONFIG_ERROR = 3002,
  
  // Application Errors (4000-4999)
  INTERNAL_ERROR = 4000,
  VALIDATION_ERROR = 4001,
  AUTHENTICATION_ERROR = 4002,
  
  // Client Errors (5000-5999)
  CLIENT_ERROR = 5000,
  BAD_REQUEST = 5001,
  NOT_FOUND = 5002,
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  cause?: Error;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly cause?: Error;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(options: AppErrorOptions) {
    super(options.message);
    
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
    this.isOperational = options.isOperational ?? true;
    this.timestamp = new Date();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
      ...(this.cause && { cause: this.cause.message }),
    };
  }

  toString() {
    return `[${this.code}] ${this.name}: ${this.message}`;
  }
}

// Factory functions for common errors
export class ErrorFactory {
  static apiKeyMissing(service: string): AppError {
    return new AppError({
      code: ErrorCode.API_KEY_MISSING,
      message: `API key missing for ${service}`,
      details: { service },
      isOperational: true,
    });
  }

  static apiRateLimited(service: string, retryAfter?: number): AppError {
    return new AppError({
      code: ErrorCode.API_RATE_LIMITED,
      message: `Rate limited by ${service} API`,
      details: { service, retryAfter },
      isOperational: true,
    });
  }

  static apiUnavailable(service: string, cause?: Error): AppError {
    return new AppError({
      code: ErrorCode.API_UNAVAILABLE,
      message: `${service} API is currently unavailable`,
      details: { service },
      cause,
      isOperational: true,
    });
  }

  static dataValidationFailed(field: string, value: any, reason: string): AppError {
    return new AppError({
      code: ErrorCode.DATA_VALIDATION_FAILED,
      message: `Data validation failed for ${field}`,
      details: { field, value, reason },
      isOperational: true,
    });
  }

  static serviceTimeout(service: string, timeoutMs: number): AppError {
    return new AppError({
      code: ErrorCode.SERVICE_TIMEOUT,
      message: `${service} service timed out after ${timeoutMs}ms`,
      details: { service, timeoutMs },
      isOperational: true,
    });
  }

  static internalError(message: string, cause?: Error): AppError {
    return new AppError({
      code: ErrorCode.INTERNAL_ERROR,
      message,
      cause,
      isOperational: false,
    });
  }

  static badRequest(message: string, details?: Record<string, any>): AppError {
    return new AppError({
      code: ErrorCode.BAD_REQUEST,
      message,
      details,
      isOperational: true,
    });
  }

  static notFound(resource: string, id?: string): AppError {
    return new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `${resource}${id ? ` with ID ${id}` : ''} not found`,
      details: { resource, id },
      isOperational: true,
    });
  }
}

// Error handler middleware for Express
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle AppError instances
  if (error instanceof AppError) {
    const statusCode = getStatusCode(error.code);
    return res.status(statusCode).json({
      error: error.toJSON(),
    });
  }

  // Handle unknown errors
  const unknownError = ErrorFactory.internalError(
    'An unexpected error occurred',
    error
  );
  
  return res.status(500).json({
    error: unknownError.toJSON(),
  });
}

function getStatusCode(errorCode: ErrorCode): number {
  switch (errorCode) {
    case ErrorCode.BAD_REQUEST:
    case ErrorCode.DATA_VALIDATION_FAILED:
      return 400;
    case ErrorCode.AUTHENTICATION_ERROR:
      return 401;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.API_RATE_LIMITED:
      return 429;
    case ErrorCode.API_KEY_MISSING:
    case ErrorCode.API_UNAVAILABLE:
    case ErrorCode.API_INVALID_RESPONSE:
    case ErrorCode.SERVICE_UNAVAILABLE:
    case ErrorCode.SERVICE_TIMEOUT:
    case ErrorCode.SERVICE_CONFIG_ERROR:
      return 503;
    default:
      return 500;
  }
}

// Async error handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation utilities
export function validateRequired(value: any, field: string): void {
  if (value === undefined || value === null || value === '') {
    throw ErrorFactory.dataValidationFailed(field, value, 'Field is required');
  }
}

export function validateNumber(value: any, field: string, min?: number, max?: number): void {
  validateRequired(value, field);
  
  const num = Number(value);
  if (isNaN(num)) {
    throw ErrorFactory.dataValidationFailed(field, value, 'Must be a valid number');
  }
  
  if (min !== undefined && num < min) {
    throw ErrorFactory.dataValidationFailed(field, value, `Must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    throw ErrorFactory.dataValidationFailed(field, value, `Must be at most ${max}`);
  }
}

export function validateString(value: any, field: string, minLength?: number, maxLength?: number): void {
  validateRequired(value, field);
  
  if (typeof value !== 'string') {
    throw ErrorFactory.dataValidationFailed(field, value, 'Must be a string');
  }
  
  if (minLength !== undefined && value.length < minLength) {
    throw ErrorFactory.dataValidationFailed(field, value, `Must be at least ${minLength} characters`);
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    throw ErrorFactory.dataValidationFailed(field, value, `Must be at most ${maxLength} characters`);
  }
}
