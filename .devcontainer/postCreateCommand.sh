#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up ICCT Smart Attendance System in Codespaces...${NC}"

# Navigate to workspace
cd /workspaces/icct-smart-attendance-system

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Start Docker services
echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if PostgreSQL is ready
echo -e "${YELLOW}🔍 Checking PostgreSQL connection...${NC}"
until docker exec icct-sas-db pg_isready -U admin -d icct-sas; do
  echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
  sleep 2
done

# Check if Redis is ready
echo -e "${YELLOW}🔍 Checking Redis connection...${NC}"
until docker exec icct-sas-redis redis-cli ping; do
  echo -e "${YELLOW}⏳ Waiting for Redis...${NC}"
  sleep 2
done

# Run database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
npx prisma migrate deploy

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Seed the database (if needed)
echo -e "${YELLOW}🌱 Seeding database...${NC}"
npx prisma db seed

# Create .env file for Codespaces
echo -e "${YELLOW}📝 Creating environment configuration...${NC}"
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://admin:admin123@localhost:5432/icct-sas"

# Docker Compose Database Configuration
POSTGRES_USER="admin"
POSTGRES_PASSWORD="admin123"
POSTGRES_DB="icct-sas"

# JWT Configuration
JWT_SECRET="codespace-jwt-secret-key-for-development-only"

# Application Configuration
NEXT_PUBLIC_APP_URL="https://\${CODESPACE_NAME}-3000.\${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
NODE_ENV="development"

# Email Configuration (Development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@icct.edu.ph"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# File Upload Configuration
MAX_FILE_SIZE="10485760"
UPLOAD_PATH="./public/uploads"

# Security Configuration
SESSION_SECRET="codespace-session-secret-key-for-development-only"
COOKIE_SECRET="codespace-cookie-secret-key-for-development-only"
CSRF_SECRET="codespace-csrf-secret-key-for-development-only"

# Production Security Settings
SECURE_COOKIES="false"
REQUIRE_HTTPS="false"

# Rate Limiting
RATE_LIMIT_WINDOW="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE_PATH="./logs/app.log"

# Monitoring Configuration
ENABLE_MONITORING="true"
METRICS_ENDPOINT="/api/metrics"

# Backup Configuration
BACKUP_ENABLED="true"
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS="30"
BACKUP_DIR="./backups"

# Notification Configuration
NOTIFICATION_QUEUE_SIZE="1000"
NOTIFICATION_RATE_LIMIT="100"
ENABLE_EMAIL_NOTIFICATIONS="false"

# Development Configuration
ENABLE_DEBUG_MODE="true"
ENABLE_FAKE_DATA="false"
ENABLE_MOCK_SERVICES="false"
EOF

# Create logs directory
mkdir -p logs

# Set up Git configuration (if not already set)
if [ -z "$(git config --global user.name)" ]; then
    echo -e "${YELLOW}🔧 Setting up Git configuration...${NC}"
    git config --global user.name "Codespace User"
    git config --global user.email "codespace@github.com"
fi

# Install additional VS Code extensions
echo -e "${YELLOW}🔌 Installing additional VS Code extensions...${NC}"
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension prisma.prisma
code --install-extension ms-vscode.vscode-eslint

# Create a startup script
echo -e "${YELLOW}📜 Creating startup script...${NC}"
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting ICCT Smart Attendance System..."

# Start Docker services
docker-compose up -d

# Wait for services
sleep 5

# Start the application
npm run dev
EOF

chmod +x start-dev.sh

# Create a health check script
echo -e "${YELLOW}🏥 Creating health check script...${NC}"
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🔍 Checking system health..."

# Check PostgreSQL
if docker exec icct-sas-db pg_isready -U admin -d icct-sas; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Redis
if docker exec icct-sas-redis redis-cli ping; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
fi

# Check if ports are open
if netstat -tuln | grep -q :3000; then
    echo "✅ Application port 3000 is open"
else
    echo "❌ Application port 3000 is not open"
fi
EOF

chmod +x health-check.sh

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. Run ${YELLOW}./start-dev.sh${NC} to start the development server"
echo -e "2. Run ${YELLOW}./health-check.sh${NC} to check system health"
echo -e "3. Open ${YELLOW}http://localhost:3000${NC} in your browser"
echo -e "4. Use ${YELLOW}npm run dev${NC} to start the Next.js development server"
echo -e ""
echo -e "${GREEN}🎉 Your ICCT Smart Attendance System is ready for development!${NC}"
