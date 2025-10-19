
import { PrismaClient } from '@prisma/client';
import { ensureValidEnvironment } from './env-validation';

// Validate environment before initializing Prisma (only in production and not during build)
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
  ensureValidEnvironment();
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;