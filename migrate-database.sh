#!/bin/bash

# Database Migration Script
# Generated on 2025-10-20

echo "🚀 Starting database migration..."

# 1. Set up Vercel Postgres (if using Vercel)
echo "📊 Setting up Vercel Postgres..."
echo "1. Go to Vercel Dashboard → Storage → Create Database"
echo "2. Choose 'Postgres'"
echo "3. Environment variables will be auto-configured"

# 2. Alternative: Set up Supabase
echo "📊 Alternative: Setting up Supabase..."
echo "1. Go to supabase.com"
echo "2. Create new project"
echo "3. Get connection string from Settings → Database"
echo "4. Add DATABASE_URL to Vercel environment variables"

# 3. Alternative: Set up Neon
echo "📊 Alternative: Setting up Neon..."
echo "1. Go to neon.tech"
echo "2. Create database"
echo "3. Get connection string"
echo "4. Add DATABASE_URL to Vercel environment variables"

# 4. Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# 5. Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

echo "✅ Migration completed!"
