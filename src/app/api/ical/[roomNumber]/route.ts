import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  try {
    const { roomNumber } = await params;

    let roomCondition = {};
    let calName = 'Hotel Sherpa Soul - All Rooms';

    if (roomNumber !== 'all') {
      const physicalRoom = await prisma.physicalRoom.findUnique({
        where: { roomNumber },
      });

      if (!physicalRoom) {
        return new NextResponse('Room not found', { status: 404 });
      }

      roomCondition = { physicalRoomId: physicalRoom.id };
      calName = `Hotel Sherpa Soul - Room ${roomNumber}`;
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...roomCondition,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
      include: {
        physicalRoom: true,
        category: true,
      },
      orderBy: { checkIn: 'asc' },
    });

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    };

    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hotel Sherpa Soul//PMS Direct Booking Engine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calName}`,
      `X-WR-TIMEZONE:Asia/Kathmandu`,
    ];

    for (const b of bookings) {
      const startStr = formatDate(new Date(b.checkIn));
      const endStr = formatDate(new Date(b.checkOut));
      const summary = b.source === 'DIRECT_WEBSITE' ? 'Direct Guest Reservation' : `Reserved (${b.source})`;
      const roomNum = b.physicalRoom?.roomNumber || 'Assigned';

      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${b.bookingNumber}-${b.id}@hotelsherpasoul.com`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${startStr}`,
        `DTEND;VALUE=DATE:${endStr}`,
        `SUMMARY:${summary} - Room ${roomNum}`,
        `DESCRIPTION:Hotel Sherpa Soul ${b.bookingNumber} | Category: ${b.category.name}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="sherpa-soul-${roomNumber}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('iCal export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
