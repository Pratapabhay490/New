#!/bin/bash

# StudySync Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up StudySync..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
echo "⚙️  Setting up environment files..."

if [ ! -f "apps/backend/.env" ]; then
    echo "Creating backend .env file..."
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ Created apps/backend/.env - Please update with your values"
fi

if [ ! -f "apps/frontend/.env.local" ]; then
    echo "Creating frontend .env.local file..."
    cp apps/frontend/.env.local.example apps/frontend/.env.local
    echo "✅ Created apps/frontend/.env.local - Please update with your values"
fi

# Setup database with Docker
echo "🐳 Starting PostgreSQL with Docker..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd apps/backend
pnpm prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate dev --name init

cd ../..

echo "✅ Setup complete!"
echo ""
echo "To start the development servers:"
echo "  pnpm dev"
echo ""
echo "To start individual services:"
echo "  Backend:  cd apps/backend && pnpm dev"
echo "  Frontend: cd apps/frontend && pnpm dev"
echo ""
echo "To view the database:"
echo "  cd apps/backend && pnpm prisma studio"
