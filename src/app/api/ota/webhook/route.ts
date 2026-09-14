import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingSource, ReservationStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';
import { checkCategoryCapacity, getAvailableAlternatives, dispatchRoomFullAlert } from '@/lib/roomCategoryShield';
import { sendBookingNotificationToOfficialMail } from '@/lib/emailService';

const sourceMap: Record<string, BookingSource> = {
  BOOKING_COM: BookingSource.BOOKING_COM,
  'BOOKING.COM': BookingSource.BOOKING_COM,
  AIRBNB: BookingSource.AIRBNB,
  AGODA: BookingSource.AGODA,
  EXPEDIA: BookingSource.EXPEDIA,
  TRIP_COM: BookingSource.TRIP_COM,
  'TRIP.COM': BookingSource.TRIP_COM,
  VRBO: BookingSource.VRBO,
  DIRECT: BookingSource.DIRECT,
  WEBSITE: BookingSource.DIRECT,
};

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelQuery = searchParams.get('channel') || 'CUSTOM';

    const payload = await request.json().catch(() => ({}));

    const { normalizeOtaBooking } = await import('@/lib/sourceAdapters');
    const { createUnifiedReservation } = await import('@/lib/reservationService');

    const normalized = normalizeOtaBooking(payload, channelQuery);

    const result = await createUnifiedReservation(normalized, {
      staffUserId: `OTA_${channelQuery.toUpperCase()}_WEBHOOK`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    if (result.isDuplicate) {
      return NextResponse.json({
        success: true,
        message: 'OTA webhook already acknowledged and recorded (idempotent)',
        data: {
          id: result.reservation.id,
          reservationNumber: result.reservation.reservationNumber,
        },
      });
    }

    if (!result.success) {
      await prisma.otaSyncLog.create({
        data: {
          channel: String(normalized.source).toUpperCase(),
          roomNumber: String(normalized.roomNumber || 'UNASSIGNED'),
          action: 'WEBHOOK_PUSH',
          status: 'CONFLICT_PREVENTED',
          message: result.error || 'Conflict prevented by PMS shield',
          details: JSON.stringify(payload),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflict: result.conflict,
        },
        { status: 409 }
      );
    }

    await prisma.otaSyncLog.create({
      data: {
        channel: String(normalized.source).toUpperCase(),
        roomNumber: result.reservation.room?.roomNumber || 'ALL',
        action: 'WEBHOOK_PUSH',
        status: 'SUCCESS',
        message: `Webhook created confirmed booking #${result.reservation.reservationNumber} for ${result.reservation.guest.name}`,
        details: JSON.stringify({ reservationId: result.reservation.id }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reservation confirmed for Room ${result.reservation.room?.roomNumber || 'Assigned'}`,
      data: {
        id: result.reservation.id,
        reservationNumber: result.reservation.reservationNumber,
        roomNumber: result.reservation.room?.roomNumber,
        guestName: result.reservation.guest.name,
        checkInDate: result.reservation.checkInDate,
        checkOutDate: result.reservation.checkOutDate,
        totalAmount: result.reservation.totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Error in OTA webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook internal error' },
      { status: 500 }
    );
  }
}
