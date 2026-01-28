/**
 * User Routes
 *
 * This file handles all user-related API endpoints. Users can:
 * - View their own profile
 * - Update their profile information
 * - (Admins only) List all users in their company
 * - (Admins only) Invite new users
 * - (Admins only) View/update any user in their company
 *
 * SECURITY: All routes require authentication (JWT token).
 * Some routes also require admin role for extra protection.
 *
 * Multi-tenancy: Users can only see/modify users within their own company.
 * This is enforced by checking companyId from the authenticated user's token.
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import crypto from 'crypto';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { validate, paginationSchema, idParamSchema, emailSchema } from '../middleware/validate';
import { Errors } from '../middleware/errorHandler';
import { hashPassword, comparePassword } from '../utils/password';

// Initialize Prisma client for database operations
const prisma = new PrismaClient();

// Create Express router instance
const router = Router();

// ===================
// VALIDATION SCHEMAS
// ===================

/**
 * Schema for creating/inviting a new user
 *
 * Required fields: email, firstName, lastName
 * Optional fields: role, licenseNumber, licenseState
 *
 * Why these validations?
 * - email: Must be valid format, will be used for login
 * - firstName/lastName: Required for identification, max 100 chars
 * - role: Only allow valid roles (admin/applicator)
 * - licenseNumber/licenseState: For pesticide applicator licensing compliance
 */
const createUserSchema = Joi.object({
  email: emailSchema,
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name must be less than 100 characters',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name must be less than 100 characters',
    }),
  role: Joi.string()
    .valid('admin', 'applicator')
    .default('applicator')
    .messages({
      'any.only': 'Role must be either admin or applicator',
    }),
  licenseNumber: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .optional()
    .messages({
      'string.max': 'License number must be less than 50 characters',
    }),
  licenseState: Joi.string()
    .trim()
    .length(2)
    .uppercase()
    .allow('')
    .optional()
    .messages({
      'string.length': 'License state must be a 2-letter code (e.g., TX, FL)',
    }),
});

/**
 * Schema for updating a user profile
 *
 * All fields are optional since this is a PATCH (partial update).
 * Different fields are allowed based on role (see route handler).
 */
const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'First name cannot be empty',
      'string.max': 'First name must be less than 100 characters',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Last name cannot be empty',
      'string.max': 'Last name must be less than 100 characters',
    }),
  licenseNumber: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'License number must be less than 50 characters',
    }),
  licenseState: Joi.string()
    .trim()
    .length(2)
    .uppercase()
    .allow('')
    .messages({
      'string.length': 'License state must be a 2-letter code (e.g., TX, FL)',
    }),
  // Admin-only fields (validated in handler)
  role: Joi.string()
    .valid('admin', 'applicator')
    .messages({
      'any.only': 'Role must be either admin or applicator',
    }),
  isActive: Joi.boolean(),
  // Password change fields
  currentPassword: Joi.string(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password must be less than 128 characters',
      'string.pattern.base': 'New password must contain at least one letter and one number',
    }),
})
  // Custom validation: if newPassword is provided, currentPassword is required
  .with('newPassword', 'currentPassword')
  .messages({
    'object.with': 'Current password is required when setting a new password',
  });

// ===================
// HELPER FUNCTIONS
// ===================

/**
 * Generate a random temporary password
 *
 * Creates a secure random string that meets our password requirements.
 * Used when inviting new users (they'll get a temp password to log in with).
 *
 * Format: 8 random chars + 2 random digits
 * This ensures it meets our "letter + number" requirement.
 *
 * @returns A random password string
 */
function generateTempPassword(): string {
  // Generate 8 random characters (letters)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'; // Excluded confusing chars: I, l, O, 0
  const digits = '23456789'; // Excluded confusing: 0, 1

  let password = '';

  // Add 8 random characters
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars[randomIndex];
  }

  // Add 2 random digits to ensure password meets requirements
  for (let i = 0; i < 2; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    password += digits[randomIndex];
  }

  return password;
}

/**
 * Fields to select when returning user data
 *
 * IMPORTANT: Never return the password hash!
 * This object defines which fields are safe to send in API responses.
 */
const userSelectFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  licenseNumber: true,
  licenseState: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  companyId: true,
  // Explicitly exclude password, resetToken, resetTokenExpiry
};

// ===================
// ROUTES
// ===================

/**
 * GET /api/users
 *
 * List all users in the authenticated user's company.
 * Supports pagination and includes application count per user.
 *
 * ADMIN ONLY: Regular users shouldn't see the full user list.
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: asc or desc (default: desc)
 *
 * Response includes:
 * - users: Array of user objects with application count
 * - pagination: Total count, pages, current page info
 */
router.get(
  '/',
  authenticate, // First, verify user is logged in
  requireAdmin, // Then, verify they're an admin
  validate(paginationSchema, 'query'), // Validate query parameters
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract validated pagination params from query string
      // Note: After Joi validation, these values are guaranteed to be the correct types
      const page = req.query.page as unknown as number;
      const limit = req.query.limit as unknown as number;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';

      // Calculate how many records to skip for pagination
      // Page 1 = skip 0, Page 2 = skip [limit], etc.
      const skip = (page - 1) * limit;

      // Get the company ID from the authenticated user
      // This ensures we only return users from their company (multi-tenancy)
      const companyId = req.user!.companyId;

      // Execute two queries in parallel for efficiency:
      // 1. Get the users with pagination
      // 2. Get total count for pagination metadata
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: { companyId }, // Only users in same company
          select: {
            ...userSelectFields,
            // Include a count of applications for each user
            // This is useful for showing activity/workload
            _count: {
              select: { applications: true },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.user.count({ where: { companyId } }),
      ]);

      // Transform the response to flatten the _count field
      // Instead of { _count: { applications: 5 } }, return { applicationCount: 5 }
      const usersWithCount = users.map((user) => ({
        ...user,
        applicationCount: user._count.applications,
        _count: undefined, // Remove the nested _count object
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);

      // Send successful response with users and pagination info
      res.json({
        users: usersWithCount,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      // Pass any errors to the error handler middleware
      next(error);
    }
  }
);

/**
 * GET /api/users/me
 *
 * Get the current authenticated user's profile.
 * Also includes their company information.
 *
 * This is the most commonly called user endpoint - the mobile app
 * calls it on startup to get the current user's details.
 *
 * No special permissions required - any authenticated user can
 * view their own profile.
 */
router.get(
  '/me',
  authenticate, // Verify user is logged in
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get the user's ID from the JWT token (set by authenticate middleware)
      const userId = req.user!.id;

      // Fetch full user data including company info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          ...userSelectFields,
          // Include company details for display in the app
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              licenseNumber: true,
              licenseState: true,
              subscriptionStatus: true,
              trialEndsAt: true,
            },
          },
        },
      });

      // This shouldn't happen since we authenticated, but TypeScript requires the check
      if (!user) {
        throw Errors.notFound('User');
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/:id
 *
 * Get a single user by their ID.
 * ADMIN ONLY: Can view any user in their company.
 *
 * Security: Verifies the requested user belongs to the same company
 * as the admin making the request (multi-tenancy protection).
 */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  validate(idParamSchema, 'params'), // Validate the :id parameter
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const companyId = req.user!.companyId;

      // Fetch the user, but only if they belong to the same company
      const user = await prisma.user.findFirst({
        where: {
          id,
          companyId, // IMPORTANT: Ensures we can only access users in our company
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          // Include count of applications for this user
          _count: {
            select: { applications: true },
          },
        },
      });

      // If not found (or belongs to different company), return 404
      if (!user) {
        throw Errors.notFound('User');
      }

      // Return user without password hash
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, resetToken, resetTokenExpiry, _count, ...safeUser } = user;

      // Flatten the response
      res.json({
        user: {
          ...safeUser,
          applicationCount: _count.applications,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users
 *
 * Invite a new user to the company.
 * ADMIN ONLY: Only admins can add new users.
 *
 * This creates a new user with a temporary password.
 * In production, you'd email this password to the user.
 * For now, we log it to the console.
 *
 * The new user will belong to the same company as the admin
 * who invited them.
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createUserSchema), // Validate request body
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, firstName, lastName, role, licenseNumber, licenseState } = req.body;
      const companyId = req.user!.companyId;

      // Check if a user with this email already exists
      // Email must be unique across all companies
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw Errors.conflict('A user with this email already exists');
      }

      // Generate a temporary password for the new user
      const tempPassword = generateTempPassword();

      // Hash the password before storing (NEVER store plain text!)
      const hashedPassword = await hashPassword(tempPassword);

      // Create the new user in the database
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || 'applicator', // Default to applicator if not specified
          licenseNumber: licenseNumber || null,
          licenseState: licenseState || null,
          companyId, // Same company as the admin
          isActive: true,
        },
        select: userSelectFields, // Don't return the password hash!
      });

      // Log the temporary password to console
      // TODO: In production, send this via email using Resend
      console.log('===========================================');
      console.log('NEW USER INVITED');
      console.log(`Email: ${email}`);
      console.log(`Temporary Password: ${tempPassword}`);
      console.log('===========================================');

      // Return 201 Created with the new user data
      res.status(201).json({
        user: newUser,
        message: 'User created successfully. Temporary password has been logged to console.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/users/:id
 *
 * Update a user's profile.
 *
 * Permission rules:
 * 1. Users can update their OWN profile: firstName, lastName, licenseNumber, licenseState
 * 2. Admins can update ANY user in their company, including: role, isActive
 * 3. Password changes require currentPassword verification
 *
 * Security:
 * - Users can only edit themselves unless they're admin
 * - Admins can only edit users in their own company
 * - Password changes always require the current password
 */
router.patch(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUser = req.user!;
      const isAdmin = currentUser.role === 'admin';
      const isOwnProfile = currentUser.id === id;

      // Permission check: Must be admin or editing own profile
      if (!isAdmin && !isOwnProfile) {
        throw Errors.forbidden('You can only update your own profile');
      }

      // Find the user being updated
      const userToUpdate = await prisma.user.findFirst({
        where: {
          id,
          companyId: currentUser.companyId, // Must be in same company
        },
      });

      if (!userToUpdate) {
        throw Errors.notFound('User');
      }

      // Build the update data based on what was provided and permissions
      const updateData: {
        firstName?: string;
        lastName?: string;
        licenseNumber?: string | null;
        licenseState?: string | null;
        role?: string;
        isActive?: boolean;
        password?: string;
      } = {};

      // Fields any user can update on their own profile
      const { firstName, lastName, licenseNumber, licenseState } = req.body;

      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber || null;
      if (licenseState !== undefined) updateData.licenseState = licenseState || null;

      // Admin-only fields: role and isActive
      const { role, isActive } = req.body;

      if (role !== undefined) {
        if (!isAdmin) {
          throw Errors.forbidden('Only admins can change user roles');
        }
        // Prevent admin from demoting themselves (to avoid lockout)
        if (isOwnProfile && role !== 'admin') {
          throw Errors.badRequest('You cannot remove your own admin role');
        }
        updateData.role = role;
      }

      if (isActive !== undefined) {
        if (!isAdmin) {
          throw Errors.forbidden('Only admins can activate/deactivate users');
        }
        // Prevent admin from deactivating themselves
        if (isOwnProfile && !isActive) {
          throw Errors.badRequest('You cannot deactivate your own account');
        }
        updateData.isActive = isActive;
      }

      // Handle password change (requires current password verification)
      const { currentPassword, newPassword } = req.body;

      if (newPassword) {
        // Only allow changing your own password
        if (!isOwnProfile) {
          throw Errors.forbidden('You can only change your own password');
        }

        // Verify the current password is correct
        const isPasswordValid = await comparePassword(currentPassword, userToUpdate.password);
        if (!isPasswordValid) {
          throw Errors.badRequest('Current password is incorrect');
        }

        // Hash and set the new password
        updateData.password = await hashPassword(newPassword);
      }

      // Check if there's actually anything to update
      if (Object.keys(updateData).length === 0) {
        throw Errors.badRequest('No valid fields provided for update');
      }

      // Perform the update
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: userSelectFields, // Don't return password!
      });

      res.json({
        user: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export the router to be used in the main app
export default router;
