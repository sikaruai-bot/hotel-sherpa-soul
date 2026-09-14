import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const roomCount = await prisma.room.count();
  const guestCount = await prisma.guest.count();
  const resCount = await prisma.reservation.count();
  console.log(`Neon DB connected! Rooms: ${roomCount}, Guests: ${guestCount}, Reservations: ${resCount}`);
}

main()
  .catch((err) => {
    console.error('DB test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
