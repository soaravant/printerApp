#!/bin/bash

# Setup Cloud Scheduler to trigger printer collection every 15 minutes

set -e

PROJECT_ID=${PROJECT_ID:-"your-project-id"}
SERVICE_NAME="printer-collector"
REGION="us-central1"
JOB_NAME="printer-collector-job"

# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo "Setting up Cloud Scheduler job..."

# Create the scheduler job
gcloud scheduler jobs create http $JOB_NAME \
  --schedule="*/15 * * * *" \
  --uri="$SERVICE_URL" \
  --http-method=GET \
  --oidc-service-account-email=$SERVICE_ACCOUNT_EMAIL \
  --location=$REGION

echo "Cloud Scheduler job created successfully!"
echo "Job will run every 15 minutes to collect printer data."
