# Deployment Guide

This guide covers deploying Field Log Pro to production environments.

## Architecture Overview

- **Backend**: Node.js/Express API deployed on Railway with PostgreSQL
- **Web Dashboard**: React/Vite SPA deployed on Vercel
- **Mobile App**: React Native/Expo deployed via EAS Build to TestFlight/Play Store

---

## 1. Backend Deployment (Railway)

### Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected to Railway

### Setup Steps

1. **Create a new Railway project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login
   ```

2. **Add PostgreSQL database**
   - In Railway dashboard, click "New" > "Database" > "PostgreSQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

3. **Deploy the backend**
   ```bash
   cd backend

   # Link to Railway project
   railway link

   # Deploy
   railway up
   ```

4. **Run database migrations**
   ```bash
   railway run npm run db:migrate:deploy
   ```

### Environment Variables (Railway)

Set these in Railway dashboard under "Variables":

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key-min-32-chars` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` (Railway sets automatically) |
| `CORS_ORIGIN` | Allowed origins | `https://your-app.vercel.app` |
| `AWS_ACCESS_KEY_ID` | S3 access key | Your AWS key |
| `AWS_SECRET_ACCESS_KEY` | S3 secret | Your AWS secret |
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `landscaping-app-uploads` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxxx` |
| `SENDGRID_FROM_EMAIL` | Sender email | `noreply@yourapp.com` |

### Health Check

The backend exposes `/api/health` for health checks. Railway will use this to monitor the service.

---

## 2. Web Dashboard Deployment (Vercel)

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel

### Setup Steps

1. **Import project to Vercel**
   - Go to Vercel dashboard
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Set the root directory to `web`

2. **Configure build settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Deploy**
   - Vercel will automatically deploy on every push to main

### Environment Variables (Vercel)

Set these in Vercel dashboard under "Settings" > "Environment Variables":

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.railway.app` |

### Custom Domain (Optional)

1. Go to "Settings" > "Domains"
2. Add your custom domain
3. Configure DNS according to Vercel instructions

---

## 3. Mobile App Deployment (EAS Build)

### Prerequisites

- Expo account (https://expo.dev)
- Apple Developer account (for iOS)
- Google Play Console account (for Android)
- EAS CLI installed

### Initial Setup

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure the project**
   ```bash
   cd mobile

   # Initialize EAS (if not already done)
   eas build:configure
   ```

4. **Update app.json**
   - Update `owner` with your Expo username
   - Update `extra.eas.projectId` with your EAS project ID
   - Update `updates.url` with your EAS project URL

### iOS Deployment (TestFlight)

1. **Build for iOS**
   ```bash
   # Development build (for simulators)
   eas build --platform ios --profile development

   # Preview build (internal testing)
   eas build --platform ios --profile preview

   # Production build (App Store/TestFlight)
   eas build --platform ios --profile production
   ```

2. **Submit to TestFlight**
   ```bash
   # Set environment variables first
   export APPLE_ID="your-apple-id@email.com"
   export ASC_APP_ID="your-app-store-connect-app-id"
   export APPLE_TEAM_ID="your-team-id"

   # Submit
   eas submit --platform ios
   ```

3. **TestFlight setup**
   - Go to App Store Connect
   - Navigate to your app > TestFlight
   - Add internal/external testers
   - Wait for Apple review (external testers only)

### Android Deployment (Play Store)

1. **Build for Android**
   ```bash
   # Development build (APK)
   eas build --platform android --profile development

   # Preview build (APK for testing)
   eas build --platform android --profile preview

   # Production build (AAB for Play Store)
   eas build --platform android --profile production
   ```

2. **Create service account for submission**
   - Go to Google Cloud Console
   - Create a service account with Play Store permissions
   - Download JSON key file
   - Place it as `mobile/google-service-account.json`
   - Add to `.gitignore`

3. **Submit to Play Store**
   ```bash
   eas submit --platform android
   ```

### Environment Variables (Mobile)

Create environment-specific config in `mobile/app.config.js` or use EAS secrets:

```bash
# Set EAS secrets
eas secret:create --name API_URL --value "https://your-backend.railway.app"
```

---

## 4. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] API endpoints tested
- [ ] CORS configured correctly

### Backend (Railway)

- [ ] Railway project created
- [ ] PostgreSQL database provisioned
- [ ] Environment variables set
- [ ] Deploy successful
- [ ] Database migrations run
- [ ] Health check endpoint responding
- [ ] API endpoints accessible

### Web (Vercel)

- [ ] Vercel project created
- [ ] Root directory set to `web`
- [ ] Environment variables set
- [ ] Deploy successful
- [ ] SPA routing working
- [ ] API connection working

### Mobile (EAS)

- [ ] EAS project configured
- [ ] app.json updated with production values
- [ ] Bundle identifiers set correctly
- [ ] Required permissions declared
- [ ] Development build tested
- [ ] Preview build tested
- [ ] Production build successful
- [ ] Submitted to TestFlight/Play Store

---

## 5. Monitoring and Maintenance

### Railway

- Monitor logs: `railway logs`
- Check metrics in Railway dashboard
- Set up alerts for errors

### Vercel

- Check deployment logs in dashboard
- Monitor analytics (if enabled)
- Review function logs

### EAS

- Check build status at expo.dev
- Monitor crash reports via Sentry (recommended)
- Track OTA update adoption

---

## 6. Rollback Procedures

### Railway

```bash
# List deployments
railway deployments

# Rollback to previous deployment
railway rollback
```

### Vercel

- Go to Deployments in Vercel dashboard
- Click on previous deployment
- Click "Promote to Production"

### Mobile (EAS)

- For OTA updates: Publish a new update with fixes
- For native builds: Submit a new build with previous code

---

## 7. Troubleshooting

### Common Issues

**Backend not starting**
- Check Railway logs: `railway logs`
- Verify DATABASE_URL is set
- Ensure Prisma migrations are run

**Web app API errors**
- Check VITE_API_URL is correct
- Verify CORS settings on backend
- Check browser console for errors

**Mobile build failing**
- Clear EAS build cache: `eas build --clear-cache`
- Verify app.json configuration
- Check for native dependency issues

### Support Resources

- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- EAS: https://docs.expo.dev/eas/

---

## Quick Reference

### Deploy Commands

```bash
# Backend (Railway)
cd backend && railway up

# Web (Vercel)
# Automatic on git push, or:
cd web && vercel

# Mobile (EAS)
cd mobile
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

### Environment Variable Summary

| Platform | Location | Variables |
|----------|----------|-----------|
| Railway | Dashboard > Variables | DATABASE_URL, JWT_SECRET, AWS_*, SENDGRID_* |
| Vercel | Settings > Environment Variables | VITE_API_URL |
| EAS | eas secret:create | API_URL |
