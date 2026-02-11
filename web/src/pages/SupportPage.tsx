import { Box, Container, Typography, Paper } from '@mui/material';

const SupportPage = () => {
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
            Field Log Pro Support
          </Typography>

          <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Contact Us</Typography>
          <Typography variant="body1" paragraph>
            For questions, bug reports, or feature requests, please reach out to us:
          </Typography>
          <Typography variant="body1" paragraph>
            Email: <a href="mailto:micah.kulish@gmail.com">micah.kulish@gmail.com</a>
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Frequently Asked Questions</Typography>

          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2 }}>
            What is Field Log Pro?
          </Typography>
          <Typography variant="body1" paragraph>
            Field Log Pro is a mobile and web application designed for landscaping professionals and
            pesticide applicators. It allows you to log chemical applications in under 30 seconds
            with automatic GPS and weather capture, and generate state-compliant PDF reports.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Which states are supported for compliance reports?
          </Typography>
          <Typography variant="body1" paragraph>
            We currently support report formats for California (DPR), Florida (DACS), and Texas (TDA).
            Additional states will be added based on user demand.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Why does the app need my location?
          </Typography>
          <Typography variant="body1" paragraph>
            GPS coordinates are captured to record where each pesticide application occurs. This is
            required for state compliance reporting. Location is only captured when you create a
            new application log, not in the background.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Why does the app need camera access?
          </Typography>
          <Typography variant="body1" paragraph>
            Camera access is used to photograph product labels (required for compliance) and
            optionally capture before/after treatment photos for your records.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Is my data secure?
          </Typography>
          <Typography variant="body1" paragraph>
            Yes. All data is encrypted in transit (HTTPS/TLS) and at rest (AES-256). Passwords
            are hashed with bcrypt. Each company's data is fully isolated so no other organization
            can access your records.
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Can I delete my account?
          </Typography>
          <Typography variant="body1" paragraph>
            Yes. Contact us at micah.kulish@gmail.com to request account deletion. All personal data
            and application logs will be permanently removed.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default SupportPage;
