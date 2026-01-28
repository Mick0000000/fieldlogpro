/**
 * Customer Routes
 *
 * CRUD operations for customer/property management.
 * All routes require authentication.
 *
 * Customers represent the properties or clients that receive pesticide
 * applications. Each customer belongs to a company (multi-tenant isolation).
 *
 * Key concepts:
 * - Row-level security: Users only see customers from their own company
 * - Each customer can have many applications (one-to-many relationship)
 * - Application count is useful for knowing how active a customer is
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

// Import our custom middleware and types
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate, idParamSchema } from '../middleware/validate';
import { Errors } from '../middleware/errorHandler';

// Create Prisma client instance for database operations
const prisma = new PrismaClient();

// Create Express router instance
const router = Router();

// ===================
// VALIDATION SCHEMAS
// ===================

/**
 * Schema for listing/searching customers
 *
 * Supports searching by name and pagination.
 * All fields are optional.
 */
const listCustomersSchema = Joi.object({
  // Search by customer name (partial match)
  search: Joi.string().trim().max(100).optional(),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),

  // Optional: only show active customers
  isActive: Joi.boolean().optional(),
});

/**
 * Schema for creating a new customer
 *
 * Required fields are the minimum needed to identify a property:
 * - Name (who/what is this property)
 * - Address details for location
 */
const createCustomerSchema = Joi.object({
  // Required fields
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Customer name is required',
    'string.max': 'Customer name must be less than 255 characters',
    'any.required': 'Customer name is required',
  }),
  address: Joi.string().trim().min(1).max(500).required().messages({
    'string.empty': 'Address is required',
    'any.required': 'Address is required',
  }),
  city: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'City is required',
    'any.required': 'City is required',
  }),
  state: Joi.string().trim().length(2).uppercase().required().messages({
    'string.length': 'State must be a 2-letter code (e.g., TX, FL)',
    'any.required': 'State is required',
  }),
  zipCode: Joi.string()
    .trim()
    .pattern(/^\d{5}(-\d{4})?$/)
    .required()
    .messages({
      'string.pattern.base': 'ZIP code must be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)',
      'any.required': 'ZIP code is required',
    }),

  // Optional contact info
  email: Joi.string().email().lowercase().trim().max(255).optional().messages({
    'string.email': 'Please provide a valid email address',
  }),
  phone: Joi.string()
    .trim()
    .max(20)
    .optional()
    .messages({
      'string.max': 'Phone number must be less than 20 characters',
    }),

  // Optional GPS coordinates (can be auto-filled from address lookup)
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),

  // Optional notification preferences
  notifyByEmail: Joi.boolean().default(true),

  // Optional notes about the property
  notes: Joi.string().max(2000).optional(),
});

/**
 * Schema for updating an existing customer
 *
 * Same fields as create, but all optional.
 * Only include fields you want to change.
 */
const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  address: Joi.string().trim().min(1).max(500).optional(),
  city: Joi.string().trim().min(1).max(100).optional(),
  state: Joi.string().trim().length(2).uppercase().optional(),
  zipCode: Joi.string()
    .trim()
    .pattern(/^\d{5}(-\d{4})?$/)
    .optional(),
  email: Joi.string().email().lowercase().trim().max(255).allow(null).optional(),
  phone: Joi.string().trim().max(20).allow(null).optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
  notifyByEmail: Joi.boolean().optional(),
  notes: Joi.string().max(2000).allow(null).optional(),
  isActive: Joi.boolean().optional(),
});

// ===================
// ROUTES
// ===================

/**
 * GET /api/customers
 *
 * List all customers for the user's company with optional search and pagination.
 *
 * Query parameters:
 * - search: Search by customer name (case-insensitive partial match)
 * - page: Page number (default 1)
 * - limit: Items per page (default 50, max 100)
 * - isActive: Filter by active status (optional)
 *
 * Returns paginated list with application count for each customer.
 */
router.get(
  '/',
  authenticate, // Verify user is logged in
  validate(listCustomersSchema, 'query'), // Validate query parameters
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get user from request (set by authenticate middleware)
      const user = req.user!;

      // Extract validated query parameters
      // Type assertion through 'unknown' is needed because Express query params
      // are typed as ParsedQs, but our Joi validation ensures the correct types
      const { search, page, limit, isActive } = req.query as unknown as {
        search?: string;
        page: number;
        limit: number;
        isActive?: boolean;
      };

      // Build the "where" clause for Prisma query
      // Start with company filter (row-level security)
      const where: {
        companyId: string;
        name?: { contains: string };
        isActive?: boolean;
      } = {
        companyId: user.companyId,
      };

      // Add name search if provided
      // "contains" does a partial match (LIKE %search%)
      if (search) {
        where.name = { contains: search };
      }

      // Filter by active status if specified
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Calculate pagination offset
      // skip = (page - 1) * limit
      // Example: page 3, limit 20 -> skip 40 items (show items 41-60)
      const skip = (page - 1) * limit;

      // Execute both queries in parallel for better performance
      const [customers, total] = await Promise.all([
        // Query 1: Get customers with application count
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' }, // Sort alphabetically by name
          include: {
            // Include count of applications for each customer
            // This is a Prisma feature that counts related records
            _count: {
              select: { applications: true },
            },
          },
        }),
        // Query 2: Count total matching records for pagination
        prisma.customer.count({ where }),
      ]);

      // Transform the response to include applicationCount as a simple number
      // instead of nested _count object (cleaner API)
      const transformedCustomers = customers.map((customer) => ({
        ...customer,
        applicationCount: customer._count.applications,
        _count: undefined, // Remove the _count object
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      // Return response with customers and pagination info
      res.json({
        data: transformedCustomers,
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
 * GET /api/customers/:id
 *
 * Get a single customer by ID with recent applications.
 *
 * Returns the customer if found and belongs to user's company.
 * Includes the last 10 applications for this customer.
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

      // Find the customer with recent applications
      const customer = await prisma.customer.findFirst({
        where: {
          id,
          companyId: user.companyId, // Row-level security
        },
        include: {
          // Include recent applications for this customer
          applications: {
            orderBy: { applicationDate: 'desc' },
            take: 10, // Last 10 applications
            select: {
              id: true,
              applicationDate: true,
              chemicalName: true,
              amount: true,
              unit: true,
              targetPestName: true,
              applicationMethod: true,
              status: true,
              applicator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          // Include total application count
          _count: {
            select: { applications: true },
          },
        },
      });

      // If not found (or doesn't belong to user's company), return 404
      if (!customer) {
        throw Errors.notFound('Customer');
      }

      // Transform response for cleaner API
      const response = {
        ...customer,
        applicationCount: customer._count.applications,
        _count: undefined,
      };

      res.json({ data: response });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/customers
 *
 * Create a new customer (property).
 *
 * This adds a new property to the company's customer list.
 * The company is automatically set from the logged-in user.
 *
 * Request body: see createCustomerSchema for fields
 */
router.post(
  '/',
  authenticate,
  validate(createCustomerSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      // Extract validated data from request body
      const {
        name,
        address,
        city,
        state,
        zipCode,
        email,
        phone,
        latitude,
        longitude,
        notifyByEmail,
        notes,
      } = req.body;

      // Create the customer record
      const customer = await prisma.customer.create({
        data: {
          companyId: user.companyId, // Auto-set from user's company
          name,
          address,
          city,
          state,
          zipCode,
          email,
          phone,
          latitude,
          longitude,
          notifyByEmail: notifyByEmail ?? true, // Default to true if not specified
          notes,
        },
        // Include count for consistent response shape
        include: {
          _count: {
            select: { applications: true },
          },
        },
      });

      // Transform response
      const response = {
        ...customer,
        applicationCount: customer._count.applications,
        _count: undefined,
      };

      // Return 201 Created with the new customer
      res.status(201).json({ data: response });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/customers/:id
 *
 * Update an existing customer.
 *
 * This is used to update customer information (address changes, etc.).
 * Only include the fields you want to change in the request body.
 *
 * Important:
 * - Cannot change companyId (customer stays with their company)
 * - Must verify the customer belongs to user's company
 */
router.patch(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updateCustomerSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const id = req.params.id as string;

      // First, verify the customer exists and belongs to user's company
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id,
          companyId: user.companyId, // Row-level security
        },
      });

      if (!existingCustomer) {
        throw Errors.notFound('Customer');
      }

      // Extract update data from validated request body
      // Only fields that are present will be updated
      const updateData = req.body;

      // If nothing to update, just return the existing customer
      if (Object.keys(updateData).length === 0) {
        const customer = await prisma.customer.findFirst({
          where: { id: id as string },
          include: {
            _count: { select: { applications: true } },
          },
        });

        if (customer) {
          const response = {
            ...customer,
            applicationCount: customer._count.applications,
            _count: undefined,
          };
          res.json({ data: response });
        } else {
          res.json({ data: existingCustomer });
        }
        return;
      }

      // Update the customer
      const customer = await prisma.customer.update({
        where: { id: id as string },
        data: updateData,
        include: {
          _count: {
            select: { applications: true },
          },
        },
      });

      // Transform response
      const response = {
        ...customer,
        applicationCount: customer._count.applications,
        _count: undefined,
      };

      res.json({ data: response });
    } catch (error) {
      next(error);
    }
  }
);

// Export the router for use in index.ts
export default router;
