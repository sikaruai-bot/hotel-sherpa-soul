import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function migrate() {
  console.log('🚀 Starting safe, non-destructive database migration on Neon PostgreSQL...');
  const pool = new Pool({ connectionString });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Enums if they do not exist
    const enums = [
      `DO $$ BEGIN
        CREATE TYPE "RiskStatus" AS ENUM ('NORMAL', 'PAYMENT_ALERT', 'MANAGER_REVIEW', 'DO_NOT_RENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED', 'DISPUTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "FolioStatus" AS ENUM ('OPEN', 'CLOSED', 'DISPUTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "FolioItemCategory" AS ENUM ('ROOM_CHARGE', 'RESTAURANT', 'LAUNDRY', 'AIRPORT_TRANSFER', 'EXTRA_SERVICE', 'DISCOUNT', 'TAX', 'SERVICE_CHARGE', 'DEPOSIT', 'REFUND', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "RoomInventoryStatus" AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'OCCUPIED', 'DIRTY', 'CLEAN', 'INSPECTED', 'MAINTENANCE', 'OUT_OF_ORDER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'RETRYING', 'FAILED', 'DEAD_LETTER', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "CommunicationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'IN_APP', 'OTA_MESSAGE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    ];

    for (const q of enums) {
      await client.query(q);
    }

    // Add new values to existing ReservationStatus enum if needed
    const resStatusAdditions = ['INQUIRY', 'HOLD', 'MODIFIED', 'COMPLETED'];
    for (const val of resStatusAdditions) {
      try {
        await client.query(`ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS '${val}'`);
      } catch (e: any) {
        // Ignored if already present
      }
    }

    // 2. Add columns to Guest
    await client.query(`
      ALTER TABLE "Guest"
      ADD COLUMN IF NOT EXISTS "fullName" TEXT,
      ADD COLUMN IF NOT EXISTS "normalizedName" TEXT,
      ADD COLUMN IF NOT EXISTS "idType" TEXT,
      ADD COLUMN IF NOT EXISTS "idNumberHash" TEXT,
      ADD COLUMN IF NOT EXISTS "livePhotoReference" TEXT,
      ADD COLUMN IF NOT EXISTS "consentStatus" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "riskStatus" "RiskStatus" NOT NULL DEFAULT 'NORMAL',
      ADD COLUMN IF NOT EXISTS "riskReason" TEXT,
      ADD COLUMN IF NOT EXISTS "previousDueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "notes" TEXT,
      ADD COLUMN IF NOT EXISTS "riskReviewedBy" TEXT,
      ADD COLUMN IF NOT EXISTS "riskReviewedAt" TIMESTAMP(3);
    `);

    // 3. Add columns to Reservation
    await client.query(`
      ALTER TABLE "Reservation"
      ADD COLUMN IF NOT EXISTS "reservationNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "externalBookingId" TEXT,
      ADD COLUMN IF NOT EXISTS "roomTypeId" TEXT,
      ADD COLUMN IF NOT EXISTS "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NPR',
      ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
      ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
      ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
      ADD COLUMN IF NOT EXISTS "holdExpiresAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "selfCheckinToken" TEXT,
      ADD COLUMN IF NOT EXISTS "selfCheckinExpiresAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "whatsappThreadId" TEXT,
      ADD COLUMN IF NOT EXISTS "utmSource" TEXT,
      ADD COLUMN IF NOT EXISTS "utmMedium" TEXT,
      ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT,
      ADD COLUMN IF NOT EXISTS "utmContent" TEXT,
      ADD COLUMN IF NOT EXISTS "gclid" TEXT,
      ADD COLUMN IF NOT EXISTS "fbclid" TEXT,
      ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
    `);

    // Make roomId nullable on Reservation if not already nullable
    await client.query(`
      ALTER TABLE "Reservation" ALTER COLUMN "roomId" DROP NOT NULL;
    `);

    // Populate reservationNumber for existing rows if null
    await client.query(`
      UPDATE "Reservation" 
      SET "reservationNumber" = 'HSS-' || TO_CHAR("createdAt", 'YYYYMM') || '-' || UPPER(SUBSTRING("id" FROM 1 FOR 6))
      WHERE "reservationNumber" IS NULL;
    `);

    // 4. Add columns to Payment
    await client.query(`
      ALTER TABLE "Payment"
      ALTER COLUMN "invoiceId" DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS "reservationId" TEXT,
      ADD COLUMN IF NOT EXISTS "folioId" TEXT,
      ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NPR',
      ADD COLUMN IF NOT EXISTS "status" "PaymentRecordStatus" NOT NULL DEFAULT 'COMPLETED',
      ADD COLUMN IF NOT EXISTS "provider" TEXT,
      ADD COLUMN IF NOT EXISTS "providerTransactionId" TEXT,
      ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
      ADD COLUMN IF NOT EXISTS "failureReason" TEXT,
      ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    // 5. Create New Tables

    // ReservationRoom
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ReservationRoom" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reservationId" TEXT NOT NULL REFERENCES "Reservation"("id") ON DELETE CASCADE,
        "roomId" TEXT REFERENCES "Room"("id"),
        "roomTypeId" TEXT NOT NULL REFERENCES "RoomType"("id"),
        "rate" DOUBLE PRECISION NOT NULL,
        "adults" INTEGER NOT NULL DEFAULT 1,
        "children" INTEGER NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
        "assignedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Folio
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Folio" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reservationId" TEXT NOT NULL UNIQUE REFERENCES "Reservation"("id") ON DELETE CASCADE,
        "guestId" TEXT NOT NULL REFERENCES "Guest"("id"),
        "status" "FolioStatus" NOT NULL DEFAULT 'OPEN',
        "totalCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalPayments" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalDiscounts" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalServiceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "currency" TEXT NOT NULL DEFAULT 'NPR',
        "closedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // FolioItem
    await client.query(`
      CREATE TABLE IF NOT EXISTS "FolioItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "folioId" TEXT NOT NULL REFERENCES "Folio"("id") ON DELETE CASCADE,
        "category" "FolioItemCategory" NOT NULL,
        "description" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "unitPrice" DOUBLE PRECISION NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "serviceChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "source" TEXT NOT NULL DEFAULT 'PMS',
        "referenceId" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // RoomInventory
    await client.query(`
      CREATE TABLE IF NOT EXISTS "RoomInventory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE CASCADE,
        "date" TIMESTAMP(3) NOT NULL,
        "status" "RoomInventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
        "reservationId" TEXT REFERENCES "Reservation"("id"),
        "heldExpiresAt" TIMESTAMP(3),
        "rate" DOUBLE PRECISION,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // DomainEvent
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DomainEvent" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "eventId" TEXT NOT NULL UNIQUE,
        "eventType" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "reservationId" TEXT REFERENCES "Reservation"("id"),
        "correlationId" TEXT,
        "payload" JSONB NOT NULL,
        "source" TEXT NOT NULL,
        "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "processedAt" TIMESTAMP(3)
      );
    `);

    // AutomationJob
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AutomationJob" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "jobType" TEXT NOT NULL,
        "eventType" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "reservationId" TEXT REFERENCES "Reservation"("id"),
        "recipient" TEXT,
        "payload" JSONB NOT NULL,
        "scheduledAt" TIMESTAMP(3) NOT NULL,
        "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "maxAttempts" INTEGER NOT NULL DEFAULT 5,
        "lastError" TEXT,
        "idempotencyKey" TEXT UNIQUE,
        "processedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // AuditLog
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "beforeData" JSONB,
        "afterData" JSONB,
        "reason" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // UnifiedMessage
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UnifiedMessage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "messageId" TEXT NOT NULL UNIQUE,
        "reservationId" TEXT REFERENCES "Reservation"("id"),
        "guestId" TEXT REFERENCES "Guest"("id"),
        "channel" "CommunicationChannel" NOT NULL,
        "direction" "MessageDirection" NOT NULL DEFAULT 'OUTBOUND',
        "templateName" TEXT,
        "sender" TEXT,
        "recipient" TEXT NOT NULL,
        "subject" TEXT,
        "content" TEXT NOT NULL,
        "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
        "provider" TEXT,
        "providerMessageId" TEXT,
        "errorMessage" TEXT,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "requiresStaffAction" BOOLEAN NOT NULL DEFAULT false,
        "assignedStaff" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // NightAuditRecord
    await client.query(`
      CREATE TABLE IF NOT EXISTS "NightAuditRecord" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "businessDate" TIMESTAMP(3) NOT NULL UNIQUE,
        "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "closedAt" TIMESTAMP(3),
        "closedBy" TEXT,
        "totalRooms" INTEGER NOT NULL DEFAULT 0,
        "occupiedRooms" INTEGER NOT NULL DEFAULT 0,
        "occupancyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "adr" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "revPar" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "roomRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "paymentsCollected" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "outstandingDues" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "noShowsProcessed" INTEGER NOT NULL DEFAULT 0,
        "exceptionsCount" INTEGER NOT NULL DEFAULT 0,
        "summary" JSONB,
        "isLocked" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // SystemConfig
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SystemConfig" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "businessTimezone" TEXT NOT NULL DEFAULT 'Asia/Kathmandu',
        "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.13,
        "serviceChargeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
        "autoReleaseNoShowHour" INTEGER NOT NULL DEFAULT 18,
        "holdDurationMinutes" INTEGER NOT NULL DEFAULT 15,
        "maxJobRetries" INTEGER NOT NULL DEFAULT 5,
        "reviewRequestDelayHours" INTEGER NOT NULL DEFAULT 24,
        "enableWhatsAppBot" BOOLEAN NOT NULL DEFAULT true,
        "enableEmailNotifs" BOOLEAN NOT NULL DEFAULT true,
        "enableSmsNotifs" BOOLEAN NOT NULL DEFAULT false,
        "enableAutoHousekeeping" BOOLEAN NOT NULL DEFAULT true,
        "metaCapiPixelId" TEXT,
        "metaCapiAccessToken" TEXT,
        "googleAdsConversionId" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure default SystemConfig exists
    await client.query(`
      INSERT INTO "SystemConfig" ("id") VALUES ('default')
      ON CONFLICT ("id") DO NOTHING;
    `);

    // 6. Safe Indexes & Unique Constraints
    const indexQueries = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_reservationNumber_key" ON "Reservation"("reservationNumber");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_selfCheckinToken_key" ON "Reservation"("selfCheckinToken");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_source_externalBookingId_key" ON "Reservation"("source", "externalBookingId");`,
      `CREATE INDEX IF NOT EXISTS "Reservation_checkInDate_checkOutDate_idx" ON "Reservation"("checkInDate", "checkOutDate");`,
      `CREATE INDEX IF NOT EXISTS "Reservation_guestId_idx" ON "Reservation"("guestId");`,
      `CREATE INDEX IF NOT EXISTS "Reservation_status_idx" ON "Reservation"("status");`,
      `CREATE INDEX IF NOT EXISTS "Reservation_paymentStatus_idx" ON "Reservation"("paymentStatus");`,
      `CREATE INDEX IF NOT EXISTS "Reservation_source_idx" ON "Reservation"("source");`,

      `CREATE INDEX IF NOT EXISTS "Guest_phoneNumber_idx" ON "Guest"("phoneNumber");`,
      `CREATE INDEX IF NOT EXISTS "Guest_email_idx" ON "Guest"("email");`,
      `CREATE INDEX IF NOT EXISTS "Guest_idNumber_idx" ON "Guest"("idNumber");`,
      `CREATE INDEX IF NOT EXISTS "Guest_idNumberHash_idx" ON "Guest"("idNumberHash");`,
      `CREATE INDEX IF NOT EXISTS "Guest_riskStatus_idx" ON "Guest"("riskStatus");`,

      `CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");`,
      `CREATE INDEX IF NOT EXISTS "Payment_reservationId_idx" ON "Payment"("reservationId");`,
      `CREATE INDEX IF NOT EXISTS "Payment_folioId_idx" ON "Payment"("folioId");`,

      `CREATE UNIQUE INDEX IF NOT EXISTS "RoomInventory_roomId_date_key" ON "RoomInventory"("roomId", "date");`,
      `CREATE INDEX IF NOT EXISTS "RoomInventory_date_idx" ON "RoomInventory"("date");`,
      `CREATE INDEX IF NOT EXISTS "RoomInventory_status_idx" ON "RoomInventory"("status");`,

      `CREATE INDEX IF NOT EXISTS "Folio_reservationId_idx" ON "Folio"("reservationId");`,
      `CREATE INDEX IF NOT EXISTS "Folio_guestId_idx" ON "Folio"("guestId");`,
      `CREATE INDEX IF NOT EXISTS "FolioItem_folioId_idx" ON "FolioItem"("folioId");`,
      `CREATE INDEX IF NOT EXISTS "FolioItem_category_idx" ON "FolioItem"("category");`,

      `CREATE INDEX IF NOT EXISTS "DomainEvent_status_idx" ON "DomainEvent"("status");`,
      `CREATE INDEX IF NOT EXISTS "DomainEvent_eventType_idx" ON "DomainEvent"("eventType");`,
      `CREATE INDEX IF NOT EXISTS "DomainEvent_createdAt_idx" ON "DomainEvent"("createdAt");`,

      `CREATE INDEX IF NOT EXISTS "AutomationJob_status_scheduledAt_idx" ON "AutomationJob"("status", "scheduledAt");`,
      `CREATE INDEX IF NOT EXISTS "AutomationJob_jobType_idx" ON "AutomationJob"("jobType");`,
      `CREATE INDEX IF NOT EXISTS "AutomationJob_reservationId_idx" ON "AutomationJob"("reservationId");`,

      `CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");`,

      `CREATE INDEX IF NOT EXISTS "UnifiedMessage_reservationId_idx" ON "UnifiedMessage"("reservationId");`,
      `CREATE INDEX IF NOT EXISTS "UnifiedMessage_guestId_idx" ON "UnifiedMessage"("guestId");`,
      `CREATE INDEX IF NOT EXISTS "UnifiedMessage_status_idx" ON "UnifiedMessage"("status");`,
      `CREATE INDEX IF NOT EXISTS "UnifiedMessage_channel_idx" ON "UnifiedMessage"("channel");`,
      `CREATE INDEX IF NOT EXISTS "UnifiedMessage_requiresStaffAction_idx" ON "UnifiedMessage"("requiresStaffAction");`,
    ];

    for (const iq of indexQueries) {
      await client.query(iq);
    }

    await client.query('COMMIT');
    console.log('✅ Safe database migration completed successfully on Neon PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Safe migration failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
