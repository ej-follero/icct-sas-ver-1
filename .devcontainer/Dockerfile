FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install additional system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    redis-tools \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    prisma \
    @prisma/client \
    nodemon \
    pm2

# Set up the workspace
WORKDIR /workspaces/icct-smart-attendance-system

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Set up environment
ENV NODE_ENV=development
ENV DATABASE_URL="postgresql://admin:admin123@localhost:5432/icct-sas"
ENV REDIS_URL="redis://localhost:6379"

# Expose ports
EXPOSE 3000 5433 6379

# Default command
CMD ["npm", "run", "dev"]
