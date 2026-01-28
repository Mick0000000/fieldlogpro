/**
 * Validation Middleware
 *
 * This middleware uses Joi schemas to validate incoming request data.
 * If validation fails, it returns a 422 error with details about what's wrong.
 *
 * Why validate input?
 * - Security: Prevents injection attacks and malformed data
 * - Data integrity: Ensures database receives correct data types
 * - User experience: Provides clear error messages
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Errors } from './errorHandler';

// Where to look for data to validate
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Creates a validation middleware for a given Joi schema
 *
 * @param schema - Joi schema to validate against
 * @param source - Where to find the data (body, query, or params)
 *
 * @example
 * // In a route file:
 * const createUserSchema = Joi.object({
 *   email: Joi.string().email().required(),
 *   password: Joi.string().min(8).required(),
 * });
 *
 * router.post('/users', validate(createUserSchema), createUser);
 */
export function validate(schema: Joi.ObjectSchema, source: ValidationSource = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true, // Remove fields not in schema
    });

    if (error) {
      // Format Joi errors into a user-friendly structure
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      next(Errors.validationError('Validation failed', details));
      return;
    }

    // Replace request data with validated/sanitized data
    req[source] = value;
    next();
  };
}

// ===================
// COMMON VALIDATION SCHEMAS
// ===================

// Email validation
export const emailSchema = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
    'string.max': 'Email must be less than 255 characters',
  });

// Password validation (minimum 8 chars, at least one letter and one number)
export const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must be less than 128 characters',
    'string.pattern.base': 'Password must contain at least one letter and one number',
    'string.empty': 'Password is required',
  });

// Common ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'ID is required',
  }),
});

// Pagination query params
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
