#!/bin/bash

# Deployment Script for Score Reports Application
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh staging

set -e

ENVIRONMENT=${1:-development}
echo "🚀 Deploying to $ENVIRONMENT environment..."

# Validate environment
case $ENVIRONMENT in
  development|qc|staging|production)
    echo "✅ Valid environment: $ENVIRONMENT"
    ;;
  *)
    echo "❌ Invalid environment. Use: development, qc, staging, or production"
    exit 1
    ;;
esac

# Load environment variables
if [ -f "environments/$ENVIRONMENT.env" ]; then
  echo "📦 Loading environment variables from environments/$ENVIRONMENT.env"
  export $(cat environments/$ENVIRONMENT.env | grep -v '^#' | xargs)
else
  echo "❌ Environment file not found: environments/$ENVIRONMENT.env"
  exit 1
fi

# Backup database (for staging/production)
if [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "production" ]; then
  echo "💾 Creating database backup..."
  # Add your backup commands here
  # pg_dump $DATABASE_URL > backups/backup-$(date +%Y%m%d-%H%M%S).sql
fi

# Install dependencies
echo "📚 Installing dependencies..."
npm ci

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:push

# Build application
echo "🔨 Building application..."
npm run build

# Run tests (skip for development)
if [ "$ENVIRONMENT" != "development" ]; then
  echo "🧪 Running tests..."
  npm test
fi

# Health check
echo "🔍 Running health check..."
# Add health check commands here

echo "✅ Deployment to $ENVIRONMENT completed successfully!"

# Send notification (optional)
if [ "$ENVIRONMENT" = "production" ]; then
  echo "📢 Sending deployment notification..."
  # Add notification logic here (Slack, email, etc.)
fi