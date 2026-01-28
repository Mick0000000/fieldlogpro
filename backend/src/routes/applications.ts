/**
 * Application Routes
 *
 * CRUD operations for pesticide application logs.
 * All routes require authentication.
 *
 * These routes handle creating, reading, updating, and listing pesticide
 * application records. Each application log tracks when a pesticide was
 * applied, where, what chemical was used, weather conditions, etc.
 *
 * Key concepts:
 * - Row-level security: Users only see their company's data (via companyId filter)
 * - Denormalization: We store chemicalName and targetPestName directly on the
 *   application record for faster queries (don't need to JOIN every time)
 * - Audit trail: Every change creates an ApplicationHistory record for compliance
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

// Import our custom middleware and types
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate, idParamSchema } from '../middleware/validate';
import { Errors } from '../middleware/errorHandler';
import { sendApplicationNotification } from '../services/email.service';

// Create Prisma client instance for database operations
const prisma = new PrismaClient();

// Create Express router instance
const router = Router();

// ===================
// VALIDATION SCHEMAS
// ===================

/**
 * Schema for filtering and paginating application list
 *
 * All fields are optional - if not provided, we return all applications
 * for the user's company with default pagination.
 */
const listApplicationsSchema = Joi.object({
  // Filter by specific customer
  customerId: Joi.string().optional(),

  // Filter by who applied the chemical
  applicatorId: Joi.string().optional(),

  // Filter by which chemical was used
  chemicalId: Joi.string().optional(),

  // Date range filters - useful for reports
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

/**
 * Schema for creating a new application record
 *
 * Required fields are the minimum needed for compliance:
 * - Who was the customer (property)
 * - What chemical was used
 * - How much was applied
 * - When it was applied
 */
const createApplicationSchema = Joi.object({
  // Required fields
  customerId: Joi.string().required().messages({
    'string.empty': 'Customer ID is required',
    'any.required': 'Customer ID is required',
  }),
  chemicalId: Joi.string().required().messages({
    'string.empty': 'Chemical ID is required',
    'any.required': 'Chemical ID is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  unit: Joi.string().required().messages({
    'string.empty': 'Unit is required (e.g., oz, gal, lb)',
    'any.required': 'Unit is required',
  }),
  applicationDate: Joi.date().iso().required().messages({
    'date.format': 'Application date must be a valid ISO date',
    'any.required': 'Application date is required',
  }),

  // Optional fields - pest being targeted
  targetPestId: Joi.string().optional(),

  // Optional fields - application details
  applicationMethod: Joi.string().optional(), // spray, granular, injection, etc.
  areaTreated: Joi.number().positive().optional(),
  areaUnit: Joi.string().optional(), // sq ft, acres, etc.

  // Optional fields - location (usually auto-filled from mobile GPS)
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),

  // Optional fields - weather conditions
  temperature: Joi.number().optional(), // Fahrenheit
  humidity: Joi.number().min(0).max(100).optional(), // Percentage
  windSpeed: Joi.number().min(0).optional(), // MPH
  windDirection: Joi.string().optional(), // N, NE, E, SE, S, SW, W, NW
  weatherCondition: Joi.string().optional(), // sunny, cloudy, rainy, etc.

  // Optional fields - photos (URLs to images stored in R2)
  labelPhotoUrl: Joi.string().uri().optional(),
  beforePhotoUrl: Joi.string().uri().optional(),
  afterPhotoUrl: Joi.string().uri().optional(),

  // Optional fields - notes and compliance
  notes: Joi.string().max(2000).optional(),
  reentryInterval: Joi.string().optional(), // For Texas compliance
  customerConsent: Joi.boolean().optional(), // For FL/TX compliance
});

/**
 * Schema for updating an existing application
 *
 * Same fields as create, but all optional.
 * Note: applicatorId and companyId cannot be changed.
 */
const updateApplicationSchema = Joi.object({
  customerId: Joi.string().optional(),
  chemicalId: Joi.string().optional(),
  amount: Joi.number().positive().optional(),
  unit: Joi.string().optional(),
  applicationDate: Joi.date().iso().optional(),
  targetPestId: Joi.string().allow(null).optional(), // Allow null to remove
  applicationMethod: Joi.string().allow(null).optional(),
  areaTreated: Joi.number().positive().allow(null).optional(),
  areaUnit: Joi.string().allow(null).optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
  temperature: Joi.number().allow(null).optional(),
  humidity: Joi.number().min(0).max(100).allow(null).optional(),
  windSpeed: Joi.number().min(0).allow(null).optional(),
  windDirection: Joi.string().allow(null).optional(),
  weatherCondition: Joi.string().allow(null).optional(),
  labelPhotoUrl: Joi.string().uri().allow(null).optional(),
  beforePhotoUrl: Joi.string().uri().allow(null).optional(),
  afterPhotoUrl: Joi.string().uri().allow(null).optional(),
  notes: Joi.string().max(2000).allow(null).optional(),
  reentryInterval: Joi.string().allow(null).optional(),
  customerConsent: Joi.boolean().optional(),
  status: Joi.string().valid('completed', 'voided').optional(),
});

// ===================
// ROUTES
// ===================

/**
 * GET /api/applications
 *
 * List all applications for the user's company with optional filters.
 *
 * Query parameters:
 * - customerId: Filter by customer
 * - applicatorId: Filter by applicator (who applied)
 * - chemicalId: Filter by chemical used
 * - dateFrom: Start date for date range filter
 * - dateTo: End date for date range filter
 * - page: Page number (default 1)
 * - limit: Items per page (default 50, max 100)
 *
 * Returns paginated list with related data (customer name, applicator name, etc.)
 */
router.get(
  '/',
  authenticate, // Verify user is logged in
  validate(listApplicationsSchema, 'query'), // Validate query parameters
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get user from request (set by authenticate middleware)
      const user = req.user!;

      // Extract validated query parameters
      // Type assertion through 'unknown' is needed because Express query params
      // are typed as ParsedQs, but our Joi validation ensures the correct types
      const {
        customerId,
        applicatorId,
        chemicalId,
        dateFrom,
        dateTo,
        page,
        limit,
      } = req.query as unknown as {
        customerId?: string;
        applicatorId?: string;
        chemicalId?: string;
        dateFrom?: string;
        dateTo?: string;
        page: number;
        limit: number;
      };

      // Build the "where" clause for Prisma query
      // Start with company filter (row-level security)
      const where: {
        companyId: string;
        customerId?: string;
        applicatorId?: string;
        chemicalId?: string;
        applicationDate?: {
          gte?: Date;
          lte?: Date;
        };
      } = {
        companyId: user.companyId,
      };

      // Add optional filters if provided
      if (customerId) {
        where.customerId = customerId;
      }
      if (applicatorId) {
        where.applicatorId = applicatorId;
      }
      if (chemicalId) {
        where.chemicalId = chemicalId;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        where.applicationDate = {};
        if (dateFrom) {
          where.applicationDate.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.applicationDate.lte = new Date(dateTo);
        }
      }

      // Calculate pagination offset
      // skip = (page - 1) * limit
      // Example: page 2, limit 50 -> skip 50 items (show items 51-100)
      const skip = (page - 1) * limit;

      // Execute both queries in parallel for better performance
      // Promise.all runs both at the same time instead of one after another
      const [applications, total] = await Promise.all([
        // Query 1: Get the applications with related data
        prisma.application.findMany({
          where,
          skip,
          take: limit,
          orderBy: { applicationDate: 'desc' }, // Most recent first
          include: {
            // Include related data so we don't need extra queries
            customer: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
              },
            },
            applicator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            chemical: {
              select: {
                id: true,
                name: true,
                epaNumber: true,
                signalWord: true,
              },
            },
            targetPest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        // Query 2: Count total matching records for pagination
        prisma.application.count({ where }),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      // Return response with applications and pagination info
      res.json({
        data: applications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      // Pass error to global error handler
      next(error);
    }
  }
);

/**
 * GET /api/applications/:id
 *
 * Get a single application by ID with all related data.
 *
 * Returns the application if found and belongs to user's company.
 * Returns 404 if not found or doesn't belong to user's company.
 */
router.get(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'), // Validate :id parameter
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const id = req.params.id as string;

      // Find the application with all related data
      const application = await prisma.application.findFirst({
        where: {
          id,
          companyId: user.companyId, // Row-level security
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
            },
          },
          applicator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              licenseNumber: true,
              licenseState: true,
            },
          },
          chemical: {
            select: {
              id: true,
              name: true,
              epaNumber: true,
              activeIngredient: true,
              manufacturer: true,
              signalWord: true,
            },
          },
          targetPest: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          // Include audit history for compliance
          history: {
            orderBy: { performedAt: 'desc' },
            take: 10, // Last 10 changes
          },
        },
      });

      // If not found (or doesn't belong to user's company), return 404
      if (!application) {
        throw Errors.notFound('Application');
      }

      res.json({ data: application });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/applications
 *
 * Create a new pesticide application log.
 *
 * This is the main action for field applicators - logging each application.
 * The system automatically:
 * - Sets the applicator to the current user
 * - Sets the company from the user's company
 * - Looks up and denormalizes chemical name and target pest name
 * - Creates an audit history record
 *
 * Request body: see createApplicationSchema for fields
 */
router.post(
  '/',
  authenticate,
  validate(createApplicationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      // Extract validated data from request body
      const {
        customerId,
        chemicalId,
        amount,
        unit,
        applicationDate,
        targetPestId,
        applicationMethod,
        areaTreated,
        areaUnit,
        latitude,
        longitude,
        temperature,
        humidity,
        windSpeed,
        windDirection,
        weatherCondition,
        labelPhotoUrl,
        beforePhotoUrl,
        afterPhotoUrl,
        notes,
        reentryInterval,
        customerConsent,
      } = req.body;

      // Verify the customer belongs to the user's company
      // This prevents creating applications for customers from other companies
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId: user.companyId,
        },
      });

      if (!customer) {
        throw Errors.notFound('Customer');
      }

      // Look up the chemical to get its name for denormalization
      // We store the name directly on the application for faster queries
      const chemical = await prisma.chemical.findUnique({
        where: { id: chemicalId },
      });

      if (!chemical) {
        throw Errors.notFound('Chemical');
      }

      // Look up target pest if provided
      let targetPestName: string | null = null;
      if (targetPestId) {
        const targetPest = await prisma.targetPest.findUnique({
          where: { id: targetPestId },
        });
        if (!targetPest) {
          throw Errors.notFound('Target pest');
        }
        targetPestName = targetPest.name;
      }

      // Create the application record and audit history in a transaction
      // A transaction ensures both operations succeed or both fail
      const application = await prisma.$transaction(async (tx) => {
        // Create the application record
        const newApplication = await tx.application.create({
          data: {
            // Foreign keys
            companyId: user.companyId, // Auto-set from user
            applicatorId: user.id, // Auto-set to current user
            customerId,
            chemicalId,

            // Denormalized fields for quick access
            chemicalName: chemical.name,
            epaNumber: chemical.epaNumber,
            targetPestId,
            targetPestName,

            // Application details
            amount,
            unit,
            applicationDate: new Date(applicationDate),
            applicationMethod,
            areaTreated,
            areaUnit,

            // Location
            latitude,
            longitude,

            // Weather
            temperature,
            humidity,
            windSpeed,
            windDirection,
            weatherCondition,

            // Photos
            labelPhotoUrl,
            beforePhotoUrl,
            afterPhotoUrl,

            // Other
            notes,
            reentryInterval,
            customerConsent: customerConsent ?? false,
          },
          include: {
            customer: {
              select: { id: true, name: true },
            },
            applicator: {
              select: { id: true, firstName: true, lastName: true },
            },
            chemical: {
              select: { id: true, name: true, epaNumber: true },
            },
            targetPest: {
              select: { id: true, name: true },
            },
          },
        });

        // Create audit history record
        // This tracks that the application was created (for compliance)
        await tx.applicationHistory.create({
          data: {
            applicationId: newApplication.id,
            action: 'created',
            performedById: user.id,
            // No "changes" field for creation - the entire record is new
          },
        });

        return newApplication;
      });

      // Send email notification if customer has email and notifications enabled
      if (customer.email && customer.notifyByEmail) {
        try {
          // Fetch company info for email
          const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: {
              name: true,
              email: true,
              phone: true,
              licenseNumber: true,
              licenseState: true,
            },
          });

          if (company) {
            // Fetch full applicator info for email
            const applicator = await prisma.user.findUnique({
              where: { id: user.id },
              select: {
                firstName: true,
                lastName: true,
                licenseNumber: true,
                licenseState: true,
              },
            });

            if (applicator) {
              const emailResult = await sendApplicationNotification(
                {
                  id: application.id,
                  applicationDate: new Date(applicationDate),
                  chemicalName: chemical.name,
                  amount,
                  unit,
                  targetPestName,
                  applicationMethod,
                  areaTreated,
                  areaUnit,
                  temperature,
                  humidity,
                  windSpeed,
                  windDirection,
                  weatherCondition,
                  notes,
                  reentryInterval,
                  applicator,
                },
                {
                  id: customer.id,
                  name: customer.name,
                  email: customer.email,
                  address: customer.address,
                  city: customer.city,
                  state: customer.state,
                  zipCode: customer.zipCode,
                },
                company
              );

              // Log the notification
              await prisma.notificationLog.create({
                data: {
                  applicationId: application.id,
                  customerId: customer.id,
                  email: customer.email,
                  subject: 'Pesticide Application Notice',
                  status: emailResult.success ? 'sent' : 'failed',
                  sentAt: emailResult.success ? new Date() : null,
                  failureReason: emailResult.error || null,
                },
              });
            }
          }
        } catch (emailError) {
          // Log email error but don't fail the request
          // The application was created successfully
          console.error('[EMAIL] Failed to send notification:', emailError);
        }
      }

      // Return 201 Created with the new application
      res.status(201).json({ data: application });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/applications/:id
 *
 * Update an existing application.
 *
 * This is used to correct errors or add information after the fact.
 * Important notes:
 * - Cannot change applicatorId (who created it) or companyId
 * - Creates an audit history record with the changes
 * - Must verify the application belongs to user's company
 */
router.patch(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updateApplicationSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const id = req.params.id as string;

      // First, verify the application exists and belongs to user's company
      const existingApplication = await prisma.application.findFirst({
        where: {
          id,
          companyId: user.companyId,
        },
      });

      if (!existingApplication) {
        throw Errors.notFound('Application');
      }

      // Extract update data from validated request body
      const updateData = req.body;

      // If chemicalId is being changed, look up the new chemical name
      if (updateData.chemicalId && updateData.chemicalId !== existingApplication.chemicalId) {
        const chemical = await prisma.chemical.findUnique({
          where: { id: updateData.chemicalId },
        });
        if (!chemical) {
          throw Errors.notFound('Chemical');
        }
        // Update denormalized fields
        updateData.chemicalName = chemical.name;
        updateData.epaNumber = chemical.epaNumber;
      }

      // If targetPestId is being changed, look up the new name
      if (updateData.targetPestId !== undefined) {
        if (updateData.targetPestId === null) {
          // Removing target pest
          updateData.targetPestName = null;
        } else if (updateData.targetPestId !== existingApplication.targetPestId) {
          // Changing to a different pest
          const targetPest = await prisma.targetPest.findUnique({
            where: { id: updateData.targetPestId },
          });
          if (!targetPest) {
            throw Errors.notFound('Target pest');
          }
          updateData.targetPestName = targetPest.name;
        }
      }

      // If customerId is being changed, verify the new customer belongs to the company
      if (updateData.customerId && updateData.customerId !== existingApplication.customerId) {
        const customer = await prisma.customer.findFirst({
          where: {
            id: updateData.customerId,
            companyId: user.companyId,
          },
        });
        if (!customer) {
          throw Errors.notFound('Customer');
        }
      }

      // Convert applicationDate string to Date if provided
      if (updateData.applicationDate) {
        updateData.applicationDate = new Date(updateData.applicationDate);
      }

      // Build a record of what changed (for audit trail)
      // Compare old values to new values
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      for (const [key, newValue] of Object.entries(updateData)) {
        const oldValue = existingApplication[key as keyof typeof existingApplication];
        // Only record if the value actually changed
        if (oldValue !== newValue) {
          changes[key] = { old: oldValue, new: newValue };
        }
      }

      // If nothing actually changed, just return the existing application
      if (Object.keys(changes).length === 0) {
        const application = await prisma.application.findFirst({
          where: { id: id as string },
          include: {
            customer: { select: { id: true, name: true } },
            applicator: { select: { id: true, firstName: true, lastName: true } },
            chemical: { select: { id: true, name: true, epaNumber: true } },
            targetPest: { select: { id: true, name: true } },
          },
        });
        res.json({ data: application });
        return;
      }

      // Update the application and create audit history in a transaction
      const application = await prisma.$transaction(async (tx) => {
        // Update the application
        const updatedApplication = await tx.application.update({
          where: { id: id as string },
          data: updateData,
          include: {
            customer: { select: { id: true, name: true } },
            applicator: { select: { id: true, firstName: true, lastName: true } },
            chemical: { select: { id: true, name: true, epaNumber: true } },
            targetPest: { select: { id: true, name: true } },
          },
        });

        // Create audit history record
        await tx.applicationHistory.create({
          data: {
            applicationId: id as string,
            action: 'updated',
            changes: JSON.stringify(changes), // Store as JSON string
            performedById: user.id,
          },
        });

        return updatedApplication;
      });

      res.json({ data: application });
    } catch (error) {
      next(error);
    }
  }
);

// Export the router for use in index.ts
export default router;
