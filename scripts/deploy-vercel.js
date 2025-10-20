#!/usr/bin/env node

/**
 * Vercel Deployment Script for ICCT Smart Attendance System
 * 
 * This script automates the deployment process to Vercel with proper
 * environment variable validation and pre-deployment checks.
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
    process.exit(1);
  }
}

function checkPrerequisites() {
  log(`${colors.bright}${colors.blue}🔍 Checking prerequisites...${colors.reset}`);
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    log(`${colors.green}✅ Vercel CLI is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Vercel CLI not found. Install with: npm i -g vercel${colors.reset}`);
    process.exit(1);
  }

  // Check if .env.local exists
  if (!fs.existsSync('.env.local')) {
    log(`${colors.yellow}⚠️  .env.local not found. Make sure to set environment variables in Vercel dashboard${colors.reset}`);
  } else {
    log(`${colors.green}✅ .env.local found${colors.reset}`);
  }

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log(`${colors.red}❌ package.json not found${colors.reset}`);
    process.exit(1);
  }

  log(`${colors.green}✅ All prerequisites met${colors.reset}`);
}

function validateEnvironment() {
  log(`${colors.bright}${colors.blue}🔧 Validating environment variables...${colors.reset}`);
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'COOKIE_SECRET',
    'CSRF_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missingVars = [];
  
  // Check if .env.local exists and read it
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    
    requiredEnvVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    });
  } else {
    log(`${colors.yellow}⚠️  .env.local not found. Make sure to set these variables in Vercel dashboard:${colors.reset}`);
    requiredEnvVars.forEach(varName => {
      log(`${colors.yellow}   - ${varName}${colors.reset}`);
    });
  }

  if (missingVars.length > 0) {
    log(`${colors.red}❌ Missing required environment variables:${colors.reset}`);
    missingVars.forEach(varName => {
      log(`${colors.red}   - ${varName}${colors.reset}`);
    });
    log(`${colors.yellow}💡 Set these in Vercel dashboard or .env.local${colors.reset}`);
  } else {
    log(`${colors.green}✅ All required environment variables found${colors.reset}`);
  }
}

function runPreDeploymentChecks() {
  log(`${colors.bright}${colors.blue}🧪 Running pre-deployment checks...${colors.reset}`);
  
  // Run linting
  execCommand('npm run lint', 'Running ESLint');
  
  // Run type checking
  execCommand('npx tsc --noEmit', 'Running TypeScript type checking');
  
  // Run build test
  execCommand('npm run build', 'Testing production build');
  
  log(`${colors.green}✅ All pre-deployment checks passed${colors.reset}`);
}

function deployToVercel() {
  log(`${colors.bright}${colors.blue}🚀 Deploying to Vercel...${colors.reset}`);
  
  // Check if already logged in to Vercel
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    log(`${colors.green}✅ Already logged in to Vercel${colors.reset}`);
  } catch (error) {
    log(`${colors.yellow}🔐 Please log in to Vercel...${colors.reset}`);
    execCommand('vercel login', 'Logging in to Vercel');
  }

  // Deploy to production
  execCommand('vercel --prod', 'Deploying to production');
  
  log(`${colors.green}🎉 Deployment completed successfully!${colors.reset}`);
}

function postDeploymentTasks() {
  log(`${colors.bright}${colors.blue}📋 Post-deployment tasks...${colors.reset}`);
  
  log(`${colors.yellow}📝 Next steps:${colors.reset}`);
  log(`${colors.cyan}   1. Check your deployment URL${colors.reset}`);
  log(`${colors.cyan}   2. Run database migrations if needed${colors.reset}`);
  log(`${colors.cyan}   3. Test all functionality${colors.reset}`);
  log(`${colors.cyan}   4. Set up monitoring and alerts${colors.reset}`);
  log(`${colors.cyan}   5. Configure custom domain if needed${colors.reset}`);
  
  log(`${colors.green}✅ Post-deployment checklist provided${colors.reset}`);
}

// Main execution
function main() {
  log(`${colors.bright}${colors.magenta}🚀 ICCT Smart Attendance System - Vercel Deployment${colors.reset}`);
  log(`${colors.cyan}================================================${colors.reset}`);
  
  try {
    checkPrerequisites();
    validateEnvironment();
    runPreDeploymentChecks();
    deployToVercel();
    postDeploymentTasks();
    
    log(`${colors.bright}${colors.green}🎉 Deployment process completed successfully!${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Deployment failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  validateEnvironment,
  runPreDeploymentChecks,
  deployToVercel,
  postDeploymentTasks
};
