/**
 * Main entry point for the Field Log Pro API
 *
 * This file sets up the Express server with:
 * - Middleware (security, CORS, JSON parsing)
 * - Routes (auth, applications, customers, users)
 * - Error handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import customerRoutes from './routes/customers';
import userRoutes from './routes/users';
import chemicalRoutes from './routes/chemicals';
import targetPestRoutes from './routes/targetPests';
import reportRoutes from './routes/reports';
import weatherRoutes from './routes/weather';
import photoRoutes from './routes/photos';
import notificationRoutes from './routes/notifications';

// Import error handler
import { errorHandler } from './middleware/errorHandler';

// Create Express app
const app = express();

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// ===================
// MIDDLEWARE SETUP
// ===================

// Helmet adds security headers (XSS protection, etc.)
app.use(helmet());

// CORS allows requests from our frontend apps
app.use(cors({
  origin: [
    process.env.WEB_APP_URL || 'http://localhost:5173',
    'https://web-ten-mauve-47.vercel.app',
  ],
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// ===================
// ROUTES
// ===================

// Health check endpoint - useful for monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Also respond to /api/health for Railway healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chemicals', chemicalRoutes);
app.use('/api/target-pests', targetPestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ===================
// START SERVER
// ===================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Field Log Pro API Server                         ║
╠═══════════════════════════════════════════════════╣
║   Status:  Running                                ║
║   Port:    ${PORT}                                    ║
║   Mode:    ${process.env.NODE_ENV || 'development'}                          ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
