import { prisma } from '@/lib/prisma';
import { ReservationStatus, RoomStatus, BookingSource } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';
import { releaseRoomInventory } from '@/lib/inventoryService';

export interface AutoReleaseResult {
  success: boolean;
  releasedCount: number;
  releasedReservations: Array<{
    id: string;
    roomNumber: string;
    guestName: string;
    checkInDate: string;
    otaReference?: string;
  }>;
  scannedAt: string;
}

/**
 * Automatically sweeps for reservations that have passed their check-in cut-off
 * without checking in (No-Shows).
 * 
 * Safety Policies:
 * - Status must be CONFIRMED or PENDING.
 * - GRACE PERIOD: Never releases reservations created within the last 6 hours.
 * - GUARANTEED: Never releases reservations with any paid amount (paidAmount > 0).
 * - WALK-IN: Never releases WALK_IN reservations (guest is on premise).
 * - Past-date: Strictly past check-in dates (< today) are released.
 * - Same-day: Today's check-in is only released if booked prior to today and cut-off hour (18:00+) passed.
 */
export async function autoReleaseExpiredNoShows(cutOffHour: number = 18): Promise<AutoReleaseResult> {
  try {
    const now = new Date();
    
    // Nepal Standard Time (UTC + 5:45)
    const nepalOffsetMs = (5 * 60 + 45) * 60 * 1000;
    const nepalNow = new Date(now.getTime() + nepalOffsetMs);
    const nepalHours = nepalNow.getUTCHours();
    const nepalTodayStart = new Date(Date.UTC(nepalNow.getUTCFullYear(), nepalNow.getUTCMonth(), nepalNow.getUTCDate(), 0, 0, 0));

    // Find all pending/confirmed reservations
    const candidateReservations = await prisma.reservation.findMany({
      where: {
        status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING] },
      },
      include: {
        guest: true,
        room: true,
      },
    });

    const toRelease: typeof candidateReservations = [];

    for (const res of candidateReservations) {
      // 1. Grace Period: Never auto-release reservations created in the last 6 hours
      const resCreatedTime = new Date(res.createdAt).getTime();
      if (now.getTime() - resCreatedTime < 6 * 60 * 60 * 1000) {
        continue;
      }

      // 2. Guaranteed Booking: Never auto-release if any payment has been recorded
      if (Number(res.paidAmount) > 0) {
        continue;
      }

      // 3. Walk-In: Never auto-release walk-in bookings (guest is at the hotel)
      if (res.source === BookingSource.WALK_IN) {
        continue;
      }

      const resCheckIn = new Date(res.checkInDate);
      const resCheckInNepal = new Date(resCheckIn.getTime() + nepalOffsetMs);
      const resCheckInDateStart = new Date(Date.UTC(resCheckInNepal.getUTCFullYear(), resCheckInNepal.getUTCMonth(), resCheckInNepal.getUTCDate(), 0, 0, 0));

      // 4. Past Check-in Date: strictly before today
      if (resCheckInDateStart < nepalTodayStart) {
        toRelease.push(res);
      } 
      // 5. Today's Check-in Date: cut-off hour passed AND was booked before today (advance booking)
      else if (resCheckInDateStart.getTime() === nepalTodayStart.getTime() && nepalHours >= cutOffHour) {
        const resCreatedNepal = new Date(resCreatedTime + nepalOffsetMs);
        const resCreatedDateStart = new Date(Date.UTC(resCreatedNepal.getUTCFullYear(), resCreatedNepal.getUTCMonth(), resCreatedNepal.getUTCDate(), 0, 0, 0));

        // Only release if booked on a prior date (advance reservation that didn't arrive by evening)
        if (resCreatedDateStart < nepalTodayStart) {
          toRelease.push(res);
        }
      }
    }

    if (toRelease.length === 0) {
      return {
        success: true,
        releasedCount: 0,
        releasedReservations: [],
        scannedAt: now.toISOString(),
      };
    }

    const releasedReservationsSummary: AutoReleaseResult['releasedReservations'] = [];

    for (const res of toRelease) {
      // 1. Mark reservation as NO_SHOW
      await prisma.reservation.update({
        where: { id: res.id },
        data: {
          status: ReservationStatus.NO_SHOW,
          specialRequests: res.specialRequests 
            ? `${res.specialRequests} | [AUTO-RELEASED NO-SHOW at ${now.toISOString()}]`
            : `[AUTO-RELEASED NO-SHOW at ${now.toISOString()}]`,
        },
      });

      // 2. Free up the room to AVAILABLE and clear currentGuest
      await prisma.room.update({
        where: { id: res.roomId },
        data: {
          status: RoomStatus.AVAILABLE,
          currentGuest: null,
        },
      });

      // 2b. Release calendar & inventory lock so other guests can book immediately
      await releaseRoomInventory(res.id);

      // 3. Create staff notification
      await prisma.notification.create({
        data: {
          title: `Auto-Released No-Show: Room ${res.room.roomNumber}`,
          detail: `Guest ${res.guest.name} did not arrive by check-in cut-off. Booking #${res.otaConfirmNum || res.id.slice(0, 8)} automatically marked NO-SHOW. Room ${res.room.roomNumber} is now AVAILABLE on the calendar.`,
          type: 'Booking',
          channel: 'In-App',
          status: 'Delivered',
        },
      });

      // 4. Emit event
      await emitPmsEvent('reservation.no_show', {
        reservationId: res.id,
        guestName: res.guest.name,
        roomNumber: res.room.roomNumber,
        reason: 'AUTO_RELEASE_EXPIRED_CUTOFF',
      });

      releasedReservationsSummary.push({
        id: res.id,
        roomNumber: res.room.roomNumber,
        guestName: res.guest.name,
        checkInDate: res.checkInDate.toISOString(),
        otaReference: res.otaConfirmNum || undefined,
      });
    }

    return {
      success: true,
      releasedCount: releasedReservationsSummary.length,
      releasedReservations: releasedReservationsSummary,
      scannedAt: now.toISOString(),
    };
  } catch (error: any) {
    console.error('Error in autoReleaseExpiredNoShows:', error);
    return {
      success: false,
      releasedCount: 0,
      releasedReservations: [],
      scannedAt: new Date().toISOString(),
    };
  }
}
