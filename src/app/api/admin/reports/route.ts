import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const TOTAL_SELLABLE_ROOMS = 6; // Strict physical rooms: 201, 202, 203, 301, 302, 303 (Area 102 excluded)

    const bookings = await prisma.booking.findMany({
      include: { category: true, physicalRoom: true },
      orderBy: { checkIn: 'desc' },
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. All-time stats
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.status));
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

    const totalRevenueUSD = confirmedBookings.reduce((sum, b) => sum + b.totalAmountUSD, 0);

    // Calculate total room nights sold
    let totalRoomNightsSold = 0;
    for (const b of confirmedBookings) {
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      totalRoomNightsSold += nights;
    }

    // ADR = Total Revenue / Room Nights Sold
    const adrUSD = totalRoomNightsSold > 0 ? (totalRevenueUSD / totalRoomNightsSold).toFixed(2) : '25.00';

    // Current Month calculations
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const totalAvailableRoomNightsMonth = TOTAL_SELLABLE_ROOMS * daysInMonth;

    let monthRoomNightsSold = 0;
    let monthRevenueUSD = 0;

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    for (const b of confirmedBookings) {
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      if (start <= monthEnd && end >= monthStart) {
        const overlapStart = start < monthStart ? monthStart : start;
        const overlapEnd = end > monthEnd ? monthEnd : end;
        const nights = Math.max(1, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)));
        monthRoomNightsSold += nights;
        monthRevenueUSD += (b.totalAmountUSD / Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))) * nights;
      }
    }

    const monthOccupancyRate = ((monthRoomNightsSold / totalAvailableRoomNightsMonth) * 100).toFixed(1);
    const revparUSD = (monthRevenueUSD / totalAvailableRoomNightsMonth).toFixed(2);

    // 2. Channel Breakdown
    const channelCounts: Record<string, { count: number; revenueUSD: number }> = {};
    for (const b of confirmedBookings) {
      const src = b.source || 'DIRECT_WEBSITE';
      if (!channelCounts[src]) channelCounts[src] = { count: 0, revenueUSD: 0 };
      channelCounts[src].count++;
      channelCounts[src].revenueUSD += b.totalAmountUSD;
    }

    // 3. Category Breakdown
    const categoryCounts: Record<string, { name: string; count: number; revenueUSD: number }> = {};
    for (const b of confirmedBookings) {
      const cat = b.category.name;
      if (!categoryCounts[cat]) categoryCounts[cat] = { name: cat, count: 0, revenueUSD: 0 };
      categoryCounts[cat].count++;
      categoryCounts[cat].revenueUSD += b.totalAmountUSD;
    }

    return NextResponse.json({
      success: true,
      kpis: {
        totalSellableRooms: TOTAL_SELLABLE_ROOMS,
        sharedKitchenPolicy: 'Excluded from denominator (Area 102)',
        monthOccupancyRate: `${monthOccupancyRate}%`,
        adrUSD: `$${adrUSD}`,
        revparUSD: `$${revparUSD}`,
        monthRevenueUSD: Math.round(monthRevenueUSD),
        totalRevenueUSD: Math.round(totalRevenueUSD),
        totalBookings,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: cancelledBookings.length,
        cancellationRate: totalBookings > 0 ? `${((cancelledBookings.length / totalBookings) * 100).toFixed(1)}%` : '0%',
      },
      channelBreakdown: Object.entries(channelCounts).map(([channel, data]) => ({
        channel,
        count: data.count,
        revenueUSD: Math.round(data.revenueUSD),
      })),
      categoryBreakdown: Object.values(categoryCounts).map(data => ({
        category: data.name,
        count: data.count,
        revenueUSD: Math.round(data.revenueUSD),
      })),
    });
  } catch (error: any) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ error: error?.message || 'Error compiling reports' }, { status: 500 });
  }
}
