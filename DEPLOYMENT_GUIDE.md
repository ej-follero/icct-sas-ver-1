# 🚀 ICCT Smart Attendance System - Deployment Guide

## Docker + Vercel Deployment Setup

### 1. Local Docker Environment

Your current Docker setup includes:
- PostgreSQL database (port 5433)
- MQTT broker (port 1883)
- Redis (if added)

### 2. Environment Variables for Vercel

#### Required Environment Variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-app.vercel.app"

# Application
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"

# Redis (Upstash Redis recommended)
REDIS_URL="redis://username:password@host:port"
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"

# MQTT (for RFID)
MQTT_BROKER_URL="mqtt://your-mqtt-broker:1883"
MQTT_USERNAME="mqtt_user"
MQTT_PASSWORD="mqtt_password"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@icct.edu.ph"

# Security
SESSION_SECRET="your-session-secret"
COOKIE_SECRET="your-cookie-secret"
CSRF_SECRET="your-csrf-secret"
SECURE_COOKIES="true"
REQUIRE_HTTPS="true"
```

### 3. Recommended Services for Production

#### Database Options:
1. **Vercel Postgres** (easiest for Vercel)
2. **Supabase** (free tier available)
3. **Neon** (PostgreSQL)
4. **PlanetScale** (MySQL)

#### Redis Options:
1. **Upstash Redis** (recommended for Vercel)
2. **Redis Cloud**
3. **AWS ElastiCache**

#### MQTT Options:
1. **CloudMQTT**
2. **HiveMQ Cloud**
3. **AWS IoT Core**

### 4. Deployment Steps

1. **Set up external services** (database, Redis, MQTT)
2. **Configure environment variables** in Vercel
3. **Deploy to Vercel**
4. **Run database migrations**
5. **Test the deployment**

### 5. Local Development with Docker

Keep your current Docker setup for local development:

```bash
# Start local services
docker-compose up -d
docker-compose -f docker-mqtt.yml up -d

# Run the application
npm run dev
```

### 6. Production vs Development

- **Local**: Use Docker containers for database, Redis, MQTT
- **Production**: Use cloud services (Vercel Postgres, Upstash Redis, CloudMQTT)
