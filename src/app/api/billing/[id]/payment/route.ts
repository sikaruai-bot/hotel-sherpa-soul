import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentMethod, InvoiceStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';

const methodMap: Record<string, PaymentMethod> = {
  'Cash NPR': PaymentMethod.CASH_NPR,
  'Cash USD': PaymentMethod.CASH_USD,
  'eSewa': PaymentMethod.ESEWA,
  'Khalti': PaymentMethod.KHALTI,
  'Visa': PaymentMethod.VISA,
  'MasterCard': PaymentMethod.MASTERCARD,
  'Bank Transfer': PaymentMethod.BANK_TRANSFER,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, method = 'eSewa', transactionId } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const payMethodEnum = methodMap[method] || PaymentMethod.CASH_NPR;
    const newPaidAmount = invoice.paidAmount + Number(amount);
    const newStatus: InvoiceStatus =
      newPaidAmount >= invoice.total ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    // Create payment record & update invoice
    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: Number(amount),
          method: payMethodEnum,
          transactionId: transactionId || null,
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          paymentMethod: method,
          status: newStatus,
        },
      }),
    ]);

    // Emit Automation Event for Webhooks
    await emitPmsEvent('payment.received', {
      invoiceId: invoice.id,
      amount: Number(amount),
      paymentMethod: method,
      guestName: invoice.guestName,
      roomNumber: invoice.roomNumber,
      totalPaid: newPaidAmount,
      balanceRemaining: Math.max(0, invoice.total - newPaidAmount),
      status: newStatus,
    });

    return NextResponse.json({
      success: true,
      data: {
        payment,
        invoice: updatedInvoice,
      },
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
