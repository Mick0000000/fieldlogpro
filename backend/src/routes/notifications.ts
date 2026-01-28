/**
 * Notification Routes
 *
 * Routes for viewing notification logs and resending notifications.
 * All routes require authentication.
 *
 * These routes allow users to:
 * - View notification history for their company
 * - Resend notifications for specific applications
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate, idParamSchema } from '../middleware/validate';
import { Errors } from '../middleware/errorHandler';
import { sendApplicationNotification } from '../services/email.service';

const prisma = new PrismaClient();
const router = Router();

// ===================
// VALIDATION SCHEMAS
// ===================

/**
 * Schema for filtering and paginating notification list
 */
const listNotificationsSchema = Joi.object({
  // Filter by customer
  customerId: Joi.string().optional(),

  // Filter by application
  applicationId: Joi.string().optional(),

  // Filter by status
  status: Joi.string().valid('pending', 'sent', 'delivered', 'bounced', 'failed').optional(),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

// ===================
// ROUTES
// ===================

/**
 * GET /api/notifications
 *
 * List notification logs for the user's company.
 *
 * Query parameters:
 * - customerId: Filter by customer
 * - applicationId: Filter by application
 * - status: Filter by delivery status
 * - page: Page number (default 1)
 * - limit: Items per page (default 50, max 100)
 */
router.get(
  '/',
  authenticate,
  validate(listNotificationsSchema, 'query'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      const { customerId, applicationId, status, page, limit } = req.query as unknown as {
        customerId?: string;
        applicationId?: string;
        status?: string;
        page: number;
        limit: number;
      };

      // Build where clause
      // We need to join through application to filter by company
      const where: {
        application?: {
          companyId: string;
        };
        customerId?: string;
        applicationId?: string;
        status?: string;
      } = {
        application: {
          companyId: user.companyId,
        },
      };

      if (customerId) {
        where.customerId = customerId;
      }
      if (applicationId) {
        where.applicationId = applicationId;
      }
      if (status) {
        where.status = status;
      }

      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            application: {
              select: {
                id: true,
                applicationDate: true,
                chemicalName: true,
              },
            },
          },
        }),
        prisma.notificationLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/notifications/:applicationId/resend
 *
 * Resend notification for a specific application.
 * Will send to the customer associated with the application
 * if they have email notifications enabled.
 */
router.post(
  '/:id/resend',
  authenticate,
  validate(idParamSchema, 'params'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const applicationId = req.params.id as string;

      // Find the application with all needed data
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          companyId: user.companyId,
        },
        include: {
          customer: true,
          applicator: {
            select: {
              firstName: true,
              lastName: true,
              licenseNumber: true,
              licenseState: true,
            },
          },
          company: {
            select: {
              name: true,
              email: true,
              phone: true,
              licenseNumber: true,
              licenseState: true,
            },
          },
        },
      });

      if (!application) {
        throw Errors.notFound('Application');
      }

      // Check if customer has email
      if (!application.customer.email) {
        throw Errors.badRequest('Customer does not have an email address');
      }

      // Check if customer has notifications enabled
      if (!application.customer.notifyByEmail) {
        throw Errors.badRequest('Customer has email notifications disabled');
      }

      // Send the notification
      const emailResult = await sendApplicationNotification(
        {
          id: application.id,
          applicationDate: application.applicationDate,
          chemicalName: application.chemicalName,
          amount: application.amount,
          unit: application.unit,
          targetPestName: application.targetPestName,
          applicationMethod: application.applicationMethod,
          areaTreated: application.areaTreated,
          areaUnit: application.areaUnit,
          temperature: application.temperature,
          humidity: application.humidity,
          windSpeed: application.windSpeed,
          windDirection: application.windDirection,
          weatherCondition: application.weatherCondition,
          notes: application.notes,
          reentryInterval: application.reentryInterval,
          applicator: application.applicator,
        },
        {
          id: application.customer.id,
          name: application.customer.name,
          email: application.customer.email,
          address: application.customer.address,
          city: application.customer.city,
          state: application.customer.state,
          zipCode: application.customer.zipCode,
        },
        application.company
      );

      // Create notification log
      const notificationLog = await prisma.notificationLog.create({
        data: {
          applicationId: application.id,
          customerId: application.customer.id,
          email: application.customer.email,
          subject: `Pesticide Application Notice`,
          status: emailResult.success ? 'sent' : 'failed',
          sentAt: emailResult.success ? new Date() : null,
          failureReason: emailResult.error || null,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          application: {
            select: {
              id: true,
              applicationDate: true,
              chemicalName: true,
            },
          },
        },
      });

      if (!emailResult.success) {
        res.status(500).json({
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: 'Failed to send notification email',
            details: emailResult.error,
          },
          data: notificationLog,
        });
        return;
      }

      res.json({
        message: 'Notification sent successfully',
        data: notificationLog,
        mock: emailResult.mock || false,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
