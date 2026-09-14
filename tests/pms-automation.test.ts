import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { createUnifiedReservation, cancelUnifiedReservation } from '../src/lib/reservationService';
import { normalizeWebsiteBooking, normalizeOtaBooking, normalizePhoneBooking, normalizeWalkInBooking } from '../src/lib/sourceAdapters';
import { executeNightAudit } from '../src/lib/nightAuditService';
import { enqueueJob, executeJob, processReadyJobs, RETRY_BACKOFF_SECONDS } from '../src/lib/jobQueue';
import { initializeWorkerHandlers } from '../src/lib/workerHandlers';
import { BookingSource, ReservationStatus, PaymentStatus, JobStatus } from '@prisma/client';

let totalTests = 0;
let passedTests = 0;

function assert(condition: any, testName: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runAllTests() {
  console.log('\n==================================================');
  console.log('HOTEL SHERPA SOUL PMS - AUTOMATION TEST SUITE');
  console.log('==================================================\n');

  initializeWorkerHandlers();

  // Pick an active room for testing
  const testRoom = await prisma.room.findFirst({
    include: { roomType: true },
  });
  if (!testRoom) {
    throw new Error('No test rooms found in database');
  }

  const farFutureDate1 = new Date('2027-05-10T00:00:00.000Z');
  const farFutureDate2 = new Date('2027-05-13T00:00:00.000Z');
  const farFutureDate3 = new Date('2027-05-15T00:00:00.000Z');

  // Clean up any test artifacts from prior runs
  // Delete related DomainEvent entries
  await prisma.$executeRawUnsafe(`DELETE FROM "DomainEvent" WHERE "reservationId" IS NOT NULL`);
  // Delete related AutomationJob entries
  await prisma.$executeRawUnsafe(`DELETE FROM "AutomationJob" WHERE "reservationId" IS NOT NULL`);
  // Delete RoomInventory entries linked to reservations
  await prisma.roomInventory.deleteMany({
    where: { reservationId: { not: null } },
  });
  // Delete reservations (cascade will remove related inventories if any)
  await prisma.reservation.deleteMany({
    where: {
      OR: [
        { externalBookingId: { in: ['TEST-WEB-001', 'TEST-OTA-001', 'TEST-PHONE-001', 'TEST-WALKIN-001', 'CONCURRENCY-A', 'CONCURRENCY-B'] } },
        { guest: { email: { in: ['test.guest@sherpasoul.com', 'test.ota@sherpasoul.com', 'test.due@sherpasoul.com'] } } },
      ],
    },
  });

  // TEST 1: Website Direct Booking Success & Folio Generation
  console.log('[1/12] Testing Website Direct Booking Flow...');
  const webInput = normalizeWebsiteBooking({
    guestName: 'Tenzing Norgay',
    email: 'test.guest@sherpasoul.com',
    phoneNumber: '+977 9801112233',
    nationality: 'Nepal',
    passportNumber: 'NPL998811',
    idType: 'Citizenship (नागरिकता)',
    roomNumber: testRoom.roomNumber,
    checkInDate: farFutureDate1,
    checkOutDate: farFutureDate2,
    adults: 2,
    totalAmount: 10500,
    paidAmount: 5000,
    bookingId: 'TEST-WEB-001',
    utm_source: 'google_ads',
    utm_campaign: 'everest_trek_2027',
  });

  const webResult = await createUnifiedReservation(webInput);
  assert(webResult.success === true, 'Website booking created successfully');
  assert(Boolean(webResult.reservation?.reservationNumber), 'Generated unique reservationNumber');
  assert(webResult.reservation?.status === ReservationStatus.CONFIRMED, 'Status is CONFIRMED');
  assert(webResult.reservation?.paymentStatus === PaymentStatus.PARTIAL, 'Payment status is PARTIAL');
  assert(webResult.reservation?.dueAmount === 5500, 'Calculated dueAmount is correct (10500 - 5000 = 5500)');
  assert(Boolean(webResult.reservation?.selfCheckinToken), 'Contactless self-checkin token generated');

  const createdWebResId = webResult.reservation.id;

  // TEST 2: Duplicate Website Webhook Idempotency
  console.log('\n[2/12] Testing Webhook Deduplication / Idempotency...');
  const duplicateWebResult = await createUnifiedReservation(webInput);
  assert(Boolean(duplicateWebResult.success), 'Duplicate call returns success');
  assert(Boolean(duplicateWebResult.isDuplicate), 'Recognized duplicate without creating new row');
  assert(duplicateWebResult.reservation.id === createdWebResId, 'Returned identical existing reservation ID');

  // TEST 3: Room Availability Overlap & Double Booking Prevention
  console.log('\n[3/12] Testing Room Date Overlap Protection...');
  const overlappingInput = normalizeWebsiteBooking({
    guestName: 'Conflicting Guest',
    email: 'conflict@sherpasoul.com',
    phoneNumber: '+977 9809998888',
    roomNumber: testRoom.roomNumber,
    checkInDate: new Date('2027-05-11T00:00:00.000Z'),
    checkOutDate: new Date('2027-05-14T00:00:00.000Z'),
    bookingId: 'TEST-OVERLAP-001',
  });

  const conflictResult = await createUnifiedReservation(overlappingInput);
  assert(conflictResult.success === false, 'Double booking successfully rejected');
  assert(Boolean(conflictResult.error && conflictResult.error.length > 5), 'Conflict reason clearly reported');

  // TEST 4: OTA Webhook Ingestion & Commission Normalization
  console.log('\n[4/12] Testing OTA Webhook Ingestion (Booking.com)...');
  const otaPayload = {
    guestName: 'John Climber',
    email: 'test.ota@sherpasoul.com',
    phone: '+44 7911 123456',
    nationality: 'British',
    roomNumber: testRoom.roomNumber,
    checkInDate: farFutureDate2,
    checkOutDate: farFutureDate3,
    total_price: 8400,
    otaReference: 'TEST-OTA-001',
    notes: 'Arriving late evening',
  };

  const otaInput = normalizeOtaBooking(otaPayload, 'BOOKING_COM');
  const otaResult = await createUnifiedReservation(otaInput);
  assert(otaResult.success === true, 'OTA reservation ingested via unified service');
  assert(otaResult.reservation.source === BookingSource.BOOKING_COM, 'Source recorded as BOOKING_COM');
  assert(otaResult.reservation.externalBookingId === 'TEST-OTA-001', 'External booking ID preserved');

  // TEST 5: Same OTA Webhook Received Twice (Idempotency)
  console.log('\n[5/12] Testing OTA Webhook Retry Deduplication...');
  const otaRetryResult = await createUnifiedReservation(otaInput);
  assert(otaRetryResult.isDuplicate === true, 'OTA retry acknowledged without duplication');

  // TEST 6: Phone Booking Flow
  console.log('\n[6/12] Testing Front Desk Phone Booking...');
  const otherRoom = await prisma.room.findFirst({
    where: { id: { not: testRoom.id } },
  });
  if (otherRoom) {
    const phoneInput = normalizePhoneBooking(
      {
        guestName: 'Maya Gurung',
        phone: '+977 9841001122',
        roomNumber: otherRoom.roomNumber,
        checkInDate: farFutureDate1,
        checkOutDate: farFutureDate2,
        totalAmount: 7000,
        paidAmount: 2000,
      },
      'STAFF-PASANG'
    );
    const phoneResult = await createUnifiedReservation(phoneInput);
    assert(phoneResult.success === true, 'Phone reservation recorded via unified service');
    assert(phoneResult.reservation.source === BookingSource.PHONE, 'Source recorded as PHONE');
  }

  // TEST 7: Walk-In Booking Instant Check-In
  console.log('\n[7/12] Testing Front Desk Walk-In Booking...');
  if (otherRoom) {
    const walkInInput = normalizeWalkInBooking(
      {
        guestName: 'Pasang Dawa',
        phone: '+977 9811223344',
        idNumber: 'CIT-9901-KTM',
        consentStatus: true,
        roomNumber: otherRoom.roomNumber,
        checkInDate: farFutureDate2,
        checkOutDate: farFutureDate3,
        totalAmount: 3800,
        paidAmount: 3800,
      },
      'RECEPTIONIST_DUTY'
    );
    const walkInResult = await createUnifiedReservation(walkInInput);
    assert(walkInResult.success === true, 'Walk-in registration completed');
    assert(walkInResult.reservation.status === ReservationStatus.CHECKED_IN, 'Walk-in immediately CHECKED_IN');
    assert(walkInResult.reservation.source === BookingSource.WALK_IN, 'Source recorded as WALK_IN');
  }

  // TEST 8: Guest Deduplication via Government ID / Hash
  console.log('\n[8/12] Testing ID-First Guest Deduplication with Alternate Spelling...');
  // Same ID 'NPL998811' from Test 1, but spelled 'T. Norgay'
  const returningGuestInput = normalizeWebsiteBooking({
    guestName: 'T. Norgay (Alternate Spelling)',
    email: 'different.email@yahoo.com',
    phoneNumber: '+977 9899887766',
    passportNumber: 'NPL998811', // Exact same ID
    roomNumber: testRoom.roomNumber,
    checkInDate: new Date('2027-06-01T00:00:00.000Z'),
    checkOutDate: new Date('2027-06-03T00:00:00.000Z'),
    bookingId: 'TEST-RETURNING-001',
  });

  const returningResult = await createUnifiedReservation(returningGuestInput);
  assert(returningResult.success === true, 'Returning guest booking created');
  assert(returningResult.reservation.guest.idNumber === 'NPL998811', 'Matched verified Government ID');
  assert(returningResult.reservation.guest.name === 'Tenzing Norgay', 'Preserved verified primary guest profile');

  // TEST 9: Previous Due Detection & Manager Review Alert
  console.log('\n[9/12] Testing Previous Due Detection & Manager Review Trigger...');
  // Update guest to have a recorded previous due
  await prisma.guest.update({
    where: { id: returningResult.reservation.guest.id },
    data: { previousDueAmount: 4500 },
  });

  const dueGuestBooking = normalizeWebsiteBooking({
    guestName: 'Tenzing Norgay',
    passportNumber: 'NPL998811',
    roomNumber: testRoom.roomNumber,
    checkInDate: new Date('2027-06-10T00:00:00.000Z'),
    checkOutDate: new Date('2027-06-12T00:00:00.000Z'),
    bookingId: 'TEST-DUE-TRIGGER-001',
  });

  const dueResult = await createUnifiedReservation(dueGuestBooking);
  assert(dueResult.requiresManagerReview === true, 'Manager review flag triggered due to previous balance');

  // TEST 10: Reservation Cancellation & Inventory Release
  console.log('\n[10/12] Testing Cancellation & Inventory Release...');
  const cancelRes = await cancelUnifiedReservation(
    createdWebResId,
    'Guest requested date change',
    'FRONT_DESK_MANAGER'
  );
  assert(cancelRes.success === true, 'Reservation cancelled');

  const updatedRes = await prisma.reservation.findUnique({
    where: { id: createdWebResId },
  });
  assert(updatedRes?.status === ReservationStatus.CANCELLED, 'Reservation status is CANCELLED');

  // TEST 11: Automation Queue & Exponential Backoff Processing
  console.log('\n[11/12] Testing Automation Queue Worker & Backoff...');
  const queuedJob = await enqueueJob({
    jobType: 'CHANNEL_SYNC',
    eventType: 'reservation.confirmed',
    entityType: 'Reservation',
    entityId: createdWebResId,
    payload: { roomNumber: testRoom.roomNumber, channel: 'BOOKING_COM' },
    idempotencyKey: `test_queue_job_${Date.now()}`,
  });
  assert(Boolean(queuedJob.id), 'Job enqueued successfully');
  assert(queuedJob.status === JobStatus.PENDING, 'Initial status is PENDING');

  // Process queue
  const queueRun = await processReadyJobs(5);
  assert(queueRun.processed > 0, 'Queue runner executed ready jobs');

  // TEST 12: Night Audit Workflow Execution
  console.log('\n[12/12] Testing Night Audit Workflow & Date Ledger...');
  const auditReport = await executeNightAudit({
    businessDate: new Date('2027-05-11T00:00:00.000Z'),
    forceClose: false,
  });
  assert(Boolean(auditReport.businessDate), 'Night audit computed Kathmandu business date');
  assert(typeof auditReport.occupancyRate === 'number', 'Occupancy rate calculated');
  assert(typeof auditReport.adr === 'number', 'Average Daily Rate (ADR) calculated');
  assert(typeof auditReport.revPar === 'number', 'RevPAR calculated');

  console.log('\n==================================================');
  console.log(`TEST SUITE RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('==================================================\n');
}

runAllTests()
  .catch((e) => {
    console.error('Fatal Test Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
