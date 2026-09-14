import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    // 1. Neon Database Query Check
    const [roomCount, resCount, pendingEvents, pendingJobs, deadLetterJobs] = await Promise.all([
      prisma.room.count(),
      prisma.reservation.count(),
      prisma.domainEvent.count({ where: { status: 'PENDING' } }),
      prisma.automationJob.count({ where: { status: { in: ['PENDING', 'RETRYING'] } } }),
      prisma.automationJob.count({ where: { status: 'DEAD_LETTER' } }),
    ]);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      service: 'Hotel Sherpa Soul PMS Automation Engine',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: {
        provider: 'Neon Serverless PostgreSQL',
        connected: true,
        latencyMs,
        stats: {
          totalRooms: roomCount,
          totalReservations: resCount,
        },
      },
      queue: {
        pendingEvents,
        pendingJobs,
        deadLetterJobs,
        healthy: deadLetterJobs === 0,
      },
    });
  } catch (error: any) {
    console.error('PMS health-check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
