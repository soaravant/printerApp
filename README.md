# Printer Billing Application

A comprehensive printer billing and management system built with Next.js, Firebase, and Google Cloud Platform.

## Features

### User Features
- **Dashboard**: View personal printing statistics and costs
- **Print History**: Detailed view of all print jobs with filtering
- **Lamination History**: Track lamination jobs and costs
- **Profile Management**: Update personal information
- **Cost Calculator**: Calculate printing costs before printing

### Admin Features
- **User Management**: Create, edit, and manage user accounts
- **Billing Management**: Generate and manage billing records
- **Price Management**: Set and update pricing for different print types
- **System Monitoring**: View printer status and system health
- **Data Export**: Export data to CSV for reporting
- **Lamination Charges**: Add manual lamination charges to users

### System Features
- **Automated Data Collection**: Collect print job data from network printers
- **Real-time Monitoring**: Monitor printer status and health
- **Flexible Pricing**: Support for different pricing models
- **Multi-language Support**: Greek language interface
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Recharts**: Data visualization library

### Backend
- **Firebase Authentication**: User authentication and authorization
- **Firestore**: NoSQL database for data storage
- **Firebase Functions**: Serverless functions for business logic

### Data Collection
- **Python Collector**: Automated printer data collection service
- **Google Cloud Run**: Containerized deployment
- **Cloud Scheduler**: Automated job scheduling
- **Docker**: Containerization for consistent deployment

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Google Cloud Platform project
- Network access to printers (for data collection)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd printer-billing-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   \`\`\`

4. **Set up Firebase**
   - Create a Firebase project
   - Enable Firestore database
   - Enable Authentication with Username/Password
   - Deploy Firestore security rules from `firestore.rules`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Login Credentials
- **Admin**: username `admin`, password `admin`
- **User 408**: username `408`, password `408`
- **User 409**: username `409`, password `409`

## Deployment

### Frontend Deployment (Vercel)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Data Collector Deployment (Google Cloud)
1. **Set up Google Cloud Project**
   \`\`\`bash
   gcloud config set project YOUR_PROJECT_ID
   \`\`\`

2. **Deploy the collector service**
   \`\`\`bash
   ./scripts/deploy-cloud-run.sh YOUR_PROJECT_ID europe-west1
   \`\`\`

3. **Set up automated scheduling**
   \`\`\`bash
   ./scripts/setup-cloud-scheduler.sh YOUR_PROJECT_ID europe-west1 SERVICE_URL
   \`\`\`

## Configuration

### Printer Configuration
Configure your printers in the Cloud Run environment variables:
\`\`\`json
[
  {
    "ip": "192.168.3.41",
    "name": "Canon iR-ADV C3330",
    "model": "canon_ir_adv",
    "username": "admin",
    "password": "admin"
  },
  {
    "ip": "192.168.3.42",
    "name": "HP LaserJet Pro M404",
    "model": "hp_laserjet",
    "username": "admin",
    "password": "admin"
  }
]
\`\`\`

### Pricing Configuration
Set pricing through the admin interface or directly in Firestore:
\`\`\`json
{
  "a4BW": 0.05,
  "a4Color": 0.15,
  "a3BW": 0.10,
  "a3Color": 0.30,
  "scan": 0.02,
  "copy": 0.03
}
\`\`\`

## Usage

### For Users
1. **Login**: Use your assigned username and password
2. **View Dashboard**: See your printing statistics and recent activity
3. **Check History**: Review detailed print and lamination history
4. **Calculate Costs**: Use the cost calculator to estimate printing costs
5. **Update Profile**: Keep your information up to date

### For Administrators
1. **User Management**: Create and manage user accounts
2. **Billing**: Generate monthly billing reports
3. **Pricing**: Update pricing for different print types
4. **Monitoring**: Monitor printer status and system health
5. **Data Export**: Export data for external reporting

## API Endpoints

### Print Data Collection
- `GET /api/collect` - Trigger manual data collection
- `GET /api/health` - Check system health
- `GET /api/printers` - Get printer status

### User Management
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)

### Billing
- `GET /api/billing` - Get billing records
- `POST /api/billing/generate` - Generate billing records (admin only)
- `PUT /api/billing/:id` - Update billing record (admin only)

## Monitoring and Logging

### Application Monitoring
- Firebase Analytics for user behavior
- Error tracking with Firebase Crashlytics
- Performance monitoring with Firebase Performance

### Infrastructure Monitoring
- Google Cloud Monitoring for Cloud Run services
- Cloud Logging for application logs
- Uptime checks for service availability

## Security

### Authentication
- Firebase Authentication with username/password
- Role-based access control (user/admin)
- Secure session management

### Data Protection
- Firestore security rules for data access control
- HTTPS encryption for all communications
- Input validation and sanitization

### Network Security
- VPC configuration for printer network access
- Firewall rules for service communication
- Secure credential management

## Troubleshooting

### Common Issues

1. **Printer Connection Issues**
   - Check network connectivity to printers
   - Verify printer credentials
   - Check firewall settings

2. **Authentication Problems**
   - Verify Firebase configuration
   - Check environment variables
   - Ensure Firestore rules are deployed

3. **Data Collection Issues**
   - Check Cloud Run service logs
   - Verify Cloud Scheduler configuration
   - Test printer API endpoints manually

### Logs and Debugging
- Application logs: `npm run logs`
- Cloud Run logs: `gcloud logs read`
- Firebase logs: Firebase Console > Functions > Logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## Changelog

### Version 1.0.0
- Initial release with basic printing and billing functionality
- User and admin interfaces
- Automated data collection from printers
- Firebase integration
- Google Cloud deployment

### Version 1.1.0
- Added lamination job tracking
- Enhanced admin features
- Improved data export capabilities
- Better mobile responsiveness
- Performance optimizations
