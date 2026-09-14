import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, reservationNumber } = body;

    if (!token && !reservationNumber) {
      return NextResponse.json(
        { success: false, error: 'Valid self-checkin token or reservation number is required.' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          ...(token ? [{ selfCheckinToken: token }] : []),
          ...(reservationNumber ? [{ reservationNumber }] : []),
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
        { success: false, error: 'Self-checkin pass invalid or expired. Please contact front desk.' },
        { status: 404 }
      );
    }

    // Check expiration if token has an expiry date
    if (reservation.selfCheckinExpiresAt && new Date() > reservation.selfCheckinExpiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'This self-checkin pass has expired. Please visit the reception for assisted check-in.',
        },
        { status: 410 }
      );
    }

    const balanceDue = reservation.dueAmount || Math.max(0, reservation.totalAmount - reservation.paidAmount);

    return NextResponse.json({
      success: true,
      data: {
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        guestName: reservation.guest.name,
        nationality: reservation.guest.nationality || 'Nepal',
        hasPhoto: Boolean(reservation.guest.photoUrl || reservation.guest.livePhotoReference),
        hasConsent: Boolean(reservation.guest.consentStatus),
        roomNumber: reservation.room.roomNumber,
        roomType: reservation.room.roomType.name,
        floor: reservation.room.floor,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        totalAmount: reservation.totalAmount,
        paidAmount: reservation.paidAmount,
        balanceDue,
        requiresPayment: balanceDue > 0,
        status: reservation.status,
        alreadyCheckedIn: reservation.status === ReservationStatus.CHECKED_IN,
      },
    });
  } catch (error: any) {
    console.error('Self check-in start error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
