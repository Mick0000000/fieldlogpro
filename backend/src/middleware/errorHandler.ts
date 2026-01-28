/**
 * Global Error Handler Middleware
 *
 * This middleware catches all errors thrown in routes and returns
 * a consistent JSON error response. It's the last middleware in the chain.
 *
 * Express identifies error handlers by having 4 parameters: (err, req, res, next)
 */

import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common error factory functions for convenience
export const Errors = {
  badRequest: (message: string, details?: unknown) =>
    new ApiError(400, 'BAD_REQUEST', message, details),

  unauthorized: (message = 'Unauthorized') =>
    new ApiError(401, 'UNAUTHORIZED', message),

  forbidden: (message = 'Forbidden') =>
    new ApiError(403, 'FORBIDDEN', message),

  notFound: (resource = 'Resource') =>
    new ApiError(404, 'NOT_FOUND', `${resource} not found`),

  conflict: (message: string) =>
    new ApiError(409, 'CONFLICT', message),

  validationError: (message: string, details?: unknown) =>
    new ApiError(422, 'VALIDATION_ERROR', message, details),

  internalError: (message = 'Internal server error') =>
    new ApiError(500, 'INTERNAL_ERROR', message),
};

// The actual error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Log the error for debugging
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // If it's our custom ApiError, use its properties
  if (err instanceof ApiError) {
    const errorResponse: { code: string; message: string; details?: unknown } = {
      code: err.code,
      message: err.message,
    };
    if (err.details) {
      errorResponse.details = err.details;
    }
    res.status(err.statusCode).json({ error: errorResponse });
    return;
  }

  // For unknown errors, return a generic 500 response
  // In production, don't expose error details
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
    },
  });
}
