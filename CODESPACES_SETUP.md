# GitHub Codespaces Setup Guide

This guide will help you set up your ICCT Smart Attendance System in GitHub Codespaces for cloud-based development.

## 🚀 Quick Start

### 1. Create a Codespace

1. Navigate to your GitHub repository
2. Click the **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"**

### 2. Automatic Setup

Once your Codespace is created, the setup will run automatically:

- ✅ Dependencies installation
- ✅ Docker services (PostgreSQL + Redis) startup
- ✅ Database migration and seeding
- ✅ Environment configuration
- ✅ VS Code extensions installation

### 3. Start Development

After the setup completes, run:

```bash
# Start the development server
npm run dev

# Or use the convenience script
./start-dev.sh
```

## 🔧 Manual Setup (if needed)

If the automatic setup doesn't work, follow these steps:

### 1. Install Dependencies

```bash
npm ci
```

### 2. Start Docker Services

```bash
docker-compose up -d
```

### 3. Wait for Services

```bash
# Check PostgreSQL
docker exec icct-sas-db pg_isready -U admin -d icct-sas

# Check Redis
docker exec icct-sas-redis redis-cli ping
```

### 4. Run Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

## 🌐 Accessing Your Application

Your application will be available at:
- **Local**: `http://localhost:3000`
- **Codespaces**: `https://{codespace-name}-3000.{github-codespaces-port-forwarding-domain}`

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:start     # Start database services
npm run db:stop      # Stop database services
npm run db:reset     # Reset database
npm run db:migrate   # Run migrations
```

### Testing
```bash
npm run test:performance    # Performance testing
npm run test:email         # Email functionality testing
npm run security:test      # Security testing
```

### Health Checks
```bash
./health-check.sh    # Check system health
./start-dev.sh       # Start development environment
```

## 🔍 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs icct-sas-db

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis logs
docker logs icct-sas-redis

# Restart Redis
docker-compose restart redis
```

### Port Forwarding Issues

1. Check if ports are forwarded in the Codespaces interface
2. Verify the port forwarding domain in your environment
3. Restart the Codespace if needed

### Environment Variables

Check your environment variables:

```bash
# Check current environment
env | grep -E "(DATABASE_URL|REDIS_URL|NEXT_PUBLIC_APP_URL)"

# Reload environment
source .env
```

## 📁 Project Structure

```
├── .devcontainer/           # Codespaces configuration
│   ├── devcontainer.json   # Main configuration
│   ├── Dockerfile         # Custom container setup
│   ├── postCreateCommand.sh # Auto-setup script
│   └── codespaces.env     # Environment variables
├── src/                    # Source code
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── docker-compose.yml     # Local development services
└── package.json           # Dependencies and scripts
```

## 🔐 Security Notes

- **Development Keys**: The Codespaces setup uses development-only security keys
- **Production**: Never use these keys in production environments
- **Secrets**: Store sensitive data in GitHub Secrets for production deployments

## 📚 Additional Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `docker logs icct-sas-db` and `docker logs icct-sas-redis`
3. Run the health check: `./health-check.sh`
4. Restart the Codespace if needed

## 🎉 Success!

Once everything is running, you should see:
- ✅ PostgreSQL database running on port 5433
- ✅ Redis cache running on port 6379
- ✅ Next.js application running on port 3000
- ✅ All services healthy and ready for development

Happy coding! 🚀
