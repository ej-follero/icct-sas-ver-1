/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

const requiredEnvVars = {
  // Database
  DATABASE_URL: 'Database connection string is required',
  
  // Security
  JWT_SECRET: 'JWT secret key is required and must be at least 32 characters',
  SESSION_SECRET: 'Session secret key is required',
  COOKIE_SECRET: 'Cookie secret key is required',
  
  // Application
  NEXT_PUBLIC_APP_URL: 'Application URL is required',
  NODE_ENV: 'Node environment is required',
} as const;

const optionalEnvVars = {
  // Email
  SMTP_HOST: 'SMTP host for email functionality',
  SMTP_PORT: 'SMTP port for email functionality',
  SMTP_USER: 'SMTP user for email functionality',
  SMTP_PASS: 'SMTP password for email functionality',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 'Rate limit window in milliseconds',
  RATE_LIMIT_MAX_REQUESTS: 'Maximum requests per window',
  
  // Backup
  BACKUP_DIR: 'Backup directory path',
  BACKUP_ENABLED: 'Whether backup system is enabled',
  
  // Security
  SECURE_COOKIES: 'Whether to use secure cookies in production',
  REQUIRE_HTTPS: 'Whether to require HTTPS in production',
} as const;

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    
    if (!value) {
      errors.push(`${key}: ${description}`);
      continue;
    }

    // Special validation for JWT_SECRET
    if (key === 'JWT_SECRET') {
      if (value.length < 32) {
        errors.push(`${key}: Must be at least 32 characters long for security`);
      }
      if (value === 'your-secret-key' || value === 'your-super-secret-jwt-key-here') {
        errors.push(`${key}: Must not use default/example values in production`);
      }
    }

    // Special validation for NODE_ENV
    if (key === 'NODE_ENV') {
      const validEnvs = ['development', 'production', 'test'];
      if (!validEnvs.includes(value)) {
        errors.push(`${key}: Must be one of: ${validEnvs.join(', ')}`);
      }
    }

    // Special validation for DATABASE_URL
    if (key === 'DATABASE_URL') {
      if (!value.startsWith('postgresql://')) {
        errors.push(`${key}: Must be a valid PostgreSQL connection string`);
      }
    }
  }

  // Check optional environment variables and warn if missing
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    const value = process.env[key];
    
    if (!value) {
      warnings.push(`${key}: ${description} (optional but recommended)`);
    }
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // Ensure secure settings in production
    if (process.env.SECURE_COOKIES !== 'true') {
      warnings.push('SECURE_COOKIES: Should be set to "true" in production');
    }
    
    if (process.env.REQUIRE_HTTPS !== 'true') {
      warnings.push('REQUIRE_HTTPS: Should be set to "true" in production');
    }

    // Check for development-like values in production
    const suspiciousValues = [
      'localhost',
      '127.0.0.1',
      'test',
      'example',
      'your-',
      'change-me',
      'secret-key'
    ];

    for (const [key, value] of Object.entries(process.env)) {
      if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) {
        const lowerValue = value?.toLowerCase() || '';
        if (suspiciousValues.some(suspicious => lowerValue.includes(suspicious))) {
          errors.push(`${key}: Contains suspicious value that looks like a default/test value`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function ensureValidEnvironment(): void {
  // Skip validation during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('⏭️  Skipping environment validation during build phase');
    return;
  }

  const validation = validateEnvironment();
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment Warnings:');
    validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (!validation.isValid) {
    console.error('❌ Environment Validation Failed:');
    validation.errors.forEach(error => console.error(`   - ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Application cannot start with invalid configuration.');
    } else {
      console.error('\n💡 To fix these issues:');
      console.error('   1. Copy env.template to .env');
      console.error('   2. Fill in all required values');
      console.error('   3. Generate secure secrets using: openssl rand -base64 32');
      throw new Error('Environment validation failed. Please check your .env file.');
    }
  }

  console.log('✅ Environment validation passed');
}

// Utility function to generate secure random secrets
export function generateSecureSecret(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(Math.ceil(length * 3 / 4)).toString('base64').slice(0, length);
}

// Export environment variables with validation
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  SESSION_SECRET: process.env.SESSION_SECRET!,
  COOKIE_SECRET: process.env.COOKIE_SECRET!,
  CSRF_SECRET: process.env.CSRF_SECRET || process.env.SESSION_SECRET!,
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  
  // Optional with defaults
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  SECURE_COOKIES: process.env.SECURE_COOKIES === 'true' || process.env.NODE_ENV === 'production',
  REQUIRE_HTTPS: process.env.REQUIRE_HTTPS === 'true' || process.env.NODE_ENV === 'production',
} as const;
