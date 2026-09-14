import { NextResponse } from 'next/server';
import { executeNightAudit } from '@/lib/nightAuditService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Return latest NightAuditRecord and current preview
    const latestRecord = await prisma.nightAuditRecord.findFirst({
      orderBy: { businessDate: 'desc' },
    });

    const preview = await executeNightAudit({ forceClose: false });

    return NextResponse.json({
      success: true,
      data: {
        latestClosedRecord: latestRecord,
        todayPreview: preview,
      },
    });
  } catch (error: any) {
    console.error('Night audit preview error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { businessDate, forceClose = false, staffUserId = 'FRONT_DESK_MANAGER' } = body;

    const report = await executeNightAudit({
      businessDate,
      forceClose: Boolean(forceClose),
      staffUserId,
    });

    return NextResponse.json({
      success: true,
      message: forceClose ? 'Night audit closed and business date locked' : 'Night audit executed successfully',
      data: report,
    });
  } catch (error: any) {
    console.error('Night audit execution error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
