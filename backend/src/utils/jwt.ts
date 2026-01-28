/**
 * JWT Token Utilities
 *
 * JWT (JSON Web Tokens) are a way to authenticate users without sessions.
 *
 * How it works:
 * 1. User logs in with email/password
 * 2. Server creates a token containing user info, signed with a secret key
 * 3. Client stores token and sends it with every request
 * 4. Server verifies the signature to ensure token wasn't tampered with
 *
 * Token structure: header.payload.signature
 * - Header: Token type and algorithm
 * - Payload: User data (id, email, etc.)
 * - Signature: Cryptographic signature to verify authenticity
 */

import jwt from 'jsonwebtoken';

// What we store in the token
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

/**
 * Generate a JWT token for a user
 *
 * @param payload - User data to encode in the token
 * @returns Signed JWT token string
 */
export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token string to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.verify(token, secret) as TokenPayload;
}

/**
 * Generate a password reset token
 *
 * These tokens are shorter-lived (1 hour) and single-use
 */
export function generateResetToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(
    { userId, type: 'password-reset' },
    secret,
    { expiresIn: '1h' } as jwt.SignOptions
  );
}

/**
 * Verify a password reset token
 */
export function verifyResetToken(token: string): { userId: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = jwt.verify(token, secret) as { userId: string; type: string };

  if (payload.type !== 'password-reset') {
    throw new Error('Invalid reset token');
  }

  return { userId: payload.userId };
}
