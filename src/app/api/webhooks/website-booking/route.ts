import { NextResponse } from 'next/server';
import { normalizeWebsiteBooking } from '@/lib/sourceAdapters';
import { createUnifiedReservation } from '@/lib/reservationService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key');

    // Webhook secret validation if configured
    const expectedSecret = process.env.WEBSITE_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}` && authHeader !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized webhook secret' }, { status: 401 });
    }

    const normalizedInput = normalizeWebsiteBooking(payload);

    const result = await createUnifiedReservation(normalizedInput, {
      staffUserId: 'WEBSITE_WEBHOOK',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, conflict: result.conflict },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      isDuplicate: Boolean(result.isDuplicate),
      data: {
        id: result.reservation.id,
        reservationNumber: result.reservation.reservationNumber,
        status: result.reservation.status,
      },
    });
  } catch (error: any) {
    console.error('Website booking webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
