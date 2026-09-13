import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const logs = await prisma.otaSyncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      channel: log.channel,
      roomNumber: log.roomNumber,
      action: log.action,
      status: log.status,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching OTA sync logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
