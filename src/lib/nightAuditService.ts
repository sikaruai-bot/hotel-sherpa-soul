import { prisma } from './prisma';
import { autoReleaseExpiredNoShows } from './autoReleaseNoShows';
import { FolioItemCategory, ReservationStatus, RoomStatus } from '@prisma/client';
import { addFolioItem, recalculateFolio } from './folioService';
import { recordAuditLog } from './auditLogger';

export interface NightAuditOptions {
  businessDate?: Date | string;
  staffUserId?: string;
  forceClose?: boolean;
}

export interface NightAuditReport {
  businessDate: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  adr: number;
  revPar: number;
  roomRevenue: number;
  totalRevenue: number;
  paymentsCollected: number;
  outstandingDues: number;
  noShowsProcessed: number;
  openArrivalsNotCheckedIn: number;
  openDeparturesNotCheckedOut: number;
  exceptions: Array<{ type: string; message: string; reservationId?: string; roomNumber?: string }>;
  isLocked: boolean;
}

/**
 * Normalizes date to the Kathmandu business date (YYYY-MM-DD at 00:00:00.000 UTC)
 */
export function getKathmanduBusinessDate(customDate?: Date | string): Date {
  const d = customDate ? new Date(customDate) : new Date();
  const kathmanduDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' }); // YYYY-MM-DD
  return new Date(`${kathmanduDateStr}T00:00:00.000Z`);
}

/**
 * Runs a safe, idempotent, and auditable Night Audit workflow
 */
export async function executeNightAudit(options: NightAuditOptions = {}): Promise<NightAuditReport> {
  const businessDate = getKathmanduBusinessDate(options.businessDate);
  const nextDay = new Date(businessDate.getTime() + 24 * 60 * 60 * 1000);
  const staff = options.staffUserId || 'SYSTEM_NIGHT_AUDIT';

  const exceptions: Array<{ type: string; message: string; reservationId?: string; roomNumber?: string }> = [];

  // 1. Auto-release un-checked-in no-shows (past 18:00 Kathmandu)
  let noShowsProcessed = 0;
  try {
    const sweep = await autoReleaseExpiredNoShows(18);
    noShowsProcessed = sweep.releasedCount || 0;
  } catch (err: any) {
    exceptions.push({
      type: 'NO_SHOW_SWEEP_ERROR',
      message: `Failed auto-releasing no-shows: ${err.message}`,
    });
  }

  // 2. Fetch occupied rooms & active in-house reservations
  const inHouseReservations = await prisma.reservation.findMany({
    where: {
      status: { in: [ReservationStatus.CHECKED_IN, ReservationStatus.CONFIRMED] },
      checkInDate: { lte: businessDate },
      checkOutDate: { gt: businessDate },
    },
    include: {
      room: { include: { roomType: true } },
      guest: true,
      folio: { include: { items: true, payments: true } },
    },
  });

  // 3. Post daily room charges & taxes to in-house folios if not already posted for this date
  let roomRevenue = 0;
  for (const res of inHouseReservations) {
    if (!res.folio) continue;

    const dailyRate = res.room?.roomType?.dailyRate || 3500;
    const dateDesc = `Room Charge (${businessDate.toISOString().split('T')[0]}) - Room ${res.room?.roomNumber}`;

    const alreadyPosted = res.folio.items.some(
      (item) => item.category === FolioItemCategory.ROOM_CHARGE && item.description.includes(businessDate.toISOString().split('T')[0])
    );

    if (!alreadyPosted && res.status === ReservationStatus.CHECKED_IN) {
      try {
        await addFolioItem({
          folioId: res.folio.id,
          category: FolioItemCategory.ROOM_CHARGE,
          description: dateDesc,
          unitPrice: dailyRate,
          quantity: 1,
          taxRate: 0.13, // 13% VAT
          serviceChargeRate: 0.10, // 10% Service Charge
          source: 'NIGHT_AUDIT',
          createdBy: staff,
        });
        roomRevenue += dailyRate;
      } catch (postErr: any) {
        exceptions.push({
          type: 'CHARGE_POSTING_FAILED',
          message: `Failed posting room charge for ${res.guest.name} (Room ${res.room?.roomNumber}): ${postErr.message}`,
          reservationId: res.id,
          roomNumber: res.room?.roomNumber,
        });
      }
    } else {
      roomRevenue += dailyRate;
    }
  }

  // 4. Check for arrivals not checked in
  const pendingArrivals = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.CONFIRMED,
      checkInDate: { lte: businessDate },
      checkOutDate: { gt: businessDate },
    },
    include: { guest: true, room: true },
  });

  for (const arr of pendingArrivals) {
    exceptions.push({
      type: 'ARRIVAL_NOT_CHECKED_IN',
      message: `Guest ${arr.guest.name} was scheduled to check into Room ${arr.room?.roomNumber} on ${arr.checkInDate.toISOString().split('T')[0]}, but is still CONFIRMED.`,
      reservationId: arr.id,
      roomNumber: arr.room?.roomNumber,
    });
  }

  // 5. Check for departures not checked out
  const overdueDepartures = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.CHECKED_IN,
      checkOutDate: { lte: businessDate },
    },
    include: { guest: true, room: true },
  });

  for (const dep of overdueDepartures) {
    exceptions.push({
      type: 'DEPARTURE_NOT_CHECKED_OUT',
      message: `In-house guest ${dep.guest.name} in Room ${dep.room?.roomNumber} has overdue departure date ${dep.checkOutDate.toISOString().split('T')[0]}.`,
      reservationId: dep.id,
      roomNumber: dep.room?.roomNumber,
    });
  }

  // 6. Calculate total occupancy metrics
  const totalRooms = await prisma.room.count();
  const occupiedRooms = await prisma.room.count({
    where: {
      OR: [
        { status: RoomStatus.OCCUPIED },
        { status: RoomStatus.LONG_STAY_OCCUPIED },
      ],
    },
  });

  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  const adr = occupiedRooms > 0 ? roomRevenue / occupiedRooms : 0;
  const revPar = totalRooms > 0 ? roomRevenue / totalRooms : 0;

  // 7. Sum payments collected on this business date
  const paymentsToday = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: businessDate, lt: nextDay },
      status: 'COMPLETED',
    },
  });

  const paymentsCollected = paymentsToday.reduce((acc, p) => acc + p.amount, 0);

  // 8. Calculate total outstanding dues across all active folios
  const openFolios = await prisma.folio.findMany({
    where: { status: 'OPEN' },
  });
  const outstandingDues = openFolios.reduce((acc, f) => acc + f.balanceDue, 0);

  const totalRevenue = roomRevenue; // Can be expanded with POS charges

  // 9. Save or update NightAuditRecord
  const record = await prisma.nightAuditRecord.upsert({
    where: { businessDate },
    update: {
      totalRooms,
      occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      adr: Math.round(adr),
      revPar: Math.round(revPar),
      roomRevenue,
      totalRevenue,
      paymentsCollected,
      outstandingDues,
      noShowsProcessed,
      exceptionsCount: exceptions.length,
      summary: { exceptions },
      isLocked: Boolean(options.forceClose),
      closedAt: options.forceClose ? new Date() : undefined,
      closedBy: options.forceClose ? staff : undefined,
    },
    create: {
      businessDate,
      totalRooms,
      occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      adr: Math.round(adr),
      revPar: Math.round(revPar),
      roomRevenue,
      totalRevenue,
      paymentsCollected,
      outstandingDues,
      noShowsProcessed,
      exceptionsCount: exceptions.length,
      summary: { exceptions },
      isLocked: Boolean(options.forceClose),
      closedAt: options.forceClose ? new Date() : undefined,
      closedBy: options.forceClose ? staff : undefined,
    },
  });

  await recordAuditLog({
    userId: staff,
    action: options.forceClose ? 'CLOSE_NIGHT_AUDIT' : 'RUN_NIGHT_AUDIT_PREVIEW',
    entityType: 'NightAuditRecord',
    entityId: record.id,
    afterData: {
      businessDate: businessDate.toISOString(),
      occupancyRate: `${record.occupancyRate}%`,
      adr: record.adr,
      revPar: record.revPar,
      roomRevenue,
      exceptionsCount: exceptions.length,
    },
    reason: `Night audit execution for ${businessDate.toISOString().split('T')[0]}`,
  });

  return {
    businessDate: businessDate.toISOString().split('T')[0],
    totalRooms,
    occupiedRooms,
    occupancyRate: record.occupancyRate,
    adr: record.adr,
    revPar: record.revPar,
    roomRevenue,
    totalRevenue,
    paymentsCollected,
    outstandingDues,
    noShowsProcessed,
    openArrivalsNotCheckedIn: pendingArrivals.length,
    openDeparturesNotCheckedOut: overdueDepartures.length,
    exceptions,
    isLocked: record.isLocked,
  };
}
