/**
 * Authentication Middleware
 *
 * This middleware verifies JWT tokens and attaches user info to requests.
 * Protected routes use this to ensure only authenticated users can access them.
 *
 * How JWT authentication works:
 * 1. User logs in, server creates a JWT token containing user ID
 * 2. Client stores token (localStorage, AsyncStorage, etc.)
 * 3. Client sends token in Authorization header: "Bearer <token>"
 * 4. This middleware verifies the token and fetches user data
 * 5. If valid, request continues; if not, returns 401 Unauthorized
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Errors } from './errorHandler';

const prisma = new PrismaClient();

// Extend Express Request type to include our user data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId: string;
    firstName: string;
    lastName: string;
  };
}

// Type for JWT payload
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

/**
 * Main auth middleware - verifies token and loads user
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Errors.unauthorized('No token provided');
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      throw Errors.unauthorized('Invalid or expired token');
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw Errors.unauthorized('User not found or inactive');
    }

    // Attach user to request for use in route handlers
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require admin role
 * Use after authenticate middleware
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(Errors.unauthorized());
    return;
  }

  if (req.user.role !== 'admin') {
    next(Errors.forbidden('Admin access required'));
    return;
  }

  next();
}
