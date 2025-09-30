const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.resolve('.env');
const templatePath = path.resolve('env.template');

function ensureEnv() {
  if (!fs.existsSync(envPath)) {
    if (!fs.existsSync(templatePath)) {
      throw new Error('env.template not found and .env missing');
    }
    fs.copyFileSync(templatePath, envPath);
  }
}

function rotateJwtSecret() {
  ensureEnv();
  const envContent = fs.readFileSync(envPath, 'utf8');
  const newSecret = crypto.randomBytes(48).toString('base64');
  const updated = envContent.replace(/^[ \t]*JWT_SECRET=.*$/m, `JWT_SECRET=${newSecret}`);
  fs.writeFileSync(envPath, updated, 'utf8');
  return newSecret;
}

try {
  const secret = rotateJwtSecret();
  console.log('JWT_SECRET updated.');
} catch (e) {
  console.error('Failed to rotate JWT secret:', e.message);
  process.exit(1);
}
