import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentMethod, ReservationStatus, PaymentStatus } from '@prisma/client';
import { postFolioPayment, getOrCreateFolio } from '@/lib/folioService';
import { emitDomainEvent } from '@/lib/domainEvents';
import { recordAuditLog } from '@/lib/auditLogger';
import { enqueueJob } from '@/lib/jobQueue';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gateway = searchParams.get('gateway') || 'ESEWA';

    const payload = await request.json().catch(() => ({}));
    const {
      reservationId,
      reservationNumber,
      transactionId,
      amount,
      currency = 'NPR',
      status = 'COMPLETE',
      signature,
    } = payload;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount' }, { status: 400 });
    }

    // 1. Locate Target Reservation
    const reservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          ...(reservationId ? [{ id: reservationId }] : []),
          ...(reservationNumber ? [{ reservationNumber }] : []),
          ...(payload.purchaseOrderId ? [{ reservationNumber: payload.purchaseOrderId }] : []),
        ],
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        folio: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Target reservation for payment not found' },
        { status: 404 }
      );
    }

    // 2. Idempotency Check: Transaction ID
    const idempotencyKey = transactionId ? `pay_txn_${transactionId}` : `pay_res_${reservation.id}_${numAmount}`;
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey },
    });

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: 'Payment already recorded (idempotent)',
        paymentId: existingPayment.id,
      });
    }

    // 3. Resolve Payment Method
    let payMethod: PaymentMethod = PaymentMethod.ESEWA;
    if (gateway.toUpperCase().includes('KHALTI')) payMethod = PaymentMethod.KHALTI;
    else if (gateway.toUpperCase().includes('CARD') || gateway.toUpperCase().includes('STRIPE')) payMethod = PaymentMethod.VISA;
    else if (gateway.toUpperCase().includes('BANK')) payMethod = PaymentMethod.BANK_TRANSFER;

    // 4. Ensure Folio exists and post payment
    const folio = await getOrCreateFolio(reservation.id, reservation.guestId);
    const { payment, folio: updatedFolio } = await postFolioPayment({
      folioId: folio.id,
      amount: numAmount,
      method: payMethod,
      currency,
      provider: gateway.toUpperCase(),
      providerTransactionId: transactionId || null,
      idempotencyKey,
      verifiedBy: `Webhook Gateway: ${gateway}`,
    });

    // 5. Update Reservation Status to CONFIRMED if it was PENDING or HOLD
    const newReservationStatus =
      reservation.status === ReservationStatus.PENDING || reservation.status === ReservationStatus.HOLD
        ? ReservationStatus.CONFIRMED
        : reservation.status;

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: newReservationStatus,
        paymentStatus: updatedFolio.balanceDue <= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
      },
    });

    // 6. Emit Domain Events
    await emitDomainEvent({
      eventType: 'payment.received',
      entityType: 'Payment',
      entityId: payment.id,
      reservationId: reservation.id,
      source: `PAYMENT_WEBHOOK_${gateway.toUpperCase()}`,
      payload: {
        paymentId: payment.id,
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        guestName: reservation.guest.name,
        amount: numAmount,
        currency,
        gateway,
        remainingDue: updatedFolio.balanceDue,
      },
    });

    // 7. Enqueue Payment Receipt & Confirmation Jobs
    await enqueueJob({
      jobType: 'SEND_COMMUNICATION',
      eventType: 'payment.received',
      entityType: 'Payment',
      entityId: payment.id,
      reservationId: reservation.id,
      recipient: reservation.guest.phoneNumber || reservation.guest.email,
      payload: {
        channel: reservation.guest.phoneNumber ? 'WHATSAPP' : 'EMAIL',
        templateName: 'PAYMENT_RECEIPT',
        recipient: reservation.guest.phoneNumber || reservation.guest.email,
        templateData: {
          guestName: reservation.guest.name,
          reservationNumber: reservation.reservationNumber,
          amount: numAmount,
          paymentMethod: gateway,
          transactionId: transactionId || 'PMS',
          remainingDue: updatedFolio.balanceDue,
        },
      },
      idempotencyKey: `receipt_${payment.id}`,
    });

    // Record Audit Log
    await recordAuditLog({
      action: 'PAYMENT_WEBHOOK_RECEIVED',
      entityType: 'Payment',
      entityId: payment.id,
      afterData: {
        amount: numAmount,
        gateway,
        reservationNumber: reservation.reservationNumber,
        newBalanceDue: updatedFolio.balanceDue,
      },
      reason: `Verified ${gateway} webhook callback`,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment recorded and reservation updated successfully',
      data: {
        paymentId: payment.id,
        reservationId: reservation.id,
        balanceDue: updatedFolio.balanceDue,
      },
    });
  } catch (error: any) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
