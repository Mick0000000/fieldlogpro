# LANDSCAPE COMPLIANCE LOGGER - TECHNICAL ARCHITECTURE

**Version:** 1.0  
**Date:** January 27, 2026  
**Status:** Final - Ready for Implementation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Data Models](#data-models)
4. [API Specification](#api-specification)
5. [Security Architecture](#security-architecture)
6. [File Upload Flow](#file-upload-flow)
7. [Error Handling](#error-handling)
8. [Performance Optimizations](#performance-optimizations)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring & Observability](#monitoring-observability)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐          ┌──────────────────────┐    │
│  │   Mobile App         │          │   Web Dashboard      │    │
│  │   (React Native)     │          │   (React.js)         │    │
│  │                      │          │                      │    │
│  │  - iOS App           │          │  - Admin Panel       │    │
│  │  - Android App       │          │  - Reports           │    │
│  │  - Camera            │          │  - Customer Mgmt     │    │
│  │  - GPS               │          │  - User Mgmt         │    │
│  │  - Photo Upload      │          │                      │    │
│  └──────────────────────┘          └──────────────────────┘    │
│           │                                  │                   │
│           │                                  │                   │
│           └──────────────┬───────────────────┘                   │
│                          │                                       │
│                          │  HTTPS/TLS 1.3                       │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                          │   API LAYER                            │
├──────────────────────────┼───────────────────────────────────────┤
│                          │                                        │
│                    ┌─────▼─────┐                                 │
│                    │           │                                 │
│                    │  REST API │                                 │
│                    │  (Node.js │                                 │
│                    │  Express) │                                 │
│                    │           │                                 │
│                    └─────┬─────┘                                 │
│                          │                                        │
│         ┌────────────────┼────────────────┐                      │
│         │                │                │                      │
│    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐                │
│    │   Auth   │    │ Business │    │  File    │                │
│    │ Service  │    │  Logic   │    │ Service  │                │
│    │          │    │ Service  │    │          │                │
│    └────┬─────┘    └────┬─────┘    └────┬─────┘                │
│         │               │               │                       │
└─────────┼───────────────┼───────────────┼───────────────────────┘
          │               │               │
┌─────────┼───────────────┼───────────────┼───────────────────────┐
│         │   DATA LAYER  │               │                       │
├─────────┼───────────────┼───────────────┼───────────────────────┤
│         │               │               │                       │
│    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐                │
│    │PostgreSQL│    │PostgreSQL│    │Cloudflare│                │
│    │  (Auth)  │    │  (Main)  │    │    R2    │                │
│    │          │    │          │    │ (Photos) │                │
│    └──────────┘    └──────────┘    └──────────┘                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ OpenWeather  │  │Google Cloud  │  │  SendGrid    │          │
│  │     API      │  │  Vision API  │  │   (Email)    │          │
│  │  (Weather)   │  │    (OCR)     │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns:** Client → API → Database (no direct database access from clients)
2. **Stateless API:** No server-side sessions; JWT tokens for authentication
3. **Cloud-Native:** Leverage managed services (Railway, Vercel, Cloudflare R2)
4. **Fail-Fast:** Validate input early, return errors quickly
5. **Idempotent Operations:** Support retries without side effects

---

## Technology Stack

### Frontend

#### Mobile Application
- **Framework:** React Native 0.73+ (Expo managed workflow)
- **State Management:** Redux Toolkit
- **Navigation:** React Navigation 6
- **UI Components:** React Native Paper (Material Design)
- **Camera:** react-native-vision-camera
- **Location:** @react-native-community/geolocation
- **HTTP Client:** Axios
- **Storage:** AsyncStorage (JWT tokens)
- **Analytics:** Mixpanel React Native SDK

#### Web Dashboard
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **State Management:** Redux Toolkit
- **Routing:** React Router 6
- **UI Library:** Material-UI (MUI) v5
- **HTTP Client:** Axios
- **Charts:** Recharts
- **PDF Generation:** @react-pdf/renderer
- **CSV Export:** papaparse
- **Date Picker:** react-datepicker

---

### Backend

#### API Server
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.18+
- **Language:** TypeScript
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** Joi
- **File Upload:** Multer
- **Image Processing:** Sharp (compression)
- **Rate Limiting:** express-rate-limit
- **Security:** Helmet.js, CORS
- **Logging:** Winston
- **Error Tracking:** Sentry

---

### Database

#### Primary Database
- **Engine:** PostgreSQL 15+
- **ORM:** Prisma (type-safe query builder)
- **Connection Pooling:** PgBouncer (Railway built-in)
- **Backup:** Automated daily snapshots

---

### File Storage

#### Photo Storage
- **Service:** Cloudflare R2 (S3-compatible)
- **CDN:** Cloudflare CDN (automatic)
- **Bucket Structure:**
  - `/labels/{company_id}/{application_id}_{uuid}.jpg`
  - `/before/{company_id}/{application_id}_{uuid}.jpg`
  - `/after/{company_id}/{application_id}_{uuid}.jpg`
- **Compression:** 80% JPEG quality via Sharp
- **Max Upload:** 10MB per photo
- **Retention:** 7 years (lifecycle policy)

---

### External Services

#### Weather API
- **Service:** OpenWeather API
- **Plan:** Free tier (60 calls/minute, 1M calls/month)
- **Endpoint:** Current Weather Data API
- **Fallback:** Cache last-known weather for location (15-minute TTL)

#### OCR (Label Scanning)
- **Service:** Google Cloud Vision API
- **Plan:** Pay-as-you-go ($1.50 per 1,000 images)
- **Feature:** Text Detection + Document Text Detection
- **Budget:** $50/month (33,000 label scans)
- **Fallback:** Manual entry if OCR fails or confidence <80%

#### Email
- **Service:** SendGrid
- **Plan:** Free tier (100 emails/day) → Essentials ($20/mo for 50k emails)
- **Features:** Transactional email, delivery tracking, bounce handling
- **Templates:** Dynamic templates with variables

#### SMS (Phase 2)
- **Service:** Twilio
- **Plan:** Pay-as-you-go ($0.0079 per SMS)

---

### Hosting & Infrastructure

#### Deployment
- **Web Dashboard:** Vercel (Free tier → Pro at $20/mo)
- **API Server:** Railway (Starter $5/mo → Pro $20/mo)
- **Database:** Railway PostgreSQL (included in plan)
- **File Storage:** Cloudflare R2 ($0.015 per GB stored)

#### CI/CD
- **Source Control:** GitHub
- **Pipeline:** GitHub Actions
  - Lint/test on every PR
  - Auto-deploy to production on merge to `main`
  - Staging environment on `develop` branch
- **Secrets Management:** Environment variables in Railway/Vercel

#### Monitoring
- **Error Tracking:** Sentry (free tier: 5k errors/mo)
- **Uptime Monitoring:** UptimeRobot (free tier: 50 monitors)
- **Analytics:** Mixpanel (free tier: 100k events/mo)
- **Logs:** Railway logs (7-day retention) + Winston file logs (30-day retention)

---

## Data Models

### Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ====================
// CORE ENTITIES
// ====================

model Company {
  id                String   @id @default(uuid())
  name              String
  address           String
  city              String
  state             String   @db.VarChar(2)
  zip               String   @db.VarChar(10)
  phone             String?
  email             String?
  licenseNumber     String   @unique
  logoUrl           String?
  subscriptionStatus String  @default("trial") // trial, active, cancelled, past_due
  subscriptionTier  String   @default("starter") // starter, professional, enterprise
  trialEndsAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  users             User[]
  customers         Customer[]
  applications      Application[]
  notificationLogs  NotificationLog[]

  @@index([licenseNumber])
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  licenseNumber String?
  role          String   @default("applicator") // applicator, admin
  isActive      Boolean  @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  applications  Application[]
  applicationHistory ApplicationHistory[]

  @@index([companyId])
  @@index([email])
}

model Customer {
  id                  String   @id @default(uuid())
  name                String
  address             String
  city                String
  state               String   @db.VarChar(2)
  zip                 String   @db.VarChar(10)
  email               String?
  phone               String?
  notificationEnabled Boolean  @default(true)
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  companyId           String
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  applications        Application[]

  @@index([companyId])
  @@index([name])
}

model Application {
  id                String   @id @default(uuid())
  applicationDate   DateTime
  locationLat       Float?
  locationLng       Float?
  address           String   // Denormalized for faster queries
  chemicalProduct   String
  epaNumber         String?
  activeIngredients String?
  amount            Float
  unit              String   // gallons, ounces, pounds, liters
  targetPest        String
  weatherTemp       Float?   // Fahrenheit
  weatherWind       Float?   // mph
  notes             String?  @db.Text
  photoLabelUrl     String?
  photoBeforeUrl    String?
  photoAfterUrl     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  companyId         String
  company           Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  customerId        String
  customer          Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  applicationHistory ApplicationHistory[]
  notificationLogs   NotificationLog[]

  @@index([companyId, applicationDate])
  @@index([customerId])
  @@index([userId])
  @@index([applicationDate])
}

// Audit trail for application edits
model ApplicationHistory {
  id            String   @id @default(uuid())
  changeType    String   // created, updated, deleted
  changedFields Json     // { field: { old: value, new: value } }
  timestamp     DateTime @default(now())

  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  changedByUserId String
  changedByUser   User   @relation(fields: [changedByUserId], references: [id])

  @@index([applicationId])
  @@index([timestamp])
}

model NotificationLog {
  id              String   @id @default(uuid())
  recipientEmail  String
  status          String   // sent, delivered, bounced, failed
  sentAt          DateTime @default(now())
  deliveredAt     DateTime?
  errorMessage    String?

  companyId       String
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  applicationId   String
  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([applicationId])
  @@index([status])
}

// ====================
// REFERENCE DATA
// ====================

model Chemical {
  id                String   @id @default(uuid())
  productName       String   @unique
  epaNumber         String   @unique
  activeIngredients String
  manufacturer      String
  safetyReentryHours Int     // Hours until safe to re-enter treated area
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([productName])
  @@index([epaNumber])
}

model TargetPest {
  id       String @id @default(uuid())
  name     String @unique
  category String // weeds, insects, fungus, other
}
```

### Entity Relationships

```
Company (1) ──< (Many) User
Company (1) ──< (Many) Customer
Company (1) ──< (Many) Application
User (1) ──< (Many) Application
Customer (1) ──< (Many) Application
Application (1) ──< (Many) ApplicationHistory
Application (1) ──< (Many) NotificationLog
```

### Key Database Indexes

```sql
-- Applications: Filter by company + date (most common query)
CREATE INDEX idx_applications_company_date 
ON applications(company_id, application_date DESC);

-- Applications: Filter by customer
CREATE INDEX idx_applications_customer 
ON applications(customer_id);

-- Applications: Filter by user (applicator)
CREATE INDEX idx_applications_user 
ON applications(user_id);

-- Customers: Search by name
CREATE INDEX idx_customers_name 
ON customers(name);

-- Notification Logs: Check delivery status
CREATE INDEX idx_notification_logs_status 
ON notification_logs(status);
```

---

## API Specification

### Base URL

- **Production:** `https://api.landscapelog.com`
- **Staging:** `https://api-staging.landscapelog.com`
- **Development:** `http://localhost:3000`

### Authentication

All endpoints except public routes require JWT token in `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ ... ] // Optional validation errors
  }
}
```

---

### Authentication Endpoints

#### POST /api/auth/signup

Create new company and admin user.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Password123",
  "name": "John Smith",
  "companyName": "Smith Landscaping",
  "licenseNumber": "CA-123456",
  "address": "123 Main St",
  "city": "Los Angeles",
  "state": "CA",
  "zip": "90001",
  "phone": "555-123-4567"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-user-123",
      "email": "admin@example.com",
      "name": "John Smith",
      "role": "admin"
    },
    "company": {
      "id": "uuid-company-456",
      "name": "Smith Landscaping",
      "subscriptionStatus": "trial",
      "trialEndsAt": "2026-02-10T00:00:00Z"
    }
  }
}
```

---

#### POST /api/auth/login

Authenticate existing user.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-user-123",
      "email": "admin@example.com",
      "name": "John Smith",
      "role": "admin",
      "licenseNumber": "CA-123456"
    },
    "company": {
      "id": "uuid-company-456",
      "name": "Smith Landscaping"
    }
  }
}
```

---

#### POST /api/auth/forgot-password

Request password reset email.

**Request Body:**
```json
{
  "email": "admin@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

---

#### POST /api/auth/reset-password

Reset password with token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

---

### Application Endpoints

#### GET /api/applications

List applications with optional filters.

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., "2026-01-01")
- `endDate` (optional): ISO date string
- `customerId` (optional): UUID
- `userId` (optional): UUID (applicator)
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Results per page (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid-application-789",
        "applicationDate": "2026-01-27T10:30:00Z",
        "customer": {
          "id": "uuid-customer-123",
          "name": "John Doe",
          "address": "123 Main St, Austin, TX 78701"
        },
        "user": {
          "id": "uuid-user-456",
          "name": "Mike Johnson",
          "licenseNumber": "TX-123456"
        },
        "chemicalProduct": "Roundup Pro",
        "epaNumber": "524-475",
        "amount": 2.5,
        "unit": "gallons",
        "targetPest": "Weeds (broadleaf)",
        "weatherTemp": 72,
        "weatherWind": 5,
        "photoLabelUrl": "https://cdn.example.com/labels/..."
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "perPage": 50,
      "totalPages": 1
    }
  }
}
```

---

#### POST /api/applications

Create new application.

**Request Body:**
```json
{
  "customerId": "uuid-customer-123",
  "applicationDate": "2026-01-27T10:30:00Z",
  "locationLat": 30.2672,
  "locationLng": -97.7431,
  "address": "123 Main St, Austin, TX 78701",
  "chemicalProduct": "Roundup Pro",
  "epaNumber": "524-475",
  "activeIngredients": "Glyphosate 41%",
  "amount": 2.5,
  "unit": "gallons",
  "targetPest": "Weeds (broadleaf)",
  "weatherTemp": 72,
  "weatherWind": 5,
  "notes": "Heavy infestation near fence line",
  "photoLabelUrl": "https://r2.example.com/labels/...",
  "photoBeforeUrl": "https://r2.example.com/before/...",
  "photoAfterUrl": "https://r2.example.com/after/..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-application-789",
    "customerId": "uuid-customer-123",
    "userId": "uuid-user-456",
    "companyId": "uuid-company-999",
    "applicationDate": "2026-01-27T10:30:00Z",
    "chemicalProduct": "Roundup Pro",
    "createdAt": "2026-01-27T10:31:00Z"
  }
}
```

---

#### GET /api/applications/:id

Get single application details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-application-789",
    "applicationDate": "2026-01-27T10:30:00Z",
    "locationLat": 30.2672,
    "locationLng": -97.7431,
    "address": "123 Main St, Austin, TX 78701",
    "customer": {
      "id": "uuid-customer-123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "user": {
      "id": "uuid-user-456",
      "name": "Mike Johnson",
      "licenseNumber": "TX-123456"
    },
    "chemicalProduct": "Roundup Pro",
    "epaNumber": "524-475",
    "activeIngredients": "Glyphosate 41%",
    "amount": 2.5,
    "unit": "gallons",
    "targetPest": "Weeds (broadleaf)",
    "weatherTemp": 72,
    "weatherWind": 5,
    "notes": "Heavy infestation near fence line",
    "photoLabelUrl": "https://r2.example.com/labels/...",
    "photoBeforeUrl": "https://r2.example.com/before/...",
    "photoAfterUrl": "https://r2.example.com/after/...",
    "createdAt": "2026-01-27T10:31:00Z",
    "updatedAt": "2026-01-27T10:31:00Z"
  }
}
```

---

#### PATCH /api/applications/:id

Update existing application (creates audit log).

**Request Body:** (partial update, only include fields to change)
```json
{
  "amount": 3.0,
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-application-789",
    "amount": 3.0,
    "notes": "Updated notes",
    "updatedAt": "2026-01-27T11:00:00Z"
  }
}
```

---

### Customer Endpoints

#### GET /api/customers

List all customers for company.

**Query Parameters:**
- `search` (optional): Search by name or address
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Results per page (default: 50)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid-customer-123",
        "name": "John Doe",
        "address": "123 Main St",
        "city": "Austin",
        "state": "TX",
        "zip": "78701",
        "email": "john@example.com",
        "phone": "555-123-4567",
        "notificationEnabled": true,
        "applicationCount": 12
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "perPage": 50,
      "totalPages": 3
    }
  }
}
```

---

#### POST /api/customers

Create new customer.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "address": "456 Oak Ave",
  "city": "Austin",
  "state": "TX",
  "zip": "78702",
  "email": "jane@example.com",
  "phone": "555-987-6543",
  "notificationEnabled": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-customer-456",
    "name": "Jane Smith",
    "address": "456 Oak Ave",
    "city": "Austin",
    "state": "TX",
    "zip": "78702",
    "createdAt": "2026-01-27T12:00:00Z"
  }
}
```

---

### Photo Endpoints

#### POST /api/photos/upload

Get signed URL for direct upload to Cloudflare R2.

**Request Body:**
```json
{
  "fileName": "label.jpg",
  "fileType": "image/jpeg",
  "category": "label"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://r2.cloudflare.com/presigned/...",
    "publicUrl": "https://cdn.landscapelog.com/labels/company-123/app-456_uuid.jpg",
    "expiresAt": "2026-01-27T12:15:00Z"
  }
}
```

---

### Report Endpoints

#### POST /api/reports/generate

Generate state-specific compliance report.

**Request Body:**
```json
{
  "state": "CA",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "applicatorIds": ["uuid-user-456"],
  "customerIds": [],
  "includePhotos": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportId": "uuid-report-111",
    "pdfUrl": "https://cdn.landscapelog.com/reports/company-123/report-111.pdf",
    "fileName": "ComplianceReport_CA_2026-01-01_2026-01-31.pdf",
    "generatedAt": "2026-01-27T11:00:00Z",
    "recordCount": 42
  }
}
```

---

### Weather Endpoint

#### GET /api/weather

Get current weather for location.

**Query Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "temperature": 72.5,
    "temperatureUnit": "F",
    "windSpeed": 5.2,
    "windSpeedUnit": "mph",
    "conditions": "Clear",
    "timestamp": "2026-01-27T10:30:00Z"
  }
}
```

---

### OCR Endpoint

#### POST /api/ocr

Extract text from product label photo.

**Request Body (multipart/form-data):**
- `image`: File upload (JPEG/PNG)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "extractedText": "ROUNDUP PRO\nEPA Reg. No. 524-475\nGlyphosate 41%...",
    "epaNumber": "524-475",
    "productName": "Roundup Pro",
    "confidence": 0.95
  }
}
```

---

## Security Architecture

### Authentication Flow

1. User enters email + password
2. Server validates credentials (bcrypt compare)
3. Server generates JWT token (30-day expiration)
4. Client stores token in AsyncStorage/localStorage
5. Client includes token in Authorization header for all requests
6. Server middleware validates token on each request

**JWT Payload:**
```json
{
  "userId": "uuid-user-123",
  "companyId": "uuid-company-456",
  "role": "admin",
  "iat": 1706356800,
  "exp": 1708948800
}
```

### Authorization Middleware

```typescript
// middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  companyId: string;
  role: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }
  next();
};
```

### Row-Level Security (Prisma Middleware)

Automatically filter all queries by company:

```typescript
// prisma/middleware.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  // Get company ID from request context
  const companyId = (params as any).context?.user?.companyId;

  // Only apply to models with companyId field
  const modelsWithCompany = ['Application', 'Customer', 'User', 'NotificationLog'];

  if (modelsWithCompany.includes(params.model as string)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        companyId,
      };
    }
  }

  return next(params);
});

export default prisma;
```

### Input Validation (Joi Schemas)

```typescript
// validation/application.ts

import Joi from 'joi';

export const createApplicationSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  applicationDate: Joi.date().iso().required(),
  locationLat: Joi.number().min(-90).max(90).optional(),
  locationLng: Joi.number().min(-180).max(180).optional(),
  address: Joi.string().max(200).required(),
  chemicalProduct: Joi.string().max(100).required(),
  epaNumber: Joi.string().max(50).optional(),
  activeIngredients: Joi.string().max(200).optional(),
  amount: Joi.number().positive().required(),
  unit: Joi.string().valid('gallons', 'ounces', 'pounds', 'liters').required(),
  targetPest: Joi.string().max(100).required(),
  weatherTemp: Joi.number().min(-50).max(150).optional(),
  weatherWind: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().max(500).optional(),
  photoLabelUrl: Joi.string().uri().optional(),
  photoBeforeUrl: Joi.string().uri().optional(),
  photoAfterUrl: Joi.string().uri().optional(),
});
```

### Rate Limiting

```typescript
// middleware/rateLimit.ts

import rateLimit from 'express-rate-limit';

// General API rate limit: 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

// Auth endpoints: 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.',
});

// Apply in index.ts:
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
```

### Security Headers (Helmet.js)

```typescript
// middleware/security.ts

import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.landscapelog.com"],
      connectSrc: ["'self'", "https://api.landscapelog.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

---

## File Upload Flow

### Photo Upload Process

```
1. Mobile App: User takes photo
   ↓
2. Compress image (Sharp library, 80% quality)
   ↓
3. Request signed upload URL from API
   POST /api/photos/upload
   { fileName: "label.jpg", fileType: "image/jpeg", category: "label" }
   ↓
4. API generates signed URL (Cloudflare R2 presigned PUT)
   ↓
5. Mobile app uploads directly to R2 using signed URL
   ↓
6. On success, mobile app includes final R2 URL in application payload
   POST /api/applications
   { photoLabelUrl: "https://r2.example.com/..." }
   ↓
7. API saves application record with photo URL
```

**Why Signed URLs?**
- Faster uploads (direct to storage, not through API server)
- Reduces API server load
- More secure (signed URLs expire in 15 minutes)

### Signed URL Generation

```typescript
// services/photoService.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateSignedUploadUrl(
  fileName: string,
  fileType: string,
  category: 'label' | 'before' | 'after',
  companyId: string,
  applicationId: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const key = `${category}/${companyId}/${applicationId}_${uuid()}.jpg`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
```

### Image Compression

```typescript
// services/imageService.ts

import sharp from 'sharp';

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }) // Max dimensions
    .jpeg({ quality: 80, progressive: true }) // 80% quality, progressive JPEG
    .toBuffer();
}
```

**Before:** 3-5 MB per photo  
**After:** 500-800 KB per photo  
**Savings:** ~85% storage reduction

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be a positive number"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service down |

### Global Error Handler

```typescript
// middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import * as Sentry from '@sentry/node';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.userId,
  });

  // Send to Sentry
  Sentry.captureException(err);

  // Determine status code
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
```

---

## Performance Optimizations

### Database Query Optimization

**Pagination (Good):**
```typescript
const applications = await prisma.application.findMany({
  where: { companyId },
  skip: (page - 1) * perPage,
  take: perPage,
  orderBy: { applicationDate: 'desc' },
});
```

**Select Only Needed Fields (Good):**
```typescript
const applications = await prisma.application.findMany({
  select: {
    id: true,
    applicationDate: true,
    customer: { select: { name: true } },
    chemicalProduct: true,
    amount: true,
    // Exclude: notes, photoUrls, etc.
  },
});
```

### Caching Strategy

**Weather API Cache (In-Memory):**
```typescript
const weatherCache = new Map<string, { data: any; expiresAt: number }>();

export async function getCachedWeather(lat: number, lng: number) {
  const cacheKey = `${Math.round(lat * 10) / 10}:${Math.round(lng * 10) / 10}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const weather = await fetchWeatherFromAPI(lat, lng);
  weatherCache.set(cacheKey, {
    data: weather,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return weather;
}
```

---

## Deployment Architecture

### Environments

**Development:**
- Local machine (Docker Compose for PostgreSQL)
- Database: Local PostgreSQL container
- File storage: Local filesystem (not R2)

**Staging:**
- Railway (separate project)
- Database: Railway PostgreSQL (smaller instance)
- File storage: Cloudflare R2 (separate bucket: `landscape-logger-staging`)

**Production:**
- Railway (Pro plan)
- Database: Railway PostgreSQL (production instance with auto-backups)
- File storage: Cloudflare R2 (`landscape-logger-production`)

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=your-32-character-random-string

# File Storage (Cloudflare R2)
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=landscape-logger-production
R2_PUBLIC_URL=https://cdn.landscapelog.com

# External Services
OPENWEATHER_API_KEY=xxx
GOOGLE_CLOUD_VISION_API_KEY=xxx
SENDGRID_API_KEY=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/yyy

# App Config
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.landscapelog.com
```

---

## Monitoring & Observability

### Key Metrics

**Application Metrics:**
- Applications logged per day
- Average log time (seconds)
- Photo upload success rate
- OCR success rate
- Report generation time

**System Metrics:**
- API response time (p50, p95, p99)
- Database query time (p95)
- Error rate (errors per 1000 requests)
- Uptime percentage

### Logging (Winston)

```typescript
// config/logger.ts

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

export { logger };
```

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | >1% | Slack alert (immediate) |
| API latency (p95) | >2 seconds | Slack alert (immediate) |
| Database connections | >80% | Email alert (warning) |
| Disk space | >90% | SMS alert (critical) |

---

**END OF TECHNICAL ARCHITECTURE DOCUMENT**
