import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/hotelsherpasoul_pms?schema=public';

// Resilient connection pool configuration
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
  });

// Prevent unhandled pool errors from terminating the Node process
pool.on('error', (err) => {
  console.warn('⚠️ [Database Pool Shield] Transient connection issue handled:', err.message);
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Always retain singleton in globalThis to avoid pool exhaustion across serverless warm starts
globalForPrisma.prisma = prisma;
globalForPrisma.pool = pool;

export default prisma;

