import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = invoices.map((inv) => {
      let parsedItems: any[] = [];
      try {
        parsedItems = inv.items ? JSON.parse(inv.items) : [];
      } catch {
        parsedItems = [];
      }

      return {
        id: inv.id,
        reservationId: inv.reservationId || undefined,
        invoiceDate: inv.invoiceDate.toISOString().split('T')[0],
        dueDate: inv.dueDate.toISOString().split('T')[0],
        guestName: inv.guestName || 'Guest',
        roomNumber: inv.roomNumber || 'N/A',
        items: parsedItems,
        subtotal: inv.subtotal,
        taxAmount: inv.tax,
        serviceCharge: inv.serviceCharge,
        discount: inv.discount,
        grandTotal: inv.total,
        paidAmount: inv.paidAmount,
        paymentMethod: inv.paymentMethod || undefined,
        status: inv.status,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reservationId,
      invoiceDate,
      dueDate,
      guestName,
      roomNumber,
      items = [],
      subtotal,
      taxAmount,
      serviceCharge = 0,
      discount = 0,
      grandTotal,
      paidAmount = 0,
      paymentMethod,
      status = 'UNPAID',
    } = body;

    const invoice = await prisma.invoice.create({
      data: {
        reservationId: reservationId || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        guestName: guestName || 'Guest',
        roomNumber: roomNumber || '',
        items: JSON.stringify(items),
        subtotal: Number(subtotal),
        tax: Number(taxAmount),
        serviceCharge: Number(serviceCharge),
        discount: Number(discount),
        total: Number(grandTotal),
        paidAmount: Number(paidAmount),
        paymentMethod: paymentMethod || null,
        status: status as InvoiceStatus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: invoice.id,
          reservationId: invoice.reservationId || undefined,
          invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
          dueDate: invoice.dueDate.toISOString().split('T')[0],
          guestName: invoice.guestName,
          roomNumber: invoice.roomNumber,
          items,
          subtotal: invoice.subtotal,
          taxAmount: invoice.tax,
          serviceCharge: invoice.serviceCharge,
          discount: invoice.discount,
          grandTotal: invoice.total,
          paidAmount: invoice.paidAmount,
          paymentMethod: invoice.paymentMethod || undefined,
          status: invoice.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
