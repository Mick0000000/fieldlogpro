import { Box, Container, Typography, Paper } from '@mui/material';

const PrivacyPolicyPage = () => {
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last Updated: February 11, 2026
          </Typography>

          <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>1. Introduction</Typography>
          <Typography variant="body1" paragraph>
            Field Log Pro ("we," "our," or "us") provides a mobile and web application for landscaping
            professionals and pesticide applicators to log chemical applications and generate compliance
            reports. This Privacy Policy explains how we collect, use, and protect your information.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>2. Information We Collect</Typography>
          <Typography variant="body1" paragraph>
            <strong>Account Information:</strong> When you create an account, we collect your name,
            email address, and password (stored securely using bcrypt hashing). We also collect your
            company name, applicator license number, and license state for compliance purposes.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Application Log Data:</strong> When you log a pesticide application, we collect
            the chemical product used, amount applied, target pest, application date and time, and
            any notes you provide.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Location Data:</strong> With your permission, we collect precise GPS coordinates
            (latitude and longitude) at the time of each application log. This data is used solely for
            compliance record-keeping and is not used for tracking your movements.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Photos:</strong> With your permission, we collect photos you take of product labels,
            and optional before/after treatment photos. Photos are stored securely in cloud storage.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Customer Information:</strong> You may enter customer names, addresses, email
            addresses, and phone numbers to associate with application logs and enable customer
            notifications.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Weather Data:</strong> We automatically capture weather conditions (temperature,
            humidity, wind speed, and wind direction) at the time of each application using the
            OpenWeather API. Only GPS coordinates are sent to this service to retrieve local weather.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>3. How We Use Your Information</Typography>
          <Typography variant="body1" paragraph>
            We use your information to: provide and maintain the Field Log Pro service; generate
            state-compliant PDF reports (California DPR, Florida DACS, Texas TDA); send automated
            customer notification emails about applications performed at their properties; maintain
            an audit trail for regulatory compliance; and authenticate your identity when you sign in.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>4. Third-Party Services</Typography>
          <Typography variant="body1" paragraph>
            We use the following third-party services that may receive limited data:
          </Typography>
          <Typography variant="body1" component="div" paragraph>
            <ul>
              <li><strong>OpenWeather API:</strong> Receives GPS coordinates to return local weather data.</li>
              <li><strong>SendGrid:</strong> Receives customer email addresses and application details to deliver notification emails.</li>
              <li><strong>Cloudflare R2:</strong> Stores uploaded photos securely with a 7-year retention period.</li>
              <li><strong>Railway:</strong> Hosts our backend API and PostgreSQL database.</li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell, rent, or share your personal information with third parties for
            advertising or marketing purposes.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>5. Data Security</Typography>
          <Typography variant="body1" paragraph>
            We implement industry-standard security measures including: HTTPS/TLS encryption for all
            data in transit; bcrypt password hashing; AES-256 encryption for data at rest; JWT-based
            authentication with 30-day token expiration; and company-level data isolation ensuring
            each organization can only access their own data.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>6. Data Retention</Typography>
          <Typography variant="body1" paragraph>
            Application logs and associated data are retained for as long as your account is active
            or as needed to comply with state pesticide application record-keeping requirements.
            Photos are retained for up to 7 years in accordance with compliance standards. You may
            request deletion of your account and associated data at any time.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>7. Your Rights</Typography>
          <Typography variant="body1" paragraph>
            You may: access and review the personal data we hold about you; request correction of
            inaccurate data; request deletion of your account and personal data; export your
            application logs as PDF reports. To exercise any of these rights, contact us at the
            email address below.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>8. Children's Privacy</Typography>
          <Typography variant="body1" paragraph>
            Field Log Pro is not intended for use by individuals under the age of 18. We do not
            knowingly collect personal information from children.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>9. Changes to This Policy</Typography>
          <Typography variant="body1" paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the new policy within the application. Your continued use of Field Log
            Pro after changes are posted constitutes acceptance of the updated policy.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>10. Contact Us</Typography>
          <Typography variant="body1" paragraph>
            If you have questions about this Privacy Policy or our data practices, please contact us
            at: micah.kulish@gmail.com
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrivacyPolicyPage;
