import { NextResponse } from 'next/server';
import { executeNightAudit } from '@/lib/nightAuditService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  return runNightAuditCron();
}

export async function POST() {
  return runNightAuditCron();
}

async function runNightAuditCron() {
  try {
    const today = new Date();

    // 1. Expire past kitchen passes
    const expiredPasses = await prisma.kitchenUser.updateMany({
      where: {
        accessEndDate: { lt: today },
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // 2. Execute comprehensive night audit (auto-release no-shows, post room rates, calculate ADR/RevPAR)
    const report = await executeNightAudit({
      forceClose: false,
      staffUserId: 'CRON_NIGHT_AUDIT',
    });

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        expiredPassesUpdated: expiredPasses.count,
      },
    });
  } catch (error: any) {
    console.error('Night audit cron error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
