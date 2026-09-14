import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingNumber: string }> }
) {
  try {
    const { bookingNumber } = await params;
    const cleanNumber = decodeURIComponent(bookingNumber).trim();

    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          { reservationNumber: { equals: cleanNumber, mode: 'insensitive' } },
          { id: { equals: cleanNumber } },
          { otaConfirmNum: { equals: cleanNumber, mode: 'insensitive' } },
          { externalBookingId: { equals: cleanNumber, mode: 'insensitive' } },
        ],
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        folio: { include: { items: true, payments: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: `No booking found for reference '${cleanNumber}'.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        guestName: reservation.guest.name,
        email: reservation.guest.email,
        phone: reservation.guest.phoneNumber,
        roomNumber: reservation.room.roomNumber,
        roomType: reservation.room.roomType.name,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        adults: reservation.adults,
        children: reservation.children,
        totalAmount: reservation.totalAmount,
        paidAmount: reservation.paidAmount,
        dueAmount: reservation.dueAmount,
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        source: reservation.source,
        selfCheckinToken: reservation.selfCheckinToken,
        createdAt: reservation.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Booking lookup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
