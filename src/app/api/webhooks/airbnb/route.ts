import { NextResponse } from 'next/server';
import { normalizeOtaBooking } from '@/lib/sourceAdapters';
import { createUnifiedReservation } from '@/lib/reservationService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const authHeader = request.headers.get('authorization') || request.headers.get('x-airbnb-token');

    const expectedSecret = process.env.AIRBNB_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}` && authHeader !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized Airbnb secret' }, { status: 401 });
    }

    const normalized = normalizeOtaBooking(payload, 'AIRBNB');

    const result = await createUnifiedReservation(normalized, {
      staffUserId: 'OTA_AIRBNB_WEBHOOK',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    if (result.isDuplicate) {
      return NextResponse.json({
        success: true,
        message: 'Airbnb booking already acknowledged (idempotent)',
        reservationNumber: result.reservation.reservationNumber,
      });
    }

    if (!result.success) {
      await prisma.otaSyncLog.create({
        data: {
          channel: 'AIRBNB',
          roomNumber: normalized.roomNumber || 'UNASSIGNED',
          action: 'WEBHOOK_PUSH',
          status: 'CONFLICT_PREVENTED',
          message: `Airbnb import conflict: ${result.error}`,
          details: JSON.stringify(payload),
        },
      });

      return NextResponse.json(
        { success: false, error: result.error, conflict: result.conflict },
        { status: 409 }
      );
    }

    await prisma.otaSyncLog.create({
      data: {
        channel: 'AIRBNB',
        roomNumber: result.reservation.room.roomNumber,
        action: 'WEBHOOK_PUSH',
        status: 'SUCCESS',
        message: `Airbnb booking confirmed: #${result.reservation.reservationNumber} for ${result.reservation.guest.name}`,
        details: JSON.stringify({ reservationId: result.reservation.id }),
      },
    });

    return NextResponse.json({
      success: true,
      reservationNumber: result.reservation.reservationNumber,
      roomNumber: result.reservation.room.roomNumber,
      status: result.reservation.status,
    });
  } catch (error: any) {
    console.error('Airbnb webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
