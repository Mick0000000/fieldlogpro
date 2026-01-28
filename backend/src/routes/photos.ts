/**
 * Photo Upload Routes
 *
 * Handles photo uploads for pesticide applications using Cloudflare R2 storage.
 * Uses presigned URLs so mobile app uploads directly to R2 (faster, no server bandwidth).
 *
 * Routes:
 * - POST /api/photos/upload-url - Generate presigned URL for direct upload
 */

import { Router, Response, NextFunction } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

// Create router instance
const router = Router();

// ===================
// S3 CLIENT SETUP
// ===================

/**
 * Initialize S3 client for Cloudflare R2
 *
 * Cloudflare R2 is S3-compatible, so we use the AWS SDK with R2's endpoint.
 * Returns null if R2 is not configured (allows development without cloud setup).
 */
const getS3Client = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null; // R2 not configured
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// ===================
// ROUTE HANDLERS
// ===================

/**
 * POST /api/photos/upload-url
 *
 * Generates a presigned URL for direct upload to Cloudflare R2.
 * The client uploads directly to R2 using this URL, bypassing the server.
 *
 * Request body:
 * {
 *   type: 'label' | 'before' | 'after';  // Type of photo being uploaded
 *   contentType: string;                  // MIME type, e.g., 'image/jpeg'
 * }
 *
 * Response:
 * {
 *   uploadUrl: string;  // Presigned URL to PUT the file (expires in 15 minutes)
 *   fileUrl: string;    // Public URL where file will be accessible after upload
 *   key: string;        // File key/path in R2 bucket
 *   mock?: boolean;     // Present and true if using mock URLs (R2 not configured)
 * }
 *
 * Flow:
 * 1. Validate type (label, before, or after) and contentType (must be image)
 * 2. Generate unique file key organized by company and type
 * 3. Create presigned URL for upload
 * 4. Return URLs for upload and access
 */
router.post(
  '/upload-url',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, contentType } = req.body;

      // Validate type parameter
      if (!type || !['label', 'before', 'after'].includes(type)) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'type must be label, before, or after' }
        });
      }

      // Validate contentType parameter
      if (!contentType || !contentType.startsWith('image/')) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'contentType must be an image type' }
        });
      }

      const s3Client = getS3Client();
      const bucket = process.env.CLOUDFLARE_R2_BUCKET;

      // If R2 not configured, return mock URLs for development
      // This allows the app to work without cloud storage during local development
      if (!s3Client || !bucket) {
        console.log('[PHOTOS] R2 not configured, returning mock URLs');
        const mockKey = `photos/${req.user!.companyId}/${type}/${crypto.randomUUID()}.jpg`;
        return res.json({
          uploadUrl: `https://mock-upload-url.example.com/${mockKey}`,
          fileUrl: `https://mock-cdn.example.com/${mockKey}`,
          key: mockKey,
          mock: true
        });
      }

      // Generate unique file key
      // Structure: photos/{companyId}/{type}/{uuid}.{extension}
      // This organizes files by company and type for easy management
      const extension = contentType === 'image/png' ? 'png' : 'jpg';
      const key = `photos/${req.user!.companyId}/${type}/${crypto.randomUUID()}.${extension}`;

      // Create presigned URL for upload (expires in 15 minutes)
      // The client will use this URL to PUT the file directly to R2
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      // Construct public URL for accessing the file after upload
      // Uses custom domain if configured, otherwise falls back to R2's default domain
      const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://${bucket}.r2.dev`;
      const fileUrl = `${publicDomain}/${key}`;

      res.json({
        uploadUrl,
        fileUrl,
        key
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
