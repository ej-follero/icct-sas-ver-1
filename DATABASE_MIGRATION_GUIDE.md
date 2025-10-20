# 🗄️ Database Migration Guide: Docker → Vercel

## Current Setup Analysis

**Local Docker Setup:**
- PostgreSQL 15+ running on port 5433
- Database: `icct-sas` (from env variables)
- Prisma ORM with PostgreSQL provider
- Connection pooling configured

## Recommended Cloud Database Options

### 1. **Vercel Postgres** (Recommended - Easiest)
```bash
# Pros:
- Native Vercel integration
- Automatic environment variables
- Built-in connection pooling
- Free tier: 1 database, 1GB storage
- Easy scaling

# Setup:
1. Go to Vercel Dashboard → Storage → Create Database
2. Choose "Postgres"
3. Environment variables auto-configured
```

### 2. **Supabase** (Free Tier Available)
```bash
# Pros:
- Free tier: 500MB database, 2GB bandwidth
- Built-in authentication
- Real-time subscriptions
- Dashboard and admin interface
- PostgreSQL compatible

# Setup:
1. Sign up at supabase.com
2. Create new project
3. Get connection string from Settings → Database
```

### 3. **Neon** (PostgreSQL Serverless)
```bash
# Pros:
- Serverless PostgreSQL
- Free tier: 3GB storage
- Branching (database versioning)
- Auto-scaling
- Great for development

# Setup:
1. Sign up at neon.tech
2. Create database
3. Get connection string
```

## Migration Steps

### Step 1: Export Current Data
```bash
# Export your current database
docker exec icct-sas-db pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > backup.sql

# Or use Prisma to export
npx prisma db pull
npx prisma generate
```

### Step 2: Set Up Cloud Database

#### Option A: Vercel Postgres
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Create Postgres database
vercel storage create postgres

# 4. Get connection string
vercel env pull .env.local
```

#### Option B: Supabase
```bash
# 1. Create project at supabase.com
# 2. Go to Settings → Database
# 3. Copy connection string
# 4. Add to Vercel environment variables
```

### Step 3: Update Environment Variables

#### For Vercel Postgres:
```bash
# These are auto-provided by Vercel
DATABASE_URL="postgresql://..."  # Auto-generated
POSTGRES_URL="postgresql://..."  # Auto-generated
POSTGRES_PRISMA_URL="postgresql://..."  # Auto-generated
```

#### For Supabase/Neon:
```bash
# Add to Vercel dashboard
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Step 4: Run Migrations
```bash
# Deploy to Vercel first, then run:
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## Database Schema Migration

### Current Prisma Schema
Your current schema is already PostgreSQL-compatible, so no changes needed.

### Migration Commands
```bash
# 1. Pull current schema (if needed)
npx prisma db pull

# 2. Create migration
npx prisma migrate dev --name "initial-migration"

# 3. Deploy to production
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate
```

## Redis Migration (If Using)

### Current Setup
- Redis running in Docker
- Used for caching and sessions

### Cloud Options

#### 1. **Upstash Redis** (Recommended for Vercel)
```bash
# Pros:
- Serverless Redis
- Vercel integration
- Free tier: 10,000 requests/day
- Auto-scaling

# Setup:
1. Go to Vercel Dashboard → Storage → Create Database
2. Choose "Redis"
3. Environment variables auto-configured
```

#### 2. **Redis Cloud**
```bash
# Setup:
1. Sign up at redis.com
2. Create database
3. Get connection string
4. Add to Vercel environment variables
```

## MQTT Migration (For RFID)

### Current Setup
- Mosquitto MQTT broker in Docker
- Used for RFID tag communication

### Cloud Options

#### 1. **CloudMQTT**
```bash
# Setup:
1. Sign up at cloudmqtt.com
2. Create instance
3. Get connection details
4. Add to Vercel environment variables
```

#### 2. **HiveMQ Cloud**
```bash
# Setup:
1. Sign up at hivemq.com
2. Create cluster
3. Get connection string
4. Add to Vercel environment variables
```

## Complete Environment Variables for Vercel

```bash
# Database (choose one)
DATABASE_URL="postgresql://..."  # Vercel Postgres auto-provided
# OR
DATABASE_URL="postgresql://username:password@host:port/database"  # Supabase/Neon

# Redis (if using)
REDIS_URL="redis://..."  # Upstash Redis auto-provided
# OR
REDIS_URL="redis://username:password@host:port"  # Redis Cloud

# MQTT (for RFID)
MQTT_BROKER_URL="mqtt://username:password@host:port"
MQTT_USERNAME="your-mqtt-username"
MQTT_PASSWORD="your-mqtt-password"

# Security
JWT_SECRET="your-jwt-secret"
SESSION_SECRET="your-session-secret"
COOKIE_SECRET="your-cookie-secret"
CSRF_SECRET="your-csrf-secret"

# App
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

## Migration Checklist

### Pre-Migration
- [ ] Export current database data
- [ ] Document current environment variables
- [ ] Test current application functionality
- [ ] Create backup of Docker setup

### During Migration
- [ ] Set up cloud database service
- [ ] Configure environment variables in Vercel
- [ ] Run database migrations
- [ ] Test database connectivity
- [ ] Deploy to Vercel
- [ ] Verify all functionality works

### Post-Migration
- [ ] Monitor database performance
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Update documentation
- [ ] Keep Docker setup for local development

## Cost Comparison

### Free Tiers Available:
- **Vercel Postgres**: 1 database, 1GB storage
- **Supabase**: 500MB database, 2GB bandwidth
- **Neon**: 3GB storage, 10GB transfer
- **Upstash Redis**: 10,000 requests/day

### Recommended Setup for Production:
- **Database**: Vercel Postgres (easiest) or Supabase (more features)
- **Redis**: Upstash Redis (Vercel integration)
- **MQTT**: CloudMQTT (reliable, good pricing)

## Local Development

Keep your Docker setup for local development:

```bash
# Start local services
docker-compose up -d

# Use local environment
cp .env.template .env.local
# Update DATABASE_URL to point to local Docker
DATABASE_URL="postgresql://username:password@localhost:5433/icct-sas"
```

This way you can develop locally with Docker and deploy to Vercel with cloud services.
