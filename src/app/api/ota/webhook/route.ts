import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingSource, ReservationStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';
import { checkCategoryCapacity, getAvailableAlternatives, dispatchRoomFullAlert } from '@/lib/roomCategoryShield';
import { sendBookingNotificationToOfficialMail } from '@/lib/emailService';

const sourceMap: Record<string, BookingSource> = {
  BOOKING_COM: BookingSource.BOOKING_COM,
  'BOOKING.COM': BookingSource.BOOKING_COM,
  AIRBNB: BookingSource.AIRBNB,
  AGODA: BookingSource.AGODA,
  EXPEDIA: BookingSource.EXPEDIA,
  TRIP_COM: BookingSource.TRIP_COM,
  'TRIP.COM': BookingSource.TRIP_COM,
  VRBO: BookingSource.VRBO,
  DIRECT: BookingSource.DIRECT,
  WEBSITE: BookingSource.DIRECT,
};

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelQuery = searchParams.get('channel') || 'CUSTOM';

    const payload = await request.json().catch(() => ({}));
    const {
      guestName,
      email,
      phone,
      nationality = 'International',
      passportNumber,
      roomNumber,
      checkInDate,
      checkOutDate,
      adults = 2,
      children = 0,
      totalAmount,
      paidAmount,
      source = channelQuery,
      otaReference,
      specialRequests,
    } = payload;

    if (!roomNumber || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required booking fields: roomNumber, checkInDate, checkOutDate',
        },
        { status: 400 }
      );
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { success: false, error: 'Invalid dates provided' },
        { status: 400 }
      );
    }

    // Find target room
    const room = await prisma.room.findUnique({
      where: { roomNumber: String(roomNumber) },
      include: { roomType: true },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Room ${roomNumber} not found in Hotel Sherpa Soul PMS` },
        { status: 404 }
      );
    }

    // CATEGORY CAPACITY SHIELD: Check if 2 rooms in this category are already booked
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
        guestName,
        phone,
        email,
        requestedCategory: categoryCheck.category.name,
        checkInDate: String(checkInDate),
        checkOutDate: String(checkOutDate),
        alternatives,
        source: String(source),
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

    // ZERO-DOUBLE-BOOKING SHIELD: Check conflict with existing reservations
    const conflictRes = await prisma.reservation.findFirst({
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

    if (conflictRes) {
      const msg = `PMS SHIELD REJECTED: Room ${roomNumber} is already occupied by ${conflictRes.guest.name} from ${conflictRes.checkInDate.toISOString().split('T')[0]} to ${conflictRes.checkOutDate.toISOString().split('T')[0]}.`;
      
      await prisma.otaSyncLog.create({
        data: {
          channel: String(source).toUpperCase(),
          roomNumber: String(roomNumber),
          action: 'WEBHOOK_PUSH',
          status: 'CONFLICT_PREVENTED',
          message: msg,
          details: JSON.stringify(payload),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: msg,
          conflict: {
            existingGuest: conflictRes.guest.name,
            checkInDate: conflictRes.checkInDate,
            checkOutDate: conflictRes.checkOutDate,
          },
        },
        { status: 409 }
      );
    }

    // Check conflict with long-stay contracts
    const conflictContract = await prisma.longStayContract.findFirst({
      where: {
        roomId: room.id,
        status: 'ACTIVE',
        AND: [
          { startDate: { lt: end } },
          { endDate: { gt: start } },
        ],
      },
      include: { guest: true },
    });

    if (conflictContract) {
      const msg = `PMS SHIELD REJECTED: Room ${roomNumber} is under active Long Stay lease by ${conflictContract.guest.name}.`;
      await prisma.otaSyncLog.create({
        data: {
          channel: String(source).toUpperCase(),
          roomNumber: String(roomNumber),
          action: 'WEBHOOK_PUSH',
          status: 'CONFLICT_PREVENTED',
          message: msg,
          details: JSON.stringify(payload),
        },
      });

      return NextResponse.json(
        { success: false, error: msg },
        { status: 409 }
      );
    }

    // Guest creation / retrieval
    let guest = await prisma.guest.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { name: guestName || 'OTA Guest' },
        ],
      },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: guestName || `${source} Guest`,
          email: email || `${(guestName || 'guest').toLowerCase().replace(/\s+/g, '.')}@channel.com`,
          phoneNumber: phone || null,
          nationality,
          passportNumber: passportNumber || null,
        },
      });
    }

    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const calculatedTotal = totalAmount || nights * room.roomType.dailyRate;
    const finalPaid = paidAmount !== undefined ? paidAmount : calculatedTotal;

    const sourceEnum = sourceMap[String(source).toUpperCase()] || BookingSource.DIRECT;

    const reservation = await prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId: room.id,
        checkInDate: start,
        checkOutDate: end,
        adults: Number(adults) || 2,
        children: Number(children) || 0,
        totalAmount: calculatedTotal,
        paidAmount: finalPaid,
        status: ReservationStatus.CONFIRMED,
        source: sourceEnum,
        otaConfirmNum: otaReference || `WH-${Date.now().toString().slice(-6)}`,
        specialRequests: specialRequests || `Instant Webhook Booking from ${source}`,
      },
      include: { guest: true, room: true },
    });

    await prisma.otaSyncLog.create({
      data: {
        channel: String(source).toUpperCase(),
        roomNumber: String(roomNumber),
        action: 'WEBHOOK_PUSH',
        status: 'SUCCESS',
        message: `Webhook created confirmed booking #${reservation.id.slice(0, 8)} for ${guest.name} (Room ${roomNumber})`,
        details: JSON.stringify({ reservationId: reservation.id, totalAmount: calculatedTotal }),
      },
    });

    // Notify official hotel email about incoming OTA webhook booking
    sendBookingNotificationToOfficialMail({
      id: reservation.id,
      guestName: guest.name,
      email: guest.email,
      phone: guest.phoneNumber,
      roomNumber: room.roomNumber,
      roomType: room.roomType.name,
      checkInDate: start,
      checkOutDate: end,
      adults: Number(adults) || 2,
      children: Number(children) || 0,
      totalAmount: calculatedTotal,
      paidAmount: finalPaid,
      source: String(source),
      otaReference,
    }).catch((err) => console.warn('Official email notification error on webhook:', err));

    emitPmsEvent('booking.created', reservation);

    return NextResponse.json({
      success: true,
      message: `Reservation confirmed for Room ${roomNumber}`,
      data: {
        id: reservation.id,
        roomNumber,
        guestName: guest.name,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        totalAmount: calculatedTotal,
      },
    });
  } catch (error: any) {
    console.error('Error in OTA webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook internal error' },
      { status: 500 }
    );
  }
}
