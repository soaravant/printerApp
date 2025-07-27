# Vercel Deployment Guide

This guide will help you deploy the Printer Billing Application to Vercel.

## 🚀 Quick Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure Environment Variables**
   - In the Vercel dashboard, go to your project
   - Navigate to Settings > Environment Variables
   - Add the following variables (copy from `env.example`):
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     FIREBASE_SERVICE_ACCOUNT_KEY=your_base64_encoded_service_account_key
     ```

4. **Deploy**
   - Click "Deploy" in the Vercel dashboard
   - Vercel will automatically build and deploy your application
   - Your app will be available at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy to preview
   vercel
   
   # Deploy to production
   vercel --prod
   ```

## 🔧 Configuration

### Vercel Configuration File

The project includes a `vercel.json` file with optimized settings:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev",
  "regions": ["iad1"],
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variables

Create a `.env.local` file for local development:

```bash
# Copy the example file
cp env.example .env.local

# Edit with your actual values
nano .env.local
```

### Firebase Setup (Optional)

If you want to use Firebase instead of the dummy database:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication and Firestore

2. **Get Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click the web app icon (</>) to add a web app
   - Copy the configuration object

3. **Update Environment Variables**
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Service Account Key**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Encode it as base64:
     ```bash
     cat service-account-key.json | base64 -w 0
     ```
   - Add to environment variables as `FIREBASE_SERVICE_ACCOUNT_KEY`

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable Vercel Analytics in your project dashboard
- Monitor performance and user behavior
- Track Core Web Vitals

### Custom Domain
1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Configure DNS records as instructed

## 🔄 Continuous Deployment

### Automatic Deployments
- Every push to the `main` branch triggers automatic deployment
- Pull requests create preview deployments
- Branch deployments are available for testing

### Deployment Settings
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Framework Preset**: Next.js

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs in Vercel dashboard
   # Or run locally to test
   pnpm build
   ```

2. **Environment Variables**
   - Ensure all required variables are set in Vercel dashboard
   - Check that variable names match exactly
   - Verify Firebase configuration is correct

3. **Performance Issues**
   - Check Vercel Analytics for performance metrics
   - Optimize images and assets
   - Review bundle size in build output

4. **Authentication Issues**
   - Verify Firebase configuration
   - Check CORS settings in Firebase
   - Ensure domain is whitelisted in Firebase

### Debug Commands

```bash
# Test build locally
pnpm build

# Test production server locally
pnpm start

# Check for linting issues
pnpm lint

# Verify TypeScript compilation
npx tsc --noEmit
```

## 📈 Performance Optimization

### Vercel Optimizations
- **Edge Functions**: Automatically deployed to edge locations
- **Image Optimization**: Automatic image optimization
- **Caching**: Intelligent caching for static assets
- **CDN**: Global content delivery network

### Application Optimizations
- **Code Splitting**: Automatic code splitting by Next.js
- **Lazy Loading**: Components loaded on demand
- **Static Generation**: Pre-rendered pages for better performance
- **Bundle Analysis**: Monitor bundle size with `@next/bundle-analyzer`

## 🔒 Security

### Environment Variables
- Never commit sensitive data to Git
- Use Vercel's environment variable encryption
- Rotate API keys regularly

### Firebase Security
- Configure Firestore security rules
- Set up proper authentication rules
- Use service account keys securely

## 📞 Support

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Status](https://vercel-status.com)

### Project Support
- Check `lessons.md` for common solutions
- Review `documentation.md` for technical details
- Check `plan.md` for project roadmap

---

**Note**: This application is ready for Vercel deployment. The dummy database will work for demonstration purposes, but for production use, configure Firebase integration following the instructions above. 