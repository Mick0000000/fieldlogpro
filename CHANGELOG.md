# LANDSCAPE COMPLIANCE LOGGER - CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-01-29 (Deployment)

### 🚀 Production Deployment

**Backend Deployed to Railway:**
- Live URL: https://fieldlogpro-production.up.railway.app
- PostgreSQL database provisioned
- Environment variables configured (JWT_SECRET, NODE_ENV, PORT, DATABASE_URL)
- Healthcheck endpoint working (/api/health)

**iOS App Submitted to TestFlight:**
- EAS Build completed successfully
- Submitted to App Store Connect
- Awaiting Apple review

**Bug Fixes:**
- Added OpenSSL to Alpine Docker image (required for Prisma)
- Fixed tsconfig.json rootDir to output dist/index.js correctly
- Added /api/health endpoint for Railway healthcheck
- Switched Prisma provider from SQLite to PostgreSQL for production

**App Renamed:**
- Project renamed to "Field Log Pro"

---

## [1.0.0] - 2026-01-28 (MVP Complete)

### 🎉 MVP Release

The Landscape Compliance Logger MVP is complete and ready for deployment!

**What's Included:**
- Full-featured mobile app for field technicians (iOS)
- Web dashboard for office staff and administrators
- Backend API with all core functionality
- Deployment configurations for Railway, Vercel, and TestFlight

---

## [0.8.0] - 2026-01-28 (Email Notifications & Deployment)

### Added

**Email Notifications:**
- SendGrid integration for automated customer notifications
- HTML email templates with application details
- Mock mode for development (logs to console when API key not configured)
- Notification logging to database
- Resend functionality for failed notifications
- NotificationsPage in web dashboard with:
  - Notification history table
  - Status filtering (sent, delivered, failed)
  - Resend button
  - Pagination

**Deployment Configuration:**
- `backend/railway.toml` - Railway deployment config
- `backend/Dockerfile` - Multi-stage production Docker build
- `web/vercel.json` - Vercel SPA configuration
- `mobile/eas.json` - EAS Build profiles (development, preview, production)
- Updated `mobile/app.json` with production bundle IDs and permissions
- `DEPLOYMENT.md` - Comprehensive deployment guide with step-by-step instructions

---

## [0.7.0] - 2026-01-28 (Reports, Weather & Photos)

### Added

**PDF Reports:**
- Report generation endpoint (`POST /api/reports/generate`)
- California DPR compliance format
- Florida DACS compliance format
- Texas TDA compliance format
- ReportsPage in web dashboard with date range, customer, and format filters
- PDF download functionality

**Weather Integration:**
- Weather API proxy endpoint (`GET /api/weather`)
- OpenWeather API integration
- Auto-fill weather data when GPS is captured in mobile app
- Displays temperature, humidity, wind speed/direction, conditions
- Mock data fallback when API key not configured

**Photo Upload:**
- Photo upload URL endpoint (`POST /api/photos/upload-url`)
- Cloudflare R2 presigned URL generation
- expo-image-picker integration for camera and photo library
- Support for label, before, and after photos
- Photo preview with remove functionality
- Mock URL fallback for development without R2 credentials

---

## [0.6.0] - 2026-01-28 (Web Dashboard)

### Added

**Web Dashboard (React + Vite + TypeScript + MUI):**
- Project initialization with Vite
- Material-UI component library
- Redux Toolkit state management
- React Router navigation

**Pages:**
- LoginPage with form validation
- SignupPage with company creation
- DashboardLayout with AppBar and sidebar navigation
- ApplicationsPage with sortable/filterable data table and CSV export
- CustomersPage with full CRUD operations and dialogs
- UsersPage for admin user management
- ReportsPage for PDF report generation

---

## [0.5.0] - 2026-01-28 (Mobile App)

### Added

**Mobile App (React Native + Expo):**
- Project initialization with Expo
- Redux Toolkit state management (auth, applications, customers, chemicals slices)
- Axios HTTP client with auth token interceptors
- React Navigation (bottom tabs + native stack)

**Screens:**
- LoginScreen with email/password validation
- SignupScreen with company name and user creation
- QuickLogScreen - main application logging with:
  - GPS auto-capture (expo-location)
  - Weather auto-fill section
  - Searchable dropdowns for customer, chemical, target pest
  - Unit selector with large touch targets (work glove friendly)
  - Photo capture section (label, before, after)
  - Form validation and success feedback
- HistoryScreen - paginated application history list
- ApplicationDetailScreen - full application details view
- ProfileScreen - user info display and logout

### Fixed
- iOS Simulator connection issue (changed localhost to 127.0.0.1)

---

## [0.4.0] - 2026-01-28 (Reference Data & Enhanced Endpoints)

### Added

**Backend Endpoints:**
- `GET /api/chemicals` - List all chemicals with search
- `GET /api/chemicals/:id` - Get single chemical
- `GET /api/target-pests` - List all target pests with search
- `GET /api/target-pests/:id` - Get single target pest

**Seed Data:**
- 39 common pesticide chemicals with EPA numbers
- 28 target pest categories organized by type

---

## [0.3.0] - 2026-01-28 (Core CRUD Endpoints)

### Added

**Application Endpoints:**
- `GET /api/applications` - List with pagination and filters
- `GET /api/applications/:id` - Get single application
- `POST /api/applications` - Create new application with audit trail
- `PATCH /api/applications/:id` - Update application with history tracking

**Customer Endpoints:**
- `GET /api/customers` - List with search
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer

**User Endpoints:**
- `GET /api/users` - List company users (admin only)
- `GET /api/users/me` - Get current user profile
- `POST /api/users` - Create/invite new user (admin only)
- `PATCH /api/users/:id` - Update user

**Middleware:**
- Joi validation middleware for request body validation
- Role-based access control (admin vs applicator)

---

## [0.2.0] - 2026-01-28 (Authentication System)

### Added

**Auth Endpoints:**
- `POST /api/auth/signup` - Create company and admin user
- `POST /api/auth/login` - Authenticate and receive JWT
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Set new password with token

**Security:**
- JWT authentication with 30-day expiration
- bcrypt password hashing
- Auth middleware for protected routes
- Global error handler with consistent response format

---

## [0.1.0] - 2026-01-28 (Backend Foundation)

### Added

**Project Setup:**
- Node.js + Express + TypeScript backend
- Prisma ORM with SQLite (local development)
- Environment configuration with dotenv

**Database Schema (8 models):**
- Company - multi-tenant root entity
- User - applicators and admins with roles
- Customer - properties being serviced
- Application - pesticide application logs
- ApplicationHistory - audit trail for changes
- NotificationLog - email delivery tracking
- Chemical - product reference data
- TargetPest - pest categories

**Infrastructure:**
- Express middleware (helmet, cors, json parsing)
- Health check endpoint (`GET /health`)
- 404 handler for unknown routes

---

## [0.0.1] - 2026-01-27 (Planning Phase)

### Added
- Complete product requirements document (28,000 words)
- Complete technical architecture document (15,000 words)
- Complete implementation roadmap (8,000 words)
- Quick start guide (README.md)
- Project status tracker (PROJECT_STATUS.md)
- This changelog

### Technical Decisions
- **Mobile Framework:** React Native (Expo)
- **Web Framework:** React.js + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (dev) / PostgreSQL (prod) + Prisma ORM
- **File Storage:** Cloudflare R2
- **Hosting:** Vercel (web) + Railway (API + database)
- **Authentication:** JWT tokens (30-day expiration)
- **Email:** SendGrid
- **Weather:** OpenWeather API

---

## Version History Summary

| Version | Date | Description | Status |
|---------|------|-------------|--------|
| 0.0.1 | 2026-01-27 | Planning complete | ✅ Released |
| 0.1.0 | 2026-01-28 | Backend foundation | ✅ Released |
| 0.2.0 | 2026-01-28 | Authentication | ✅ Released |
| 0.3.0 | 2026-01-28 | Core CRUD | ✅ Released |
| 0.4.0 | 2026-01-28 | Reference data | ✅ Released |
| 0.5.0 | 2026-01-28 | Mobile app | ✅ Released |
| 0.6.0 | 2026-01-28 | Web dashboard | ✅ Released |
| 0.7.0 | 2026-01-28 | Reports, weather, photos | ✅ Released |
| 0.8.0 | 2026-01-28 | Email & deployment | ✅ Released |
| 1.0.0 | 2026-01-28 | MVP Complete | ✅ Released |
| **1.0.1** | **2026-01-29** | **Deployment** | **🚀 In Progress** |

---

## Future Versions (Planned)

### [1.1.0] - Phase 2

**Planned Features:**
- Edit past applications (with audit trail)
- Offline mode (mobile app)
- SMS notifications
- 10 additional state templates
- Analytics dashboard
- Scheduled reports

### [2.0.0] - Phase 3

**Planned Features:**
- All 50 state report templates
- Dark mode
- Customer portal
- Public API
- Advanced analytics

---

**END OF CHANGELOG**

*This file will be updated with each release and significant change.*
