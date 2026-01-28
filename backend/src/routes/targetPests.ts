/**
 * Target Pests Routes
 *
 * Provides reference data for target pests.
 * These are read-only endpoints for populating dropdowns in the mobile app.
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/target-pests
 *
 * List all active target pests for dropdown selection.
 * Returns pests sorted alphabetically by name.
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const targetPests = await prisma.targetPest.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
        },
      });

      res.json({ data: targetPests });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/target-pests/:id
 *
 * Get a single target pest by ID.
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const targetPest = await prisma.targetPest.findUnique({
        where: { id },
      });

      if (!targetPest) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Target pest not found' },
        });
        return;
      }

      res.json({ data: targetPest });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
