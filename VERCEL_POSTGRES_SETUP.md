# 🚀 Vercel Postgres Setup Guide

## Step-by-Step Migration to Vercel Postgres

### 1. Create Vercel Postgres Database

#### Via Vercel Dashboard:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Choose **Postgres**
6. Select region (recommend: `iad1` for US East)
7. Click **Create**

#### Via Vercel CLI:
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel storage create postgres
```

### 2. Environment Variables (Auto-Configured)

Vercel will automatically provide these environment variables:
```bash
# Auto-provided by Vercel Postgres
DATABASE_URL="postgresql://..."
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
```

### 3. Export Your Current Docker Data

```bash
# Export your current database
docker exec icct-sas-db pg_dump -U admin -d icct-sas > database-backup.sql

# Verify the backup
dir database-backup.sql
```

### 4. Deploy to Vercel

```bash
# Deploy your application
vercel --prod

# Or use the deployment script
npm run deploy:vercel
```

### 5. Run Database Migrations

After deployment, run migrations on Vercel:
```bash
# Connect to your Vercel project
vercel env pull .env.local

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 6. Import Your Data (Optional)

If you have important data to migrate:
```bash
# Connect to Vercel Postgres and import
psql $DATABASE_URL < database-backup.sql
```

## Vercel Postgres Features

### ✅ **Advantages:**
- **Native Integration**: Seamless with Vercel deployments
- **Auto-scaling**: Handles traffic spikes automatically
- **Connection Pooling**: Built-in connection management
- **Backups**: Automatic daily backups
- **Monitoring**: Built-in performance monitoring
- **Free Tier**: 1 database, 1GB storage, 1GB bandwidth

### 📊 **Pricing:**
- **Free**: 1 database, 1GB storage, 1GB bandwidth
- **Pro**: $20/month per database, 8GB storage, 100GB bandwidth
- **Team**: $20/month per database, 8GB storage, 100GB bandwidth

## Environment Variables Checklist

### Required (Auto-provided by Vercel):
- ✅ `DATABASE_URL`
- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL`
- ✅ `POSTGRES_URL_NON_POOLING`

### Additional Required Variables:
```bash
# Security (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-here"
SESSION_SECRET="your-session-secret-here"
COOKIE_SECRET="your-cookie-secret-here"
CSRF_SECRET="your-csrf-secret-here"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"

# Redis (if using)
REDIS_URL="redis://..."  # Set up Upstash Redis

# MQTT (for RFID)
MQTT_BROKER_URL="mqtt://username:password@host:port"
MQTT_USERNAME="your-mqtt-username"
MQTT_PASSWORD="your-mqtt-password"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@icct.edu.ph"
```

## Migration Commands

### 1. Export Current Data:
```bash
docker exec icct-sas-db pg_dump -U admin -d icct-sas > database-backup.sql
```

### 2. Create Vercel Postgres:
```bash
vercel storage create postgres
```

### 3. Deploy Application:
```bash
vercel --prod
```

### 4. Run Migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Import Data (if needed):
```bash
psql $DATABASE_URL < database-backup.sql
```

## Post-Migration Checklist

- [ ] Vercel Postgres database created
- [ ] Environment variables configured
- [ ] Application deployed to Vercel
- [ ] Database migrations run successfully
- [ ] Data imported (if applicable)
- [ ] Application tested on Vercel
- [ ] Performance monitoring enabled
- [ ] Backups configured
- [ ] Local development still works with Docker

## Local Development

Keep your Docker setup for local development:

```bash
# Start local services
docker-compose up -d

# Use local database
DATABASE_URL="postgresql://admin:admin123@localhost:5433/icct-sas"
```

## Troubleshooting

### Common Issues:

1. **Connection Issues**: Check environment variables in Vercel dashboard
2. **Migration Failures**: Ensure Prisma schema is up to date
3. **Data Import Issues**: Check data format and permissions
4. **Performance Issues**: Monitor Vercel Postgres metrics

### Support:
- Vercel Documentation: https://vercel.com/docs/storage/vercel-postgres
- Vercel Support: https://vercel.com/support
