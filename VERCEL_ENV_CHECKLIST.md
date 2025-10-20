# 🚀 Vercel Environment Variables Checklist

## Required Environment Variables for Production

### 1. Database Configuration
```bash
# Primary Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# Alternative: Use Vercel Postgres (recommended)
# DATABASE_URL will be auto-provided by Vercel Postgres addon
```

### 2. Authentication & Security
```bash
# JWT Secret (Required) - Generate with: openssl rand -base64 32
JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Session Security (Required)
SESSION_SECRET="your-session-secret-key-here"
COOKIE_SECRET="your-cookie-secret-key-here"
CSRF_SECRET="your-csrf-secret-key-here"

# Security Settings
SECURE_COOKIES="true"
REQUIRE_HTTPS="true"
```

### 3. Application Configuration
```bash
# App URL (Required)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### 4. Redis Configuration (Recommended)
```bash
# Upstash Redis (Recommended for Vercel)
REDIS_URL="redis://username:password@host:port"
# OR
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"
```

### 5. MQTT Configuration (For RFID)
```bash
# CloudMQTT or similar service
MQTT_BROKER_URL="mqtt://username:password@host:port"
MQTT_USERNAME="your-mqtt-username"
MQTT_PASSWORD="your-mqtt-password"
```

### 6. Email Configuration
```bash
# SMTP Settings
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@icct.edu.ph"
```

### 7. File Upload Configuration
```bash
# File Upload Limits
MAX_FILE_SIZE="10485760"  # 10MB
UPLOAD_PATH="./public/uploads"
```

### 8. Rate Limiting
```bash
# Rate Limiting Settings
RATE_LIMIT_WINDOW="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"
```

### 9. Monitoring & Logging
```bash
# Logging
LOG_LEVEL="info"
ENABLE_MONITORING="true"
METRICS_ENDPOINT="/api/metrics"
```

### 10. Backup Configuration
```bash
# Backup Settings
BACKUP_ENABLED="true"
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS="30"
```

## Quick Setup Commands

### Generate Secure Secrets:
```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret
openssl rand -base64 32

# Generate Cookie Secret
openssl rand -base64 32

# Generate CSRF Secret
openssl rand -base64 32
```

## Vercel CLI Commands

### Set Environment Variables:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add SESSION_SECRET
vercel env add COOKIE_SECRET
vercel env add CSRF_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel env add REDIS_URL
vercel env add MQTT_BROKER_URL
vercel env add SMTP_HOST
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add SMTP_FROM
```

### Deploy:
```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## Recommended Services

### Database:
- **Vercel Postgres** (easiest integration)
- **Supabase** (free tier available)
- **Neon** (PostgreSQL)

### Redis:
- **Upstash Redis** (recommended for Vercel)
- **Redis Cloud**

### MQTT:
- **CloudMQTT**
- **HiveMQ Cloud**
- **AWS IoT Core**

## Pre-Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] Database migrations run
- [ ] Redis connection tested
- [ ] MQTT broker configured
- [ ] Email SMTP settings verified
- [ ] File upload paths configured
- [ ] Security secrets generated
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Backup schedule set

## Post-Deployment Testing

- [ ] Database connection works
- [ ] Authentication flows
- [ ] File uploads
- [ ] Email notifications
- [ ] MQTT connectivity
- [ ] API endpoints
- [ ] Performance monitoring
- [ ] Security headers
- [ ] Rate limiting
