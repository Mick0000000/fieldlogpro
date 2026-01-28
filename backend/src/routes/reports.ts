/**
 * PDF Reports Routes
 *
 * Generates PDF compliance reports for pesticide applications.
 * Supports state-specific formats for California (DPR), Florida (FDACS), and Texas (TDA).
 *
 * Each state has different requirements for what must be included in compliance reports:
 * - California: Basic application data grouped by customer
 * - Florida: California fields + application method, area treated, customer consent
 * - Texas: California fields + re-entry interval, property owner consent, area size (grouped by date)
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import Joi from 'joi';

// Import our custom middleware and types
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Errors } from '../middleware/errorHandler';

// Create Prisma client instance for database operations
const prisma = new PrismaClient();

// Create Express router instance
const router = Router();

// ===================
// TYPES
// ===================

// Supported states for compliance reports
type SupportedState = 'CA' | 'FL' | 'TX';

// State display names for the PDF header
const STATE_NAMES: Record<SupportedState, string> = {
  CA: 'California (DPR)',
  FL: 'Florida (FDACS)',
  TX: 'Texas (TDA)',
};

// Application data with related entities
interface ApplicationWithRelations {
  id: string;
  applicationDate: Date;
  chemicalName: string;
  epaNumber: string | null;
  amount: number;
  unit: string;
  targetPestName: string | null;
  applicationMethod: string | null;
  areaTreated: number | null;
  areaUnit: string | null;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  weatherCondition: string | null;
  reentryInterval: string | null;
  customerConsent: boolean;
  customer: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  applicator: {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber: string | null;
    licenseState: string | null;
  };
}

// ===================
// VALIDATION SCHEMAS
// ===================

/**
 * Schema for PDF report generation request
 */
const generateReportSchema = Joi.object({
  // Which state's compliance format to use
  state: Joi.string()
    .valid('CA', 'FL', 'TX')
    .required()
    .messages({
      'any.only': 'State must be CA, FL, or TX',
      'any.required': 'State is required',
    }),

  // Date range for the report
  dateFrom: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'dateFrom must be a valid ISO date',
      'any.required': 'dateFrom is required',
    }),
  dateTo: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'dateTo must be a valid ISO date',
      'any.required': 'dateTo is required',
    }),

  // Optional filters
  customerId: Joi.string().optional(),
  applicatorId: Joi.string().optional(),
});

// ===================
// HELPER FUNCTIONS
// ===================

/**
 * Format a date for display in the PDF
 * Example: "Jan 15, 2024 2:30 PM"
 */
function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date range for the PDF header
 * Example: "Jan 15, 2024 - Jan 31, 2024"
 */
function formatDateRange(from: Date, to: Date): string {
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  return `${formatDate(from)} - ${formatDate(to)}`;
}

/**
 * Format weather conditions into a readable string
 * Example: "75F, 45% humidity, Wind 5mph NW"
 */
function formatWeather(app: ApplicationWithRelations): string {
  const parts: string[] = [];

  if (app.temperature !== null) {
    parts.push(`${app.temperature}F`);
  }
  if (app.humidity !== null) {
    parts.push(`${app.humidity}% humidity`);
  }
  if (app.windSpeed !== null) {
    let wind = `Wind ${app.windSpeed}mph`;
    if (app.windDirection) {
      wind += ` ${app.windDirection}`;
    }
    parts.push(wind);
  }
  if (app.weatherCondition) {
    parts.push(app.weatherCondition);
  }

  return parts.length > 0 ? parts.join(', ') : 'Not recorded';
}

/**
 * Format applicator info with license
 * Example: "John Smith (License: TX-12345)"
 */
function formatApplicator(applicator: ApplicationWithRelations['applicator']): string {
  const name = `${applicator.firstName} ${applicator.lastName}`;
  if (applicator.licenseNumber && applicator.licenseState) {
    return `${name} (License: ${applicator.licenseState}-${applicator.licenseNumber})`;
  }
  if (applicator.licenseNumber) {
    return `${name} (License: ${applicator.licenseNumber})`;
  }
  return name;
}

/**
 * Group applications by customer (for CA and FL reports)
 */
function groupByCustomer(
  applications: ApplicationWithRelations[]
): Map<string, ApplicationWithRelations[]> {
  const grouped = new Map<string, ApplicationWithRelations[]>();

  for (const app of applications) {
    const key = app.customer.id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(app);
  }

  return grouped;
}

/**
 * Group applications by date (for TX reports)
 */
function groupByDate(
  applications: ApplicationWithRelations[]
): Map<string, ApplicationWithRelations[]> {
  const grouped = new Map<string, ApplicationWithRelations[]>();

  for (const app of applications) {
    // Use date only (no time) as the key
    const dateKey = app.applicationDate.toISOString().split('T')[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(app);
  }

  return grouped;
}

// ===================
// PDF GENERATION
// ===================

/**
 * Add the PDF header with company info and report metadata
 */
function addPdfHeader(
  doc: PDFKit.PDFDocument,
  companyName: string,
  state: SupportedState,
  dateFrom: Date,
  dateTo: Date
): void {
  // Company name (large, centered)
  doc.fontSize(20).font('Helvetica-Bold').text(companyName, { align: 'center' });

  // Report title
  doc.moveDown(0.5);
  doc.fontSize(16).font('Helvetica').text('Pesticide Application Report', { align: 'center' });

  // State compliance format
  doc.moveDown(0.3);
  doc.fontSize(12).text(`${STATE_NAMES[state]} Compliance Format`, { align: 'center' });

  // Date range
  doc.moveDown(0.3);
  doc.fontSize(10).text(`Date Range: ${formatDateRange(dateFrom, dateTo)}`, { align: 'center' });

  // Generation timestamp
  doc.text(`Generated: ${formatDateTime(new Date())}`, { align: 'center' });

  // Separator line
  doc.moveDown(0.5);
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke();

  doc.moveDown(1);
}

/**
 * Add a customer header section
 */
function addCustomerHeader(
  doc: PDFKit.PDFDocument,
  customer: ApplicationWithRelations['customer']
): void {
  // Customer section header with background
  const startY = doc.y;
  doc
    .fillColor('#f5f5f5')
    .rect(50, startY, doc.page.width - 100, 35)
    .fill();

  // Customer name
  doc
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(`CUSTOMER: ${customer.name}`, 60, startY + 8);

  // Customer address
  const address = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`;
  doc.font('Helvetica').fontSize(10).text(address, 60, startY + 22);

  doc.y = startY + 45;
}

/**
 * Add a date header section (for Texas reports)
 */
function addDateHeader(doc: PDFKit.PDFDocument, dateStr: string): void {
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Date section header with background
  const startY = doc.y;
  doc
    .fillColor('#f5f5f5')
    .rect(50, startY, doc.page.width - 100, 25)
    .fill();

  doc
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(`DATE: ${formattedDate}`, 60, startY + 7);

  doc.y = startY + 35;
}

/**
 * Add an application entry to the PDF
 */
function addApplicationEntry(
  doc: PDFKit.PDFDocument,
  app: ApplicationWithRelations,
  state: SupportedState,
  includeCustomer: boolean
): void {
  // Check if we need a new page
  if (doc.y > doc.page.height - 180) {
    doc.addPage();
  }

  // Entry separator line
  doc
    .strokeColor('#dddddd')
    .lineWidth(0.5)
    .moveTo(60, doc.y)
    .lineTo(doc.page.width - 60, doc.y)
    .stroke();

  doc.moveDown(0.5);

  const leftCol = 60;
  const rightCol = 320;
  const lineHeight = 14;

  // Start Y for this entry
  let y = doc.y;

  // Helper to add a field
  const addField = (label: string, value: string, x: number, yPos: number) => {
    doc.font('Helvetica-Bold').fontSize(9).text(`${label}:`, x, yPos);
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(` ${value}`, x + doc.widthOfString(`${label}: `), yPos);
  };

  // Row 1: Date/Time and Chemical
  addField('Date', formatDateTime(app.applicationDate), leftCol, y);

  const chemicalInfo = app.epaNumber
    ? `${app.chemicalName} (EPA# ${app.epaNumber})`
    : app.chemicalName;
  addField('Chemical', chemicalInfo, rightCol, y);
  y += lineHeight;

  // Row 2: Amount and Applicator
  addField('Amount', `${app.amount} ${app.unit}`, leftCol, y);
  addField('Applicator', formatApplicator(app.applicator), rightCol, y);
  y += lineHeight;

  // Row 3: Weather and Target Pest
  addField('Weather', formatWeather(app), leftCol, y);
  if (app.targetPestName) {
    addField('Target Pest', app.targetPestName, rightCol, y);
  }
  y += lineHeight;

  // Include customer info if grouping by date (Texas)
  if (includeCustomer) {
    const customerAddress = `${app.customer.name}, ${app.customer.address}, ${app.customer.city}`;
    addField('Location', customerAddress, leftCol, y);
    y += lineHeight;
  }

  // State-specific fields
  if (state === 'FL') {
    // Florida: Application Method, Area Treated, Customer Consent
    if (app.applicationMethod) {
      addField('Application Method', app.applicationMethod, leftCol, y);
    }
    if (app.areaTreated !== null && app.areaUnit) {
      addField('Area Treated', `${app.areaTreated} ${app.areaUnit}`, rightCol, y);
    }
    y += lineHeight;

    addField('Customer Consent', app.customerConsent ? 'Yes' : 'No', leftCol, y);
    y += lineHeight;
  }

  if (state === 'TX') {
    // Texas: Re-entry Interval, Property Owner Consent, Area Size
    if (app.reentryInterval) {
      addField('Re-entry Interval', app.reentryInterval, leftCol, y);
    }
    addField('Property Owner Consent', app.customerConsent ? 'Yes' : 'No', rightCol, y);
    y += lineHeight;

    if (app.areaTreated !== null && app.areaUnit) {
      addField('Area Size', `${app.areaTreated} ${app.areaUnit}`, leftCol, y);
    }
    y += lineHeight;
  }

  doc.y = y + 5;
}

/**
 * Add page numbers to all pages of the PDF
 */
function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer with page number
    const pageNum = `Page ${i + 1} of ${pages.count}`;
    doc
      .fontSize(8)
      .fillColor('#666666')
      .text(pageNum, 50, doc.page.height - 30, {
        align: 'center',
        width: doc.page.width - 100,
      });
  }
}

/**
 * Add "no applications found" message
 */
function addNoDataMessage(doc: PDFKit.PDFDocument): void {
  doc.moveDown(2);
  doc
    .fontSize(14)
    .fillColor('#666666')
    .text('No applications found for the specified date range and filters.', {
      align: 'center',
    });
}

// ===================
// ROUTES
// ===================

/**
 * POST /api/reports/generate
 *
 * Generate a PDF compliance report for pesticide applications.
 *
 * Request body:
 * - state: 'CA' | 'FL' | 'TX' - Which state's compliance format to use
 * - dateFrom: ISO date string - Start of date range
 * - dateTo: ISO date string - End of date range
 * - customerId: (optional) Filter to specific customer
 * - applicatorId: (optional) Filter to specific applicator
 *
 * Returns: PDF file download
 */
router.post(
  '/generate',
  authenticate,
  validate(generateReportSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;

      // Extract validated data from request body
      const { state, dateFrom, dateTo, customerId, applicatorId } = req.body as {
        state: SupportedState;
        dateFrom: string;
        dateTo: string;
        customerId?: string;
        applicatorId?: string;
      };

      // Parse dates
      const dateFromParsed = new Date(dateFrom);
      const dateToParsed = new Date(dateTo);

      // Validate date range
      if (dateToParsed < dateFromParsed) {
        throw Errors.badRequest('dateTo must be after dateFrom');
      }

      // Fetch company info for the header
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { name: true },
      });

      if (!company) {
        throw Errors.notFound('Company');
      }

      // Build the where clause for applications
      const where: {
        companyId: string;
        applicationDate: { gte: Date; lte: Date };
        status: string;
        customerId?: string;
        applicatorId?: string;
      } = {
        companyId: user.companyId,
        applicationDate: {
          gte: dateFromParsed,
          lte: dateToParsed,
        },
        status: 'completed', // Only include completed applications
      };

      // Optional filters
      if (customerId) {
        // Verify customer belongs to company
        const customer = await prisma.customer.findFirst({
          where: { id: customerId, companyId: user.companyId },
        });
        if (!customer) {
          throw Errors.notFound('Customer');
        }
        where.customerId = customerId;
      }

      if (applicatorId) {
        // Verify applicator belongs to company
        const applicator = await prisma.user.findFirst({
          where: { id: applicatorId, companyId: user.companyId },
        });
        if (!applicator) {
          throw Errors.notFound('Applicator');
        }
        where.applicatorId = applicatorId;
      }

      // Fetch applications with related data
      const applications = (await prisma.application.findMany({
        where,
        orderBy: { applicationDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
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
              licenseNumber: true,
              licenseState: true,
            },
          },
        },
      })) as ApplicationWithRelations[];

      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true, // Required for adding page numbers at the end
      });

      // Set response headers for PDF download
      const filename = `report-${state}-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Pipe PDF to response
      doc.pipe(res);

      // Add header
      addPdfHeader(doc, company.name, state, dateFromParsed, dateToParsed);

      // If no applications found, show message
      if (applications.length === 0) {
        addNoDataMessage(doc);
      } else {
        // Group and render applications based on state
        if (state === 'TX') {
          // Texas: Group by date
          const grouped = groupByDate(applications);
          const sortedDates = Array.from(grouped.keys()).sort().reverse();

          for (const dateKey of sortedDates) {
            const apps = grouped.get(dateKey)!;

            // Add date header
            addDateHeader(doc, dateKey);

            // Add each application
            for (const app of apps) {
              addApplicationEntry(doc, app, state, true);
            }

            doc.moveDown(0.5);
          }
        } else {
          // California and Florida: Group by customer
          const grouped = groupByCustomer(applications);

          for (const [, apps] of grouped) {
            // Add customer header (use first application's customer)
            addCustomerHeader(doc, apps[0].customer);

            // Add each application
            for (const app of apps) {
              addApplicationEntry(doc, app, state, false);
            }

            doc.moveDown(0.5);
          }
        }
      }

      // Add page numbers to all pages
      addPageNumbers(doc);

      // Finalize PDF
      doc.end();
    } catch (error) {
      next(error);
    }
  }
);

// Export the router for use in index.ts
export default router;
