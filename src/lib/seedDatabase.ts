import { prisma } from './prisma';
import { RoomStatus, ReservationStatus, BookingSource, TaskStatus } from '@prisma/client';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing records in reverse relation order
  await prisma.notification.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.housekeepingTask.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.kitchenIncident.deleteMany();
  await prisma.kitchenUser.deleteMany();
  await prisma.kitchenInventory.deleteMany();
  await prisma.longStayContract.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.user.deleteMany();

  // 2. Default Users (Front Desk, Manager, Admin)
  await prisma.user.createMany({
    data: [
      {
        email: 'frontdesk@hotelsherpasoul.com',
        name: 'Pasang Sherpa (Reception Desk)',
        password: 'frontdesk123',
        pinCode: '1234',
        role: 'RECEPTIONIST',
        shift: 'Day',
        isActive: true,
      },
      {
        email: 'manager@hotelsherpasoul.com',
        name: 'Mingma Sherpa (General Manager)',
        password: 'manager123',
        pinCode: '9999',
        role: 'MANAGER',
        shift: 'Day',
        isActive: true,
      },
      {
        email: 'admin@hotelsherpasoul.com',
        name: 'System Admin',
        password: 'admin123',
        pinCode: '0000',
        role: 'ADMIN',
        shift: 'Day',
        isActive: true,
      },
    ],
  });

  // 3. Room Types
  const roomTypesData = [
    { name: 'Standard Double', capacity: 2, bedType: 'Queen Bed', dailyRate: 3500, weeklyRate: 21000, monthlyRate: 45000 },
    { name: 'Deluxe Twin', capacity: 2, bedType: '2 Single Beds', dailyRate: 4200, weeklyRate: 25000, monthlyRate: 50000 },
    { name: 'Deluxe Double', capacity: 2, bedType: 'King Bed', dailyRate: 4500, weeklyRate: 27000, monthlyRate: 55000 },
    { name: 'Standard Twin', capacity: 2, bedType: '2 Single Beds', dailyRate: 3800, weeklyRate: 23000, monthlyRate: 48000 },
    { name: 'Family Suite', capacity: 4, bedType: '1 King + 2 Singles', dailyRate: 6500, weeklyRate: 39000, monthlyRate: 85000 },
  ];

  const roomTypeMap = new Map<string, string>();
  for (const rt of roomTypesData) {
    const created = await prisma.roomType.create({ data: rt });
    roomTypeMap.set(rt.name, created.id);
  }

  // 4. Rooms
  const roomsData = [
    { roomNumber: '201', floor: 2, roomTypeName: 'Standard Double', status: RoomStatus.AVAILABLE, kitchenEligible: true, longStayEligible: true },
    { roomNumber: '202', floor: 2, roomTypeName: 'Standard Double', status: RoomStatus.OCCUPIED, kitchenEligible: true, longStayEligible: true, currentGuest: 'Sarah Connor', cleaningStaff: 'Pasang Lhamu' },
    { roomNumber: '203', floor: 2, roomTypeName: 'Deluxe Twin', status: RoomStatus.LONG_STAY_OCCUPIED, kitchenEligible: true, longStayEligible: true, currentGuest: 'Carlos Gomez', cleaningStaff: 'Dawa Sherpa' },
    { roomNumber: '301', floor: 3, roomTypeName: 'Deluxe Double', status: RoomStatus.UNDER_MAINTENANCE, kitchenEligible: true, longStayEligible: true, maintenanceNote: 'Shower pressure calibration' },
    { roomNumber: '302', floor: 3, roomTypeName: 'Standard Twin', status: RoomStatus.LONG_STAY_OCCUPIED, kitchenEligible: true, longStayEligible: true, currentGuest: 'Jane Smith', cleaningStaff: 'Dawa Sherpa' },
    { roomNumber: '303', floor: 3, roomTypeName: 'Family Suite', status: RoomStatus.AVAILABLE, kitchenEligible: true, longStayEligible: true },
  ];

  const roomMap = new Map<string, string>();
  for (const r of roomsData) {
    const typeId = roomTypeMap.get(r.roomTypeName);
    if (!typeId) continue;
    const created = await prisma.room.create({
      data: {
        roomNumber: r.roomNumber,
        floor: r.floor,
        roomTypeId: typeId,
        status: r.status,
        kitchenEligible: r.kitchenEligible,
        longStayEligible: r.longStayEligible,
        currentGuest: r.currentGuest,
        cleaningStaff: r.cleaningStaff,
        maintenanceNote: r.maintenanceNote,
      },
    });
    roomMap.set(r.roomNumber, created.id);
  }

  // 5. Guests
  const guestSarah = await prisma.guest.create({
    data: { name: 'Sarah Connor', email: 'sarah.connor@gmail.com', phoneNumber: '+1 555 0192', nationality: 'American', passportNumber: 'USA8892104' },
  });
  const guestMichael = await prisma.guest.create({
    data: { name: 'Michael Chang', email: 'm.chang@outlook.com', phoneNumber: '+852 9123 4567', nationality: 'Hong Kong', passportNumber: 'HKG491028' },
  });
  const guestElena = await prisma.guest.create({
    data: { name: 'Elena Rossi', email: 'elena.rossi@yahoo.it', phoneNumber: '+39 333 123456', nationality: 'Italian', passportNumber: 'ITA772199' },
  });
  const guestCarlos = await prisma.guest.create({
    data: { name: 'Carlos Gomez', email: 'carlos.gomez@nomad.io', phoneNumber: '+34 612 345 678', nationality: 'Spanish', passportNumber: 'ESP901823' },
  });
  const guestJane = await prisma.guest.create({
    data: { name: 'Jane Smith', email: 'jane.smith@remote.org', phoneNumber: '+44 7700 900123', nationality: 'British', passportNumber: 'GBR881920' },
  });

  // 6. Reservations
  const today = new Date();
  const res1 = await prisma.reservation.create({
    data: {
      otaConfirmNum: 'BK-991204',
      guestId: guestSarah.id,
      roomId: roomMap.get('202')!,
      checkInDate: today,
      checkOutDate: new Date(today.getTime() + 86400000 * 3),
      adults: 2,
      children: 0,
      totalAmount: 10500,
      paidAmount: 10500,
      status: ReservationStatus.CHECKED_IN,
      source: BookingSource.BOOKING_COM,
      specialRequests: 'Quiet room on upper side, extra towels',
    },
  });

  await prisma.reservation.create({
    data: {
      otaConfirmNum: 'AG-77412',
      guestId: guestMichael.id,
      roomId: roomMap.get('201')!,
      checkInDate: today,
      checkOutDate: new Date(today.getTime() + 86400000 * 2),
      adults: 1,
      children: 0,
      totalAmount: 7000,
      paidAmount: 0,
      status: ReservationStatus.CONFIRMED,
      source: BookingSource.AGODA,
      specialRequests: 'Late check-in around 6:00 PM',
    },
  });

  await prisma.reservation.create({
    data: {
      guestId: guestElena.id,
      roomId: roomMap.get('303')!,
      checkInDate: new Date(today.getTime() + 86400000),
      checkOutDate: new Date(today.getTime() + 86400000 * 5),
      adults: 3,
      children: 1,
      totalAmount: 26000,
      paidAmount: 5000,
      status: ReservationStatus.CONFIRMED,
      source: BookingSource.DIRECT,
      specialRequests: 'Airport pickup request from TIA at 2 PM',
    },
  });

  // 7. Long-Stay Contracts
  await prisma.longStayContract.create({
    data: {
      guestId: guestCarlos.id,
      roomId: roomMap.get('203')!,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-01'),
      monthlyRent: 50000,
      securityDeposit: 30000,
      kitchenAccess: true,
      depositStatus: 'HELD',
      rentPaidUntil: new Date('2026-09-30'),
      status: 'ACTIVE',
      notes: 'Software engineer working remotely from Pokhara/Kathmandu.',
    },
  });

  await prisma.longStayContract.create({
    data: {
      guestId: guestJane.id,
      roomId: roomMap.get('302')!,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-10-15'),
      monthlyRent: 48000,
      securityDeposit: 25000,
      kitchenAccess: true,
      depositStatus: 'HELD',
      rentPaidUntil: new Date('2026-09-15'),
      status: 'ACTIVE',
      notes: 'Yoga instructor and researcher.',
    },
  });

  // 8. Kitchen Users
  await prisma.kitchenUser.create({
    data: {
      guestId: guestCarlos.id,
      roomId: roomMap.get('203')!,
      passType: 'Long Stay',
      accessStartDate: new Date('2026-08-01'),
      accessEndDate: new Date('2026-11-01'),
      depositHeld: 5000,
      depositStatus: 'HELD',
      status: 'ACTIVE',
    },
  });

  await prisma.kitchenUser.create({
    data: {
      guestId: guestJane.id,
      roomId: roomMap.get('302')!,
      passType: 'Long Stay',
      accessStartDate: new Date('2026-07-15'),
      accessEndDate: new Date('2026-10-15'),
      depositHeld: 5000,
      depositStatus: 'HELD',
      status: 'ACTIVE',
    },
  });

  // 9. Kitchen Incidents
  await prisma.kitchenIncident.create({
    data: {
      type: 'Damaged Cookware',
      guestName: 'Carlos Gomez',
      roomNumber: '203',
      costNpr: 1800,
      status: 'Deducted from Deposit',
      note: 'Burned non-stick frying pan beyond reuse.',
    },
  });

  // 10. Housekeeping
  await prisma.housekeepingTask.create({
    data: {
      roomId: roomMap.get('201')!,
      taskType: 'Turnover Clean',
      status: TaskStatus.IN_PROGRESS,
      priority: 'HIGH',
      assignedTo: 'Pasang Lhamu',
      notes: 'Guest arriving today at 6 PM. Deep clean bathroom and setup fresh towels.',
      scheduledFor: new Date(),
    },
  });

  // 11. Maintenance
  await prisma.maintenanceTicket.create({
    data: {
      roomId: roomMap.get('301')!,
      location: 'Room 301',
      issue: 'Low shower pressure and hot water temperature fluctuation',
      reportedBy: 'Front Desk (Reception)',
      priority: 'Urgent',
      status: 'In Progress',
      assignedTechnician: 'Pemba (Plumber)',
    },
  });

  // 12. Invoice
  const inv1 = await prisma.invoice.create({
    data: {
      reservationId: res1.id,
      guestName: 'Sarah Connor',
      roomNumber: '202',
      items: JSON.stringify([
        { description: 'Room Stay: Standard Double (3 Nights)', quantity: 3, unitPrice: 3500, total: 10500 },
        { description: 'Airport Pickup Taxi', quantity: 1, unitPrice: 1500, total: 1500 },
      ]),
      subtotal: 12000,
      serviceCharge: 0,
      tax: 0,
      discount: 0,
      total: 12000,
      paidAmount: 12000,
      paymentMethod: 'Visa',
      status: 'PAID',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: 12000,
      method: 'VISA',
      transactionId: 'TXN-VISA-991204',
    },
  });

  // 13. Notifications
  await prisma.notification.create({
    data: {
      title: 'New Reservation: Elena Rossi',
      detail: 'Room 303 (Family Suite) booked for 4 nights starting tomorrow.',
      type: 'Booking',
      channel: 'WhatsApp',
      status: 'Delivered',
    },
  });

  return { message: 'Seeding completed successfully' };
}
