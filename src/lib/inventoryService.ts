import { prisma } from './prisma';
import { RoomInventoryStatus, RoomStatus } from '@prisma/client';
import { checkCategoryCapacity } from './roomCategoryShield';

export interface DateRange {
  checkInDate: Date;
  checkOutDate: Date;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  conflictReason?: string;
  conflictingReservationId?: string;
  room?: any;
}

/**
 * Normalizes a date to midnight (00:00:00.000) UTC for consistent day-by-day inventory
 */
export function normalizeDateOnly(d: Date | string): Date {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Generates an array of individual dates between checkInDate and checkOutDate (excluding checkOutDate day)
 */
export function getDateArray(checkInDate: Date, checkOutDate: Date): Date[] {
  const dates: Date[] = [];
  const curr = normalizeDateOnly(checkInDate);
  const end = normalizeDateOnly(checkOutDate);

  while (curr < end) {
    dates.push(new Date(curr));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Checks if a specific room is available for the given date range.
 * Checks both the atomic `RoomInventory` table and active `Reservation`/`LongStayContract` overlaps.
 */
export async function checkRoomAvailability(
  roomId: string,
  checkInDate: Date,
  checkOutDate: Date,
  excludeReservationId?: string,
  tx?: any
): Promise<AvailabilityCheckResult> {
  const db = tx || prisma;
  const start = normalizeDateOnly(checkInDate);
  const end = normalizeDateOnly(checkOutDate);

  if (start >= end) {
    return { isAvailable: false, conflictReason: 'Check-out date must be after check-in date.' };
  }

  // 1. Verify target room exists
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { roomType: true },
  });

  if (!room) {
    return { isAvailable: false, conflictReason: `Room ID ${roomId} not found.` };
  }

  // 2. Check Category-level capacity shield
  const categoryCheck = await checkCategoryCapacity({
    categoryOrRoom: room.roomNumber,
    checkInDate: start,
    checkOutDate: end,
  });

  if (!categoryCheck.isAvailable) {
    return {
      isAvailable: false,
      conflictReason: categoryCheck.conflictReason,
      room,
    };
  }

  // 3. Check existing overlapping reservations
  const overlappingReservation = await db.reservation.findFirst({
    where: {
      roomId,
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'HOLD', 'PENDING'] },
      AND: [
        { checkInDate: { lt: end } },
        { checkOutDate: { gt: start } },
      ],
      // For HOLD or PENDING, check if hold has expired
      OR: [
        { holdExpiresAt: null },
        { holdExpiresAt: { gt: new Date() } },
        { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
      ],
    },
    include: { guest: true },
  });

  if (overlappingReservation) {
    return {
      isAvailable: false,
      conflictReason: `Room ${room.roomNumber} is reserved by ${overlappingReservation.guest.name} from ${overlappingReservation.checkInDate.toISOString().split('T')[0]} to ${overlappingReservation.checkOutDate.toISOString().split('T')[0]}.`,
      conflictingReservationId: overlappingReservation.id,
      room,
    };
  }

  // 4. Check active Long Stay contracts
  const overlappingContract = await db.longStayContract.findFirst({
    where: {
      roomId,
      status: { in: ['ACTIVE', 'EXPIRING'] },
      AND: [
        { startDate: { lt: end } },
        { endDate: { gt: start } },
      ],
    },
    include: { guest: true },
  });

  if (overlappingContract) {
    return {
      isAvailable: false,
      conflictReason: `Room ${room.roomNumber} is under an active long-stay contract for ${overlappingContract.guest.name}.`,
      room,
    };
  }

  // 5. Check RoomInventory table for maintenance, out of order, or active booking locks
  const invRows = await db.roomInventory.findMany({
    where: {
      roomId,
      date: { gte: start, lt: end },
      status: { in: [RoomInventoryStatus.MAINTENANCE, RoomInventoryStatus.OUT_OF_ORDER, RoomInventoryStatus.BOOKED, RoomInventoryStatus.OCCUPIED] },
      reservationId: excludeReservationId ? { not: excludeReservationId } : undefined,
    },
    include: {
      reservation: true,
    },
  });

  const activeConflicts: typeof invRows = [];
  for (const inv of invRows) {
    if (inv.status === RoomInventoryStatus.MAINTENANCE || inv.status === RoomInventoryStatus.OUT_OF_ORDER) {
      activeConflicts.push(inv);
    } else if (inv.reservationId && inv.reservation) {
      // Only block if reservation is genuinely active
      if (['CONFIRMED', 'CHECKED_IN', 'HOLD', 'PENDING'].includes(inv.reservation.status)) {
        activeConflicts.push(inv);
      } else {
        // Stale inventory lock from a NO_SHOW, CANCELLED, or historical booking: auto-heal
        await db.roomInventory.update({
          where: { id: inv.id },
          data: {
            status: RoomInventoryStatus.AVAILABLE,
            reservationId: null,
            heldExpiresAt: null,
          },
        }).catch(() => {});
      }
    } else if (inv.status === RoomInventoryStatus.BOOKED || inv.status === RoomInventoryStatus.OCCUPIED) {
      // Stale orphaned row with no valid reservation
      await db.roomInventory.update({
        where: { id: inv.id },
        data: {
          status: RoomInventoryStatus.AVAILABLE,
          reservationId: null,
          heldExpiresAt: null,
        },
      }).catch(() => {});
    }
  }

  if (activeConflicts.length > 0) {
    return {
      isAvailable: false,
      conflictReason: `Room ${room.roomNumber} is unavailable on one or more dates due to ${activeConflicts[0].status}.`,
      room,
    };
  }

  return { isAvailable: true, room };
}

/**
 * Atomically locks room inventory dates for a reservation
 */
export async function commitRoomInventory(
  roomId: string,
  reservationId: string,
  checkInDate: Date,
  checkOutDate: Date,
  status: RoomInventoryStatus = RoomInventoryStatus.BOOKED,
  tx?: any
) {
  const db = tx || prisma;
  const dates = getDateArray(checkInDate, checkOutDate);

  for (const date of dates) {
    await db.roomInventory.upsert({
      where: {
        roomId_date: { roomId, date },
      },
      update: {
        status,
        reservationId,
        heldExpiresAt: null,
      },
      create: {
        roomId,
        date,
        status,
        reservationId,
      },
    });
  }
}

/**
 * Creates a temporary room hold (e.g. 15 mins for website direct bookings)
 */
export async function holdRoomInventory(
  roomId: string,
  reservationId: string,
  checkInDate: Date,
  checkOutDate: Date,
  holdDurationMinutes = 15,
  tx?: any
) {
  const db = tx || prisma;
  const dates = getDateArray(checkInDate, checkOutDate);
  const heldExpiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

  for (const date of dates) {
    await db.roomInventory.upsert({
      where: {
        roomId_date: { roomId, date },
      },
      update: {
        status: RoomInventoryStatus.HELD,
        reservationId,
        heldExpiresAt,
      },
      create: {
        roomId,
        date,
        status: RoomInventoryStatus.HELD,
        reservationId,
        heldExpiresAt,
      },
    });
  }

  return heldExpiresAt;
}

/**
 * Releases room inventory on cancellation or hold expiry
 */
export async function releaseRoomInventory(
  reservationId: string,
  tx?: any
) {
  const db = tx || prisma;
  await db.roomInventory.updateMany({
    where: { reservationId },
    data: {
      status: RoomInventoryStatus.AVAILABLE,
      reservationId: null,
      heldExpiresAt: null,
    },
  });
}
