import { NextResponse } from 'next/server';
import { processReadyJobs } from '@/lib/jobQueue';
import { initializeWorkerHandlers } from '@/lib/workerHandlers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    initializeWorkerHandlers();

    const { processed, details } = await processReadyJobs(20);

    return NextResponse.json({
      success: true,
      processedCount: processed,
      details,
    });
  } catch (error: any) {
    console.error('Job queue process error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
