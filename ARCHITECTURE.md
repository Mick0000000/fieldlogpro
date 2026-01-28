# LANDSCAPE COMPLIANCE LOGGER - ARCHITECTURE OVERVIEW

**Version:** 1.0  
**Date:** January 27, 2026  
**Purpose:** High-level system overview for quick reference

---

## System Overview

**Product:** Landscape Compliance Logger  
**Architecture Pattern:** Three-tier (Client → API → Database)  
**Deployment Model:** Cloud-native (Vercel, Railway, Cloudflare R2)

---

## High-Level Components

```
┌─────────────────────────────────────────┐
│         CLIENT LAYER                    │
│  ┌───────────────┐  ┌────────────────┐ │
│  │ Mobile App    │  │ Web Dashboard  │ │
│  │ (React Native)│  │ (React.js)     │ │
│  └───────────────┘  └────────────────┘ │
└─────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────┐
│         API LAYER                        │
│  ┌───────────────────────────────────┐  │
│  │  REST API (Node.js + Express)     │  │
│  │  - Auth (JWT)                     │  │
│  │  - Business Logic                 │  │
│  │  - File Upload                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         DATA LAYER                       │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ PostgreSQL   │  │ Cloudflare R2   │ │
│  │ (Relational) │  │ (Photo Storage) │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      EXTERNAL SERVICES                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Weather  │ │   OCR    │ │  Email  │ │
│  │   API    │ │   API    │ │   API   │ │
│  └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────┘
```

---

## Technology Stack Summary

### Frontend

**Mobile:**
- React Native (Expo)
- Redux Toolkit
- React Navigation
- React Native Paper

**Web:**
- React.js + TypeScript
- Vite
- Redux Toolkit
- Material-UI (MUI)
- React Router

### Backend

**API:**
- Node.js 20 LTS
- Express.js
- TypeScript
- JWT Authentication
- Prisma ORM

### Data

**Database:**
- PostgreSQL 15+
- Prisma ORM
- Automated backups

**File Storage:**
- Cloudflare R2 (S3-compatible)
- Photos compressed to 80% JPEG
- 7-year retention

### Hosting

**Deployment:**
- Web Dashboard: Vercel
- API: Railway
- Database: Railway PostgreSQL
- Photos: Cloudflare R2

**CI/CD:**
- GitHub Actions
- Auto-deploy on merge to main

### External Services

**Weather:** OpenWeather API (free tier)  
**OCR:** Google Cloud Vision API ($1.50/1k images)  
**Email:** SendGrid (free tier → $20/mo)

---

## Core Data Models

### Primary Entities

**Company** → has many Users, Customers, Applications  
**User** → belongs to Company, has many Applications  
**Customer** → belongs to Company, has many Applications  
**Application** → belongs to Company, User, Customer

### Key Relationships

```
Company (1) ──< (Many) User
Company (1) ──< (Many) Customer  
Company (1) ──< (Many) Application
User (1) ──< (Many) Application
Customer (1) ──< (Many) Application
Application (1) ──< (Many) ApplicationHistory (audit trail)
Application (1) ──< (Many) NotificationLog
```

---

## Security Architecture

### Authentication
- **Method:** JWT tokens
- **Expiration:** 30 days
- **Storage:** AsyncStorage (mobile), localStorage (web)
- **Password Hashing:** bcrypt (cost factor 12)

### Authorization
- **Roles:** Admin, Applicator
- **Middleware:** requireAuth, requireAdmin
- **Row-Level Security:** All queries filtered by companyId

### Data Protection
- **In Transit:** HTTPS/TLS 1.3
- **At Rest:** AES-256 encryption
- **Input Validation:** Joi schemas
- **SQL Injection Prevention:** Prisma parameterized queries
- **XSS Prevention:** React auto-escaping + CSP headers

---

## API Architecture

### Base URL
- Production: `https://api.landscapelog.com`
- Staging: `https://api-staging.landscapelog.com`

### Key Endpoints

**Authentication:**
- POST `/api/auth/signup`
- POST `/api/auth/login`
- POST `/api/auth/forgot-password`

**Applications:**
- GET `/api/applications` (with filters)
- POST `/api/applications`
- GET `/api/applications/:id`
- PATCH `/api/applications/:id`

**Customers:**
- GET `/api/customers`
- POST `/api/customers`
- PATCH `/api/customers/:id`

**Photos:**
- POST `/api/photos/upload` (returns signed URL)

**Reports:**
- POST `/api/reports/generate` (returns PDF)

**Weather:**
- GET `/api/weather?lat=X&lng=Y`

**OCR:**
- POST `/api/ocr` (upload image, get extracted text)

---

## File Upload Flow

```
1. Mobile App: User takes photo
   ↓
2. Compress image (Sharp library, 80% quality)
   ↓
3. Request signed upload URL from API
   POST /api/photos/upload
   ↓
4. API generates signed URL (Cloudflare R2 presigned PUT)
   ↓
5. Mobile app uploads directly to R2 using signed URL
   ↓
6. On success, include final R2 URL in application payload
   POST /api/applications
   { photoLabelUrl: "https://r2.example.com/..." }
   ↓
7. API saves application record with photo URL
```

**Why Signed URLs?**
- Faster (direct to storage, not through API)
- Reduces API server load
- More secure (URLs expire in 15 minutes)

---

## Performance Targets

| Metric | Target | Priority |
|--------|--------|----------|
| Mobile app load time | <3 seconds | High |
| Photo upload time | <5 seconds (LTE) | High |
| Dashboard page load | <2 seconds | High |
| Database query response | <500ms (p95) | High |
| Report generation | <10 seconds (1k records) | Medium |
| API uptime | 99.5% | High |

---

## Scalability Targets

### MVP (Months 1-6)
- 100 companies
- 500 users
- 50,000 applications/month

### Year 1
- 1,000 companies
- 5,000 users
- 500,000 applications/month

### Scaling Strategy
- **Horizontal:** Add API server instances (Railway auto-scales)
- **Vertical:** Upgrade database instance
- **Caching:** Add Redis (Phase 2)
- **Database:** Add read replicas (Phase 2)

---

## Monitoring & Observability

### Error Tracking
- **Service:** Sentry
- **Alerts:** Slack integration
- **Threshold:** >1% error rate → immediate alert

### Uptime Monitoring
- **Service:** UptimeRobot
- **Frequency:** Ping every 5 minutes
- **Threshold:** <99% uptime → alert

### Logging
- **Service:** Winston
- **Retention:** 30 days (local files), 7 days (Railway)
- **Levels:** ERROR, WARN, INFO, DEBUG

### Analytics
- **Service:** Mixpanel
- **Events Tracked:**
  - Application logged
  - Report generated
  - User signed up
  - Email sent

---

## Deployment Environments

### Development
- Local machine (Docker Compose for PostgreSQL)
- Database: Local PostgreSQL container
- File storage: Local filesystem

### Staging
- Railway (separate project)
- Database: Railway PostgreSQL (smaller instance)
- File storage: Cloudflare R2 (staging bucket)

### Production
- Railway (Pro plan)
- Database: Railway PostgreSQL (production instance)
- File storage: Cloudflare R2 (production bucket)
- Custom domain: app.landscapelog.com

---

## Environment Variables

### Required for Backend

```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-32-character-random-string

# File Storage
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=landscape-logger-production
R2_PUBLIC_URL=https://cdn.landscapelog.com

# External Services
OPENWEATHER_API_KEY=...
GOOGLE_CLOUD_VISION_API_KEY=...
SENDGRID_API_KEY=...

# Monitoring
SENTRY_DSN=https://...

# App Config
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.landscapelog.com
```

---

## Critical Dependencies

**Backend:**
- express (API server)
- @prisma/client (database ORM)
- jsonwebtoken (authentication)
- bcrypt (password hashing)
- sharp (image compression)
- joi (input validation)
- @aws-sdk/client-s3 (R2 uploads)

**Mobile:**
- react-native (framework)
- expo (tooling)
- @react-navigation/native (navigation)
- react-native-vision-camera (photo capture)
- @react-native-community/geolocation (GPS)
- axios (HTTP client)

**Web:**
- react (framework)
- react-router-dom (routing)
- @mui/material (UI components)
- axios (HTTP client)
- @react-pdf/renderer (PDF generation)

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mobile Framework | React Native | Single codebase, faster MVP |
| Database | PostgreSQL | ACID compliance for audit trail |
| File Storage | Cloudflare R2 | Cheaper than S3 (no egress fees) |
| Auth | JWT | Stateless, simple, scales well |
| ORM | Prisma | Type-safe, great developer experience |
| Hosting | Managed services | Faster deployment, less ops burden |

---

## Success Metrics (MVP)

**Development:**
- Time to MVP: 8 weeks
- Test coverage: >70%
- Zero P0 bugs at launch

**Product:**
- Average log time: <60 seconds
- Email delivery rate: >95%
- API uptime: >99.5%

**Business:**
- Beta customers: 10
- Customer retention: >85%
- NPS score: >30

---

## Documentation References

**Full Details:**
- Product requirements → `PRODUCT_REQUIREMENTS.md`
- Technical architecture → `TECHNICAL_ARCHITECTURE.md`
- Implementation roadmap → `IMPLEMENTATION_ROADMAP.md`
- Quick start guide → `README.md`
- Project status → `PROJECT_STATUS.md`

---

**END OF ARCHITECTURE OVERVIEW**

*Last Updated: January 27, 2026*
