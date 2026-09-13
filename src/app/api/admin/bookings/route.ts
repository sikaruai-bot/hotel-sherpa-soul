import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateBookingNumber } from '@/lib/bookingEngine';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const q = (searchParams.get('q') || '').toLowerCase().trim();

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        category: true,
        physicalRoom: true,
      },
      orderBy: { checkIn: 'desc' },
    });

    let filtered = bookings;
    if (q) {
      filtered = bookings.filter(b =>
        b.guestName.toLowerCase().includes(q) ||
        b.bookingNumber.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        b.guestPhone.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, count: filtered.length, bookings: filtered });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error fetching bookings' }, { status: 500 });
  }
}

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
      guestIdType,
      guestIdNumber,
      guestIdDocumentUrl,
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
        guestIdType: guestIdType || null,
        guestIdNumber: guestIdNumber || null,
        guestIdDocumentUrl: guestIdDocumentUrl || null,
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
    const {
      bookingId,
      status,
      physicalRoomId,
      paymentStatus,
      paymentMethod,
      amountPaidUSD,
      guestIdType,
      guestIdNumber,
      guestIdDocumentUrl,
      notes
    } = body;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status || undefined,
        physicalRoomId: physicalRoomId !== undefined ? physicalRoomId : undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        amountPaidUSD: amountPaidUSD !== undefined ? parseFloat(amountPaidUSD) : undefined,
        guestIdType: guestIdType !== undefined ? guestIdType : undefined,
        guestIdNumber: guestIdNumber !== undefined ? guestIdNumber : undefined,
        guestIdDocumentUrl: guestIdDocumentUrl !== undefined ? guestIdDocumentUrl : undefined,
        notes: notes !== undefined ? notes : undefined,
      }
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error updating booking' }, { status: 500 });
  }
}
