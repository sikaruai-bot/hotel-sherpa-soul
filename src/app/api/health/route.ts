import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;
  let activeSellableRooms = 0;
  let totalBookings = 0;

  try {
    const dbPingStart = Date.now();
    // Test database connectivity and count rooms
    const [roomsCount, bookingsCount] = await Promise.all([
      prisma.physicalRoom.count({ where: { isSellable: true } }),
      prisma.booking.count(),
    ]);

    dbLatencyMs = Date.now() - dbPingStart;
    dbStatus = 'connected';
    activeSellableRooms = roomsCount;
    totalBookings = bookingsCount;
  } catch (err: unknown) {
    console.error('[HealthCheck] Database ping failed:', err);
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'connected';
  const totalResponseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'Hotel Sherpa Soul API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: process.env.DATABASE_URL?.startsWith('postgres')
          ? 'PostgreSQL'
          : process.env.DATABASE_URL?.startsWith('mysql')
          ? 'MySQL'
          : 'SQLite',
      },
      inventory: {
        activeSellableRooms,
        strictRoomPolicyEnforced: activeSellableRooms === 6,
        totalBookingsRecorded: totalBookings,
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        totalResponseTimeMs,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
