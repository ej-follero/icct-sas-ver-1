#!/usr/bin/env node

/**
 * Setup JWT_SECRET for authentication
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function setupJwtSecret() {
  console.log('🔐 Setting up JWT_SECRET for authentication...\n');

  // Generate a secure JWT secret
  const jwtSecret = crypto.randomBytes(32).toString('base64');
  console.log('✅ Generated secure JWT_SECRET');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envTemplatePath = path.join(process.cwd(), 'env.template');

  let envContent = '';

  if (fs.existsSync(envPath)) {
    console.log('📄 Found existing .env file');
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envTemplatePath)) {
    console.log('📄 Using env.template as base');
    envContent = fs.readFileSync(envTemplatePath, 'utf8');
  } else {
    console.log('📄 Creating new .env file');
    envContent = '# ICCT Smart Attendance System Environment Variables\n';
  }

  // Update or add JWT_SECRET
  if (envContent.includes('JWT_SECRET=')) {
    console.log('🔄 Updating existing JWT_SECRET');
    envContent = envContent.replace(
      /JWT_SECRET=".*"/,
      `JWT_SECRET="${jwtSecret}"`
    );
  } else {
    console.log('➕ Adding JWT_SECRET to .env file');
    envContent += `\n# JWT Configuration\nJWT_SECRET="${jwtSecret}"\n`;
  }

  // Write the updated .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ JWT_SECRET added to .env file');

  // Set environment variable for current session
  process.env.JWT_SECRET = jwtSecret;
  console.log('✅ JWT_SECRET set for current session');

  console.log('\n🎯 JWT Setup Complete!');
  console.log('   - JWT_SECRET generated and saved');
  console.log('   - Authentication should now work');
  console.log('   - Restart your development server to apply changes');
  
  console.log('\n💡 Next steps:');
  console.log('   1. Restart your Next.js development server');
  console.log('   2. Try uploading an avatar again');
  console.log('   3. Check browser console for any remaining errors');
}

setupJwtSecret().catch(console.error);
