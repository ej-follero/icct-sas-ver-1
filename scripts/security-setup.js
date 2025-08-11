#!/usr/bin/env node

/**
 * Security Setup Script
 * Helps set up secure environment variables and validates security configuration
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔒 ICCT Smart Attendance System - Security Setup\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envTemplatePath = path.join(process.cwd(), 'env.template');

if (!fs.existsSync(envTemplatePath)) {
  console.error('❌ env.template file not found!');
  process.exit(1);
}

// Generate secure random secret
function generateSecret(length = 32) {
  return crypto.randomBytes(Math.ceil(length * 3 / 4)).toString('base64').slice(0, length);
}

// Read template
let envTemplate = fs.readFileSync(envTemplatePath, 'utf8');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists.');
  console.log('   The setup will show you what needs to be updated.\n');
  
  const existingEnv = fs.readFileSync(envPath, 'utf8');
  
  // Check for insecure values
  const insecurePatterns = [
    'your-secret-key',
    'your-super-secret-jwt-key-here',
    'your-session-secret-key',
    'your-cookie-secret-key',
    'your-csrf-secret-key',
    'CHANGE-THIS',
    'change-me',
    'test-secret',
    'default'
  ];
  
  const vulnerabilities = [];
  
  insecurePatterns.forEach(pattern => {
    if (existingEnv.toLowerCase().includes(pattern.toLowerCase())) {
      vulnerabilities.push(pattern);
    }
  });
  
  if (vulnerabilities.length > 0) {
    console.log('🚨 SECURITY VULNERABILITIES FOUND:');
    vulnerabilities.forEach(vuln => {
      console.log(`   - Found insecure value: "${vuln}"`);
    });
    console.log('\n   These MUST be changed before deploying to production!\n');
  }
  
} else {
  console.log('📁 Creating .env file from template...\n');
}

// Generate new secrets
const secrets = {
  JWT_SECRET: generateSecret(32),
  SESSION_SECRET: generateSecret(32),
  CSRF_SECRET: generateSecret(32),
  COOKIE_SECRET: generateSecret(32)
};

console.log('🔑 Generated secure secrets:');
console.log('   (Copy these to your .env file)\n');

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}="${value}"`);
});

console.log('\n📋 Security Configuration Checklist:\n');

const checklist = [
  {
    item: 'Database URL configured',
    var: 'DATABASE_URL',
    check: 'Should point to your PostgreSQL database'
  },
  {
    item: 'JWT secret is secure',
    var: 'JWT_SECRET',
    check: 'Must be at least 32 characters, randomly generated'
  },
  {
    item: 'Session secret is secure',
    var: 'SESSION_SECRET',
    check: 'Must be at least 32 characters, randomly generated'
  },
  {
    item: 'CSRF secret is secure',
    var: 'CSRF_SECRET',
    check: 'Must be at least 32 characters, randomly generated'
  },
  {
    item: 'Cookie secret is secure',
    var: 'COOKIE_SECRET',
    check: 'Must be at least 32 characters, randomly generated'
  },
  {
    item: 'Secure cookies enabled (production)',
    var: 'SECURE_COOKIES',
    check: 'Should be "true" in production'
  },
  {
    item: 'HTTPS required (production)',
    var: 'REQUIRE_HTTPS',
    check: 'Should be "true" in production'
  },
  {
    item: 'Rate limiting configured',
    var: 'RATE_LIMIT_MAX_REQUESTS',
    check: 'Adjust based on your needs (default: 100)'
  }
];

checklist.forEach((item, index) => {
  console.log(`   ${index + 1}. ☐ ${item.item}`);
  console.log(`      Variable: ${item.var}`);
  console.log(`      Check: ${item.check}\n`);
});

console.log('🛠️  Setup Steps:\n');

if (!fs.existsSync(envPath)) {
  console.log('   1. Copy env.template to .env:');
  console.log('      cp env.template .env\n');
}

console.log('   2. Update your .env file with the generated secrets above\n');

console.log('   3. Configure your database URL:\n');
console.log('      DATABASE_URL="postgresql://username:password@localhost:5432/icct_attendance"\n');

console.log('   4. For production deployment, also set:\n');
console.log('      NODE_ENV="production"');
console.log('      SECURE_COOKIES="true"');
console.log('      REQUIRE_HTTPS="true"\n');

console.log('   5. Test the configuration:');
console.log('      npm run dev\n');

console.log('   6. Verify security headers:');
console.log('      curl -I http://localhost:3000\n');

console.log('🔍 Security Validation:\n');

console.log('   After setup, the application will automatically:');
console.log('   • Validate all environment variables on startup');
console.log('   • Check secret strength and uniqueness');
console.log('   • Warn about development-like values in production');
console.log('   • Enforce HTTPS and secure cookies in production\n');

console.log('⚠️  Important Security Notes:\n');

console.log('   • NEVER commit .env file to version control');
console.log('   • Rotate secrets every 90 days');
console.log('   • Use different secrets for each environment');
console.log('   • Monitor security logs for suspicious activity');
console.log('   • Keep dependencies updated\n');

console.log('📚 Documentation:\n');

console.log('   • Security Implementation Guide: docs/SECURITY_IMPLEMENTATION_GUIDE.md');
console.log('   • API Documentation: docs/SECURITY_API_DOCUMENTATION.md');
console.log('   • Developer Reference: docs/SECURITY_DEVELOPER_QUICK_REFERENCE.md\n');

console.log('✅ Security setup guidance complete!');
console.log('   Follow the steps above to secure your application.\n');
