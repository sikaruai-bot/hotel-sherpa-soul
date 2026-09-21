import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function verifyBotAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key');
  const expectedKey = process.env.CHATBOT_API_KEY || 'sherpa-bot-key-2026';

  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  return token === expectedKey;
}

/**
 * GET /api/bot/booking/[id]
 * Lookup booking by ID, Reservation Number (HSS-...), or Phone
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyBotAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing x-api-key header' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const digits = id.replace(/[^0-9]/g, '');
    const phoneConditions: any[] = [];
    if (digits.length >= 6) {
      phoneConditions.push({ guest: { phoneNumber: { contains: digits } } });
      if (digits.length >= 9) {
        phoneConditions.push({ guest: { phoneNumber: { contains: digits.slice(-9) } } });
      }
      if (digits.length >= 10) {
        phoneConditions.push({ guest: { phoneNumber: { contains: digits.slice(-10) } } });
      }
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          { id },
          { reservationNumber: id.toUpperCase() },
          { externalBookingId: id },
          ...phoneConditions,
        ],
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: `No reservation found for "${id}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        guestName: reservation.guest.name,
        phone: reservation.guest.phoneNumber,
        email: reservation.guest.email,
        roomNumber: reservation.room?.roomNumber,
        roomType: reservation.room?.roomType?.name,
        checkInDate: reservation.checkInDate.toISOString().split('T')[0],
        checkOutDate: reservation.checkOutDate.toISOString().split('T')[0],
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        totalAmount: reservation.totalAmount,
        paidAmount: reservation.paidAmount,
        dueAmount: reservation.dueAmount,
        currency: reservation.currency,
        voucherUrl: `https://pms.hotelsherpasoul.com/self-checkin?token=${reservation.selfCheckinToken || reservation.id}`,
      },
    });
  } catch (error: any) {
    console.error('Bot booking lookup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error looking up booking' },
      { status: 500 }
    );
  }
}
