/**
 * Custom error classes for better error handling and debugging
 */

export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public readonly resource?: string) {
    super(message);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public readonly resource?: string) {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends Error {
  constructor(message: string, public readonly resource?: string) {
    super(message);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Parse Supabase/PostgreSQL error codes and convert to appropriate error types
 */
export function parseDatabaseError(error: unknown, context?: string): Error {
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message: string; details?: string };
    const errorMessage = context ? `${context}: ${dbError.message}` : dbError.message;

    switch (dbError.code) {
      case '23505': // Unique violation
        return new ConflictError(
          errorMessage || 'A record with this value already exists',
          context
        );
      case '23503': // Foreign key violation
        return new ValidationError(
          errorMessage || 'Referenced record does not exist',
          context
        );
      case '23502': // Not null violation
        return new ValidationError(
          errorMessage || 'Required field is missing',
          context
        );
      case '23514': // Check violation
        return new ValidationError(
          errorMessage || 'Data does not meet required constraints',
          context
        );
      case 'PGRST116': // Not found (PostgREST)
        return new NotFoundError(
          errorMessage || 'Record not found',
          context
        );
      default:
        return new DatabaseError(errorMessage, dbError.code, error);
    }
  }

  if (error instanceof Error) {
    return new DatabaseError(
      context ? `${context}: ${error.message}` : error.message,
      undefined,
      error
    );
  }

  return new DatabaseError(
    context ? `${context}: Unknown database error` : 'Unknown database error',
    undefined,
    error
  );
}

