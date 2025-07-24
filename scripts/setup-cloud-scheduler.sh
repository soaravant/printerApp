#!/bin/bash

# Set up Cloud Scheduler for Printer Data Collection
# Usage: ./setup-cloud-scheduler.sh [PROJECT_ID] [REGION] [SERVICE_URL]

set -e

PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"europe-west1"}
SERVICE_URL=${3:-"https://printer-collector-hash-ew.a.run.app"}
JOB_NAME="printer-data-collection"

echo "⏰ Setting up Cloud Scheduler for Printer Data Collection..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service URL: $SERVICE_URL"
echo "Job Name: $JOB_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable Cloud Scheduler API
echo "📋 Enabling Cloud Scheduler API..."
gcloud services enable cloudscheduler.googleapis.com

# Create or update the scheduled job
echo "📅 Creating scheduled job..."

# Check if job already exists
if gcloud scheduler jobs describe $JOB_NAME --location=$REGION &>/dev/null; then
    echo "📝 Updating existing job..."
    gcloud scheduler jobs update http $JOB_NAME \
        --location=$REGION \
        --schedule="0 * * * *" \
        --uri="$SERVICE_URL" \
        --http-method=GET \
        --time-zone="Europe/Athens" \
        --description="Collect printer data every hour"
else
    echo "🆕 Creating new job..."
    gcloud scheduler jobs create http $JOB_NAME \
        --location=$REGION \
        --schedule="0 * * * *" \
        --uri="$SERVICE_URL" \
        --http-method=GET \
        --time-zone="Europe/Athens" \
        --description="Collect printer data every hour"
fi

# Test the job
echo "🧪 Testing the scheduled job..."
gcloud scheduler jobs run $JOB_NAME --location=$REGION

echo "✅ Cloud Scheduler setup completed!"
echo ""
echo "📋 Job Details:"
echo "   Name: $JOB_NAME"
echo "   Schedule: Every hour (0 * * * *)"
echo "   Timezone: Europe/Athens"
echo "   Target: $SERVICE_URL"
echo ""
echo "🔍 To view job status:"
echo "   gcloud scheduler jobs describe $JOB_NAME --location=$REGION"
echo ""
echo "📊 To view job logs:"
echo "   gcloud logging read 'resource.type=\"cloud_scheduler_job\" AND resource.labels.job_id=\"$JOB_NAME\"' --limit=10"
