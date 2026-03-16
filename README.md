# Printer Billing Application

A comprehensive printer billing and management system built with Next.js, Firebase, and Google Cloud Platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm
- Firebase project (required)

### Local Development
```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example .env.local

# Start the auto-reloading dev server
./dev
```

`./dev` is the repo entrypoint for local development. It checks that `node_modules` and `.env.local` exist, then starts `next dev` with hot reloading enabled.

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   ```

2. **Deploy to Vercel**
   ```bash
   # Deploy to production
   vercel --prod
   
   # Or deploy to preview
   vercel
   ```

3. **Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add the variables from `env.example`
   - Add your Firebase configuration values (public config and service account key)

4. **Automatic Deployments**
   - Connect your GitHub repository to Vercel
   - Every push to main branch will trigger automatic deployment
   - Preview deployments for pull requests

## 🏗️ Project Structure

```
printerApp/
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
├── lib/                    # Utility functions and data store
├── python/                 # Data collection service
├── scripts/                # Deployment and setup scripts
├── vercel.json            # Vercel deployment configuration
└── env.example            # Environment variables template
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with the following variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY=your_base64_encoded_service_account_key
```

### Firebase Setup (Required)
1. Create a Firebase project
2. Enable Authentication and Firestore
3. Add your Firebase configuration to environment variables
4. No code changes are needed—Firebase is already wired in the app

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login system with role-based access
- **Print Job Tracking**: Monitor and track all print jobs
- **Cost Calculation**: Real-time cost calculation for printing services
- **Billing Management**: Generate and manage billing records
- **Admin Dashboard**: Comprehensive admin interface for user management

### User Interface
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: Clean interface using shadcn/ui components
- **Data Visualization**: Charts and graphs for printing statistics
- **Interactive Tables**: Sortable, filterable tables with pagination

### Admin Features
- **User Management**: Create, edit, and manage user accounts
- **Billing Management**: Generate and export billing records
- **Price Management**: Set and update pricing for services
- **System Monitoring**: View printer status and system health

## 🛠️ Development

### Available Scripts
```bash
npm run dev       # Start the repo dev server wrapper
npm run dev:next  # Run raw Next.js dev server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npx ts-node -P tsconfig.scripts.json scripts/backfill-income-createdAt-and-ids.ts  # Backfill income createdAt and IDs
```

### Tech Stack
- **Frontend**: Next.js 15.4.3, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Deployment**: Vercel

## 📊 Data Collection

The application includes a Python service for automated data collection from network printers:

```bash
# Deploy data collection service
cd python
docker build -t printer-collector .
docker run -e FIREBASE_SERVICE_ACCOUNT_KEY=your_key printer-collector
```

## 🔒 Security

- Environment variables for sensitive configuration
- Role-based access control
- Secure authentication system
- Input validation and sanitization

## 📈 Performance

- Optimized Next.js configuration
- Code splitting and lazy loading
- Efficient data fetching
- Responsive image optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation in `/documentation.md`
- Review development lessons in `/lessons.md`
- Check the project roadmap in `/plan.md`

---

**Note**: This application uses Firebase Firestore and Authentication. The dummy data utilities are available only for seeding/testing via the scripts in `/scripts`.
