import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

export async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('📦 Starting Hotel Sherpa Soul PMS Database Backup...');

  try {
    const [
      settings,
      roomTypes,
      rooms,
      guests,
      reservations,
      reservationRooms,
      invoices,
      payments,
      folios,
      folioItems,
      longStayContracts,
      kitchenUsers,
      kitchenInventory,
      housekeepingTasks,
      maintenanceTickets,
      automationJobs,
    ] = await Promise.all([
      prisma.hotelSetting ? prisma.hotelSetting.findMany().catch(() => []) : Promise.resolve([]),
      prisma.roomType ? prisma.roomType.findMany().catch(() => []) : Promise.resolve([]),
      prisma.room ? prisma.room.findMany().catch(() => []) : Promise.resolve([]),
      prisma.guest ? prisma.guest.findMany().catch(() => []) : Promise.resolve([]),
      prisma.reservation ? prisma.reservation.findMany().catch(() => []) : Promise.resolve([]),
      prisma.reservationRoom ? prisma.reservationRoom.findMany().catch(() => []) : Promise.resolve([]),
      prisma.invoice ? prisma.invoice.findMany().catch(() => []) : Promise.resolve([]),
      prisma.payment ? prisma.payment.findMany().catch(() => []) : Promise.resolve([]),
      prisma.folio ? prisma.folio.findMany().catch(() => []) : Promise.resolve([]),
      prisma.folioItem ? prisma.folioItem.findMany().catch(() => []) : Promise.resolve([]),
      prisma.longStayContract ? prisma.longStayContract.findMany().catch(() => []) : Promise.resolve([]),
      prisma.kitchenUser ? prisma.kitchenUser.findMany().catch(() => []) : Promise.resolve([]),
      prisma.kitchenInventory ? prisma.kitchenInventory.findMany().catch(() => []) : Promise.resolve([]),
      prisma.housekeepingTask ? prisma.housekeepingTask.findMany().catch(() => []) : Promise.resolve([]),
      prisma.maintenanceTicket ? prisma.maintenanceTicket.findMany().catch(() => []) : Promise.resolve([]),
      prisma.automationJob ? prisma.automationJob.findMany().catch(() => []) : Promise.resolve([]),
    ]);

    const backupPayload = {
      metadata: {
        hotel: 'Hotel Sherpa Soul',
        pan: '119205419',
        version: '1.0',
        createdAt: new Date().toISOString(),
        timestamp,
        stats: {
          settings: settings.length,
          roomTypes: roomTypes.length,
          rooms: rooms.length,
          guests: guests.length,
          reservations: reservations.length,
          reservationRooms: reservationRooms.length,
          invoices: invoices.length,
          payments: payments.length,
          folios: folios.length,
          folioItems: folioItems.length,
          longStayContracts: longStayContracts.length,
          kitchenUsers: kitchenUsers.length,
          kitchenInventory: kitchenInventory.length,
          housekeepingTasks: housekeepingTasks.length,
          maintenanceTickets: maintenanceTickets.length,
          automationJobs: automationJobs.length,
        },
      },
      data: {
        settings,
        roomTypes,
        rooms,
        guests,
        reservations,
        reservationRooms,
        invoices,
        payments,
        folios,
        folioItems,
        longStayContracts,
        kitchenUsers,
        kitchenInventory,
        housekeepingTasks,
        maintenanceTickets,
        automationJobs,
      },
    };

    const filename = `pms-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    const latestPath = path.join(backupDir, 'latest-pms-backup.json');

    fs.writeFileSync(filepath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    fs.writeFileSync(latestPath, JSON.stringify(backupPayload, null, 2), 'utf-8');

    console.log(`✅ Backup successfully saved to: ${filepath}`);
    console.log(`✅ Latest pointer updated at: ${latestPath}`);
    console.log(`📊 Backup Summary:`);
    console.log(`   - Rooms: ${rooms.length}`);
    console.log(`   - Guests: ${guests.length}`);
    console.log(`   - Reservations: ${reservations.length}`);
    console.log(`   - Invoices: ${invoices.length}`);
    console.log(`   - Payments: ${payments.length}`);

    return { success: true, filepath, latestPath, stats: backupPayload.metadata.stats };
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  }
}

// Allow direct execution: npx tsx scripts/backup-db.ts
if (require.main === module || process.argv[1]?.endsWith('backup-db.ts')) {
  createDatabaseBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
