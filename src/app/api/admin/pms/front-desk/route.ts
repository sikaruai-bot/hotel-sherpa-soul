import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. All 6 physical rooms
    const rooms = await prisma.physicalRoom.findMany({
      where: { isSellable: true },
      include: {
        category: true,
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            checkIn: { lte: tomorrow },
            checkOut: { gte: today },
          },
          orderBy: { checkIn: 'asc' },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    // 2. Active Arrivals (today)
    const arrivals = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { gte: today, lt: tomorrow },
      },
      include: { category: true, physicalRoom: true },
      orderBy: { checkIn: 'asc' },
    });

    // 3. Active Departures (today)
    const departures = await prisma.booking.findMany({
      where: {
        status: 'CHECKED_IN',
        checkOut: { gte: today, lt: tomorrow },
      },
      include: { category: true, physicalRoom: true },
      orderBy: { checkOut: 'asc' },
    });

    // 4. Currently In-House
    const inHouse = await prisma.booking.findMany({
      where: {
        status: 'CHECKED_IN',
      },
      include: { category: true, physicalRoom: true },
      orderBy: { checkOut: 'asc' },
    });

    // Strict 6-room occupancy metrics (excluding Shared Kitchen 102)
    const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED' || r.bookings.some(b => b.status === 'CHECKED_IN')).length;
    const occupancyRate = ((occupiedCount / 6) * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      stats: {
        totalSellableRooms: 6,
        occupiedRooms: occupiedCount,
        availableRooms: 6 - occupiedCount,
        occupancyRate: `${occupancyRate}%`,
        arrivalsCount: arrivals.length,
        departuresCount: departures.length,
        inHouseCount: inHouse.length,
      },
      rooms,
      arrivals,
      departures,
      inHouse,
    });
  } catch (error: any) {
    console.error('Front Desk GET error:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching PMS front desk data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, bookingId, roomNumber, passportNumber, notes } = body;

    if (!action || !bookingId) {
      return NextResponse.json({ error: 'Action and bookingId are required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { physicalRoom: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'CHECK_IN') {
      let targetRoomId = booking.physicalRoomId;

      if (roomNumber) {
        const pRoom = await prisma.physicalRoom.findUnique({ where: { roomNumber } });
        if (pRoom) targetRoomId = pRoom.id;
      }

      // Update booking to CHECKED_IN
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CHECKED_IN',
          physicalRoomId: targetRoomId,
          notes: notes ? `${booking.notes || ''} | Check-in note: ${notes}` : booking.notes,
        },
      });

      // Update physical room status to OCCUPIED
      if (targetRoomId) {
        await prisma.physicalRoom.update({
          where: { id: targetRoomId },
          data: { status: 'OCCUPIED' },
        });
      }

      return NextResponse.json({ success: true, message: 'Guest checked in successfully', booking: updatedBooking });
    }

    if (action === 'CHECK_OUT') {
      // Update booking to CHECKED_OUT
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CHECKED_OUT',
          notes: notes ? `${booking.notes || ''} | Check-out note: ${notes}` : booking.notes,
        },
      });

      // Mark room as DIRTY / CLEANING_REQUIRED so housekeeping can sanitize
      if (booking.physicalRoomId) {
        await prisma.physicalRoom.update({
          where: { id: booking.physicalRoomId },
          data: { status: 'DIRTY' },
        });

        // Automatically create turnover housekeeping task
        await prisma.housekeepingTask.create({
          data: {
            roomId: booking.physicalRoomId,
            taskType: 'Turnover Clean & Linen Change',
            status: 'PENDING',
            notes: `Turnover after check-out of ${booking.guestName} (${booking.bookingNumber})`,
          },
        });
      }

      return NextResponse.json({ success: true, message: 'Guest checked out successfully. Room marked for cleaning.', booking: updatedBooking });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Front Desk POST error:', error);
    return NextResponse.json({ error: error?.message || 'Error processing front desk action' }, { status: 500 });
  }
}
