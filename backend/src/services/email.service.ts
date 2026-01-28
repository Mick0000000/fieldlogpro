/**
 * Email Service
 *
 * Handles sending email notifications via SendGrid.
 * Supports mock mode when API key is not configured (logs to console).
 *
 * Usage:
 * - Configure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in environment
 * - Call sendApplicationNotification() after creating an application
 */

import sgMail from '@sendgrid/mail';

// Types for the application and customer data we need
interface ApplicationData {
  id: string;
  applicationDate: Date;
  chemicalName: string;
  amount: number;
  unit: string;
  targetPestName?: string | null;
  applicationMethod?: string | null;
  areaTreated?: number | null;
  areaUnit?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  windDirection?: string | null;
  weatherCondition?: string | null;
  notes?: string | null;
  reentryInterval?: string | null;
  applicator: {
    firstName: string;
    lastName: string;
    licenseNumber?: string | null;
    licenseState?: string | null;
  };
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CompanyData {
  name: string;
  phone?: string | null;
  email: string;
  licenseNumber?: string | null;
  licenseState?: string | null;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mock?: boolean;
}

// Check if SendGrid is configured
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

// Initialize SendGrid if API key is configured
const isMockMode = !SENDGRID_API_KEY;

if (!isMockMode) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Format a date for display in emails
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Generate HTML email template for application notification
 */
function generateApplicationEmailHtml(
  application: ApplicationData,
  customer: CustomerData,
  company: CompanyData
): string {
  const applicationDate = formatDate(new Date(application.applicationDate));

  // Build weather section if data available
  let weatherSection = '';
  if (application.temperature || application.humidity || application.windSpeed || application.weatherCondition) {
    const weatherParts: string[] = [];
    if (application.temperature !== null && application.temperature !== undefined) {
      weatherParts.push(`Temperature: ${application.temperature}°F`);
    }
    if (application.humidity !== null && application.humidity !== undefined) {
      weatherParts.push(`Humidity: ${application.humidity}%`);
    }
    if (application.windSpeed !== null && application.windSpeed !== undefined) {
      const windDir = application.windDirection ? ` ${application.windDirection}` : '';
      weatherParts.push(`Wind: ${application.windSpeed} mph${windDir}`);
    }
    if (application.weatherCondition) {
      weatherParts.push(`Conditions: ${application.weatherCondition}`);
    }

    weatherSection = `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #374151;">Weather Conditions</strong><br>
          <span style="color: #6b7280;">${weatherParts.join(' | ')}</span>
        </td>
      </tr>
    `;
  }

  // Build area section if data available
  let areaSection = '';
  if (application.areaTreated && application.areaUnit) {
    areaSection = `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #374151;">Area Treated</strong><br>
          <span style="color: #6b7280;">${application.areaTreated} ${application.areaUnit}</span>
        </td>
      </tr>
    `;
  }

  // Build reentry interval section if available
  let reentrySection = '';
  if (application.reentryInterval) {
    reentrySection = `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; background-color: #fef3c7;">
          <strong style="color: #92400e;">Re-entry Interval</strong><br>
          <span style="color: #92400e;">${application.reentryInterval}</span>
        </td>
      </tr>
    `;
  }

  // Build notes section if available
  let notesSection = '';
  if (application.notes) {
    notesSection = `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #374151;">Notes</strong><br>
          <span style="color: #6b7280;">${application.notes}</span>
        </td>
      </tr>
    `;
  }

  // Build applicator license info
  let licenseInfo = '';
  if (application.applicator.licenseNumber && application.applicator.licenseState) {
    licenseInfo = `<br><span style="font-size: 12px; color: #9ca3af;">License: ${application.applicator.licenseState} #${application.applicator.licenseNumber}</span>`;
  }

  // Company license info
  let companyLicenseInfo = '';
  if (company.licenseNumber && company.licenseState) {
    companyLicenseInfo = `<br>License: ${company.licenseState} #${company.licenseNumber}`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pesticide Application Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #059669; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Pesticide Application Notice</h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">A treatment was applied to your property</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Dear ${customer.name},</p>
              <p style="margin: 0 0 25px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                This notice confirms that a pesticide application was performed at your property.
                Please review the details below and keep this email for your records.
              </p>

              <!-- Property Address -->
              <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                <strong style="color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Property Address</strong>
                <p style="margin: 8px 0 0 0; color: #111827; font-size: 15px;">
                  ${customer.address}<br>
                  ${customer.city}, ${customer.state} ${customer.zipCode}
                </p>
              </div>

              <!-- Application Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Application Date</strong><br>
                    <span style="color: #6b7280;">${applicationDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Product Applied</strong><br>
                    <span style="color: #6b7280;">${application.chemicalName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Amount Applied</strong><br>
                    <span style="color: #6b7280;">${application.amount} ${application.unit}</span>
                  </td>
                </tr>
                ${application.targetPestName ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Target Pest</strong><br>
                    <span style="color: #6b7280;">${application.targetPestName}</span>
                  </td>
                </tr>
                ` : ''}
                ${application.applicationMethod ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Application Method</strong><br>
                    <span style="color: #6b7280;">${application.applicationMethod}</span>
                  </td>
                </tr>
                ` : ''}
                ${areaSection}
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Applied By</strong><br>
                    <span style="color: #6b7280;">${application.applicator.firstName} ${application.applicator.lastName}</span>
                    ${licenseInfo}
                  </td>
                </tr>
                ${weatherSection}
                ${reentrySection}
                ${notesSection}
              </table>

              <!-- Safety Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 0 6px 6px 0;">
                <strong style="color: #92400e; font-size: 14px;">Safety Information</strong>
                <p style="margin: 8px 0 0 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                  Please follow any posted signs or instructions regarding treated areas.
                  If you have questions about this application, contact us at the information below.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 5px 0; color: #374151; font-size: 14px; font-weight: 600;">${company.name}</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                ${company.email}${company.phone ? ` | ${company.phone}` : ''}
                ${companyLicenseInfo}
              </p>
              <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 11px;">
                This is an automated notification. Please retain this email for your records.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email
 */
function generateApplicationEmailText(
  application: ApplicationData,
  customer: CustomerData,
  company: CompanyData
): string {
  const applicationDate = formatDate(new Date(application.applicationDate));

  let text = `
PESTICIDE APPLICATION NOTICE
============================

Dear ${customer.name},

This notice confirms that a pesticide application was performed at your property.

PROPERTY ADDRESS
----------------
${customer.address}
${customer.city}, ${customer.state} ${customer.zipCode}

APPLICATION DETAILS
-------------------
Application Date: ${applicationDate}
Product Applied: ${application.chemicalName}
Amount Applied: ${application.amount} ${application.unit}
`;

  if (application.targetPestName) {
    text += `Target Pest: ${application.targetPestName}\n`;
  }

  if (application.applicationMethod) {
    text += `Application Method: ${application.applicationMethod}\n`;
  }

  if (application.areaTreated && application.areaUnit) {
    text += `Area Treated: ${application.areaTreated} ${application.areaUnit}\n`;
  }

  text += `Applied By: ${application.applicator.firstName} ${application.applicator.lastName}`;
  if (application.applicator.licenseNumber && application.applicator.licenseState) {
    text += ` (License: ${application.applicator.licenseState} #${application.applicator.licenseNumber})`;
  }
  text += '\n';

  // Weather conditions
  const weatherParts: string[] = [];
  if (application.temperature !== null && application.temperature !== undefined) {
    weatherParts.push(`${application.temperature}°F`);
  }
  if (application.humidity !== null && application.humidity !== undefined) {
    weatherParts.push(`${application.humidity}% humidity`);
  }
  if (application.windSpeed !== null && application.windSpeed !== undefined) {
    const windDir = application.windDirection ? ` ${application.windDirection}` : '';
    weatherParts.push(`${application.windSpeed} mph wind${windDir}`);
  }
  if (application.weatherCondition) {
    weatherParts.push(application.weatherCondition);
  }
  if (weatherParts.length > 0) {
    text += `Weather Conditions: ${weatherParts.join(', ')}\n`;
  }

  if (application.reentryInterval) {
    text += `\n*** RE-ENTRY INTERVAL: ${application.reentryInterval} ***\n`;
  }

  if (application.notes) {
    text += `\nNotes: ${application.notes}\n`;
  }

  text += `
SAFETY INFORMATION
------------------
Please follow any posted signs or instructions regarding treated areas.
If you have questions about this application, contact us at the information below.

---
${company.name}
${company.email}${company.phone ? ` | ${company.phone}` : ''}`;

  if (company.licenseNumber && company.licenseState) {
    text += `\nLicense: ${company.licenseState} #${company.licenseNumber}`;
  }

  text += `

This is an automated notification. Please retain this email for your records.
`;

  return text.trim();
}

/**
 * Send application notification email to customer
 *
 * @param application - The application record with applicator info
 * @param customer - The customer to notify
 * @param company - The company that performed the application
 * @returns Result object with success status and messageId or error
 */
export async function sendApplicationNotification(
  application: ApplicationData,
  customer: CustomerData,
  company: CompanyData
): Promise<EmailResult> {
  const subject = `Pesticide Application Notice - ${formatDate(new Date(application.applicationDate)).split(',')[0]}`;

  const htmlContent = generateApplicationEmailHtml(application, customer, company);
  const textContent = generateApplicationEmailText(application, customer, company);

  // Mock mode - log to console instead of sending
  if (isMockMode) {
    console.log('='.repeat(60));
    console.log('[EMAIL SERVICE - MOCK MODE]');
    console.log('SendGrid API key not configured. Email would have been sent:');
    console.log('='.repeat(60));
    console.log(`To: ${customer.email}`);
    console.log(`From: ${SENDGRID_FROM_EMAIL}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log('Plain Text Content:');
    console.log(textContent);
    console.log('='.repeat(60));

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      mock: true,
    };
  }

  // Real SendGrid send
  try {
    const msg = {
      to: customer.email,
      from: SENDGRID_FROM_EMAIL,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const response = await sgMail.send(msg);

    // SendGrid returns array of responses, get the first one
    const messageId = response[0]?.headers?.['x-message-id'] || `sg-${Date.now()}`;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('[EMAIL SERVICE] Failed to send email:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if email service is in mock mode
 */
export function isEmailMockMode(): boolean {
  return isMockMode;
}
