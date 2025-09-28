#!/bin/bash

# MonaScribe Deployment Script
# This script helps deploy the Envio indexer to Render and frontend to Vercel

set -e

echo "🚀 MonaScribe Deployment Script"
echo "================================"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "📋 Checking prerequisites..."
check_tool "git"
check_tool "node"
check_tool "pnpm"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "monascribe-indexer" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Step 1: Deploy Envio Indexer to Render
echo ""
echo "🔧 Step 1: Deploy Envio Indexer to Render"
echo "=========================================="

echo "📝 Instructions for Render deployment:"
echo "1. Go to https://render.com and sign in"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure the service:"
echo "   - Name: monascribe-indexer"
echo "   - Root Directory: monascribe-indexer"
echo "   - Build Command: pnpm install && pnpm codegen && pnpm build"
echo "   - Start Command: pnpm start"
echo "   - Environment: Node"
echo "   - Plan: Starter (free tier)"
echo ""
echo "5. Add environment variables:"
echo "   - MONGODB_URI: (your MongoDB Atlas connection string)"
echo "   - MONGODB_DB: monascribe_analytics"
echo "   - NODE_ENV: production"
echo ""
echo "6. Click 'Create Web Service'"
echo ""
echo "⏳ Wait for deployment to complete, then note the URL (e.g., https://monascribe-indexer.onrender.com)"

read -p "Press Enter when Render deployment is complete and you have the URL..."

# Step 2: Update Vercel configuration
echo ""
echo "🔧 Step 2: Update Vercel Configuration"
echo "======================================"

echo "Please provide your Render app URL:"
read -p "Render URL (e.g., https://monascribe-indexer.onrender.com): " RENDER_URL

# Update vercel.json with the actual Render URL
sed -i "s|https://your-render-app.onrender.com|$RENDER_URL|g" vercel.json

echo "✅ Updated vercel.json with Render URL: $RENDER_URL"

# Step 3: Deploy Frontend to Vercel
echo ""
echo "🔧 Step 3: Deploy Frontend to Vercel"
echo "===================================="

echo "📝 Instructions for Vercel deployment:"
echo "1. Go to https://vercel.com and sign in"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository"
echo "4. Configure the project:"
echo "   - Framework Preset: Next.js"
echo "   - Root Directory: ./ (default)"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo ""
echo "5. Add environment variables:"
echo "   - MONGODB_URI: (your MongoDB Atlas connection string)"
echo "   - MONGODB_DB: monascribe_analytics"
echo "   - NEXT_PUBLIC_ENVIO_GRAPHQL_URL: $RENDER_URL/graphql"
echo "   - NEXT_PUBLIC_APP_ENV: production"
echo ""
echo "6. Click 'Deploy'"

# Step 4: Commit and push changes
echo ""
echo "🔧 Step 4: Commit and Push Changes"
echo "=================================="

git add .
git commit -m "Add deployment configuration for Render and Vercel

- Add render.yaml for Envio indexer deployment
- Add Dockerfile for containerized deployment
- Update vercel.json with production environment
- Add deployment script for easy setup"

echo "✅ Changes committed and ready to push"
echo ""
echo "🚀 Final Steps:"
echo "1. Run: git push origin main"
echo "2. Complete the Render and Vercel deployments as instructed above"
echo "3. Test your deployed application"
echo ""
echo "🎉 Deployment setup complete!"
