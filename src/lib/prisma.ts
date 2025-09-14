
import { PrismaClient } from '@prisma/client';
import { ensureValidEnvironment } from './env-validation';

// Validate environment before initializing Prisma (only in production)
if (process.env.NODE_ENV === 'production') {
  ensureValidEnvironment();
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;