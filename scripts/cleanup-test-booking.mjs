import 'dotenv/config';
import dns from 'dns/promises';
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

  const resNumber = 'HSS-202609-2361EF';
  const res = await client.query('SELECT * FROM "Reservation" WHERE "reservationNumber" = $1', [resNumber]);
  if (res.rows.length === 0) {
    console.log('No reservation found for', resNumber, '(already clean).');
    await client.end();
    return;
  }

  const reservationId = res.rows[0].id;
  console.log('Deleting test reservation:', reservationId, resNumber);

  await client.query('DELETE FROM "RoomInventory" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "Payment" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "Invoice" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "FolioItem" WHERE "folioId" IN (SELECT id FROM "Folio" WHERE "reservationId" = $1)', [reservationId]);
  await client.query('DELETE FROM "Folio" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "ReservationRoom" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "DomainEvent" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "AutomationJob" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "UnifiedMessage" WHERE "reservationId" = $1', [reservationId]);
  await client.query('DELETE FROM "Reservation" WHERE id = $1', [reservationId]);

  console.log('✅ Successfully deleted test reservation', resNumber);
  await client.end();
}

main().catch(console.error);
