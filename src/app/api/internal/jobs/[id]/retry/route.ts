import { NextResponse } from 'next/server';
import { manualRetryJob } from '@/lib/jobQueue';
import { initializeWorkerHandlers } from '@/lib/workerHandlers';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    initializeWorkerHandlers();

    await manualRetryJob(id);

    return NextResponse.json({
      success: true,
      message: `Job ${id} manually retried successfully`,
    });
  } catch (error: any) {
    console.error(`Error retrying job:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
