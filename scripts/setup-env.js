const fs = require('fs');
const crypto = require('crypto');

// Generate secure random password
function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Create .env file with secure credentials
function createEnvFile() {
  const securePassword = generateSecurePassword();
  
  const envContent = `# Docker Compose Database Configuration
POSTGRES_USER=admin
POSTGRES_PASSWORD=${securePassword}
POSTGRES_DB=icct-sas

# Database URL for your application
DATABASE_URL=postgresql://admin:${securePassword}@localhost:5433/icct-sas

# JWT Configuration
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Security Configuration
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}
COOKIE_SECRET=${crypto.randomBytes(32).toString('hex')}
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created with secure credentials');
  console.log(`📝 Database password: ${securePassword}`);
  console.log('⚠️  Please save this password securely!');
  console.log('📋 Copy the DATABASE_URL to your application configuration');
}

// Check if .env already exists
if (fs.existsSync('.env')) {
  console.log('⚠️  .env file already exists. Do you want to overwrite it? (y/N)');
  process.stdin.once('data', (data) => {
    const input = data.toString().trim().toLowerCase();
    if (input === 'y' || input === 'yes') {
      createEnvFile();
    } else {
      console.log('❌ Operation cancelled');
    }
    process.exit(0);
  });
} else {
  createEnvFile();
}
