import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalRooms,
      occupiedRooms,
      reservedRooms,
      arrivalsToday,
      departuresToday,
      activeLongStay,
      pendingHousekeeping,
      openMaintenance,
      invoices,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({
        where: {
          OR: [{ status: 'OCCUPIED' }, { status: 'LONG_STAY_OCCUPIED' }],
        },
      }),
      prisma.room.count({ where: { status: 'RESERVED' } }),
      prisma.reservation.count({
        where: {
          checkInDate: { gte: today, lt: tomorrow },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
      }),
      prisma.reservation.count({
        where: {
          checkOutDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.longStayContract.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.housekeepingTask.count({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      prisma.maintenanceTicket.count({
        where: { status: { in: ['Open', 'In Progress'] } },
      }),
      prisma.invoice.findMany({
        select: { total: true, paidAmount: true, status: true },
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const unpaidAmount = invoices
      .filter((inv) => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + Math.max(0, inv.total - inv.paidAmount), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        reservedRooms,
        availableRooms: Math.max(0, totalRooms - occupiedRooms - reservedRooms),
        occupancyRate,
        arrivalsToday,
        departuresToday,
        activeLongStay,
        pendingHousekeeping,
        openMaintenance,
        totalRevenue,
        unpaidAmount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
