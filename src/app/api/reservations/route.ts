import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingSource, ReservationStatus, RoomStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';
import { autoReleaseExpiredNoShows } from '@/lib/autoReleaseNoShows';
import { checkCategoryCapacity, getAvailableAlternatives, dispatchRoomFullAlert } from '@/lib/roomCategoryShield';
import { sendBookingNotificationToOfficialMail, sendBookingConfirmationToGuest } from '@/lib/emailService';

// Map UI sources to Prisma enum values
const sourceMap: Record<string, BookingSource> = {
  'Booking.com': BookingSource.BOOKING_COM,
  'Agoda': BookingSource.AGODA,
  'Airbnb': BookingSource.AIRBNB,
  'Trip.com': BookingSource.TRIP_COM,
  'Expedia': BookingSource.EXPEDIA,
  'Vrbo': BookingSource.VRBO,
  'Direct Website': BookingSource.DIRECT,
  'Walk-In': BookingSource.WALK_IN,
  'WhatsApp': BookingSource.WHATSAPP,
  'Phone': BookingSource.PHONE,
  'Manual': BookingSource.MANUAL,
};

const reverseSourceMap: Record<BookingSource, string> = {
  [BookingSource.BOOKING_COM]: 'Booking.com',
  [BookingSource.AGODA]: 'Agoda',
  [BookingSource.AIRBNB]: 'Airbnb',
  [BookingSource.TRIP_COM]: 'Trip.com',
  [BookingSource.EXPEDIA]: 'Expedia',
  [BookingSource.VRBO]: 'Vrbo',
  [BookingSource.DIRECT]: 'Direct Website',
  [BookingSource.WEBSITE]: 'Direct Website',
  [BookingSource.WALK_IN]: 'Walk-In',
  [BookingSource.WHATSAPP]: 'WhatsApp',
  [BookingSource.PHONE]: 'Phone',
  [BookingSource.MANUAL]: 'Manual',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    // Auto-release expired un-checked-in bookings so rooms immediately become AVAILABLE (खाली)
    try {
      await autoReleaseExpiredNoShows();
    } catch (sweepErr) {
      console.warn('Auto-release expired no-shows background check failed:', sweepErr);
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        ...(statusParam && { status: statusParam as ReservationStatus }),
      },
      include: {
        guest: true,
        room: {
          include: {
            roomType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = reservations.map((r) => ({
      id: r.id,
      otaReference: r.otaConfirmNum || undefined,
      guestName: r.guest.name,
      email: r.guest.email || '',
      phone: r.guest.phoneNumber || '',
      nationality: r.guest.nationality || 'Nepal',
      passportNumber: r.guest.passportNumber || '',
      idNumber: r.guest.idNumber || r.guest.passportNumber || '',
      photoUrl: r.guest.photoUrl || undefined,
      signatureUrl: r.guest.signatureUrl || undefined,
      isBlacklisted: Boolean(r.guest.isBlacklisted),
      blacklistReason: r.guest.blacklistReason || undefined,
      roomNumber: r.room.roomNumber,
      roomType: r.room.roomType.name,
      checkInDate: r.checkInDate.toISOString().split('T')[0],
      checkOutDate: r.checkOutDate.toISOString().split('T')[0],
      adults: r.adults,
      children: r.children,
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      status: r.status,
      source: reverseSourceMap[r.source] || 'Direct Website',
      specialRequests: r.specialRequests || undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching reservations:', error);
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
      otaReference,
      guestName,
      email,
      phone,
      nationality = 'Nepal',
      passportNumber,
      idNumber,
      idType,
      photoUrl,
      roomNumber,
      checkInDate,
      checkOutDate,
      adults = 1,
      children = 0,
      totalAmount,
      paidAmount = 0,
      status = 'CONFIRMED',
      source = 'Direct Website',
      specialRequests,
    } = body;

    const prismaSource = sourceMap[source] || BookingSource.DIRECT;

    // Delegate to Unified Reservation Service
    const { createUnifiedReservation } = await import('@/lib/reservationService');
    const result = await createUnifiedReservation(
      {
        guestName,
        email,
        phone,
        nationality,
        passportNumber,
        idNumber,
        idType,
        photoUrl,
        roomNumber: String(roomNumber),
        checkInDate,
        checkOutDate,
        adults: Number(adults),
        children: Number(children),
        totalAmount: totalAmount ? Number(totalAmount) : undefined,
        paidAmount: Number(paidAmount),
        status: status as any,
        source: prismaSource,
        externalBookingId: otaReference || null,
        specialRequests: specialRequests || null,
        isInstantCheckIn: status === 'CHECKED_IN' || source === 'Walk-In',
      },
      { staffUserId: 'FRONT_DESK_STAFF' }
    );

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

    const r = result.reservation;
    return NextResponse.json(
      {
        success: true,
        data: {
          id: r.id,
          otaReference: r.otaConfirmNum || undefined,
          guestName: r.guest.name,
          email: r.guest.email || '',
          phone: r.guest.phoneNumber || '',
          nationality: r.guest.nationality || '',
          passportNumber: r.guest.passportNumber || '',
          roomNumber: r.room?.roomNumber || '',
          roomType: r.room?.roomType?.name || '',
          checkInDate: r.checkInDate.toISOString().split('T')[0],
          checkOutDate: r.checkOutDate.toISOString().split('T')[0],
          adults: r.adults,
          children: r.children,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          status: r.status,
          source: reverseSourceMap[r.source as BookingSource] || 'Direct Website',
          specialRequests: r.specialRequests || undefined,
          createdAt: r.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
