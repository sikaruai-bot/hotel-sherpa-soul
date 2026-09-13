import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    let parsedItems = [];
    try {
      parsedItems = invoice.items ? JSON.parse(invoice.items) : [];
    } catch {
      parsedItems = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invoice.id,
        reservationId: invoice.reservationId || undefined,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        guestName: invoice.guestName || 'Guest',
        roomNumber: invoice.roomNumber || 'N/A',
        items: parsedItems,
        subtotal: invoice.subtotal,
        taxAmount: invoice.tax,
        serviceCharge: invoice.serviceCharge,
        discount: invoice.discount,
        grandTotal: invoice.total,
        paidAmount: invoice.paidAmount,
        paymentMethod: invoice.paymentMethod || undefined,
        status: invoice.status,
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      items,
      subtotal,
      discount,
      grandTotal,
      paidAmount,
      status,
      guestName,
      roomNumber,
      paymentMethod,
    } = body;

    const dataToUpdate: any = {};

    if (items !== undefined) {
      dataToUpdate.items = typeof items === 'string' ? items : JSON.stringify(items);
    }
    if (subtotal !== undefined) dataToUpdate.subtotal = Number(subtotal);
    if (discount !== undefined) dataToUpdate.discount = Number(discount);
    if (grandTotal !== undefined) dataToUpdate.total = Number(grandTotal);
    if (paidAmount !== undefined) dataToUpdate.paidAmount = Number(paidAmount);
    if (status !== undefined) dataToUpdate.status = status as InvoiceStatus;
    if (guestName !== undefined) dataToUpdate.guestName = guestName;
    if (roomNumber !== undefined) dataToUpdate.roomNumber = roomNumber;
    if (paymentMethod !== undefined) dataToUpdate.paymentMethod = paymentMethod;

    const updated = await prisma.invoice.update({
      where: { id },
      data: dataToUpdate,
    });

    let parsedItems = [];
    try {
      parsedItems = updated.items ? JSON.parse(updated.items) : [];
    } catch {
      parsedItems = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        reservationId: updated.reservationId || undefined,
        invoiceDate: updated.invoiceDate.toISOString().split('T')[0],
        dueDate: updated.dueDate.toISOString().split('T')[0],
        guestName: updated.guestName || 'Guest',
        roomNumber: updated.roomNumber || 'N/A',
        items: parsedItems,
        subtotal: updated.subtotal,
        taxAmount: updated.tax,
        serviceCharge: updated.serviceCharge,
        discount: updated.discount,
        grandTotal: updated.total,
        paidAmount: updated.paidAmount,
        paymentMethod: updated.paymentMethod || undefined,
        status: updated.status,
      },
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
