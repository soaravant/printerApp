#!/bin/bash

# Deploy Python collector to Cloud Run
# Make sure to set these environment variables:
# - PROJECT_ID: Your GCP project ID
# - SERVICE_ACCOUNT_EMAIL: Your service account email

set -e

PROJECT_ID=${PROJECT_ID:-"your-project-id"}
SERVICE_NAME="printer-collector"
REGION="us-central1"

echo "Building and deploying printer collector to Cloud Run..."

# Build and push Docker image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest ./python
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars FIRESTORE_PROJECT_ID=$PROJECT_ID \
  --set-env-vars PRINTER_IPS="192.168.3.41,192.168.3.42" \
  --set-env-vars BW_RATE="0.05" \
  --set-env-vars COLOR_RATE="0.15" \
  --set-env-vars SCAN_RATE="0.02" \
  --service-account $SERVICE_ACCOUNT_EMAIL

echo "Deployment completed!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')"
