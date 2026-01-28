/**
 * Password Hashing Utilities
 *
 * NEVER store passwords in plain text! Always hash them.
 *
 * How bcrypt works:
 * 1. Takes plain password + randomly generated "salt"
 * 2. Runs through hashing algorithm multiple times (cost factor)
 * 3. Produces a fixed-length hash that includes the salt
 *
 * Key features:
 * - One-way: Cannot reverse hash to get password
 * - Unique: Same password produces different hashes (due to salt)
 * - Slow: Intentionally slow to prevent brute force attacks
 *
 * Cost factor (12): Number of hashing rounds = 2^12 = 4096
 * Higher = more secure but slower. 12 is a good balance.
 */

import bcrypt from 'bcrypt';

// Cost factor for bcrypt (2^12 = 4096 rounds)
const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 *
 * @param password - Plain text password to hash
 * @returns Hashed password string (safe to store in database)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 *
 * @param password - Plain text password to check
 * @param hash - Stored hash to compare against
 * @returns true if password matches, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
