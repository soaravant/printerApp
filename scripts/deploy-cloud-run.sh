#!/bin/bash

# Deploy Printer Collector to Google Cloud Run
# Usage: ./deploy-cloud-run.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"europe-west1"}
SERVICE_NAME="printer-collector"

echo "🚀 Deploying Printer Collector to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth login'"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🔨 Building and deploying with Cloud Build..."
gcloud builds submit \
    --config=infra/cloudbuild.yaml \
    --substitutions=_FIREBASE_SERVICE_ACCOUNT_KEY="$(cat service-account-key.json | base64 -w 0)" \
    .

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Set up Cloud Scheduler to trigger the service periodically"
echo "2. Configure your printer network settings"
echo "3. Test the service with: curl $SERVICE_URL"
echo ""
echo "🔧 To set up Cloud Scheduler, run:"
echo "   ./setup-cloud-scheduler.sh $PROJECT_ID $REGION $SERVICE_URL"
