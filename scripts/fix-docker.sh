#!/bin/bash

# Fix Docker permissions for Envio development
# This script adds the current user to the docker group

echo "🐳 Fixing Docker permissions for Envio..."

# Add user to docker group
sudo usermod -aG docker $USER

echo "✅ User $USER added to docker group"
echo "⚠️  You need to log out and log back in (or restart) for changes to take effect"
echo ""
echo "After restart, run:"
echo "  cd monascribe-indexer && pnpm dev"
echo ""
echo "This will start Envio locally with GraphQL endpoint at http://localhost:4000/graphql"
