import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reservationId, reservationNumber, amount, provider = 'ESEWA' } = body;

    if (!reservationId && !reservationNumber) {
      return NextResponse.json(
        { success: false, error: 'reservationId or reservationNumber is required.' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          ...(reservationId ? [{ id: reservationId }] : []),
          ...(reservationNumber ? [{ reservationNumber }] : []),
        ],
      },
      include: { guest: true, room: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found.' },
        { status: 404 }
      );
    }

    const payableAmount = Number(amount) || reservation.dueAmount || reservation.totalAmount;
    const paymentIntentId = `pi_${randomUUID().replace(/-/g, '')}`;
    const merchantTxnId = `HSS-TXN-${Date.now().toString().slice(-6)}`;

    // Prepare provider-specific checkout parameters
    let providerPayload: any = {};

    if (provider.toUpperCase() === 'ESEWA') {
      providerPayload = {
        actionUrl: 'https://epay.esewa.com.np/api/epay/main/v2/form',
        productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
        totalAmount: payableAmount,
        transactionUuid: merchantTxnId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pms.hotelsherpasoul.com'}/api/webhooks/payment?gateway=esewa`,
        failureUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pms.hotelsherpasoul.com'}/booking-status?status=failed`,
      };
    } else if (provider.toUpperCase() === 'KHALTI') {
      providerPayload = {
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pms.hotelsherpasoul.com'}/api/webhooks/payment?gateway=khalti`,
        websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://pms.hotelsherpasoul.com',
        amount: Math.round(payableAmount * 100), // Khalti uses paisa
        purchaseOrderId: merchantTxnId,
        purchaseOrderName: `Hotel Sherpa Soul Booking #${reservation.reservationNumber}`,
      };
    } else {
      providerPayload = {
        paymentMethod: 'CARD_STRIPE',
        currency: 'USD',
        amount: payableAmount,
        clientSecret: `mock_sec_${randomUUID()}`,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentIntentId,
        merchantTxnId,
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        guestName: reservation.guest.name,
        amount: payableAmount,
        currency: reservation.currency,
        provider,
        providerConfig: providerPayload,
      },
    });
  } catch (error: any) {
    console.error('Payment intent error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
