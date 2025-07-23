# Printer Billing App

A comprehensive printer billing and usage tracking application built with Next.js, Firebase, and Cloud Run.

## Features

- **User Authentication**: Secure login/signup with Firebase Auth
- **Role-based Access**: User and admin roles with different permissions
- **Real-time Data**: Live updates of print jobs and billing information
- **Automated Collection**: Python service collects data from network printers every 15 minutes
- **Cost Calculation**: Automatic billing calculation with configurable rates
- **Admin Panel**: User management and billing oversight
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Automation**: Python service on Cloud Run
- **Deployment**: Vercel (frontend) + Google Cloud (backend)

## Setup

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop
- Firebase CLI
- Google Cloud CLI

### Environment Variables

Set these in your Vercel deployment:

\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

### Deployment

1. **Frontend**: Deploy to Vercel using the GitHub integration
2. **Backend**: Run `./scripts/deploy-cloud-run.sh` to deploy the Python collector
3. **Scheduler**: Run `./scripts/setup-cloud-scheduler.sh` to set up automated collection

## Usage

1. **Sign Up**: Create an account with your name and department
2. **Print**: Use the network printers (192.168.3.41, 192.168.3.42)
3. **Track**: View your print jobs and costs in the dashboard
4. **Admin**: Admins can manage users and mark invoices as paid

## Printer Configuration

The system currently supports generic printer web interfaces. You may need to customize the parsing logic in `python/collect.py` for your specific printer models.

## Support

For issues or questions, please create a GitHub issue or contact the development team.
