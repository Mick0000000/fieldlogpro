/**
 * Authentication Routes
 *
 * Handles user registration, login, and password reset.
 * These routes are PUBLIC (no authentication required).
 *
 * IMPORTANT SECURITY NOTE:
 * - Passwords are ALWAYS hashed before storing (using bcrypt)
 * - JWT tokens are used for session management
 * - Never log or expose plain-text passwords
 *
 * Routes:
 * - POST /api/auth/signup       - Create new company & admin user
 * - POST /api/auth/login        - Authenticate and get token
 * - POST /api/auth/forgot-password - Request password reset email
 * - POST /api/auth/reset-password  - Reset password with token
 */

import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { validate, emailSchema, passwordSchema } from '../middleware/validate';
import { Errors } from '../middleware/errorHandler';
import { generateToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';

// Create router instance
const router = Router();

// Create Prisma client for database operations
// Prisma is our ORM (Object-Relational Mapping) that lets us interact with the database using JavaScript/TypeScript
const prisma = new PrismaClient();

// ===================
// VALIDATION SCHEMAS
// ===================
// Joi schemas define what data we expect for each endpoint.
// If the data doesn't match, the request is rejected with a 422 error.

/**
 * Schema for signup - creates a new company and admin user
 *
 * Why these fields?
 * - companyName: Required for multi-tenant setup (each company is isolated)
 * - email: User's login credential, must be unique across all users
 * - password: Must be strong (8+ chars, letter + number)
 * - firstName/lastName: For display and communication
 */
const signupSchema = Joi.object({
  companyName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Company name must be at least 2 characters',
      'string.max': 'Company name must be less than 100 characters',
      'string.empty': 'Company name is required',
    }),
  email: emailSchema, // Reuse the common email validation from validate.ts
  password: passwordSchema, // Reuse the common password validation
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name must be less than 50 characters',
      'string.empty': 'First name is required',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must be less than 50 characters',
      'string.empty': 'Last name is required',
    }),
});

/**
 * Schema for login - authenticate existing user
 */
const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

/**
 * Schema for forgot password - just needs email
 */
const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

/**
 * Schema for reset password - token and new password
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
  }),
  newPassword: passwordSchema,
});

// ===================
// HELPER FUNCTIONS
// ===================

/**
 * Remove sensitive fields from user object before sending to client
 *
 * Why? We NEVER want to send the password hash to the client.
 * Even though it's hashed, it's a security best practice to exclude it.
 *
 * @param user - User object from database
 * @returns User object without password and reset token fields
 */
function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// ===================
// ROUTE HANDLERS
// ===================

/**
 * POST /api/auth/signup
 *
 * Creates a new company and an admin user for that company.
 * This is the entry point for new customers signing up.
 *
 * Flow:
 * 1. Validate input data (companyName, email, password, firstName, lastName)
 * 2. Check if email is already in use
 * 3. Hash the password (NEVER store plain text!)
 * 4. Create the Company record
 * 5. Create the User record with role "admin"
 * 6. Generate a JWT token for immediate login
 * 7. Return user data and token
 */
router.post(
  '/signup',
  validate(signupSchema), // Middleware: validates request body against schema
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Extract validated data from request body
      // After validation middleware runs, req.body contains clean, validated data
      const { companyName, email, password, firstName, lastName } = req.body;

      // Step 2: Check if email is already registered
      // Each email must be unique across all users (enforced in DB too, but we check first for better error messages)
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Return a 409 Conflict error - the resource (email) already exists
        throw Errors.conflict('An account with this email already exists');
      }

      // Step 3: Hash the password
      // This is CRITICAL for security - never store plain text passwords!
      // bcrypt automatically generates a salt and includes it in the hash
      const hashedPassword = await hashPassword(password);

      // Step 4 & 5: Create Company and User in a transaction
      // A transaction ensures both are created together - if one fails, both are rolled back
      // This prevents orphaned records (e.g., a company without an admin)
      const result = await prisma.$transaction(async (tx) => {
        // Create the company first
        const company = await tx.company.create({
          data: {
            name: companyName,
            email: email, // Company contact email (same as admin for now)
            subscriptionStatus: 'trial', // New signups start on trial
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });

        // Create the admin user linked to this company
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'admin', // First user is always admin
            companyId: company.id,
            isActive: true,
          },
        });

        return { company, user };
      });

      // Step 6: Generate JWT token
      // This token will be used for all authenticated API requests
      const token = generateToken({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.user.companyId,
      });

      // Step 7: Return success response
      // Note: We use sanitizeUser() to remove the password hash from the response
      res.status(201).json({
        message: 'Account created successfully',
        user: sanitizeUser(result.user),
        token,
      });
    } catch (error) {
      // Pass errors to the global error handler
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 *
 * Flow:
 * 1. Validate input data (email, password)
 * 2. Find user by email
 * 3. Compare password hash
 * 4. Check if user is active
 * 5. Generate JWT token
 * 6. Return user data and token
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Extract validated data
      const { email, password } = req.body;

      // Step 2: Find user by email
      // We need to include the password field for comparison (normally excluded)
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Step 3: Check if user exists and verify password
      // IMPORTANT: We use the same error message for both "user not found" and "wrong password"
      // This prevents attackers from knowing which emails are registered (security best practice)
      if (!user) {
        throw Errors.unauthorized('Invalid email or password');
      }

      // Compare the provided password with the stored hash
      // bcrypt.compare handles the salt automatically
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw Errors.unauthorized('Invalid email or password');
      }

      // Step 4: Check if user account is active
      // Admins can deactivate users without deleting them
      if (!user.isActive) {
        throw Errors.unauthorized('Your account has been deactivated. Please contact support.');
      }

      // Step 5: Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      });

      // Step 6: Return success response
      res.json({
        message: 'Login successful',
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 *
 * Initiates the password reset process.
 * Generates a reset token and (eventually) sends it via email.
 *
 * Flow:
 * 1. Validate input (email)
 * 2. Find user by email
 * 3. Generate a secure random reset token
 * 4. Store token and expiry in database
 * 5. Log token to console (email sending will be added later)
 * 6. Return success message
 *
 * SECURITY NOTE: We always return success, even if email doesn't exist.
 * This prevents attackers from discovering which emails are registered.
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Extract validated email
      const { email } = req.body;

      // Step 2: Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // SECURITY: Always return success message, even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        // Log for debugging but don't tell the client
        console.log(`[FORGOT-PASSWORD] No user found for email: ${email}`);
        res.json({
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
        return;
      }

      // Step 3: Generate a secure random reset token
      // crypto.randomBytes generates cryptographically secure random data
      // We convert to hex string for easy storage and URL usage
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Step 4: Set token expiry to 1 hour from now
      // After this time, the token becomes invalid (security measure)
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store the token and expiry in the user record
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Step 5: Log the token (replace with email sending later)
      // In production, you would send this via email with a link like:
      // https://yourapp.com/reset-password?token=<resetToken>
      console.log('========================================');
      console.log('[FORGOT-PASSWORD] Reset token generated');
      console.log(`Email: ${email}`);
      console.log(`Token: ${resetToken}`);
      console.log(`Expires: ${resetTokenExpiry.toISOString()}`);
      console.log('========================================');

      // Step 6: Return success message
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/reset-password
 *
 * Completes the password reset process using the token from email.
 *
 * Flow:
 * 1. Validate input (token, newPassword)
 * 2. Find user by reset token
 * 3. Check if token has expired
 * 4. Hash the new password
 * 5. Update user password and clear reset token
 * 6. Return success message
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Step 1: Extract validated data
      const { token, newPassword } = req.body;

      // Step 2: Find user by reset token
      // The token should be unique, so we can search by it directly
      const user = await prisma.user.findFirst({
        where: { resetToken: token },
      });

      if (!user) {
        // Invalid token - either doesn't exist or was already used
        throw Errors.badRequest('Invalid or expired reset token');
      }

      // Step 3: Check if token has expired
      // resetTokenExpiry stores when the token becomes invalid
      if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        // Token has expired - clear it from database for cleanup
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: null,
            resetTokenExpiry: null,
          },
        });
        throw Errors.badRequest('Reset token has expired. Please request a new one.');
      }

      // Step 4: Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Step 5: Update user password and clear reset token
      // Clearing the token ensures it can't be used again (single-use)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null, // Clear the token
          resetTokenExpiry: null, // Clear the expiry
        },
      });

      // Log successful password reset
      console.log(`[RESET-PASSWORD] Password reset successful for user: ${user.email}`);

      // Step 6: Return success message
      res.json({
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
