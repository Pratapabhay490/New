#!/bin/bash

# StudySync Production Deployment Script

set -e

echo "🚀 Deploying StudySync to production..."

# Build shared types
echo "📦 Building shared types..."
cd packages/shared-types
pnpm build
cd ../..

# Build backend
echo "🔧 Building backend..."
cd apps/backend
pnpm build
pnpm prisma generate
cd ../..

# Build frontend
echo "🎨 Building frontend..."
cd apps/frontend
pnpm build
cd ../..

echo "✅ Build complete!"
echo ""
echo "Deployment options:"
echo ""
echo "1. Docker Deployment:"
echo "   docker-compose -f infrastructure/docker/docker-compose.yml up -d"
echo ""
echo "2. Platform Deployment:"
echo "   - Backend: Deploy apps/backend to Railway/Render/Fly.io"
echo "   - Frontend: Deploy apps/frontend to Vercel"
echo "   - Database: Use managed PostgreSQL (Railway/Supabase)"
echo ""
echo "3. Manual Deployment:"
echo "   - Upload dist folders to your server"
echo "   - Configure environment variables"
echo "   - Run migrations: cd apps/backend && pnpm prisma migrate deploy"
echo "   - Start services: pm2 start"
