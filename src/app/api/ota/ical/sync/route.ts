import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseIcalFeed, ParsedIcalEvent } from '@/lib/ical';
import { BookingSource, ReservationStatus } from '@prisma/client';
import { emitPmsEvent } from '@/lib/events';
import { checkCategoryCapacity, getAvailableAlternatives, dispatchRoomFullAlert } from '@/lib/roomCategoryShield';

const channelToSourceMap: Record<string, BookingSource> = {
  BOOKING_COM: BookingSource.BOOKING_COM,
  AIRBNB: BookingSource.AIRBNB,
  AGODA: BookingSource.AGODA,
  EXPEDIA: BookingSource.EXPEDIA,
  TRIP_COM: BookingSource.TRIP_COM,
  VRBO: BookingSource.VRBO,
  CUSTOM: BookingSource.DIRECT,
};

async function syncSingleListing(connection: {
  id: string;
  channel: string;
  roomNumber: string;
  importUrl: string | null;
}) {
  const { channel, roomNumber, importUrl, id } = connection;

  if (!importUrl || !importUrl.trim()) {
    return {
      channel,
      roomNumber,
      status: 'SKIPPED',
      message: 'No import URL configured',
      importedCount: 0,
    };
  }

  try {
    // 1. Fetch external iCal feed
    const res = await fetch(importUrl.trim(), {
      headers: {
        'User-Agent': 'HotelSherpaSoulPMS-iCalSync/1.0',
        'Accept': 'text/calendar, text/plain, */*',
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(12000), // 12-second timeout
    });

    if (!res.ok) {
      throw new Error(`OTA server responded with HTTP ${res.status}: ${res.statusText}`);
    }

    const icsText = await res.text();
    const events = parseIcalFeed(icsText);

    if (events.length === 0) {
      await prisma.otaConnection.update({
        where: { id },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: 'SUCCESS',
          syncMessage: 'Feed active (0 external bookings found)',
          eventsCount: 0,
        },
      });

      return {
        channel,
        roomNumber,
        status: 'SUCCESS',
        message: 'No active reservations in calendar feed',
        importedCount: 0,
      };
    }

    // 2. Find target room
    const targetRoom = await prisma.room.findUnique({
      where: { roomNumber },
      include: { roomType: true },
    });

    if (!targetRoom) {
      throw new Error(`Room ${roomNumber} not found in PMS database`);
    }

    let importedCount = 0;
    let conflictCount = 0;
    const now = new Date();
    // Exclude bookings that ended more than 7 days ago
    const cutoffDate = new Date(now.getTime() - 7 * 86400000);

    for (const ev of events) {
      if (ev.endDate < cutoffDate) continue;

      const sourceEnum = channelToSourceMap[channel.toUpperCase()] || BookingSource.DIRECT;
      const otaRef = ev.otaReference || ev.uid;

      // Check if reservation already exists
      const existingRes = await prisma.reservation.findFirst({
        where: {
          OR: [
            { otaConfirmNum: ev.uid },
            ...(ev.otaReference ? [{ otaConfirmNum: ev.otaReference }] : []),
          ],
        },
      });

      if (existingRes) {
        // Already recorded - skip or verify status
        continue;
      }

      // CATEGORY-LEVEL CAPACITY CHECK (Max 2 rooms per category per day)
      const categoryCheck = await checkCategoryCapacity({
        categoryOrRoom: targetRoom.roomNumber,
        checkInDate: ev.startDate,
        checkOutDate: ev.endDate,
      });

      if (!categoryCheck.isAvailable) {
        conflictCount++;
        const alternatives = await getAvailableAlternatives({
          checkInDate: ev.startDate,
          checkOutDate: ev.endDate,
          excludeCategoryId: categoryCheck.category.id,
        });

        await dispatchRoomFullAlert({
          guestName: ev.guestName || `${channel} Guest`,
          requestedCategory: categoryCheck.category.name,
          checkInDate: ev.startDate.toISOString().split('T')[0],
          checkOutDate: ev.endDate.toISOString().split('T')[0],
          alternatives,
          source: channel,
        });
        continue;
      }

      // ZERO-DOUBLE-BOOKING SHIELD: Check for overlapping bookings
      const conflictRes = await prisma.reservation.findFirst({
        where: {
          roomId: targetRoom.id,
          status: {
            in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.PENDING],
          },
          AND: [
            { checkInDate: { lt: ev.endDate } },
            { checkOutDate: { gt: ev.startDate } },
          ],
        },
        include: { guest: true },
      });

      if (conflictRes) {
        conflictCount++;
        await prisma.otaSyncLog.create({
          data: {
            channel,
            roomNumber,
            action: 'IMPORT_ICAL',
            status: 'CONFLICT_PREVENTED',
            message: `Double-booking prevented! Incoming ${channel} booking (${ev.startDate.toISOString().split('T')[0]} to ${ev.endDate.toISOString().split('T')[0]}) overlaps with ${conflictRes.guest.name}'s reservation.`,
            details: JSON.stringify({
              incoming: { uid: ev.uid, guest: ev.guestName, start: ev.startDate, end: ev.endDate },
              existing: { id: conflictRes.id, guest: conflictRes.guest.name, start: conflictRes.checkInDate, end: conflictRes.checkOutDate },
            }),
          },
        });
        continue;
      }

      // Also check long-stay contracts
      const conflictContract = await prisma.longStayContract.findFirst({
        where: {
          roomId: targetRoom.id,
          status: 'ACTIVE',
          AND: [
            { startDate: { lt: ev.endDate } },
            { endDate: { gt: ev.startDate } },
          ],
        },
        include: { guest: true },
      });

      if (conflictContract) {
        conflictCount++;
        await prisma.otaSyncLog.create({
          data: {
            channel,
            roomNumber,
            action: 'IMPORT_ICAL',
            status: 'CONFLICT_PREVENTED',
            message: `Double-booking prevented! Room ${roomNumber} is occupied under Long Stay contract by ${conflictContract.guest.name}.`,
          },
        });
        continue;
      }

      // Calculate nights and total amount
      const nights = Math.max(
        1,
        Math.round((ev.endDate.getTime() - ev.startDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const totalAmount = nights * targetRoom.roomType.dailyRate;

      // Find or create Guest
      let guest = await prisma.guest.findFirst({
        where: { name: ev.guestName || `Guest (${channel})` },
      });

      if (!guest) {
        guest = await prisma.guest.create({
          data: {
            name: ev.guestName || `${channel} Guest`,
            email: `${(ev.guestName || 'guest').toLowerCase().replace(/\s+/g, '.')}@guest.${channel.toLowerCase()}.com`,
            nationality: 'International',
          },
        });
      }

      // Create Reservation
      await prisma.reservation.create({
        data: {
          guestId: guest.id,
          roomId: targetRoom.id,
          checkInDate: ev.startDate,
          checkOutDate: ev.endDate,
          adults: targetRoom.roomType.capacity || 2,
          totalAmount,
          paidAmount: totalAmount, // Pre-paid via OTA
          status: ReservationStatus.CONFIRMED,
          source: sourceEnum,
          otaConfirmNum: otaRef,
          specialRequests: `Synced via ${channel} iCal feed. UID: ${ev.uid}`,
        },
      });

      importedCount++;
    }

    // Update connection status
    const syncMsg = `Successfully synced: ${importedCount} new bookings imported${
      conflictCount > 0 ? `, ${conflictCount} double-booking conflicts prevented` : ''
    }`;

    await prisma.otaConnection.update({
      where: { id },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: 'SUCCESS',
        syncMessage: syncMsg,
        eventsCount: events.length,
      },
    });

    await prisma.otaSyncLog.create({
      data: {
        channel,
        roomNumber,
        action: 'IMPORT_ICAL',
        status: 'SUCCESS',
        message: syncMsg,
        details: JSON.stringify({ eventsFound: events.length, importedCount, conflictCount }),
      },
    });

    emitPmsEvent('booking.created', {
      channel,
      roomNumber,
      importedCount,
    });

    return {
      channel,
      roomNumber,
      status: 'SUCCESS',
      message: syncMsg,
      importedCount,
      conflictCount,
    };
  } catch (error: any) {
    const errorMsg = error.message || 'Sync failed';
    await prisma.otaConnection.update({
      where: { id },
      data: {
        lastSyncedAt: new Date(),
        syncStatus: 'ERROR',
        syncMessage: errorMsg,
      },
    });

    await prisma.otaSyncLog.create({
      data: {
        channel,
        roomNumber,
        action: 'IMPORT_ICAL',
        status: 'ERROR',
        message: `Sync failed for ${channel} (Room ${roomNumber}): ${errorMsg}`,
      },
    });

    return {
      channel,
      roomNumber,
      status: 'ERROR',
      message: errorMsg,
      importedCount: 0,
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { channel, roomNumber, syncAll } = body;

    if (syncAll) {
      // Sync all connections that have an importUrl
      const connections = await prisma.otaConnection.findMany({
        where: {
          importUrl: { not: null },
          isActive: true,
        },
      });

      if (connections.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No active OTA import URLs configured yet. Paste an iCal link into any room to start syncing.',
          results: [],
        });
      }

      const results = [];
      for (const conn of connections) {
        const res = await syncSingleListing(conn);
        results.push(res);
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${connections.length} OTA calendar feeds.`,
        results,
      });
    }

    // Sync a specific channel and room
    if (!channel || !roomNumber) {
      return NextResponse.json(
        { success: false, error: 'Either syncAll=true or channel and roomNumber are required' },
        { status: 400 }
      );
    }

    let connection = await prisma.otaConnection.findUnique({
      where: {
        channel_roomNumber: {
          channel,
          roomNumber: String(roomNumber),
        },
      },
    });

    if (!connection || !connection.importUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `No external iCal link found for ${channel} (Room ${roomNumber}). Please paste your OTA calendar link first.`,
        },
        { status: 400 }
      );
    }

    const result = await syncSingleListing(connection);

    return NextResponse.json({
      success: result.status === 'SUCCESS',
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in OTA iCal sync POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync error' },
      { status: 500 }
    );
  }
}
