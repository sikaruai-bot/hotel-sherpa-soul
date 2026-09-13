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

    // 1. Auto-sweep and release any expired no-show bookings to unblock rooms
    await autoReleaseExpiredNoShows().catch((err) =>
      console.warn('Auto-release no-show error on reservations GET:', err)
    );

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

    // 1. Validate Dates
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { success: false, error: 'Invalid dates: Check-out must be after check-in date.' },
        { status: 400 }
      );
    }

    // 2. Find Room
    const room = await prisma.room.findUnique({
      where: { roomNumber: String(roomNumber) },
      include: { roomType: true },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Room ${roomNumber} not found` },
        { status: 404 }
      );
    }

    // Auto-sweep expired no-shows before checking conflict so un-checked-in rooms can be booked
    await autoReleaseExpiredNoShows().catch((err) =>
      console.warn('Auto-release no-show error on reservations POST:', err)
    );

    // 2.5 CATEGORY-LEVEL CAPACITY SHIELD: Max 2 rooms per category per day
    const categoryCheck = await checkCategoryCapacity({
      categoryOrRoom: String(roomNumber),
      checkInDate: start,
      checkOutDate: end,
    });

    if (!categoryCheck.isAvailable) {
      const alternatives = await getAvailableAlternatives({
        checkInDate: start,
        checkOutDate: end,
        excludeCategoryId: categoryCheck.category.id,
      });

      const alertResult = await dispatchRoomFullAlert({
        guestName: body.guestName,
        phone: body.phoneNumber || body.phone,
        email: body.email,
        requestedCategory: categoryCheck.category.name,
        checkInDate: String(checkInDate),
        checkOutDate: String(checkOutDate),
        alternatives,
        source: body.source,
      });

      return NextResponse.json(
        {
          success: false,
          error: categoryCheck.conflictReason,
          category: categoryCheck.category.name,
          capacity: categoryCheck.totalCapacity,
          bookedCount: categoryCheck.bookedCount,
          roomFullMessage: alertResult.messageNepali,
          roomFullMessageEnglish: alertResult.fullMessage,
          alternatives: alertResult.alternatives,
          notificationStatus: alertResult.dispatchStatus,
        },
        { status: 409 }
      );
    }

    // 3. ZERO-DOUBLE-BOOKING SHIELD: Check existing overlapping reservations
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId: room.id,
        status: {
          in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.PENDING],
        },
        AND: [
          { checkInDate: { lt: end } },
          { checkOutDate: { gt: start } },
        ],
      },
      include: { guest: true },
    });

    if (conflictingReservation) {
      const existingIn = conflictingReservation.checkInDate.toISOString().split('T')[0];
      const existingOut = conflictingReservation.checkOutDate.toISOString().split('T')[0];
      return NextResponse.json(
        {
          success: false,
          error: `DOUBLE_BOOKING_PREVENTED: Room ${roomNumber} is already booked for ${conflictingReservation.guest.name} from ${existingIn} to ${existingOut}. Please pick an alternative room.`,
          conflict: {
            type: 'RESERVATION',
            guestName: conflictingReservation.guest.name,
            checkInDate: existingIn,
            checkOutDate: existingOut,
            source: conflictingReservation.source,
          },
        },
        { status: 409 }
      );
    }

    // 4. ZERO-DOUBLE-BOOKING SHIELD: Check active Long-Stay Contracts
    const conflictingContract = await prisma.longStayContract.findFirst({
      where: {
        roomId: room.id,
        status: {
          in: ['ACTIVE', 'EXPIRING'],
        },
        AND: [
          { startDate: { lt: end } },
          { endDate: { gt: start } },
        ],
      },
      include: { guest: true },
    });

    if (conflictingContract) {
      const leaseStart = conflictingContract.startDate.toISOString().split('T')[0];
      const leaseEnd = conflictingContract.endDate.toISOString().split('T')[0];
      return NextResponse.json(
        {
          success: false,
          error: `DOUBLE_BOOKING_PREVENTED: Room ${roomNumber} is under an active Long-Stay lease for ${conflictingContract.guest.name} from ${leaseStart} to ${leaseEnd}.`,
          conflict: {
            type: 'LONG_STAY',
            guestName: conflictingContract.guest.name,
            checkInDate: leaseStart,
            checkOutDate: leaseEnd,
          },
        },
        { status: 409 }
      );
    }

    // 5. Find or create Guest
    let guest = await prisma.guest.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phoneNumber: phone }] : []),
          ...(passportNumber ? [{ passportNumber }] : []),
          { name: guestName },
        ],
      },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: guestName,
          email: email || null,
          phoneNumber: phone || null,
          nationality,
          passportNumber: passportNumber || null,
        },
      });
    } else {
      // Update info if provided
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          ...(passportNumber && { passportNumber }),
          ...(phone && { phoneNumber: phone }),
          ...(email && { email }),
          ...(nationality && { nationality }),
        },
      });
    }

    // 3. Create Reservation
    const prismaSource = sourceMap[source] || BookingSource.DIRECT;
    const reservation = await prisma.reservation.create({
      data: {
        otaConfirmNum: otaReference || null,
        guestId: guest.id,
        roomId: room.id,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        adults: Number(adults),
        children: Number(children),
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        status: status as ReservationStatus,
        source: prismaSource,
        specialRequests: specialRequests || null,
      },
    });

    // 4. Update room status if checking in immediately or reservation is confirmed
    if (status === 'CHECKED_IN') {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: RoomStatus.OCCUPIED,
          currentGuest: guestName,
        },
      });
    } else if (status === 'CONFIRMED' && room.status === RoomStatus.AVAILABLE) {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: RoomStatus.RESERVED,
          currentGuest: guestName,
        },
      });
    }

    // 5. Create notification
    await prisma.notification.create({
      data: {
        title: `New Reservation: ${guestName}`,
        detail: `Room ${roomNumber} booked from ${checkInDate} to ${checkOutDate} via ${source}.`,
        type: 'Booking',
        channel: 'In-App',
        status: 'Delivered',
      },
    });

    // 5.5 Automatically send email notification to Official Hotel Email & Guest
    sendBookingNotificationToOfficialMail({
      id: reservation.id,
      guestName,
      email: guest.email,
      phone: guest.phoneNumber,
      nationality: guest.nationality,
      roomNumber: room.roomNumber,
      roomType: room.roomType.name,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      adults: Number(adults),
      children: Number(children),
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount),
      source,
      specialRequests,
      otaReference,
    }).catch((err) => console.warn('Official email notification error:', err));

    if (guest.email) {
      sendBookingConfirmationToGuest({
        id: reservation.id,
        guestName,
        email: guest.email,
        phone: guest.phoneNumber,
        roomNumber: room.roomNumber,
        roomType: room.roomType.name,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        totalAmount: Number(totalAmount),
      }).catch((err) => console.warn('Guest confirmation email error:', err));
    }

    // 6. Emit Automation Event for Webhooks & Zapier
    await emitPmsEvent('booking.created', {
      reservationId: reservation.id,
      guestName,
      email: guest.email,
      phone: guest.phoneNumber,
      roomNumber,
      roomType: room.roomType.name,
      checkInDate,
      checkOutDate,
      totalAmount,
      source,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: reservation.id,
          otaReference: reservation.otaConfirmNum || undefined,
          guestName,
          email: guest.email || '',
          phone: guest.phoneNumber || '',
          nationality: guest.nationality || '',
          passportNumber: guest.passportNumber || '',
          roomNumber,
          roomType: room.roomType.name,
          checkInDate,
          checkOutDate,
          adults: reservation.adults,
          children: reservation.children,
          totalAmount: reservation.totalAmount,
          paidAmount: reservation.paidAmount,
          status: reservation.status,
          source,
          specialRequests: reservation.specialRequests || undefined,
          createdAt: reservation.createdAt.toISOString(),
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
