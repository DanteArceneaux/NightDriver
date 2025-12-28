/**
 * Standardized error handling for the frontend
 */

export enum FrontendErrorCode {
  // Network Errors
  NETWORK_ERROR = 1000,
  TIMEOUT_ERROR = 1001,
  CORS_ERROR = 1002,
  
  // API Errors
  API_ERROR = 2000,
  VALIDATION_ERROR = 2001,
  NOT_FOUND = 2002,
  RATE_LIMITED = 2003,
  
  // Application Errors
  GEOLOCATION_ERROR = 3000,
  PERMISSION_ERROR = 3001,
  STORAGE_ERROR = 3002,
  
  // User Errors
  INVALID_INPUT = 4000,
  ACTION_FAILED = 4001,
}

export interface FrontendErrorOptions {
  code: FrontendErrorCode;
  message: string;
  details?: Record<string, any>;
  cause?: Error;
  userFriendly?: boolean;
}

export class FrontendError extends Error {
  public readonly code: FrontendErrorCode;
  public readonly details?: Record<string, any>;
  public readonly cause?: Error;
  public readonly userFriendly: boolean;
  public readonly timestamp: Date;

  constructor(options: FrontendErrorOptions) {
    super(options.message);
    
    this.name = 'FrontendError';
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
    this.userFriendly = options.userFriendly ?? true;
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
      userFriendly: this.userFriendly,
      ...(this.cause && { cause: this.cause.message }),
    };
  }

  toString() {
    return `[${this.code}] ${this.name}: ${this.message}`;
  }
}

// Factory functions for common frontend errors
export class FrontendErrorFactory {
  static networkError(message: string, cause?: Error): FrontendError {
    return new FrontendError({
      code: FrontendErrorCode.NETWORK_ERROR,
      message,
      cause,
      userFriendly: true,
    });
  }

  static timeoutError(operation: string, timeoutMs: number): FrontendError {
    return new FrontendError({
      code: FrontendErrorCode.TIMEOUT_ERROR,
      message: `${operation} timed out after ${timeoutMs}ms`,
      details: { operation, timeoutMs },
      userFriendly: true,
    });
  }

  static apiError(status: number, message: string): FrontendError {
    return new FrontendError({
      code: FrontendErrorCode.API_ERROR,
      message: `API Error (${status}): ${message}`,
      details: { status, message },
      userFriendly: true,
    });
  }

  static geolocationError(reason: string): FrontendError {
    return new FrontendError({
      code: FrontendErrorCode.GEOLOCATION_ERROR,
      message: `Geolocation error: ${reason}`,
      details: { reason },
      userFriendly: true,
    });
  }

  static permissionError(permission: string): FrontendError {
    return new FrontendError({
      code: FrontendErrorCode.PERMISSION_ERROR,
      message: `Permission denied for ${permission}`,
      details: { permission },
      userFriendly: true,
    });
  }

  static invalidInput(field: string, value: any, reason: string): FrontendError {
    return new FrontendError({
      code: FrontendErrorCode.INVALID_INPUT,
      message: `Invalid input for ${field}`,
      details: { field, value, reason },
      userFriendly: true,
    });
  }
}

// Error handling utilities
export function handleError(error: unknown): FrontendError {
  if (error instanceof FrontendError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'AbortError') {
      return FrontendErrorFactory.timeoutError('Request', 5000);
    }

    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return FrontendErrorFactory.networkError('Network connection failed', error);
    }

    if (error.message.includes('CORS')) {
      return FrontendErrorFactory.networkError('Cross-origin request blocked', error);
    }

    // Generic error
    return new FrontendError({
      code: FrontendErrorCode.ACTION_FAILED,
      message: error.message,
      cause: error,
      userFriendly: false,
    });
  }

  // Unknown error type
  return new FrontendError({
    code: FrontendErrorCode.ACTION_FAILED,
    message: 'An unexpected error occurred',
    details: { originalError: error },
    userFriendly: false,
  });
}

// Error logging utility
export function logError(error: FrontendError, context?: string) {
  console.error(`[${context || 'App'}] Error:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    cause: error.cause?.message,
    stack: error.stack,
    timestamp: error.timestamp.toISOString(),
  });

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

// User-friendly error messages
export function getUserFriendlyMessage(error: FrontendError): string {
  if (!error.userFriendly) {
    return 'An unexpected error occurred. Please try again.';
  }

  switch (error.code) {
    case FrontendErrorCode.NETWORK_ERROR:
      return 'Network connection failed. Please check your internet connection.';
    
    case FrontendErrorCode.TIMEOUT_ERROR:
      return 'The request timed out. Please try again.';
    
    case FrontendErrorCode.API_ERROR:
      return 'Server error. Please try again later.';
    
    case FrontendErrorCode.GEOLOCATION_ERROR:
      return 'Unable to get your location. Please enable location services.';
    
    case FrontendErrorCode.PERMISSION_ERROR:
      return 'Permission denied. Please check your browser settings.';
    
    case FrontendErrorCode.INVALID_INPUT:
      return 'Invalid input. Please check your entries and try again.';
    
    default:
      return error.message;
  }
}

// Safe execution wrapper
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: FrontendError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const frontendError = handleError(error);
    logError(frontendError, context);
    return { error: frontendError };
  }
}

// React hook for error handling
import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<FrontendError | null>(null);

  const handleError = useCallback((error: unknown) => {
    const frontendError = handleError(error);
    setError(frontendError);
    logError(frontendError);
    return frontendError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    getUserFriendlyMessage: error ? getUserFriendlyMessage(error) : null,
  };
}
