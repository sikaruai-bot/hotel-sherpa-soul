import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateIcalFeed, IcalReservationInput } from '@/lib/ical';
import { ReservationStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomParam = searchParams.get('room') || 'ALL';
    const channelParam = (searchParams.get('channel') || 'DIRECT').toUpperCase();

    // 1. Fetch Room details if specific room
    let roomTypeLabel: string | undefined = undefined;
    let roomFilter: { roomNumber?: string } = {};

    if (roomParam !== 'ALL') {
      const room = await prisma.room.findUnique({
        where: { roomNumber: roomParam },
        include: { roomType: true },
      });
      if (room) {
        roomTypeLabel = room.roomType.name;
        roomFilter = { roomNumber: roomParam };
      }
    }

    // 2. Query active reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        status: {
          in: [
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
            ReservationStatus.PENDING,
          ],
        },
        ...(roomParam !== 'ALL' && {
          room: { roomNumber: roomParam },
        }),
      },
      include: {
        guest: true,
        room: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    // 3. Query active long-stay contracts (they also block room inventory)
    const longStays = await prisma.longStayContract.findMany({
      where: {
        status: 'ACTIVE',
        ...(roomParam !== 'ALL' && {
          room: { roomNumber: roomParam },
        }),
      },
      include: {
        guest: true,
        room: true,
      },
      orderBy: { startDate: 'asc' },
    });

    // Format all reservations into iCal input
    const icalItems: IcalReservationInput[] = [
      ...reservations.map((r) => ({
        id: r.id,
        guestName: r.guest.name,
        source: r.source,
        roomNumber: r.room.roomNumber,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate,
        status: r.status,
        otaReference: r.otaConfirmNum,
      })),
      ...longStays.map((ls) => ({
        id: `ls-${ls.id}`,
        guestName: `${ls.guest.name} (Long Stay)`,
        source: 'Long Stay Contract',
        roomNumber: ls.room.roomNumber,
        checkInDate: ls.startDate,
        checkOutDate: ls.endDate,
        status: 'CONFIRMED',
        otaReference: `LS-${ls.id.slice(0, 8).toUpperCase()}`,
      })),
    ];

    const icsContent = generateIcalFeed({
      roomNumber: roomParam,
      roomType: roomTypeLabel,
      reservations: icalItems,
      hotelName: 'Hotel Sherpa Soul',
    });

    // Log the export event asynchronously (don't block the response)
    prisma.otaSyncLog.create({
      data: {
        channel: channelParam,
        roomNumber: roomParam,
        action: 'EXPORT_ICAL',
        status: 'SUCCESS',
        message: `External OTA fetched iCal feed for Room ${roomParam} (${icalItems.length} active bookings blocked)`,
      },
    }).catch((err) => console.warn('Failed to log iCal export:', err));

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="sherpa-soul-room-${roomParam}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error generating iCal export:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error generating calendar feed' },
      { status: 500 }
    );
  }
}
