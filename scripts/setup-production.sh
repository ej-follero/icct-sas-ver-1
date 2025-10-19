#!/bin/bash

# ICCT Smart Attendance System - Production Setup Script
# This script helps set up the production environment for Vercel deployment

echo "🚀 Setting up ICCT Smart Attendance System for Production..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp env.template .env.local
    echo "✅ Created .env.local from template"
    echo "⚠️  Please update .env.local with your actual values"
fi

# Generate secure secrets
echo "🔐 Generating secure secrets..."

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env.local

# Generate NextAuth Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.local

# Generate Session Secret
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET=$SESSION_SECRET" >> .env.local

# Generate Cookie Secret
COOKIE_SECRET=$(openssl rand -base64 32)
echo "COOKIE_SECRET=$COOKIE_SECRET" >> .env.local

# Generate CSRF Secret
CSRF_SECRET=$(openssl rand -base64 32)
echo "CSRF_SECRET=$CSRF_SECRET" >> .env.local

echo "✅ Generated secure secrets"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run database migrations (if database is available)
echo "🔄 Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Database not available, skipping migrations"

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your actual service URLs"
echo "2. Set up external services (database, Redis, MQTT)"
echo "3. Configure environment variables in Vercel"
echo "4. Deploy to Vercel"
echo ""
echo "🔧 For local development:"
echo "   docker-compose up -d"
echo "   docker-compose -f docker-mqtt.yml up -d"
echo "   npm run dev"
