#!/usr/bin/env node

/**
 * Redis Configuration Setup Script
 * Updates environment configuration for Redis caching
 */

const fs = require('fs');
const path = require('path');

console.log('🔴 Setting up Redis Configuration...\n');

// Redis configuration to add to .env
const redisConfig = `
# Redis Configuration (for caching and sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# Performance Configuration
CACHE_TTL_DEFAULT=1800
CACHE_TTL_SHORT=300
CACHE_TTL_LONG=3600
PERFORMANCE_MONITORING=true

# Security Configuration
SECURITY_ENABLED=true
SECURITY_AUDIT_ENABLED=true
RATE_LIMITING_ENABLED=true
ACCESS_CONTROL_ENABLED=true
ROLE_BASED_ACCESS_ENABLED=true
`;

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  
  // Read existing .env content
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if Redis config already exists
  if (envContent.includes('REDIS_HOST')) {
    console.log('✅ Redis configuration already exists in .env');
  } else {
    // Add Redis configuration
    envContent += redisConfig;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Redis configuration added to .env');
  }
} else {
  console.log('⚠️  .env file not found');
  
  // Create .env.example with Redis config
  const envExampleContent = `# Copy this file to .env and update the values

# Database Configuration
DATABASE_URL="postgresql://admin:admin123@localhost:5433/icct-sas"

# JWT Configuration
JWT_SECRET="PLACEHOLDER_JWT_SECRET_CHANGE_IN_PRODUCTION"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Email Configuration (SMTP) - PLACEHOLDER VALUES ONLY
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="PLACEHOLDER_EMAIL_USERNAME"
SMTP_PASS="PLACEHOLDER_EMAIL_PASSWORD"
SMTP_FROM="noreply@icct.edu.ph"
${redisConfig}

# Security Configuration - PLACEHOLDER VALUES FOR DEVELOPMENT ONLY
SESSION_SECRET="PLACEHOLDER_SESSION_SECRET_DEVELOPMENT_ONLY"
COOKIE_SECRET="PLACEHOLDER_COOKIE_SECRET_DEVELOPMENT_ONLY"
CSRF_SECRET="PLACEHOLDER_CSRF_SECRET_DEVELOPMENT_ONLY"

# Rate Limiting
RATE_LIMIT_WINDOW="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Logging Configuration
LOG_LEVEL="info"

# Monitoring Configuration
ENABLE_MONITORING="true"

# Backup Configuration
BACKUP_ENABLED="true"
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS="30"

# Notification Configuration
NOTIFICATION_QUEUE_SIZE="1000"
NOTIFICATION_RATE_LIMIT="100"
ENABLE_EMAIL_NOTIFICATIONS="true"

# Development Configuration
ENABLE_DEBUG_MODE="false"
ENABLE_FAKE_DATA="false"
ENABLE_MOCK_SERVICES="false"
`;

  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✅ Created .env.example with Redis configuration');
  console.log('💡 Copy .env.example to .env and update the values');
}

// Test Redis connection
console.log('\n🧪 Testing Redis Connection...');

const { execSync } = require('child_process');

try {
  // Test Redis connection using Docker
  const result = execSync('docker exec icct-sas-redis redis-cli ping', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  if (result.trim() === 'PONG') {
    console.log('✅ Redis is running and accessible');
    console.log('✅ Redis connection test successful');
  } else {
    console.log('⚠️  Redis responded but with unexpected result:', result);
  }
} catch (error) {
  console.log('❌ Redis connection test failed:', error.message);
  console.log('💡 Make sure Redis container is running: docker ps');
}

// Create Redis test script
console.log('\n📝 Creating Redis test script...');

const testScript = `#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Tests Redis connection and basic operations
 */

const Redis = require('ioredis');

async function testRedis() {
  console.log('🔴 Testing Redis Connection...\\n');

  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  try {
    // Test connection
    console.log('Testing connection...');
    const pong = await redis.ping();
    console.log('✅ Connection successful:', pong);

    // Test set/get
    console.log('\\nTesting set/get operations...');
    await redis.set('test:key', 'Hello Redis!');
    const value = await redis.get('test:key');
    console.log('✅ Set/Get successful:', value);

    // Test expiration
    console.log('\\nTesting expiration...');
    await redis.setex('test:expire', 5, 'This will expire in 5 seconds');
    const beforeExpire = await redis.get('test:expire');
    console.log('✅ Before expire:', beforeExpire);

    // Test keys
    console.log('\\nTesting keys command...');
    const keys = await redis.keys('test:*');
    console.log('✅ Keys found:', keys);

    // Test info
    console.log('\\nTesting info command...');
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:([^\\r\\n]+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : 'Unknown';
    console.log('✅ Memory usage:', memoryUsage);

    // Cleanup
    await redis.del('test:key', 'test:expire');
    console.log('\\n✅ Cleanup completed');

    console.log('\\n🎉 Redis test completed successfully!');
    console.log('\\n📊 Redis is ready for caching operations');

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.log('\\n💡 Troubleshooting:');
    console.log('   1. Make sure Redis container is running: docker ps');
    console.log('   2. Check Redis logs: docker logs icct-sas-redis');
    console.log('   3. Verify port 6379 is accessible');
  } finally {
    await redis.quit();
  }
}

testRedis().catch(console.error);
`;

const testScriptPath = path.join(__dirname, 'test-redis-connection.js');
fs.writeFileSync(testScriptPath, testScript);
fs.chmodSync(testScriptPath, '755');
console.log('✅ Redis test script created at scripts/test-redis-connection.js');

// Update package.json with Redis test script
console.log('\n📋 Adding Redis test script to package.json...');
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['redis:test'] = 'node scripts/test-redis-connection.js';
  packageJson.scripts['redis:status'] = 'docker exec icct-sas-redis redis-cli ping';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Redis scripts added to package.json');
} catch (error) {
  console.log('⚠️  Could not update package.json');
}

console.log('\n🎉 Redis Configuration Complete!');
console.log('\n📋 What was configured:');
console.log('   ✅ Redis connection settings');
console.log('   ✅ Performance caching configuration');
console.log('   ✅ Security settings');
console.log('   ✅ Test script created');

console.log('\n🚀 Next steps:');
console.log('   1. Test Redis connection: npm run redis:test');
console.log('   2. Check Redis status: npm run redis:status');
console.log('   3. Test performance optimizations: npm run perf:test');

console.log('\n💡 Redis is now ready for caching!');
console.log('   • Performance improvements will be active');
console.log('   • API responses will be cached');
console.log('   • Database load will be reduced');
