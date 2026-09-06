import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus, RoomStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

// GET: Lookup reservation by booking confirmation code, phone number, or guest name
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Please provide your booking reference or phone number.' },
        { status: 400 }
      );
    }

    // Search by reservation ID, otaConfirmNum, or guest's phone / name
    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { id: { equals: query } },
          { otaConfirmNum: { contains: query, mode: 'insensitive' } },
          {
            guest: {
              OR: [
                { phoneNumber: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        guest: true,
        room: {
          include: { roomType: true },
        },
      },
      orderBy: { checkInDate: 'desc' },
      take: 5,
    });

    if (!reservations || reservations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No booking found with this reference or phone number. Please check your booking confirmation or contact front desk.',
        },
        { status: 404 }
      );
    }

    // Format safe response for guest
    const formatted = reservations.map((res) => ({
      id: res.id,
      otaConfirmNum: res.otaConfirmNum || res.id.slice(0, 8).toUpperCase(),
      guestName: res.guest.name,
      guestPhone: res.guest.phoneNumber,
      hasPassport: Boolean(res.guest.passportNumber),
      roomNumber: res.room.roomNumber,
      roomType: res.room.roomType.name,
      floor: res.room.floor,
      checkInDate: res.checkInDate,
      checkOutDate: res.checkOutDate,
      adults: res.adults,
      status: res.status,
      totalAmount: res.totalAmount,
      paidAmount: res.paidAmount,
      balanceDue: Math.max(0, res.totalAmount - res.paidAmount),
      source: res.source,
      alreadyCheckedIn: res.status === ReservationStatus.CHECKED_IN,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Self check-in lookup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Execute self check-in
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reservationId, passportNumber, nationality, phoneNumber } = body;

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'Reservation ID is required.' },
        { status: 400 }
      );
    }

    if (!passportNumber || passportNumber.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Passport or ID number is required by Nepal tourism regulations.' },
        { status: 400 }
      );
    }

    // Find reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        room: {
          include: { roomType: true },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found.' },
        { status: 404 }
      );
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: 'This booking was cancelled. Please contact management.' },
        { status: 400 }
      );
    }

    // Update guest passport and contact details
    await prisma.guest.update({
      where: { id: reservation.guestId },
      data: {
        passportNumber: passportNumber.trim(),
        ...(nationality ? { nationality: nationality.trim() } : {}),
        ...(phoneNumber ? { phoneNumber: phoneNumber.trim() } : {}),
      },
    });

    // Update reservation to CHECKED_IN
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.CHECKED_IN,
      },
    });

    // Update room to OCCUPIED
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: {
        status: RoomStatus.OCCUPIED,
        currentGuest: reservation.guest.name,
      },
    });

    // Staff in-app notification
    await prisma.notification.create({
      data: {
        title: `📱 QR Self Check-In: ${reservation.guest.name}`,
        detail: `Room ${reservation.room.roomNumber} (${reservation.room.roomType.name}) was self-checked in via QR code. ID: ${passportNumber}.`,
        type: 'Booking',
        channel: 'In-App',
        status: 'Delivered',
      },
    });

    // Emit webhook / automation event
    await emitPmsEvent('guest.checked_in', {
      reservationId: reservation.id,
      guestName: reservation.guest.name,
      roomNumber: reservation.room.roomNumber,
      passportNumber: passportNumber.trim(),
      method: 'QR_SELF_CHECKIN',
      checkedInAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Self check-in completed successfully! Welcome to Hotel Sherpa Soul.',
      data: {
        guestName: reservation.guest.name,
        roomNumber: reservation.room.roomNumber,
        floor: reservation.room.floor,
        roomType: reservation.room.roomType.name,
        bedType: reservation.room.roomType.bedType,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        wifiNetwork: 'Hotel Sherpa Soul Guest',
        wifiPassword: 'ThamelSleepWell2026',
        kitchenEligible: reservation.room.kitchenEligible,
        kitchenHours: '06:00 AM - 10:00 PM (Ground Floor)',
        keyPickupInstructions:
          'Your physical room key is in the Key Drop Box at Reception labeled with your Room Number. If the key box is locked, please press the bell or call manager.',
        emergencyContact: '+977-9851068219 (Pasang / Mingma Sherpa)',
        landline: '+977-1-4530311',
        address: 'Bhagawati Marg -26, Thamel, Kathmandu, Nepal',
      },
    });
  } catch (error: any) {
    console.error('Self check-in error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
