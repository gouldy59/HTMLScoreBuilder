#!/bin/bash

# Make deployment scripts executable
chmod +x scripts/deploy.sh
chmod +x scripts/setup-env.sh

echo "✅ Scripts are now executable"
echo "Usage:"
echo "  ./scripts/setup-env.sh [environment]"
echo "  ./scripts/deploy.sh [environment]"