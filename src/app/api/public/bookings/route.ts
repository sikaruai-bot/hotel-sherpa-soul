import { NextResponse } from 'next/server';
import { normalizeWebsiteBooking } from '@/lib/sourceAdapters';
import { createUnifiedReservation } from '@/lib/reservationService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 1. Normalize Website Booking Payload
    const normalizedInput = normalizeWebsiteBooking(payload);

    if (!normalizedInput.guestName || !normalizedInput.checkInDate || !normalizedInput.checkOutDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required booking fields: guestName, checkInDate, checkOutDate.',
        },
        { status: 400 }
      );
    }

    // 2. Delegate to Unified Reservation Service
    const result = await createUnifiedReservation(normalizedInput, {
      ipAddress,
      userAgent,
      staffUserId: 'WEBSITE_DIRECT_BOOKING',
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflict: result.conflict,
        },
        { status: 409 }
      );
    }

    const res = result.reservation;

    return NextResponse.json(
      {
        success: true,
        message: 'Booking created successfully',
        data: {
          id: res.id,
          reservationNumber: res.reservationNumber,
          guestName: res.guest.name,
          email: res.guest.email,
          phone: res.guest.phoneNumber,
          roomNumber: res.room.roomNumber,
          roomType: res.room.roomType.name,
          checkInDate: res.checkInDate,
          checkOutDate: res.checkOutDate,
          totalAmount: res.totalAmount,
          paidAmount: res.paidAmount,
          dueAmount: res.dueAmount,
          status: res.status,
          paymentStatus: res.paymentStatus,
          selfCheckinToken: res.selfCheckinToken,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Direct website booking API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
