#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ICCT Smart Attendance System - Database Connectivity Check\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

console.log('📁 Environment Configuration:');
if (envExists) {
  console.log('✅ .env file found');
  
  // Read and check DATABASE_URL
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
  
  if (dbUrlMatch) {
    const dbUrl = dbUrlMatch[1];
    console.log('✅ DATABASE_URL found');
    
    // Check if it's the correct format for our docker setup
    if (dbUrl.includes('localhost:5433')) {
      console.log('✅ DATABASE_URL points to correct port (5433)');
    } else if (dbUrl.includes('localhost:5432')) {
      console.log('⚠️  DATABASE_URL points to port 5432, should be 5433 for docker setup');
    } else {
      console.log('ℹ️  DATABASE_URL format:', dbUrl.substring(0, 50) + '...');
    }
  } else {
    console.log('❌ DATABASE_URL not found in .env file');
  }
} else {
  console.log('❌ .env file not found');
  console.log('📝 Creating .env file with default database configuration...');
  
  const defaultEnvContent = `# Database Configuration
DATABASE_URL="postgresql://admin:admin123@localhost:5433/icct-sas"

# Next.js Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application Configuration
NODE_ENV="development"
`;
  
  fs.writeFileSync(envPath, defaultEnvContent);
  console.log('✅ .env file created with default configuration');
}

// Check if Docker is running
console.log('\n🐳 Docker Status:');
try {
  const dockerInfo = execSync('docker info', { encoding: 'utf8' });
  console.log('✅ Docker is running');
} catch (error) {
  console.log('❌ Docker is not running or not accessible');
  console.log('💡 Please start Docker Desktop and try again');
  process.exit(1);
}

// Check if the database container is running
console.log('\n🗄️  Database Container Status:');
try {
  const containerStatus = execSync('docker ps --filter "name=icct-sas-db" --format "table {{.Names}}\t{{.Status}}"', { encoding: 'utf8' });
  
  if (containerStatus.includes('icct-sas-db')) {
    console.log('✅ Database container is running');
    
    // Check container health
    const healthStatus = execSync('docker inspect icct-sas-db --format "{{.State.Health.Status}}"', { encoding: 'utf8' }).trim();
    if (healthStatus === 'healthy') {
      console.log('✅ Database container is healthy');
    } else {
      console.log(`⚠️  Database container health status: ${healthStatus}`);
    }
  } else {
    console.log('❌ Database container is not running');
    console.log('💡 Starting database container...');
    
    try {
      execSync('docker-compose up -d postgres', { stdio: 'inherit' });
      console.log('✅ Database container started');
      
      // Wait a moment for the container to be ready
      console.log('⏳ Waiting for database to be ready...');
      setTimeout(() => {
        console.log('✅ Database should be ready now');
      }, 5000);
    } catch (startError) {
      console.log('❌ Failed to start database container');
      console.log('💡 Please run: docker-compose up -d postgres');
    }
  }
} catch (error) {
  console.log('❌ Error checking container status');
}

// Test database connection
console.log('\n🔌 Database Connection Test:');
try {
  // Load environment variables
  dotenv.config();
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set in environment');
    console.log('💡 Please check your .env file');
  } else {
    console.log('✅ DATABASE_URL is set');
    
          // Test connection using Prisma
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
      
      console.log('🔄 Testing database connection...');
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database query test successful');
      
      // Check if tables exist
      try {
        const courseCount = await prisma.courseOffering.count();
        console.log(`✅ CourseOffering table accessible (${courseCount} records)`);
      } catch (tableError) {
        console.log('❌ CourseOffering table not accessible');
        console.log('💡 Database might need to be migrated');
      }
      
      await prisma.$disconnect();
    } catch (prismaError) {
      console.log('❌ Database connection failed');
      console.log('Error:', prismaError.message);
      
      if (prismaError.message.includes('connect')) {
        console.log('💡 Possible solutions:');
        console.log('   1. Make sure Docker is running');
        console.log('   2. Start the database: docker-compose up -d postgres');
        console.log('   3. Check if port 5433 is available');
        console.log('   4. Verify DATABASE_URL in .env file');
      }
    }
  }
} catch (error) {
  console.log('❌ Error during connection test:', error.message);
}

// Check if Prisma migrations are needed
console.log('\n🔄 Database Migration Status:');
try {
  const migrationStatus = execSync('npx prisma migrate status', { encoding: 'utf8' });
  console.log('✅ Prisma migrations are up to date');
} catch (error) {
  console.log('⚠️  Prisma migrations might be needed');
  console.log('💡 Run: npx prisma migrate dev');
}

console.log('\n📋 Summary:');
console.log('If you see any ❌ errors above, please:');
console.log('1. Make sure Docker Desktop is running');
console.log('2. Run: docker-compose up -d postgres');
console.log('3. Check your .env file has the correct DATABASE_URL');
console.log('4. Run: npx prisma migrate dev (if needed)');
console.log('5. Restart your development server: npm run dev');

console.log('\n🔗 Useful Commands:');
console.log('  Start database: docker-compose up -d postgres');
console.log('  Stop database:  docker-compose down');
console.log('  View logs:      docker-compose logs postgres');
console.log('  Reset database: docker-compose down -v && docker-compose up -d postgres');
console.log('  Run migrations: npx prisma migrate dev');
console.log('  Generate client: npx prisma generate'); 