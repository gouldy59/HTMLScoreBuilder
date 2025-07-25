#!/bin/bash

# Environment Setup Script
# Usage: ./scripts/setup-env.sh [environment]

ENVIRONMENT=${1:-development}

echo "🛠️ Setting up $ENVIRONMENT environment..."

# Create environment directory if it doesn't exist
mkdir -p environments

# Copy example file if environment file doesn't exist
if [ ! -f "environments/$ENVIRONMENT.env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example "environments/$ENVIRONMENT.env"
    echo "📄 Created environments/$ENVIRONMENT.env from template"
    echo "⚠️ Please edit environments/$ENVIRONMENT.env with your actual values"
  else
    echo "❌ .env.example not found"
    exit 1
  fi
else
  echo "✅ Environment file already exists: environments/$ENVIRONMENT.env"
fi

# Create database for environment
echo "🗄️ Setting up database for $ENVIRONMENT..."

case $ENVIRONMENT in
  development)
    echo "🔧 Development database setup..."
    # Development-specific setup
    ;;
  qc)
    echo "🧪 QC database setup..."
    # QC-specific setup
    ;;
  staging)
    echo "🎭 Staging database setup..."
    # Staging-specific setup
    ;;
  production)
    echo "🚀 Production database setup..."
    # Production-specific setup
    echo "⚠️ IMPORTANT: Make sure to use strong passwords and secure connections"
    ;;
esac

echo "✅ Environment setup completed!"
echo "📝 Next steps:"
echo "   1. Edit environments/$ENVIRONMENT.env with your database credentials"
echo "   2. Run: npm run db:push"
echo "   3. Start the application: npm run dev"