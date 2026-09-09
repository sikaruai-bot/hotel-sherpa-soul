import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus, RoomStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        room: {
          include: { roomType: true },
        },
        invoices: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: reservation });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, passportNumber, paidAmount, specialRequests, checkInDate, checkOutDate, roomNumber, roomId } = body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { guest: true, room: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Determine target room and dates
    let targetRoomId = reservation.roomId;
    if (roomNumber) {
      const targetRoom = await prisma.room.findUnique({ where: { roomNumber: String(roomNumber) } });
      if (!targetRoom) {
        return NextResponse.json({ success: false, error: `Room ${roomNumber} not found` }, { status: 404 });
      }
      targetRoomId = targetRoom.id;
    } else if (roomId) {
      targetRoomId = roomId;
    }

    const newStart = checkInDate ? new Date(checkInDate) : reservation.checkInDate;
    const newEnd = checkOutDate ? new Date(checkOutDate) : reservation.checkOutDate;

    if (newStart >= newEnd) {
      return NextResponse.json({ success: false, error: 'Check-out must be after check-in date.' }, { status: 400 });
    }

    // If dates or room are changing, verify no overlap with other reservations
    if (checkInDate || checkOutDate || roomNumber || roomId) {
      const conflict = await prisma.reservation.findFirst({
        where: {
          id: { not: id },
          roomId: targetRoomId,
          status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.PENDING] },
          AND: [
            { checkInDate: { lt: newEnd } },
            { checkOutDate: { gt: newStart } },
          ],
        },
        include: { guest: true },
      });

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: `DOUBLE_BOOKING_PREVENTED: Room is already booked for ${conflict.guest.name} from ${conflict.checkInDate.toISOString().split('T')[0]} to ${conflict.checkOutDate.toISOString().split('T')[0]}.`,
          },
          { status: 409 }
        );
      }
    }

    // If passport provided during check-in, update guest
    if (passportNumber) {
      await prisma.guest.update({
        where: { id: reservation.guestId },
        data: { passportNumber },
      });
    }

    // Update reservation
    const updatedRes = await prisma.reservation.update({
      where: { id },
      data: {
        ...(status && { status: status as ReservationStatus }),
        ...(paidAmount !== undefined && { paidAmount: Number(paidAmount) }),
        ...(specialRequests !== undefined && { specialRequests }),
        ...(checkInDate && { checkInDate: newStart }),
        ...(checkOutDate && { checkOutDate: newEnd }),
        ...(targetRoomId !== reservation.roomId && { roomId: targetRoomId }),
      },
    });

    // Side-effects on Room Status
    if (status === 'CHECKED_IN') {
      await prisma.room.update({
        where: { id: reservation.roomId },
        data: {
          status: RoomStatus.OCCUPIED,
          currentGuest: reservation.guest.name,
        },
      });

      await prisma.notification.create({
        data: {
          title: `Guest Checked In: ${reservation.guest.name}`,
          detail: `Room ${reservation.room.roomNumber} is now OCCUPIED. Passport verified.`,
          type: 'Booking',
          channel: 'In-App',
          status: 'Delivered',
        },
      });

      // Emit Automation Event for Webhooks
      await emitPmsEvent('guest.checked_in', {
        reservationId: id,
        guestName: reservation.guest.name,
        roomNumber: reservation.room.roomNumber,
        passportNumber: passportNumber || reservation.guest.passportNumber,
      });
    } else if (status === 'CHECKED_OUT') {
      await prisma.room.update({
        where: { id: reservation.roomId },
        data: {
          status: RoomStatus.CLEANING_REQUIRED,
          currentGuest: null,
        },
      });

      // Automatically create housekeeping task
      await prisma.housekeepingTask.create({
        data: {
          roomId: reservation.roomId,
          taskType: 'Turnover Clean',
          status: 'PENDING',
          priority: 'HIGH',
          notes: `Turnover clean after check-out of ${reservation.guest.name}. Room ${reservation.room.roomNumber}.`,
          scheduledFor: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          title: `Guest Checked Out: ${reservation.guest.name}`,
          detail: `Room ${reservation.room.roomNumber} flagged for Turnover Cleaning.`,
          type: 'Booking',
          channel: 'In-App',
          status: 'Action Required',
        },
      });

      // Emit Automation Event for Webhooks
      await emitPmsEvent('guest.checked_out', {
        reservationId: id,
        guestName: reservation.guest.name,
        roomNumber: reservation.room.roomNumber,
      });
    }

    return NextResponse.json({ success: true, data: updatedRes });
  } catch (error: any) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
