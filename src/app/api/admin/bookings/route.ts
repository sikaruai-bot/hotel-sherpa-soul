import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateBookingNumber } from '@/lib/bookingEngine';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      checkIn,
      checkOut,
      adults,
      children = 0,
      categoryId,
      physicalRoomId,
      guestName,
      guestEmail,
      guestPhone,
      guestWhatsApp,
      guestCountry,
      totalAmountUSD,
      paymentStatus = 'UNPAID',
      paymentMethod,
      source = 'WALK_IN',
      notes,
    } = body;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        adults: parseInt(adults),
        children: parseInt(children),
        guestName,
        guestEmail,
        guestPhone,
        guestWhatsApp: guestWhatsApp || guestPhone,
        guestCountry: guestCountry || null,
        categoryId,
        physicalRoomId: physicalRoomId || null,
        totalAmountUSD: parseFloat(totalAmountUSD),
        paymentStatus,
        paymentMethod: paymentMethod || null,
        status: 'CONFIRMED',
        source,
        notes: notes || 'Created via Admin Portal',
      }
    });

    return NextResponse.json({ success: true, booking });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error creating booking' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { bookingId, status, physicalRoomId, paymentStatus, paymentMethod, amountPaidUSD, notes } = body;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status || undefined,
        physicalRoomId: physicalRoomId !== undefined ? physicalRoomId : undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        amountPaidUSD: amountPaidUSD !== undefined ? parseFloat(amountPaidUSD) : undefined,
        notes: notes !== undefined ? notes : undefined,
      }
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error updating booking' }, { status: 500 });
  }
}
