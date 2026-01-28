/**
 * Chemicals Routes
 *
 * Provides reference data for chemicals/pesticides and target pests.
 * These are read-only endpoints for populating dropdowns in the mobile app.
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/chemicals
 *
 * List all active chemicals for dropdown selection.
 * Returns chemicals sorted alphabetically by name.
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const chemicals = await prisma.chemical.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          epaNumber: true,
          activeIngredient: true,
          manufacturer: true,
          signalWord: true,
        },
      });

      res.json({ data: chemicals });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/chemicals/:id
 *
 * Get a single chemical by ID.
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const chemical = await prisma.chemical.findUnique({
        where: { id },
      });

      if (!chemical) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Chemical not found' },
        });
        return;
      }

      res.json({ data: chemical });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
