import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchDomainEvent } from '@/lib/domainEvents';
import { initializeWorkerHandlers } from '@/lib/workerHandlers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    initializeWorkerHandlers();

    // Query pending events from outbox table
    const pendingEvents = await prisma.domainEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });

    const results = [];
    for (const event of pendingEvents) {
      try {
        await dispatchDomainEvent(event.eventId);
        results.push({ eventId: event.eventId, success: true });
      } catch (err: any) {
        results.push({ eventId: event.eventId, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Events process error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
