import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let dbUrl = process.env.DATABASE_URL;

if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  if (!fs.existsSync(tmpDbPath)) {
    const srcDb = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(srcDb)) {
      try {
        fs.copyFileSync(srcDb, tmpDbPath);
      } catch (e) {
        console.error('[Prisma] Error copying dev.db to /tmp:', e);
      }
    }
  }
  if (fs.existsSync(tmpDbPath)) {
    dbUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = dbUrl;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: dbUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

