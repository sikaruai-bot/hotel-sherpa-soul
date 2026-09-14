import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RiskStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Dead-letter & Failed Automation Jobs
    const failedJobs = await prisma.automationJob.findMany({
      where: {
        status: { in: ['FAILED', 'DEAD_LETTER'] },
      },
      include: { reservation: { include: { guest: true, room: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 2. OTA Sync Conflicts & Failures
    const otaErrors = await prisma.otaSyncLog.findMany({
      where: {
        status: { in: ['CONFLICT_PREVENTED', 'ERROR'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 3. Flagged Guests (Previous Due, Manager Review, Do Not Rent)
    const flaggedGuests = await prisma.guest.findMany({
      where: {
        OR: [
          { riskStatus: { in: [RiskStatus.PAYMENT_ALERT, RiskStatus.MANAGER_REVIEW, RiskStatus.DO_NOT_RENT] } },
          { isBlacklisted: true },
          { previousDueAmount: { gt: 0 } },
        ],
      },
      include: {
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { room: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    // 4. Failed Messages (WhatsApp / Email / SMS)
    const failedMessages = await prisma.unifiedMessage.findMany({
      where: { status: 'FAILED' },
      include: { reservation: true, guest: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Compile into standardized exception list
    const items = [
      ...failedJobs.map((j) => ({
        id: j.id,
        type: 'JOB_FAILURE',
        severity: j.status === 'DEAD_LETTER' ? 'CRITICAL' : 'HIGH',
        source: 'Automation Queue',
        reservationNumber: j.reservation?.reservationNumber || 'N/A',
        guestName: j.reservation?.guest?.name || 'System',
        roomNumber: j.reservation?.room?.roomNumber || 'N/A',
        title: `Automation Job Failed: ${j.jobType}`,
        message: j.lastError || 'Job execution failed',
        status: j.status,
        canRetry: true,
        retryJobId: j.id,
        createdAt: j.createdAt.toISOString(),
      })),
      ...otaErrors.map((o) => ({
        id: o.id,
        type: 'OTA_CONFLICT',
        severity: o.status === 'ERROR' ? 'CRITICAL' : 'HIGH',
        source: o.channel,
        reservationNumber: 'OTA Webhook',
        guestName: 'Channel Guest',
        roomNumber: o.roomNumber,
        title: `OTA Sync Conflict prevented [${o.channel}]`,
        message: o.message,
        status: o.status,
        canRetry: false,
        createdAt: o.createdAt.toISOString(),
      })),
      ...flaggedGuests.map((g) => ({
        id: g.id,
        type: 'GUEST_RISK',
        severity: g.riskStatus === 'DO_NOT_RENT' ? 'CRITICAL' : 'MEDIUM',
        source: 'Guest CRM',
        reservationNumber: g.reservations[0]?.reservationNumber || 'No Active Res',
        guestName: g.name,
        roomNumber: g.reservations[0]?.room?.roomNumber || 'N/A',
        title: `Guest Review: ${g.riskStatus}`,
        message: g.riskReason || `Unsettled past balance: NPR ${g.previousDueAmount.toLocaleString()}`,
        status: g.riskStatus,
        canRetry: false,
        createdAt: g.updatedAt.toISOString(),
      })),
      ...failedMessages.map((m) => ({
        id: m.id,
        type: 'COMMUNICATION_FAILED',
        severity: 'MEDIUM',
        source: m.channel,
        reservationNumber: m.reservation?.reservationNumber || 'N/A',
        guestName: m.recipient,
        roomNumber: 'N/A',
        title: `Failed to deliver ${m.channel} message`,
        message: m.errorMessage || 'Provider delivery error',
        status: 'FAILED',
        canRetry: true,
        retryMessageId: m.id,
        createdAt: m.createdAt.toISOString(),
      })),
    ];

    // Sort by severity and date
    const severityWeight: Record<string, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
    items.sort((a, b) => {
      const diff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      totalExceptions: items.length,
      criticalCount: items.filter((i) => i.severity === 'CRITICAL').length,
      data: items,
    });
  } catch (error: any) {
    console.error('Exceptions fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
