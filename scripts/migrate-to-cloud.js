#!/usr/bin/env node

/**
 * Database Migration Script: Docker → Cloud Services
 * 
 * This script helps migrate from local Docker PostgreSQL to cloud services
 * for Vercel deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n${colors.cyan}🔄 ${description}...${colors.reset}`);
    const result = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    log(`${colors.green}✅ ${description} completed${colors.reset}`);
    return result;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed: ${error.message}${colors.reset}`);
    throw error;
  }
}

function checkDockerStatus() {
  log(`${colors.bright}${colors.blue}🐳 Checking Docker status...${colors.reset}`);
  
  try {
    execSync('docker ps', { stdio: 'pipe' });
    log(`${colors.green}✅ Docker is running${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Docker is not running. Please start Docker first.${colors.reset}`);
    process.exit(1);
  }

  // Check if PostgreSQL container is running
  try {
    const result = execSync('docker ps --filter "name=icct-sas-db" --format "{{.Names}}"', { encoding: 'utf8' });
    if (result.trim() === 'icct-sas-db') {
      log(`${colors.green}✅ PostgreSQL container is running${colors.reset}`);
    } else {
      log(`${colors.yellow}⚠️  PostgreSQL container not found. Starting Docker services...${colors.reset}`);
      execCommand('docker-compose up -d', 'Starting Docker services');
    }
  } catch (error) {
    log(`${colors.yellow}⚠️  Starting Docker services...${colors.reset}`);
    execCommand('docker-compose up -d', 'Starting Docker services');
  }
}

function exportDatabase() {
  log(`${colors.bright}${colors.blue}📤 Exporting database...${colors.reset}`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup-${timestamp}.sql`;
  
  try {
    // Read environment variables
    const envContent = fs.readFileSync('.env', 'utf8');
    const postgresUser = envContent.match(/POSTGRES_USER=(.+)/)?.[1] || 'postgres';
    const postgresDb = envContent.match(/POSTGRES_DB=(.+)/)?.[1] || 'icct-sas';
    
    log(`${colors.cyan}📋 Using database: ${postgresDb}, user: ${postgresUser}${colors.reset}`);
    
    // Export database
    execCommand(
      `docker exec icct-sas-db pg_dump -U ${postgresUser} -d ${postgresDb} > ${backupFile}`,
      'Exporting database to SQL file'
    );
    
    log(`${colors.green}✅ Database exported to ${backupFile}${colors.reset}`);
    return backupFile;
  } catch (error) {
    log(`${colors.red}❌ Database export failed: ${error.message}${colors.reset}`);
    throw error;
  }
}

function generateMigrationScript() {
  log(`${colors.bright}${colors.blue}📝 Generating migration script...${colors.reset}`);
  
  const migrationScript = `#!/bin/bash

# Database Migration Script
# Generated on ${new Date().toISOString()}

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
`;

  fs.writeFileSync('migrate-database.sh', migrationScript);
  log(`${colors.green}✅ Migration script created: migrate-database.sh${colors.reset}`);
}

function createEnvironmentTemplate() {
  log(`${colors.bright}${colors.blue}🔧 Creating environment template...${colors.reset}`);
  
  const envTemplate = `# Vercel Environment Variables Template
# Copy these to Vercel Dashboard → Settings → Environment Variables

# Database (choose one)
# For Vercel Postgres (auto-configured):
# DATABASE_URL - auto-provided by Vercel

# For Supabase/Neon:
DATABASE_URL="postgresql://username:password@host:port/database"

# Redis (if using)
# For Upstash Redis (auto-configured):
# REDIS_URL - auto-provided by Vercel

# For Redis Cloud:
REDIS_URL="redis://username:password@host:port"

# MQTT (for RFID)
MQTT_BROKER_URL="mqtt://username:password@host:port"
MQTT_USERNAME="your-mqtt-username"
MQTT_PASSWORD="your-mqtt-password"

# Security (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-here"
SESSION_SECRET="your-session-secret-here"
COOKIE_SECRET="your-cookie-secret-here"
CSRF_SECRET="your-csrf-secret-here"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@icct.edu.ph"

# File Upload
MAX_FILE_SIZE="10485760"
UPLOAD_PATH="./public/uploads"

# Rate Limiting
RATE_LIMIT_WINDOW="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Monitoring
LOG_LEVEL="info"
ENABLE_MONITORING="true"
METRICS_ENDPOINT="/api/metrics"

# Backup
BACKUP_ENABLED="true"
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS="30"
`;

  fs.writeFileSync('vercel-env-template.txt', envTemplate);
  log(`${colors.green}✅ Environment template created: vercel-env-template.txt${colors.reset}`);
}

function showNextSteps() {
  log(`${colors.bright}${colors.magenta}📋 Next Steps for Database Migration${colors.reset}`);
  log(`${colors.cyan}================================================${colors.reset}`);
  
  log(`${colors.yellow}1. Choose your cloud database provider:${colors.reset}`);
  log(`${colors.cyan}   • Vercel Postgres (easiest integration)${colors.reset}`);
  log(`${colors.cyan}   • Supabase (free tier, more features)${colors.reset}`);
  log(`${colors.cyan}   • Neon (serverless PostgreSQL)${colors.reset}`);
  
  log(`${colors.yellow}2. Set up Redis (if using):${colors.reset}`);
  log(`${colors.cyan}   • Upstash Redis (Vercel integration)${colors.reset}`);
  log(`${colors.cyan}   • Redis Cloud${colors.reset}`);
  
  log(`${colors.yellow}3. Set up MQTT (for RFID):${colors.reset}`);
  log(`${colors.cyan}   • CloudMQTT${colors.reset}`);
  log(`${colors.cyan}   • HiveMQ Cloud${colors.reset}`);
  
  log(`${colors.yellow}4. Configure environment variables in Vercel dashboard${colors.reset}`);
  
  log(`${colors.yellow}5. Run migrations:${colors.reset}`);
  log(`${colors.cyan}   npx prisma migrate deploy${colors.reset}`);
  
  log(`${colors.yellow}6. Deploy to Vercel:${colors.reset}`);
  log(`${colors.cyan}   npm run deploy:vercel${colors.reset}`);
  
  log(`${colors.green}✅ Migration preparation completed!${colors.reset}`);
}

// Main execution
function main() {
  log(`${colors.bright}${colors.magenta}🗄️  Database Migration: Docker → Cloud${colors.reset}`);
  log(`${colors.cyan}================================================${colors.reset}`);
  
  try {
    checkDockerStatus();
    const backupFile = exportDatabase();
    generateMigrationScript();
    createEnvironmentTemplate();
    showNextSteps();
    
    log(`${colors.bright}${colors.green}🎉 Migration preparation completed successfully!${colors.reset}`);
    log(`${colors.cyan}📁 Files created:${colors.reset}`);
    log(`${colors.cyan}   • ${backupFile} (database backup)${colors.reset}`);
    log(`${colors.cyan}   • migrate-database.sh (migration script)${colors.reset}`);
    log(`${colors.cyan}   • vercel-env-template.txt (environment template)${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Migration preparation failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkDockerStatus,
  exportDatabase,
  generateMigrationScript,
  createEnvironmentTemplate,
  showNextSteps
};
