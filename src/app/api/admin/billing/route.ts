import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const invoices = await prisma.invoice.findMany({
      include: { booking: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const totalCollected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
    const totalOutstanding = totalInvoiced - totalCollected;

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    for (const inv of invoices) {
      const pm = inv.paymentMethod || 'UNSPECIFIED';
      paymentMethods[pm] = (paymentMethods[pm] || 0) + inv.amountPaid;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalInvoices: invoices.length,
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        paymentMethods,
      },
      invoices,
    });
  } catch (error: any) {
    console.error('Billing GET error:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching billing records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      bookingId,
      guestName,
      guestEmail,
      guestPhone,
      guestPassport,
      roomNumber,
      checkIn,
      checkOut,
      items, // array of { description, quantity, unitPrice, total }
      taxRate = 0.13, // 13% VAT
      serviceChargeRate = 0.10, // 10% Service Charge
      discount = 0,
      paymentMethod,
      amountPaid = 0,
      notes,
    } = body;

    const subtotal = items.reduce((acc: number, item: any) => acc + (item.total || item.quantity * item.unitPrice), 0);
    const serviceCharge = Math.round(subtotal * serviceChargeRate);
    const taxAmount = Math.round((subtotal + serviceCharge) * taxRate);
    const grandTotal = Math.max(0, subtotal + serviceCharge + taxAmount - discount);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const status = amountPaid >= grandTotal ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: bookingId || null,
        guestName,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        guestPassport: guestPassport || null,
        roomNumber: roomNumber || '201',
        checkIn: new Date(checkIn || new Date()),
        checkOut: new Date(checkOut || new Date()),
        items: JSON.stringify(items),
        subtotal,
        serviceCharge,
        taxAmount,
        discount,
        grandTotal,
        amountPaid,
        paymentMethod: paymentMethod || null,
        status,
        notes: notes || null,
      },
    });

    // If linked to a booking, update booking paymentStatus
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: status,
          amountPaidUSD: amountPaid,
          paymentMethod: paymentMethod || undefined,
        },
      });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ error: error?.message || 'Error creating invoice' }, { status: 500 });
  }
}
