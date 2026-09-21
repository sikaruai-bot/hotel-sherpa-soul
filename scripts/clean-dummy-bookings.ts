import 'dotenv/config';
import dns from 'dns/promises';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

async function main() {
  const host = 'ep-icy-hill-ae6o44b2-pooler.c-2.us-east-2.aws.neon.tech';
  const lookup = await dns.lookup(host, { family: 4 });

  const client = new Client({
    host: lookup.address,
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_osIUBYbDP4G9',
    database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: host },
    connectionTimeoutMillis: 20000,
  });

  await client.connect();
  console.log('✅ Connected to database for cleanup.');

  // 1. SAFETY BACKUP FIRST
  console.log('📦 Creating pre-cleanup backup...');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const [allReservations, allLongStay, allKitchen, allFolios, allFolioItems, allPayments, allInvoices, allInventory, allRooms, allGuests] = await Promise.all([
    client.query('SELECT * FROM "Reservation"'),
    client.query('SELECT * FROM "LongStayContract"'),
    client.query('SELECT * FROM "KitchenUser"'),
    client.query('SELECT * FROM "Folio"'),
    client.query('SELECT * FROM "FolioItem"'),
    client.query('SELECT * FROM "Payment"'),
    client.query('SELECT * FROM "Invoice"'),
    client.query('SELECT * FROM "RoomInventory"'),
    client.query('SELECT * FROM "Room"'),
    client.query('SELECT * FROM "Guest"'),
  ]);

  const backupData = {
    timestamp: new Date().toISOString(),
    reservations: allReservations.rows,
    longStayContracts: allLongStay.rows,
    kitchenUsers: allKitchen.rows,
    folios: allFolios.rows,
    folioItems: allFolioItems.rows,
    payments: allPayments.rows,
    invoices: allInvoices.rows,
    roomInventory: allInventory.rows,
    rooms: allRooms.rows,
    guests: allGuests.rows,
  };

  const backupPath = path.join(backupDir, `backup-before-dummy-cleanup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✅ Backup successfully saved to ${backupPath}`);

  // 2. IDENTIFY DUMMY DATA
  const dummyGuestNames = [
    'Carlos Gomez',
    'Jane Smith',
    'Michael Chang',
    'mingma sherpa',
    'Live Test Guest',
    'Test Guest Nepali',
    'Maya Gurung',
    'Pasang Dawa',
    'Sarah Connor',
    'Family Guest 1',
    'Family Guest 2',
    'Tenzing Norgay',
    'John Climber',
    'Elena Rossi',
  ];

  const dummyResQuery = await client.query(`
    SELECT r.id, r."reservationNumber", rm."roomNumber", g.name as guest_name
    FROM "Reservation" r
    JOIN "Guest" g ON r."guestId" = g.id
    LEFT JOIN "Room" rm ON r."roomId" = rm.id
    WHERE g.name = ANY($1::text[]);
  `, [dummyGuestNames]);

  const dummyResIds = dummyResQuery.rows.map(r => r.id);
  console.log(`📋 Found ${dummyResIds.length} dummy reservations to delete:`);
  dummyResQuery.rows.forEach(r => console.log(`   - [Rm ${r.roomNumber}] ${r.guest_name} (${r.id})`));

  // 3. EXECUTE CLEANUP TRANSACTION
  console.log('\n🚀 Beginning cleanup transaction...');
  await client.query('BEGIN');

  try {
    // A. RoomInventory locks
    const delInv = await client.query(`
      DELETE FROM "RoomInventory"
      WHERE "reservationId" = ANY($1::text[])
      RETURNING id;
    `, [dummyResIds]);
    console.log(`🗑️ Deleted ${delInv.rowCount} RoomInventory locks.`);

    // B. Payments
    const delPay = await client.query(`
      DELETE FROM "Payment"
      WHERE "reservationId" = ANY($1::text[])
      RETURNING id;
    `, [dummyResIds]);
    console.log(`🗑️ Deleted ${delPay.rowCount} Payment records.`);

    // C. Invoices
    const delInvRecord = await client.query(`
      DELETE FROM "Invoice"
      WHERE "reservationId" = ANY($1::text[])
      RETURNING id;
    `, [dummyResIds]);
    console.log(`🗑️ Deleted ${delInvRecord.rowCount} Invoice records.`);

    // D. Folio Items
    const delFolioItems = await client.query(`
      DELETE FROM "FolioItem"
      WHERE "folioId" IN (SELECT id FROM "Folio" WHERE "reservationId" = ANY($1::text[]))
      RETURNING id;
    `, [dummyResIds]);
    console.log(`🗑️ Deleted ${delFolioItems.rowCount} FolioItem records.`);

    // E. Folios
    const delFolios = await client.query(`
      DELETE FROM "Folio"
      WHERE "reservationId" = ANY($1::text[])
      RETURNING id;
    `, [dummyResIds]);
    console.log(`🗑️ Deleted ${delFolios.rowCount} Folio records.`);

    // F. Reservation Rooms
    const delResRooms = await client.query(`
      DELETE FROM "ReservationRoom"
      WHERE "reservationId" = ANY($1::text[])
      RETURNING id;
    `, [dummyResIds]);
    console.log(`🗑️ Deleted ${delResRooms.rowCount} ReservationRoom records.`);

    // G. Domain Events, Automation Jobs, Unified Messages
    await client.query(`DELETE FROM "DomainEvent" WHERE "reservationId" = ANY($1::text[])`, [dummyResIds]);
    await client.query(`DELETE FROM "AutomationJob" WHERE "reservationId" = ANY($1::text[])`, [dummyResIds]);
    await client.query(`DELETE FROM "UnifiedMessage" WHERE "reservationId" = ANY($1::text[])`, [dummyResIds]);
    console.log('🗑️ Deleted associated domain events, automation jobs, and messages.');

    // H. Delete Dummy Reservations
    const delRes = await client.query(`
      DELETE FROM "Reservation"
      WHERE id = ANY($1::text[])
      RETURNING id;
    `, [dummyResIds]);
    console.log(`🗑️ Deleted ${delRes.rowCount} dummy Reservations.`);

    // I. Delete Kitchen Users for 203 & 302
    const delKitchen = await client.query(`
      DELETE FROM "KitchenUser"
      WHERE "roomId" IN (SELECT id FROM "Room" WHERE "roomNumber" IN ('203', '302'))
         OR "guestId" IN (SELECT id FROM "Guest" WHERE name IN ('Carlos Gomez', 'Jane Smith'))
      RETURNING id;
    `);
    console.log(`🗑️ Deleted ${delKitchen.rowCount} dummy KitchenUser records.`);

    // J. Delete Long Stay Contracts for 203 & 302
    const delLongStay = await client.query(`
      DELETE FROM "LongStayContract"
      WHERE "roomId" IN (SELECT id FROM "Room" WHERE "roomNumber" IN ('203', '302'))
         OR "guestId" IN (SELECT id FROM "Guest" WHERE name IN ('Carlos Gomez', 'Jane Smith'))
      RETURNING id;
    `);
    console.log(`🗑️ Deleted ${delLongStay.rowCount} dummy LongStayContract records.`);

    // K. Delete orphan dummy guests
    const delGuests = await client.query(`
      DELETE FROM "Guest"
      WHERE name = ANY($1::text[])
        AND id NOT IN (SELECT DISTINCT "guestId" FROM "Reservation" WHERE "guestId" IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT "guestId" FROM "LongStayContract" WHERE "guestId" IS NOT NULL)
        AND id NOT IN (SELECT DISTINCT "guestId" FROM "Folio" WHERE "guestId" IS NOT NULL)
      RETURNING id, name;
    `, [dummyGuestNames]);
    console.log(`🗑️ Deleted ${delGuests.rowCount} orphan dummy Guest profiles:`, delGuests.rows.map(g => g.name));

    // L. Reset Room statuses for 203, 301, 302, 303 to AVAILABLE and clean guest
    const updatedRooms = await client.query(`
      UPDATE "Room"
      SET status = 'AVAILABLE',
          "currentGuest" = NULL
      WHERE "roomNumber" IN ('203', '301', '302', '303')
      RETURNING "roomNumber", status, "currentGuest";
    `);
    console.log('✨ Updated room statuses:', updatedRooms.rows);

    await client.query('COMMIT');
    console.log('\n🎉 TRANSACTION COMMITTED SUCCESSFULLY!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup, rolled back transaction:', err);
    throw err;
  }

  // 4. VERIFICATION
  console.log('\n=== VERIFICATION ===');
  const remainingRes = await client.query(`
    SELECT r.id, rm."roomNumber", g.name as guest_name, r.status, r."checkInDate"::date, r."checkOutDate"::date
    FROM "Reservation" r
    JOIN "Guest" g ON r."guestId" = g.id
    LEFT JOIN "Room" rm ON r."roomId" = rm.id
    ORDER BY rm."roomNumber", r."checkInDate";
  `);
  console.log(`Total remaining active reservations: ${remainingRes.rows.length}`);
  remainingRes.rows.forEach(r => {
    console.log(`   - [Rm ${r.roomNumber}] ${r.guest_name} | ${r.checkInDate} to ${r.checkOutDate} | ${r.status}`);
  });

  const remainingLs = await client.query('SELECT count(*)::int as count FROM "LongStayContract"');
  console.log(`Total remaining LongStay contracts: ${remainingLs.rows[0].count}`);

  const remainingKu = await client.query('SELECT count(*)::int as count FROM "KitchenUser"');
  console.log(`Total remaining Kitchen users: ${remainingKu.rows[0].count}`);

  const allRoomsCheck = await client.query('SELECT "roomNumber", status, "currentGuest" FROM "Room" ORDER BY "roomNumber"');
  console.log('All rooms current status:');
  allRoomsCheck.rows.forEach(r => console.log(`   - Room ${r.roomNumber}: ${r.status} (${r.currentGuest || 'No current guest'})`));

  await client.end();
}

main().catch(console.error);
