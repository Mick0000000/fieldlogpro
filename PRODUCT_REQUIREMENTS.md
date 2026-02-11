# LANDSCAPE COMPLIANCE LOGGER - PRODUCT REQUIREMENTS DOCUMENT

**Version:** 1.0  
**Date:** January 27, 2026  
**Status:** Final - Ready for Implementation

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [User Personas](#user-personas)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [User Acceptance Criteria](#user-acceptance-criteria)
6. [Open Questions & Decisions](#open-questions-decisions)
7. [Success Criteria](#success-criteria)
8. [Out of Scope](#out-of-scope)
9. [State Compliance Requirements](#state-compliance-requirements)

---

## Product Overview

**Product Name:** Field Log Pro  
**Target Users:** Pesticide applicators (field technicians) and business owners/managers  
**Core Value:** Log chemical applications in <30 seconds, auto-generate compliance reports, eliminate 90% of paperwork  
**Business Model:** SaaS subscription ($39-79/month per company)

### North Star Metric

"Enable any landscaper to achieve perfect chemical compliance with zero paperwork and minimal training."

### Key Objectives

- **Speed:** Average log time <45 seconds per application
- **Adoption:** 80%+ of technicians use weekly
- **Retention:** >85% MRR retention
- **Satisfaction:** NPS Score >40

---

## User Personas

### Primary: Field Applicator (Technician)

**Demographics:**
- Age: 25-55
- Tech comfort: Low to medium
- Device: Personal or company smartphone (iOS/Android)

**Context:**
- Environment: Outdoors, in truck between jobs, wearing work gloves
- Pain Points: Paper logs get lost/damaged, manual entry takes too long
- Primary Goal: Log application quickly without interrupting workflow

**Success Metric:** Can complete log in <45 seconds

**Key Needs:**
- Large touch targets (glove-friendly)
- Auto-fill as much as possible (GPS, weather, applicator info)
- Minimal typing required
- Works in bright sunlight (high contrast UI)

---

### Secondary: Business Owner / Office Manager

**Demographics:**
- Age: 35-65
- Tech comfort: Medium
- Device: Desktop/laptop primary, mobile secondary

**Context:**
- Environment: Office or home
- Pain Points: Manual report generation takes hours, hard to find historical records, risk of state fines
- Primary Goal: Generate compliant reports, maintain audit trail, avoid fines

**Success Metric:** Generate compliance report in <5 minutes

**Key Needs:**
- Easy filtering and searching
- One-click report generation
- Export to PDF/CSV for records
- Audit trail for compliance

---

### Tertiary: Customer (Property Owner)

**Demographics:**
- Age: 30-70
- Tech comfort: Varies
- Device: Email or SMS on any device

**Context:**
- Receives: Notification after application to their property
- Pain Points: Uncertainty about what chemicals were used, safety concerns
- Primary Goal: Know what was sprayed, when, and if it's safe

**Success Metric:** Clear, timely notification with safety info

**Key Needs:**
- Plain language (no jargon)
- Safety information (re-entry period)
- Contact info if questions arise
- Visual proof (photos)

---

## Functional Requirements

### MVP PHASE 1 - Core Features

---

## 1. MOBILE APPLICATION (React Native)

### 1.1 Quick Log Screen (Primary Workflow)

**User Story:** As a field applicator, I want to log a chemical application in under 30 seconds so I can get back to work immediately.

#### MUST HAVE Features

| Feature | Requirement | Acceptance Criteria |
|---------|-------------|-------------------|
| **Photo Capture** | Camera integration for 3 photo types | User can capture product label, before, and after photos; photos upload to cloud storage within 5 seconds each |
| **GPS Auto-Capture** | Automatic location detection | Latitude/longitude captured automatically when user opens "New Application" screen; accuracy within 10 meters |
| **Date/Time Auto-Fill** | System timestamp | Current date/time pre-populated; user can override if needed |
| **Weather Integration** | API call to OpenWeather | Temperature (°F) and wind speed (mph) auto-filled based on GPS coordinates; <3 second response time |
| **Chemical Selection** | Searchable dropdown | User can search/select from pre-populated chemical database; recently used chemicals appear at top; search updates as user types |
| **Amount Input** | Numeric input + unit selector | User enters quantity; selects unit (gallons, ounces, pounds, liters); validates numeric input >0 |
| **Target Pest** | Dropdown menu | Pre-defined list: Weeds (broadleaf), Weeds (grassy), Grubs, Fungus, Insects (general), Mosquitoes, Other |
| **Customer Selection** | Autocomplete search | User types customer name; sees matching results from customer list; can add new customer inline |
| **Applicator Auto-Fill** | User profile data | Applicator name and license number pre-filled from login session; read-only in this screen |
| **Notes Field** | Optional text input | Multi-line text field (max 500 characters) for additional details; not required |
| **Submit Action** | Save to database | Single "Save & Notify" button; shows loading state; success confirmation shown; customer notification triggered if enabled |

#### Validation Rules

- **Customer name:** Required, min 2 characters
- **Chemical product:** Required
- **Amount:** Required, must be numeric, must be >0
- **Unit:** Required, must be one of: gallons, ounces, pounds, liters
- **Photos:** Label photo required, before/after optional
- **GPS:** Required - if GPS disabled, prompt user to enable or allow manual address entry
- **Weather:** Required - if API fails, show manual temperature/wind inputs

#### Error Handling

| Error Condition | User Experience | System Behavior |
|----------------|-----------------|-----------------|
| Photo upload failure | Show warning banner: "Photo will upload when connection improves" | Queue photo locally, retry with exponential backoff (1s, 2s, 4s), max 3 retries |
| GPS unavailable | Modal prompt: "Enable GPS or enter address manually" | Show address input fields if GPS remains disabled |
| Weather API failure | Show manual input fields for temperature/wind | Log error to Sentry, continue without blocking submission |
| No network connection | Banner: "Offline - application will sync when online" | Save to local SQLite (Phase 2), sync when connection restored |
| Duplicate submission | Prevent double-tap with loading state | Disable submit button after first tap until response received |

#### UI Specifications

- **Screen Layout:** Single scrollable form (no tabs)
- **Touch Targets:** Minimum 48x48px (glove-friendly)
- **Font Size:** Body text 16px minimum, labels 14px
- **Colors:** High contrast (WCAG AA compliant)
- **Camera Button:** Large, prominent, blue (#2196F3)
- **Submit Button:** Full-width, green (#4CAF50), bottom of screen
- **Loading States:** Skeleton screens for data loading, spinner for submission
- **Success Feedback:** Checkmark animation + haptic feedback (vibration)

---

### 1.2 Application History

**User Story:** As an applicator, I want to view my recent applications so I can reference what I sprayed at a property last time.

#### MUST HAVE Features

| Feature | Requirement | Acceptance Criteria |
|---------|-------------|-------------------|
| **List View** | Scrollable list of past applications | Shows last 50 applications (most recent first); each row displays: date, customer name, chemical, amount; loads in <2 seconds |
| **Detail View** | Tap to expand | Full details displayed including photos, weather, notes, GPS coordinates (map thumbnail); swipe gesture to close |
| **Date Filter** | Filter by date range | User selects start/end date from calendar picker; list updates to show only applications in range; persists selection |
| **Customer Filter** | Filter by customer | User selects customer from dropdown; list shows only that customer's applications; clear filter button visible |
| **Chemical Filter** | Filter by product | User selects chemical from dropdown; list shows only applications using that product; supports multiple selection |
| **Export Single** | PDF generation | "Export" button on detail view generates PDF with all details + embedded photos; downloads to device; <5 seconds |

#### List Item Design

```
┌─────────────────────────────────────────┐
│ Jan 27, 2026 • 10:30 AM                 │
│ John Smith - 123 Main St                │
│ Roundup Pro • 2.5 gallons               │
│ ────────────────────────────────────── │
│                                         │
│ Jan 26, 2026 • 2:15 PM                  │
│ Jane Doe - 456 Oak Ave                  │
│ Fertilizer 10-10-10 • 50 pounds         │
│ ────────────────────────────────────── │
└─────────────────────────────────────────┘
```

#### UI Specifications

- **List item height:** 80px (easy to tap)
- **Pull-to-refresh:** Swipe down to reload
- **Infinite scroll:** Load 50 at a time, automatic pagination
- **Loading skeleton:** Show placeholder while fetching
- **Empty state:** "No applications yet. Tap + to log your first application"
- **Filter badges:** Show active filters at top (e.g., "Customer: John Smith ✕")

---

### 1.3 User Profile

**User Story:** As an applicator, I want to manage my profile information so my license number is always included in logs.

#### MUST HAVE Features

- **View/Edit Name:** Text input, max 100 characters
- **View/Edit License Number:** Text input, state selector + number field
- **View/Edit Email:** Email input with validation
- **Change Password:** Old password + new password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
- **Logout:** Clears JWT token, returns to login screen

#### Validation

- **License Number:** Required, format validation based on state
  - CA: 6 digits (e.g., "123456")
  - FL: QAL followed by 6 digits (e.g., "QAL123456")
  - TX: TDA followed by 6 digits (e.g., "TDA123456")
- **Email:** Valid email format (RFC 5322)
- **Password:** Min 8 characters, 1 uppercase, 1 lowercase, 1 number

---

## 2. WEB DASHBOARD (React.js)

### 2.1 Application Log Table

**User Story:** As a business owner, I want to see all applications logged by my team so I can monitor activity and ensure compliance.

#### MUST HAVE Features

| Feature | Requirement | Acceptance Criteria |
|---------|-------------|-------------------|
| **Data Table** | Sortable, paginated table | Columns: Date/Time, Customer, Address, Chemical, Amount, Applicator, Weather; 50 rows per page; click column header to sort ascending/descending |
| **Date Range Filter** | Calendar picker | User selects start/end date; table updates to show only applications in range; defaults to "Last 30 days" |
| **Applicator Filter** | Multi-select dropdown | User selects one or more applicators; table filters to show only their applications; "Select All" option |
| **Customer Filter** | Search/select | User types customer name; table filters to matching customers; autocomplete suggestions |
| **Chemical Filter** | Multi-select dropdown | User selects one or more chemicals; table filters accordingly; shows product name only |
| **CSV Export** | Bulk data export | "Export CSV" button downloads all filtered results as spreadsheet; includes all columns; filename: `applications_YYYY-MM-DD.csv` |
| **PDF Report** | Compliance report generation | "Generate Report" button creates state-specific PDF (see section 2.4); modal to select state and options |
| **Row Detail** | Click to expand | Clicking row shows full details + photos in modal; modal has close button and keyboard shortcut (Escape) |

#### Table Columns

| Column | Width | Sortable | Filterable |
|--------|-------|----------|------------|
| Date/Time | 140px | Yes | Yes (range) |
| Customer | 180px | Yes | Yes (search) |
| Address | 220px | No | No |
| Chemical | 160px | Yes | Yes (select) |
| Amount | 100px | Yes | No |
| Applicator | 140px | Yes | Yes (select) |
| Weather | 120px | No | No |
| Actions | 80px | No | No |

#### Performance Requirements

- **Table load time:** <2 seconds for 1,000 records
- **Filtering:** <500ms response time
- **Sorting:** <300ms response time
- **Export CSV:** <5 seconds for 10,000 records
- **Pagination:** Client-side (load 1,000 records, paginate in browser)

#### Empty States

- **No applications:** "No applications logged yet. Your team's applications will appear here."
- **No results from filter:** "No applications match your filters. Try adjusting your search criteria."

---

### 2.2 Customer Management

**User Story:** As a business owner, I want to maintain a customer list so applicators can quickly select customers when logging applications.

#### MUST HAVE Features

| Feature | Requirement | Acceptance Criteria |
|---------|-------------|-------------------|
| **Customer List** | Searchable table | Shows all customers with columns: Name, Address, Phone, Email, Notification Enabled; search by name or address updates list in real-time |
| **Add Customer** | Form with validation | Fields: Name (req), Address (req), City (req), State (req), Zip (req), Phone (opt), Email (opt), Notification toggle (default: ON); opens in modal |
| **Edit Customer** | Modal form | Click "Edit" button; same fields as Add; saves on "Update" click; closes modal on success |
| **Delete Customer** | Soft delete with warning | "Delete" button; warning modal: "This customer has X applications. Are you sure? Applications will be preserved."; if confirmed, customer marked inactive (not hard deleted) |
| **Customer Detail** | View application history | Click customer name; shows all applications for that customer (same table as 2.1 but pre-filtered); back button to return to list |

#### Add/Edit Customer Form

```
┌────────────────────────────────────────┐
│  Add Customer                    [✕]   │
├────────────────────────────────────────┤
│                                        │
│  Name: [____________________] *        │
│                                        │
│  Address: [____________________] *     │
│                                        │
│  City: [__________] State: [TX] * *    │
│                                        │
│  Zip: [_____] *                        │
│                                        │
│  Phone: [____________]                 │
│                                        │
│  Email: [____________________]         │
│                                        │
│  [✓] Send email notifications          │
│                                        │
│           [Cancel] [Save Customer]     │
└────────────────────────────────────────┘
```

#### Validation Rules

- **Name:** Required, max 100 characters, no special characters except hyphen/apostrophe
- **Address:** Required, max 200 characters
- **City:** Required, max 100 characters
- **State:** Required, 2-letter abbreviation (dropdown)
- **Zip:** Required, 5 or 9 digits (formats: 12345 or 12345-6789)
- **Email:** Optional, valid email format (RFC 5322)
- **Phone:** Optional, valid US phone format (xxx-xxx-xxxx or (xxx) xxx-xxxx)

#### Customer List Actions

- **Search:** Real-time search across name and address fields
- **Sort:** Click column headers to sort (name, address)
- **Pagination:** 50 customers per page
- **Bulk Actions (Phase 2):** Select multiple customers, bulk delete or bulk enable/disable notifications

---

### 2.3 Auto-Notifications

**User Story:** As a business owner, I want customers to automatically receive notifications when their property is treated so I don't have to manually send emails.

#### MUST HAVE Features

| Feature | Requirement | Acceptance Criteria |
|---------|-------------|-------------------|
| **Email Template** | Pre-built HTML email | Template includes: Company name/logo, Application date/time, Chemical product name + EPA number, Active ingredients, Re-entry period (safety info), Applicator name + license, Before/after photos (embedded), Company contact info |
| **Auto-Send Trigger** | Send immediately after log | When applicator clicks "Save & Notify" → email sent within 60 seconds; only if customer has notifications enabled |
| **Toggle per Customer** | Notification preference | Customer record has "Email Notifications: ON/OFF" toggle in customer management; persists across applications |
| **Notification Log** | Audit trail | Dashboard shows list of sent notifications with: Timestamp, Recipient email, Application ID, Delivery status (sent/delivered/bounced/failed) |
| **Manual Resend** | Retry failed sends | If email bounces or fails, admin can click "Resend" button; retries immediately |

#### Email Template Structure

**Subject:** Application Notification - [Customer Name] - [Date]

**Body:**
```
[Company Logo]

Dear [Customer Name],

This is to notify you that a pesticide application was performed at your property:

Property Address: [Address]
Date: [Date]
Time: [Time]

Chemical Information:
- Product Name: [Chemical Product]
- EPA Registration Number: [EPA Number]
- Active Ingredients: [Active Ingredients]
- Target Pest: [Target Pest]

Safety Information:
- Re-entry Period: [X] hours
- It is safe to re-enter the treated area after [Time]

Application Details:
- Amount Applied: [Amount] [Unit]
- Weather Conditions: [Temp]°F, Wind [Speed] mph
- Applicator: [Name], License #[License Number]

[Before Photo]  [After Photo]

If you have any questions or concerns, please contact us:
[Company Name]
Phone: [Phone]
Email: [Email]

Thank you,
[Company Name]
```

#### Email Template Variables

```javascript
{
  companyName: string,
  companyLogoUrl: string,
  customerName: string,
  propertyAddress: string,
  applicationDate: string, // "January 27, 2026"
  applicationTime: string, // "10:30 AM"
  chemicalProductName: string,
  epaNumber: string,
  activeIngredients: string,
  targetPest: string,
  reentryHours: number,
  reentryTime: string, // "6:30 PM"
  amount: number,
  unit: string,
  weatherTemp: number,
  weatherWind: number,
  applicatorName: string,
  applicatorLicense: string,
  photoBeforeUrl: string,
  photoAfterUrl: string,
  companyPhone: string,
  companyEmail: string,
}
```

#### Notification Delivery Requirements

- **Email Service:** SendGrid
- **Send Limit:** Free tier = 100/day; upgrade to Essentials ($20/mo) for 50,000/day
- **Delivery Tracking:** Use SendGrid Event Webhook to track:
  - `delivered`: Email successfully delivered to inbox
  - `bounce`: Email bounced (invalid address)
  - `dropped`: SendGrid rejected (spam, invalid)
  - `deferred`: Temporarily failed, will retry
- **Retry Logic:** If SendGrid API fails (5xx error), retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **Queue:** Store failed notifications in database, retry via cron job every 15 minutes

#### Notification Log Table

| Column | Description |
|--------|-------------|
| Timestamp | When notification was sent |
| Customer Name | Recipient name (linked to customer record) |
| Recipient Email | Email address |
| Application | Link to application details |
| Status | sent / delivered / bounced / failed |
| Error Message | If failed, reason (e.g., "Invalid email address") |
| Actions | "Resend" button if status = bounced or failed |

---

### 2.4 Compliance Reports

**User Story:** As a business owner, I want to generate state-compliant reports so I can submit to regulators or respond to audits without manual work.

#### MUST HAVE Features (MVP: CA, FL, TX templates)

| Feature | Requirement | Acceptance Criteria |
|---------|-------------|-------------------|
| **State Selection** | Dropdown menu | User selects California, Florida, or Texas; changes report template format |
| **Date Range** | Calendar picker | User selects start/end date for report period; defaults to "Last Month" |
| **Applicator Filter** | Optional multi-select | User can generate report for specific applicator(s) or all; defaults to "All" |
| **Customer Filter** | Optional multi-select | User can generate report for specific customer(s) or all; defaults to "All" |
| **PDF Generation** | State-specific format | PDF includes all required fields per state regulations; renders in <10 seconds for up to 1,000 applications |
| **Company Header** | Business info | Report header includes: Company name, Address, License number, Contact info (phone/email); pulled from company profile |
| **Data Grouping** | Organized by customer or date | Applications grouped per state requirements: CA/FL = by customer, TX = by date; sub-totals for chemical amounts |
| **Download** | Save to local machine | "Download PDF" button → file saved as `ComplianceReport_[STATE]_[START]_[END].pdf`; opens in new tab for preview |

#### Generate Report Modal

```
┌────────────────────────────────────────┐
│  Generate Compliance Report      [✕]   │
├────────────────────────────────────────┤
│                                        │
│  State: [California ▼] *               │
│                                        │
│  Report Period:                        │
│  From: [01/01/2026] To: [01/31/2026] * │
│                                        │
│  Applicators: [All Applicators ▼]     │
│                                        │
│  Customers: [All Customers ▼]         │
│                                        │
│  Options:                              │
│  [✓] Include photos                    │
│  [✓] Include weather details           │
│  [✓] Group by customer                 │
│                                        │
│     [Cancel]  [Generate & Download]    │
└────────────────────────────────────────┘
```

#### State-Specific Templates

**California (DPR Format):**

**Required Fields:**
- Date, Time, Location (address + GPS coordinates)
- Chemical product, EPA reg #, Active ingredients
- Amount, Unit, Target pest
- Applicator name, License #
- Weather conditions (temperature, wind speed)

**Grouping:** By property address  
**Footer:** Certification statement + signature line

**Sample CA Report Structure:**
```
═══════════════════════════════════════
      [COMPANY NAME]
      [Address, City, State ZIP]
      License #: [License Number]
═══════════════════════════════════════

PESTICIDE APPLICATION REPORT
State: California
Period: January 1-31, 2026

─────────────────────────────────────
CUSTOMER: John Smith
ADDRESS: 123 Main St, Los Angeles, CA
─────────────────────────────────────

Date: Jan 15, 2026  Time: 10:30 AM
Chemical: Roundup Pro (EPA #524-475)
Active Ingredients: Glyphosate 41%
Amount: 2.5 gallons
Target: Weeds (broadleaf)
Weather: 72°F, Wind 5 mph
Applicator: Mike Johnson (CA-123456)

[Repeat for each application at this property]

TOTAL FOR CUSTOMER: 5.0 gallons

═══════════════════════════════════════

I certify that the above information is
true and accurate to the best of my
knowledge.

Signature: _________________________
Date: _____________________________
```

**Florida (FDACS Format):**

**Required Fields:** All CA fields PLUS:
- Customer signature/consent
- Application method (spray, granular, injection, etc.)
- Square footage or acreage treated

**Grouping:** By customer  
**Footer:** Quarterly summary totals

**Texas (TDA Format):**

**Required Fields:** All CA fields PLUS:
- Property owner consent (checkbox)
- Re-entry interval (hours)
- Size of area treated (square feet or acres)

**Grouping:** By date  
**Footer:** Annual summary

#### Report Generation Performance

| Applications | Generation Time | Status |
|-------------|----------------|--------|
| 1-100 | <3 seconds | ✅ Instant |
| 101-1,000 | <10 seconds | ✅ Acceptable |
| 1,001-10,000 | <30 seconds | ⚠️ Show progress bar |
| 10,000+ | <60 seconds | ⚠️ Background job (Phase 2) |

#### Empty State

If no applications match filters:
```
No applications found for the selected criteria.

Try adjusting your date range, applicators, or customers.
```

PDF still generates with company header/footer and "No data" message.

---

### 2.5 User Management

**User Story:** As a business owner, I want to add my applicators to the system so they can log applications from their phones.

#### MUST HAVE Features

| Feature | Requirement | Acceptance Criteria |
|---------|-------------|-------------------|
| **Add User** | Invitation system | Admin enters email + name → system sends invite email with signup link → user creates password → account activated; invite link expires in 7 days |
| **User List** | View all company users | Table shows: Name, Email, Role, License #, Status (Active/Inactive), Last Login; sortable by name/email |
| **Edit User** | Update user info | Admin can edit: Name, License #, Role; cannot edit email (unique identifier); saves immediately |
| **Role Assignment** | Two roles: Admin, Applicator | Dropdown to select role; Admin = full dashboard access; Applicator = mobile app only |
| **Deactivate User** | Soft delete | "Deactivate" button → confirmation modal → user cannot log in but historical data preserved; can reactivate later |
| **Password Reset** | Self-service | User clicks "Forgot Password" on login screen → receives reset email → sets new password; link expires in 1 hour |

#### User Invitation Email

**Subject:** You've been invited to join [Company Name] on Landscape Logger

**Body:**
```
Hi [Name],

[Admin Name] has invited you to join [Company Name]'s account on Field Log Pro.

Click the link below to create your account:
[Signup Link - expires in 7 days]

Field Log Pro helps you log pesticide applications quickly and stay compliant with state regulations.

Questions? Contact support@landscapelog.com

Thanks,
The Landscape Logger Team
```

#### Role Permissions Matrix

| Feature | Admin | Applicator |
|---------|-------|-----------|
| **Mobile App** |  |  |
| Log applications | ✅ | ✅ |
| View own application history | ✅ | ✅ |
| Edit own profile | ✅ | ✅ |
| **Web Dashboard** |  |  |
| View all applications | ✅ | ❌ |
| Generate reports | ✅ | ❌ |
| Manage customers | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Company settings | ✅ | ❌ |
| Billing | ✅ | ❌ |

#### User List Actions

- **Search:** Real-time search by name or email
- **Filter by Role:** Show only Admins or only Applicators
- **Filter by Status:** Show only Active or only Inactive
- **Sort:** Click column headers (name, email, last login)
- **Bulk Actions (Phase 2):** Select multiple users, bulk deactivate

---

## 3. AUTHENTICATION & SECURITY

### 3.1 Authentication Flow

#### Signup Flow

1. User enters email, password, name, company name, license number
2. System validates input (Joi schema)
3. Check if email already exists → return error if duplicate
4. Hash password (bcrypt, cost factor 12)
5. Create company record (subscription status = "trial", trial ends in 14 days)
6. Create user record (role = "admin" for first user)
7. Generate JWT token (expires in 30 days)
8. Return token + user data to client
9. Client stores token in AsyncStorage (mobile) or localStorage (web)

#### Login Flow

1. User enters email, password
2. System validates input
3. Find user by email → return error if not found
4. Verify password (bcrypt.compare) → return error if invalid
5. Check if user is active → return error if deactivated
6. Update last login timestamp
7. Generate JWT token (expires in 30 days)
8. Return token + user data to client
9. Client stores token in storage

#### JWT Token Structure

**Payload:**
```json
{
  "userId": "uuid-user-123",
  "companyId": "uuid-company-456",
  "role": "admin",
  "iat": 1706356800,
  "exp": 1708948800
}
```

**Signature:** HMAC SHA256 with `JWT_SECRET` environment variable

**Expiration:** 30 days from issue (can be refreshed by logging in again)

#### Protected Routes

All API endpoints except `/api/auth/signup`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password` require JWT token in `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Middleware extracts token, verifies signature, attaches user context to request.

---

### 3.2 Password Requirements

**Minimum Requirements:**
- 8 characters minimum
- 1 uppercase letter (A-Z)
- 1 lowercase letter (a-z)
- 1 number (0-9)

**Optional (Phase 2):**
- 1 special character (!@#$%^&*)
- No common passwords (check against list of 10,000 most common)

**Password Storage:**
- Hash: bcrypt with cost factor 12 (2^12 iterations)
- Salt: Automatic (bcrypt generates unique salt per password)
- Never store plaintext passwords
- Never log passwords (even hashed)

**Password Reset:**
1. User clicks "Forgot Password"
2. Enters email address
3. System generates reset token (random UUID, stored in database with expiration)
4. Sends email with reset link: `https://app.landscapelog.com/reset-password?token=xyz`
5. User clicks link, enters new password
6. System validates token (not expired, not used), updates password hash
7. Invalidates token (one-time use)

---

### 3.3 Account Security

**Account Lockout:**
- After 5 failed login attempts from same IP: Lock for 15 minutes
- After 10 failed attempts from same email: Lock for 1 hour
- Email sent to user: "Suspicious login attempts detected. Reset your password if you didn't attempt to log in."

**Session Management:**
- JWT tokens expire after 30 days
- No server-side session storage (stateless)
- User can manually log out (client deletes token)
- Phase 2: Add "Log out all devices" feature (token blacklist)

**Two-Factor Authentication (Phase 2):**
- Optional 2FA via SMS or authenticator app
- Required for Admin role in Enterprise plan

---

### 3.4 Data Encryption

**In Transit:**
- All API calls over HTTPS/TLS 1.3
- Certificate: Auto-provisioned by Vercel/Railway (Let's Encrypt)
- Minimum TLS version: 1.2 (1.3 preferred)

**At Rest:**
- Database: PostgreSQL encryption at rest (Railway default)
- File Storage: Cloudflare R2 server-side encryption (AES-256)
- Backups: Encrypted with same key as primary data

**Sensitive Fields:**
- Passwords: Hashed with bcrypt (irreversible)
- JWT Secret: Stored in environment variable, never committed to Git
- API Keys: Stored in environment variables, rotated quarterly

---

### 3.5 Input Validation & Sanitization

**Server-Side Validation (Joi):**
Every API endpoint validates input with Joi schemas before processing.

Example:
```javascript
const applicationSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  chemicalProduct: Joi.string().max(100).required(),
  amount: Joi.number().positive().required(),
  unit: Joi.string().valid('gallons', 'ounces', 'pounds', 'liters').required(),
  // ... other fields
});
```

**SQL Injection Prevention:**
- Prisma ORM uses parameterized queries (never concatenate user input into SQL)
- No raw SQL queries except for database migrations

**XSS Prevention:**
- React automatically escapes user input in JSX
- API sanitizes string inputs (remove `<script>`, `<iframe>`, etc.)
- Content Security Policy headers (Helmet.js)

**CSRF Prevention:**
- Mobile app: Not vulnerable (no cookies, token in Authorization header)
- Web dashboard: CSRF tokens on all POST/PUT/DELETE requests

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement Method | Priority |
|--------|--------|-------------------|----------|
| Mobile app load time | <3 seconds | Time from app launch to "New Application" screen ready | High |
| Photo upload time | <5 seconds per photo (on LTE) | Time from capture to upload confirmation | High |
| Dashboard page load | <2 seconds | Time to first contentful paint | High |
| Database query response | <500ms | 95th percentile for all API calls | High |
| Report generation | <10 seconds for 1,000 records | Time from "Generate" click to PDF download | Medium |
| API uptime | 99.5% | Monthly uptime percentage | High |

**Testing:**
- Load testing: Simulate 100 concurrent users (Artillery or k6)
- Monitor performance in production (Vercel Analytics, Railway metrics)
- Set up alerts for API response time >1 second (p95)

---

### Scalability

**MVP Targets (First 6 Months):**
- 100 companies
- 500 total users (applicators + admins)
- 50,000 applications/month
- 1TB photo storage

**Year 1 Targets:**
- 1,000 companies
- 5,000 total users
- 500,000 applications/month
- 10TB photo storage

**Scaling Strategy:**
1. **Database:** Add read replicas when >10,000 applications/day
2. **API Server:** Horizontal scaling via Railway (auto-scales based on CPU/memory)
3. **File Storage:** Cloudflare R2 scales automatically (no action needed)
4. **Caching:** Add Redis in Phase 2 for weather/chemical data

**Monitoring:**
- Track applications/day, users/day in analytics
- Monitor database CPU/memory (Railway dashboard)
- Set up alerts for >70% database CPU (sustained for 24 hours)

---

### Usability

**Mobile App:**
- **Touch Targets:** Minimum 48x48px (Apple HIG / Material Design)
- **Font Size:** Minimum 16px for body text (WCAG readability)
- **Contrast Ratio:** WCAG AA compliant (4.5:1 for normal text, 3:1 for large text)
- **Error Messages:** Plain language, actionable
  - Bad: "Error 400: Validation failed"
  - Good: "Please enter the amount applied (must be greater than 0)"
- **Loading States:** Always show loading indicator (spinner, skeleton screen)
- **Success Feedback:** Visual + haptic (checkmark animation + vibration on success)

**Web Dashboard:**
- **Responsive Design:** Usable on tablet (iPad minimum: 768px width)
- **Keyboard Shortcuts:**
  - Enter to submit forms
  - Escape to close modals
  - Tab to navigate between fields
- **Data Tables:** Sticky headers, horizontal scroll on small screens
- **Forms:** Inline validation (real-time feedback as user types)
- **Help Text:** Tooltips on hover, ? icons for complex fields

**Accessibility:**
- WCAG 2.1 Level AA compliance (target)
- Semantic HTML (proper heading hierarchy, labels for inputs)
- ARIA labels for screen readers
- Keyboard navigation (all actions accessible without mouse)

---

### Reliability

**Data Integrity:**
- Zero tolerance for data loss
- Daily automated backups (Railway PostgreSQL)
- Backup retention: 30 days
- Point-in-time recovery: Restore to any moment in last 7 days

**Photo Redundancy:**
- Cloudflare R2: Minimum 2 copies in different availability zones
- Lifecycle policy: Retain for 7 years (longest state requirement)
- Soft delete: Photos not immediately deleted (30-day grace period)

**Error Recovery:**
- Failed photo uploads: Queue locally, retry up to 24 hours
- Failed API calls: Exponential backoff with jitter (1s, 2s, 4s, 8s)
- Database failures: Automatic failover to replica (RTO: <5 minutes)

**Monitoring & Alerts:**
- Error tracking: Sentry (free tier: 5k errors/month)
- Uptime monitoring: UptimeRobot (ping every 5 minutes)
- Alert thresholds:
  - Error rate >1% → Slack alert (immediate)
  - API latency >2 seconds (p95) → Slack alert (immediate)
  - Database connections >80% → Email alert (warning)
  - Disk space >90% → SMS alert (critical)

---

## User Acceptance Criteria (MVP)

### Critical Path Test Cases

#### Test Case 1: Log Application (Happy Path)

**Preconditions:**
- Applicator logged into mobile app
- GPS enabled
- Camera permission granted
- Internet connection available

**Steps:**
1. Applicator taps "New Application"
2. Taps "Take Photo" → Takes photo of product label
3. OCR extracts EPA number, auto-fills chemical product
4. Selects customer "John Smith" from autocomplete (types "John")
5. Amount auto-filled as "2" gallons (user just confirms)
6. Selects target pest "Weeds (broadleaf)" from dropdown
7. GPS and weather auto-filled (no user action)
8. Adds note "Heavy infestation near fence line"
9. Taps "Save & Notify"

**Expected Result:**
- Success message shown: "Application logged. Customer notified."
- Application appears in dashboard within 10 seconds
- All fields correct (customer, chemical, amount, GPS, weather, notes)
- Photos visible in dashboard (label, before, after)
- Customer receives email within 60 seconds with all details

**Acceptance Criteria:**
- Total time from step 1 to step 9: <45 seconds
- Email delivery confirmed (status = "delivered" in notification log)
- No errors in console/logs

---

#### Test Case 2: Generate Compliance Report

**Preconditions:**
- Admin logged into web dashboard
- At least 10 applications logged in current month
- Company profile complete (name, license number, address)

**Steps:**
1. Admin clicks "Reports" in navigation
2. Clicks "Generate New Report"
3. Selects state "California"
4. Selects date range "1/1/2026 - 1/31/2026"
5. Leaves applicator/customer filters as "All"
6. Checks "Include photos"
7. Clicks "Generate & Download"

**Expected Result:**
- PDF downloads within 10 seconds
- Opens PDF: Shows company header (name, license, address)
- All applications from Jan 1-31 listed
- Grouped by customer (CA format)
- Each application has: Date, time, chemical, EPA #, amount, applicator, weather
- Photos embedded for each application
- Footer has certification statement

**Acceptance Criteria:**
- Report format matches CA DPR requirements (verified by compliance consultant)
- All data matches dashboard (no missing applications)
- Photos render correctly (not broken links)

---

#### Test Case 3: Add Customer

**Preconditions:**
- Admin logged into web dashboard

**Steps:**
1. Admin clicks "Customers" in navigation
2. Clicks "Add Customer" button
3. Fills form:
   - Name: "Jane Doe"
   - Address: "123 Main St"
   - City: "Austin"
   - State: "TX"
   - Zip: "78701"
   - Email: "jane@example.com"
   - Notification: ON (checked)
4. Clicks "Save"

**Expected Result:**
- Success message: "Customer added successfully"
- Customer appears in customer list
- Customer appears in applicator's autocomplete list on mobile (within 60 seconds)

**Acceptance Criteria:**
- No duplicate check warning (Jane Doe at 123 Main St is unique)
- Email format validated (jane@example.com is valid)
- Notification toggle persisted (can verify in customer edit)

---

### Edge Cases to Test

#### Photo Upload Failure
**Scenario:** User in area with poor cell signal (3G or worse)  
**Expected:** Photo queued locally, success message shows "Photo will upload when connection improves", application submitted successfully without blocking

**Verify:**
- Photo uploads when signal restored (check after 1 minute on WiFi)
- Application record in database has photo URL (not null)

---

#### Duplicate Customer Prevention
**Scenario:** Admin tries to add customer "John Smith" at "123 Main St" but customer already exists  
**Expected:** Warning message "A customer with this name and address already exists. View customer instead?"

**Verify:**
- Clicking "View customer" navigates to existing customer detail
- No duplicate customer created

---

#### Report with No Data
**Scenario:** User generates report for date range with zero applications  
**Expected:** PDF generated with header/footer, message "No applications found for this period"

**Verify:**
- PDF downloads successfully (no error)
- Company header/footer present
- "No data" message clear

---

#### GPS Disabled
**Scenario:** User tries to log application with GPS off  
**Expected:** Modal prompt "GPS is required for compliance. Enable GPS or enter address manually."

**Verify:**
- If user enables GPS, coordinates auto-filled
- If user selects "Enter manually", address input fields shown
- Application cannot be submitted without location (GPS or manual address)

---

#### OCR Extraction Failure
**Scenario:** User takes blurry photo of product label  
**Expected:** Chemical field remains empty, user can search/select manually

**Verify:**
- No error shown to user
- Dropdown still functional (can type to search)
- Application can be submitted with manual chemical selection

---

## Open Questions & Decisions

### Product Decisions Required (Before Development Starts)

#### 1. Offline Mode in MVP?

**Question:** Should mobile app work without internet connection?

**Options:**
- **YES:** Better UX for rural areas, adds 3-4 weeks dev time, complex sync logic
- **NO:** Simpler MVP, faster launch, requires cell signal to log

**Recommendation:** ❌ NO for MVP. Add in Phase 2 based on beta feedback.

**Rationale:** Most applicators work in areas with LTE coverage. Adding offline mode increases complexity and risk. If beta users report connectivity issues, prioritize for Phase 2.

**Status:** ✅ DECIDED - No offline mode in MVP

---

#### 2. OCR Accuracy Threshold

**Question:** What's acceptable EPA number extraction accuracy?

**Options:**
- 95%+ accuracy (Google Cloud Vision API, costs $1.50/1000 images)
- 80%+ accuracy (Tesseract open-source, free but less accurate)
- Manual entry only (no OCR, users type EPA number)

**Recommendation:** ✅ Google Cloud Vision API, budget $50/month for MVP

**Rationale:** 95% accuracy = 1 in 20 users needs to correct. Acceptable tradeoff for time saved.

**Status:** ✅ DECIDED - Use Google Cloud Vision API

---

#### 3. Customer Dispute Process

**Question:** Can customers request changes to logged applications?

**Options:**
- **YES:** Requires customer portal, dispute workflow, audit trail
- **NO:** Applications are immutable after submission

**Recommendation:** ❌ NO for MVP. Applications are immutable.

**Rationale:** Adds significant complexity. No competitor offers this. Not a deal-breaker for early adopters. If customer disputes, business owner can add note or delete/re-log.

**Status:** ✅ DECIDED - No customer dispute feature

---

#### 4. Audit Trail (Change History)

**Question:** Must we track every edit to applications/customers?

**Options:**
- **YES for applications:** Log all changes (who, what, when) in `application_history` table
- **NO for customers:** Customer edits overwrite previous data

**Recommendation:** ✅ YES for applications, ❌ NO for customers

**Rationale:** Applications are compliance records (audit trail critical). Customer info changes are not regulatory (low value).

**Status:** ✅ DECIDED - Audit trail for applications only

---

#### 5. Priority State Templates

**Question:** Which 3 states for MVP?

**Options:**
- CA, FL, TX (largest markets)
- CA, NY, TX (diverse geography)
- User's state + 2 neighbors

**Recommendation:** ✅ California, Florida, Texas

**Rationale:** Largest markets (CA: 45k landscapers, FL: 35k, TX: 30k). Different regulatory approaches (CA most strict, FL quarterly reporting, TX annual).

**Status:** ✅ DECIDED - CA, FL, TX

---

### Business Decisions Needed

#### 6. Free Trial Length

**Options:** 7 days, 14 days, 30 days

**Recommendation:** ✅ 14 days

**Rationale:** 7 days too short to test full workflow. 30 days delays revenue. 14 days = 2 weeks, enough for 5-10 applications.

**Status:** ✅ DECIDED - 14-day free trial

---

#### 7. Annual Discount

**Options:** None, 10% off, 2 months free (16% off)

**Recommendation:** ✅ 2 months free (pay for 10, get 12)

**Rationale:** Strong incentive for annual commitment. Improves cash flow. Industry standard.

**Status:** ✅ DECIDED - 2 months free for annual

---

#### 8. Refund Policy

**Options:** No refunds, 30-day money-back guarantee, pro-rated refunds

**Recommendation:** ✅ 30-day money-back guarantee, no questions asked

**Rationale:** Reduces signup friction. Builds trust. Low churn expected after 30 days (if using product, unlikely to cancel).

**Status:** ✅ DECIDED - 30-day money-back guarantee

---

### Technical Decisions Needed

#### 9. Native vs. React Native

**Options:**
- Native (Swift + Kotlin): Better performance, 2x development time
- React Native: Single codebase, faster launch, good enough performance

**Recommendation:** ✅ React Native

**Rationale:** MVP goal is speed to market. React Native performance is sufficient for this use case (not a heavy gaming or video app). Can always rebuild native later if needed.

**Status:** ✅ DECIDED - React Native (Expo)

---

#### 10. Hosting Strategy

**Options:**
- AWS (EC2 + RDS + S3): Full control, complex setup
- Vercel (web) + Railway (backend) + Cloudflare R2 (storage): Managed services, faster setup
- Firebase: All-in-one, vendor lock-in

**Recommendation:** ✅ Vercel + Railway + Cloudflare R2

**Rationale:** Fastest MVP deployment. Railway auto-scales. Cloudflare R2 cheaper than S3 for photo storage (no egress fees). Can migrate to AWS if scale demands it.

**Status:** ✅ DECIDED - Vercel + Railway + Cloudflare R2

---

#### 11. Photo Compression

**Question:** How much to compress photos?

**Options:**
- No compression: 3-5 MB per photo, expensive storage
- Light compression (80% quality): 500-800 KB per photo
- Heavy compression (60% quality): 200-300 KB per photo

**Recommendation:** ✅ Light compression (80% JPEG quality)

**Rationale:** Photos must be legible for product labels. 80% quality preserves text readability. Reduces storage costs by 85%.

**Status:** ✅ DECIDED - 80% JPEG compression

---

#### 12. Database Choice

**Options:**
- PostgreSQL: Relational, best for compliance records, complex queries
- MongoDB: NoSQL, flexible schema, faster writes
- Firebase: Real-time, managed, expensive at scale

**Recommendation:** ✅ PostgreSQL

**Rationale:** Compliance data is highly relational (applications → customers → users → companies). ACID compliance critical for audit trail. SQL queries needed for report generation.

**Status:** ✅ DECIDED - PostgreSQL with Prisma ORM

---

## Success Criteria (MVP Launch)

### Launch-Ready Definition

**Technical Criteria:**
- [ ] Mobile app published to Apple App Store and Google Play Store
- [ ] Web dashboard live at production URL (e.g., app.landscapelog.com)
- [ ] API deployed to Railway with SSL certificate
- [ ] Database backed up daily (automated)
- [ ] Monitoring active (Sentry, UptimeRobot)

**Quality Criteria:**
- [ ] Zero P0 bugs (app crashes, data loss, security issues)
- [ ] <5 P1 bugs (blocking workflows but workarounds exist)
- [ ] <10 P2 bugs (minor issues, cosmetic problems)
- [ ] App crash rate <2% (Sentry tracking)
- [ ] API uptime >99% during beta period (2 weeks)

**Product Criteria:**
- [ ] 10 beta customers signed up and actively using
- [ ] Average log time: <60 seconds (measured via analytics)
- [ ] Email notifications delivering with >95% success rate
- [ ] Compliance report PDFs validated by regulatory consultant (CA, FL, TX)
- [ ] Payment processing live (Stripe integration tested)

**User Criteria:**
- [ ] At least 5 beta users have logged 10+ applications each
- [ ] At least 3 beta users have generated compliance reports
- [ ] NPS score from beta users: >30 (survey after 2 weeks)
- [ ] At least 1 beta user willing to provide testimonial

---

### Month 3 Goals (Post-Launch)

**Customer Metrics:**
- 25 paying customers (convert from beta + new signups)
- <15% monthly churn
- 80%+ of beta customers convert to paid

**Revenue Metrics:**
- $1,000 MRR (Monthly Recurring Revenue)
- $50-100 CAC (Customer Acquisition Cost)
- 3 months to payback CAC

**Product Metrics:**
- Average log time: <45 seconds
- Email delivery rate: >95%
- API uptime: >99.5%
- Support tickets: <5 per 100 users per month

**User Satisfaction:**
- NPS Score: >40
- App Store rating: >4.0 stars
- Google Play rating: >4.0 stars

---

## Out of Scope (Explicitly NOT Building in MVP)

### Features to Avoid Scope Creep

**❌ CRM Features:**
- Lead tracking
- Sales pipeline
- Email marketing campaigns
- Customer segmentation

**❌ Scheduling:**
- Calendar integration (Google Calendar, Outlook)
- Appointment booking
- Route optimization
- Crew scheduling

**❌ Billing/Invoicing:**
- Invoice generation for services rendered
- Payment processing for customer invoices (we only process subscription payments)
- QuickBooks integration

**❌ Time Tracking:**
- Clock in/out
- Timesheets
- Payroll integration

**❌ Inventory Management:**
- Chemical stock levels
- Reorder alerts
- Purchase orders
- Supplier management

**❌ Equipment Maintenance:**
- Service schedules
- Maintenance logs
- Equipment tracking

**❌ Customer Portal:**
- Self-service login for property owners
- View application history
- Request services

**❌ Advanced Features:**
- Multi-language support (English only)
- White-label branding (custom logo/colors for resellers)
- SMS notifications (Phase 2)
- Barcode scanning for product labels (Phase 2)
- Voice-to-text for notes (Phase 2)
- Mobile app offline mode (Phase 2)
- All 50 state report templates (start with 3, add in Phase 2-3)

---

### Rationale for Out of Scope

**Competitive Differentiation:** Our advantage is simplicity and low cost. Every feature added:
- Increases development time
- Increases maintenance burden
- Increases user complexity
- Increases support costs

**Focus Strategy:** Do one thing exceptionally well: compliance logging. Let competitors own the "all-in-one platform" market. We target small operators who can't afford or don't need full-featured software.

**Phase 2 Candidates:** Features with highest user demand after MVP launch will be prioritized for Phase 2. Data-driven roadmap based on:
- User feedback surveys
- Support ticket frequency
- Feature upvotes in roadmap tool

---

## State Compliance Requirements

### Appendix A: Regulatory Requirements by State

---

### California (Department of Pesticide Regulation - DPR)

**Retention Period:** 2 years  
**Reporting Frequency:** No routine reporting; records available for inspection on demand

**Required Fields:**
- Date of application (MM/DD/YYYY)
- Time of application (HH:MM AM/PM)
- Location (property address + GPS coordinates if available)
- Chemical product name (brand name as it appears on label)
- EPA registration number (format: XXX-XXX or XXX-XXX-XXXX)
- Active ingredient(s) (common name, not chemical name)
- Amount applied (quantity + unit: gallons, ounces, pounds, liters)
- Target pest or weed species (specific: "Dandelions" not just "Weeds")
- Applicator name (first and last)
- Applicator license number (CA format: 6 digits)
- Weather conditions at time of application (temperature in °F, wind speed in mph)

**Customer Notification Requirements:**
- Required for restricted use pesticides
- Must notify within 24 hours of application
- Must include re-entry period information (hours until safe)
- Posting signs at treated area (if public property)

**Report Format Requirements:**
- Grouped by property/customer
- Chronological order within each property
- Company header: Business name, address, license number
- Footer with certification statement: "I certify that the above information is true and accurate to the best of my knowledge."
- Signature line for responsible person

**Penalties for Non-Compliance:**
- Missing records: $500-1,000 per violation
- Inaccurate records: $1,000-5,000 per violation
- Repeated violations: License suspension

---

### Florida (Department of Agriculture and Consumer Services - FDACS)

**Retention Period:** 2 years  
**Reporting Frequency:** Quarterly reports required for certain license types (commercial applicators)

**Required Fields (All California fields PLUS):**
- Customer signature or verbal consent documentation
- Application method (spray, granular, injection, baiting, fumigation)
- Square footage or acreage treated (specific measurement)
- Dilution rate (if applicable)

**Customer Notification Requirements:**
- Required for all residential applications
- Notification must include safety information and re-entry period
- Written notice required if customer not present during application
- Notice must be posted at entry points (if multi-unit property)

**Report Format Requirements:**
- Grouped by customer
- Quarterly summary totals (total gallons/pounds applied, total properties serviced)
- Submit quarterly reports to FDACS online portal by 15th of following month
- Annual summary due by January 31 for prior calendar year

**Penalties for Non-Compliance:**
- Late quarterly report: $250
- Missing records: $500-2,500 per violation
- Failure to notify customer: $500 per occurrence

---

### Texas (Department of Agriculture - TDA)

**Retention Period:** 2 years  
**Reporting Frequency:** Annual summary report due by January 31

**Required Fields (All California fields PLUS):**
- Property owner consent (checkbox or signature on record)
- Re-entry interval (hours until safe to enter treated area)
- Size of area treated (square feet or acres, exact measurement)
- Service category (structural pest control, lawn care, agricultural, etc.)

**Customer Notification Requirements:**
- Required for commercial applications on residential property
- Must provide written notice within 24 hours if customer not present
- Notice must include: Chemical name, EPA registration number, safety precautions, re-entry interval
- Posting required at entry points (if HOA or multi-unit)

**Report Format Requirements:**
- Grouped by date (chronological)
- Annual summary report showing: Total applications, total chemicals used (by type), total properties serviced, total area treated
- Submit to TDA online portal by January 31 for prior calendar year
- Late submission: $100 late fee, $10/day after 30 days

**Penalties for Non-Compliance:**
- Missing records: $500-2,500 per violation
- Failure to submit annual report: $100 + $10/day penalty
- Inaccurate records: $1,000-5,000 per violation

---

### General Compliance Best Practices

**All States:**
- Keep records for minimum 2 years (recommend 7 years to be safe)
- Store in secure location (locked file cabinet or encrypted digital)
- Make available for inspection within 24 hours of request
- Maintain backup copies (digital records should have 2+ backups)
- Include photos when possible (before/after, product label)
- Document weather conditions at time of application
- Ensure applicator license is current and on file

**Common Violations to Avoid:**
- Illegible handwriting (digital records solve this)
- Missing date or time
- Missing applicator signature
- Incomplete chemical information (need EPA #, not just brand name)
- No customer consent/notification
- Records not available during inspection

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

*Next Documents: Technical Architecture, Implementation Roadmap, and Build Guides*
