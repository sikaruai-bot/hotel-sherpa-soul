import { prisma } from '@/lib/prisma';
import { ReservationStatus, RoomStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';

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
 * Policy:
 * - Status must be CONFIRMED or PENDING (NOT CHECKED_IN, NOT CHECKED_OUT, NOT CANCELLED, NOT NO_SHOW)
 * - Check-in date is in the past, OR is today and the current Nepal time has passed the cut-off hour (default 18:00 / 6:00 PM)
 * - For each expired reservation:
 *   1. Updates Reservation status to NO_SHOW.
 *   2. Updates Room status to AVAILABLE and clears currentGuest.
 *   3. Creates an audit notification for hotel staff.
 *   4. Emits a PMS event for automations/webhooks.
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
      const resCheckIn = new Date(res.checkInDate);
      const resCheckInNepal = new Date(resCheckIn.getTime() + nepalOffsetMs);
      const resCheckInDateStart = new Date(Date.UTC(resCheckInNepal.getUTCFullYear(), resCheckInNepal.getUTCMonth(), resCheckInNepal.getUTCDate(), 0, 0, 0));

      // 1. If check-in date was before today (strictly past day), it is an expired no-show
      if (resCheckInDateStart < nepalTodayStart) {
        toRelease.push(res);
      } 
      // 2. If check-in date is today, and Nepal local time has exceeded the cut-off hour (e.g. 18:00 / 6 PM)
      else if (resCheckInDateStart.getTime() === nepalTodayStart.getTime() && nepalHours >= cutOffHour) {
        toRelease.push(res);
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
