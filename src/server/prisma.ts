import { PrismaClient } from '@prisma/client';

const runtime = globalThis as typeof globalThis & {
  process?: { env?: { NODE_ENV?: string } };
};
const nodeEnv = runtime.process?.env?.NODE_ENV;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });

if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
