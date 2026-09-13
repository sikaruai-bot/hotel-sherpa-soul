import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autoReleaseExpiredNoShows } from '@/lib/autoReleaseNoShows';

export async function GET() {
  return executeNightAudit();
}

export async function POST() {
  return executeNightAudit();
}

async function executeNightAudit() {
  try {
    const today = new Date();

    // 1. Auto-release expired un-checked-in bookings (No-Shows) to free rooms for new guests
    const noShowSweep = await autoReleaseExpiredNoShows(18);

    // 2. Expire past kitchen passes
    const expiredPasses = await prisma.kitchenUser.updateMany({
      where: {
        accessEndDate: { lt: today },
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // 2. Count occupied rooms & calculate occupancy
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({
      where: {
        OR: [{ status: 'OCCUPIED' }, { status: 'LONG_STAY_OCCUPIED' }],
      },
    });

    const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 3. Log audit notification
    await prisma.notification.create({
      data: {
        title: 'Daily Night Audit Completed',
        detail: `Night audit finished. Current Occupancy: ${occupancyPct}% (${occupiedRooms}/${totalRooms} rooms). Expired kitchen passes updated: ${expiredPasses.count}.`,
        type: 'General',
        channel: 'In-App',
        status: 'Delivered',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        auditTimestamp: today.toISOString(),
        occupancyRate: `${occupancyPct}%`,
        occupiedRooms,
        totalRooms,
        expiredPassesUpdated: expiredPasses.count,
      },
    });
  } catch (error: any) {
    console.error('Night audit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
