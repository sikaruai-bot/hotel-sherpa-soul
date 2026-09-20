import { prisma } from './prisma';
import {
  BookingSource,
  ReservationStatus,
  PaymentStatus,
  RoomStatus,
  RoomInventoryStatus,
  PaymentMethod,
  FolioItemCategory,
  CommunicationChannel,
} from '@prisma/client';
import { UnifiedReservationInput } from './sourceAdapters';
import { findOrCreateGuest } from './guestRiskService';
import { checkRoomAvailability, commitRoomInventory, releaseRoomInventory } from './inventoryService';
import { getOrCreateFolio, addFolioItem, postFolioPayment } from './folioService';
import { emitDomainEvent } from './domainEvents';
import { enqueueJob } from './jobQueue';
import { recordAuditLog } from './auditLogger';
import { sendBookingNotificationToOfficialMail } from './emailService';
import { randomUUID } from 'crypto';

export interface ReservationServiceResult {
  success: boolean;
  isDuplicate?: boolean;
  reservation?: any;
  error?: string;
  conflict?: any;
  requiresManagerReview?: boolean;
  managerReviewReason?: string | null;
}

/**
 * Generates an official, human-readable reservation number:
 * e.g. HSS-202609-8A3F1B
 */
export function generateReservationNumber(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const suffix = randomUUID().replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase();
  return `HSS-${yearMonth}-${suffix}`;
}

/**
 * THE UNIFIED RESERVATION SERVICE
 * Single source of truth for all booking channels (Website, WhatsApp, OTAs, Phone, Walk-in).
 */
export async function createUnifiedReservation(
  input: UnifiedReservationInput,
  options?: { staffUserId?: string; ipAddress?: string; userAgent?: string }
): Promise<ReservationServiceResult> {
  try {
    // 1. Idempotency Check: (source + externalBookingId)
    if (input.externalBookingId) {
      const existing = await prisma.reservation.findUnique({
        where: {
          source_externalBookingId: {
            source: input.source,
            externalBookingId: input.externalBookingId,
          },
        },
        include: {
          guest: true,
          room: { include: { roomType: true } },
          folio: { include: { items: true, payments: true } },
        },
      });

      if (existing) {
        return {
          success: true,
          isDuplicate: true,
          reservation: existing,
        };
      }
    }

    // 2. Validate Dates
    const start = new Date(input.checkInDate);
    const end = new Date(input.checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return {
        success: false,
        error: 'Invalid dates: Check-out must be after check-in date.',
      };
    }

    // 3. Find or Create Guest Profile & Evaluate Risk Status
    const guestEval = await findOrCreateGuest({
      name: input.guestName,
      email: input.email,
      phoneNumber: input.phone,
      nationality: input.nationality,
      idNumber: input.idNumber,
      passportNumber: input.passportNumber,
      idType: input.idType,
      photoUrl: input.photoUrl,
      livePhotoReference: input.livePhotoReference,
      consentStatus: input.consentStatus,
    });

    const guest = guestEval.guest;

    // 4. Resolve Target Room & RoomType
    let targetRoom: any = null;
    if (input.roomNumber) {
      targetRoom = await prisma.room.findUnique({
        where: { roomNumber: String(input.roomNumber) },
        include: { roomType: true },
      });
      if (!targetRoom) {
        return { success: false, error: `Room ${input.roomNumber} not found.` };
      }
    } else if (input.roomTypeName) {
      // Auto-assign first available room in category
      const roomsInType = await prisma.room.findMany({
        where: {
          roomType: { name: { equals: input.roomTypeName.trim(), mode: 'insensitive' } },
        },
        include: { roomType: true },
      });
      for (const r of roomsInType) {
        const avail = await checkRoomAvailability(r.id, start, end);
        if (avail.isAvailable) {
          targetRoom = r;
          break;
        }
      }
      if (!targetRoom) {
        return {
          success: false,
          error: `No available rooms in category '${input.roomTypeName}' for selected dates.`,
        };
      }
    } else {
      // Fallback: pick any available room
      const allRooms = await prisma.room.findMany({ include: { roomType: true } });
      for (const r of allRooms) {
        const avail = await checkRoomAvailability(r.id, start, end);
        if (avail.isAvailable) {
          targetRoom = r;
          break;
        }
      }
      if (!targetRoom) {
        return { success: false, error: 'No rooms available for the selected dates.' };
      }
    }

    // 5. Check Room Availability & Category Capacity
    const availCheck = await checkRoomAvailability(targetRoom.id, start, end);
    if (!availCheck.isAvailable) {
      return {
        success: false,
        error: availCheck.conflictReason,
        conflict: {
          roomId: targetRoom.id,
          roomNumber: targetRoom.roomNumber,
        },
      };
    }

    // Calculate nights & pricing
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRate = targetRoom.roomType?.dailyRate || 3500;
    const computedTotal = input.totalAmount !== undefined ? input.totalAmount : nights * dailyRate;
    const paid = input.paidAmount || 0;
    const balanceDue = Math.max(0, computedTotal - paid);

    const reservationNumber = generateReservationNumber();
    const selfCheckinToken = `chk_${randomUUID().replace(/-/g, '')}`;
    const selfCheckinExpiresAt = new Date(end.getTime() + 24 * 60 * 60 * 1000);

    const initialStatus: ReservationStatus = input.isInstantCheckIn
      ? ReservationStatus.CHECKED_IN
      : input.status || ReservationStatus.CONFIRMED;

    const initialPaymentStatus: PaymentStatus =
      paid >= computedTotal && computedTotal > 0
        ? PaymentStatus.PAID
        : paid > 0
        ? PaymentStatus.PARTIAL
        : PaymentStatus.UNPAID;

    // 6. ACID TRANSACTION in Neon PostgreSQL
    const createdReservation = await prisma.$transaction(
      async (tx) => {
        // 6a. Create Reservation Record
        const res = await tx.reservation.create({
          data: {
            reservationNumber,
            otaConfirmNum: input.externalBookingId || null,
            externalBookingId: input.externalBookingId || null,
            guestId: guest.id,
            roomId: targetRoom.id,
            roomTypeId: targetRoom.roomTypeId,
            checkInDate: start,
            checkOutDate: end,
            adults: input.adults || 1,
            children: input.children || 0,
            totalAmount: computedTotal,
            paidAmount: paid,
            dueAmount: balanceDue,
            currency: input.currency || 'NPR',
            status: initialStatus,
            paymentStatus: initialPaymentStatus,
            source: input.source,
            specialRequests: input.specialRequests || null,
            internalNotes: input.internalNotes || null,
            selfCheckinToken,
            selfCheckinExpiresAt,
            whatsappThreadId: input.whatsappThreadId || null,
            utmSource: input.utmSource || null,
            utmMedium: input.utmMedium || null,
            utmCampaign: input.utmCampaign || null,
            utmContent: input.utmContent || null,
            gclid: input.gclid || null,
            fbclid: input.fbclid || null,
            createdBy: input.createdBy || options?.staffUserId || 'PMS Reservation Service',
          },
        });

        // 6b. Create ReservationRoom Record
        await tx.reservationRoom.create({
          data: {
            reservationId: res.id,
            roomId: targetRoom.id,
            roomTypeId: targetRoom.roomTypeId,
            rate: dailyRate,
            adults: input.adults || 1,
            children: input.children || 0,
            status: 'ASSIGNED',
            assignedAt: new Date(),
          },
        });

        // 6c. Initialize Folio with items and payment directly in one atomic operation
        await tx.folio.create({
          data: {
            reservationId: res.id,
            guestId: guest.id,
            status: 'OPEN',
            totalCharges: computedTotal,
            totalPayments: paid,
            totalDiscounts: 0,
            totalTax: Math.round(computedTotal * 0.13),
            totalServiceCharge: Math.round(computedTotal * 0.10),
            balanceDue,
            currency: input.currency || 'NPR',
            items: {
              create: {
                category: FolioItemCategory.ROOM_CHARGE,
                description: `Room Stay: ${targetRoom.roomNumber} (${targetRoom.roomType.name}) - ${nights} Night(s)`,
                quantity: nights,
                unitPrice: dailyRate,
                amount: computedTotal,
                taxRate: 0.13,
                serviceChargeRate: 0.10,
                source: 'PMS',
                createdBy: input.createdBy || 'Automated Folio Engine',
              },
            },
            ...(paid > 0
              ? {
                  payments: {
                    create: {
                      reservationId: res.id,
                      amount: paid,
                      currency: input.currency || 'NPR',
                      method: PaymentMethod.BANK_TRANSFER,
                      status: 'COMPLETED',
                      provider: input.source.toString(),
                      verifiedBy: input.createdBy || 'PMS Reservation System',
                      idempotencyKey: `init_pay_${res.id}`,
                    },
                  },
                }
              : {}),
          },
        });

        // 6d. Commit RoomInventory status for all dates
        const invStatus = input.isInstantCheckIn
          ? RoomInventoryStatus.OCCUPIED
          : RoomInventoryStatus.BOOKED;

        await commitRoomInventory(targetRoom.id, res.id, start, end, invStatus, tx);

      // 6f. Update Room master status if instant checkin or reserved for today
      const nowTime = new Date();
      const nepalOffsetMs = (5 * 60 + 45) * 60 * 1000;
      const nepalNow = new Date(nowTime.getTime() + nepalOffsetMs);
      const nepalTodayDate = new Date(Date.UTC(nepalNow.getUTCFullYear(), nepalNow.getUTCMonth(), nepalNow.getUTCDate(), 0, 0, 0));
      const arrivesToday = start.getTime() <= nepalTodayDate.getTime() && end.getTime() > nepalTodayDate.getTime();

      if (input.isInstantCheckIn) {
        await tx.room.update({
          where: { id: targetRoom.id },
          data: {
            status: RoomStatus.OCCUPIED,
            currentGuest: guest.name,
          },
        });
      } else if (arrivesToday && targetRoom.status === RoomStatus.AVAILABLE) {
        await tx.room.update({
          where: { id: targetRoom.id },
          data: {
            status: RoomStatus.RESERVED,
            currentGuest: guest.name,
          },
        });
      }

      // 6g. Insert Domain Event to Outbox
      await emitDomainEvent(
        {
          eventType: initialStatus === ReservationStatus.CHECKED_IN ? 'guest.checked_in' : 'reservation.confirmed',
          entityType: 'Reservation',
          entityId: res.id,
          reservationId: res.id,
          source: input.source.toString(),
          payload: {
            reservationId: res.id,
            reservationNumber,
            guestId: guest.id,
            guestName: guest.name,
            email: guest.email,
            phone: guest.phoneNumber,
            roomNumber: targetRoom.roomNumber,
            roomType: targetRoom.roomType.name,
            checkInDate: start.toISOString(),
            checkOutDate: end.toISOString(),
            totalAmount: computedTotal,
            paidAmount: paid,
            dueAmount: balanceDue,
            source: input.source,
          },
        },
        tx
      );

      // 6h. Record Audit Log
      await recordAuditLog(
        {
          userId: options?.staffUserId || 'SYSTEM',
          action: 'CREATE_RESERVATION',
          entityType: 'Reservation',
          entityId: res.id,
          afterData: {
            reservationNumber,
            source: input.source,
            roomNumber: targetRoom.roomNumber,
            guestName: guest.name,
            totalAmount: computedTotal,
          },
          reason: `Booking via ${input.source}`,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
        },
        tx
      );

      return res;
    }, { maxWait: 15000, timeout: 30000 });

    // 7. ENQUEUE AUTOMATION JOBS (Executed safely outside the ACID transaction)
    try {
      // 7a. Housekeeping Task
      await enqueueJob({
        jobType: 'CREATE_HOUSEKEEPING',
        eventType: 'reservation.confirmed',
        entityType: 'Reservation',
        entityId: createdReservation.id,
        reservationId: createdReservation.id,
        payload: {
          roomId: targetRoom.id,
          roomNumber: targetRoom.roomNumber,
          checkInDate: start.toISOString(),
          taskType: 'Turnover Clean',
          priority: 'NORMAL',
        },
        idempotencyKey: `hk_prearrival_${createdReservation.id}`,
      });

      // 7b. Pre-arrival Check-in Reminder (72 hours before check-in)
      const t72h = new Date(start.getTime() - 72 * 60 * 60 * 1000);
      if (t72h > new Date()) {
        await enqueueJob({
          jobType: 'SEND_COMMUNICATION',
          eventType: 'reservation.confirmed',
          entityType: 'Reservation',
          entityId: createdReservation.id,
          reservationId: createdReservation.id,
          recipient: guest.email || guest.phoneNumber,
          scheduledAt: t72h,
          payload: {
            channel: guest.email ? CommunicationChannel.EMAIL : CommunicationChannel.WHATSAPP,
            templateName: 'CHECKIN_REMINDER_72H',
            recipient: guest.email || guest.phoneNumber,
            templateData: {
              guestName: guest.name,
              reservationNumber,
              checkInDate: start.toISOString().split('T')[0],
              roomNumber: targetRoom.roomNumber,
            },
          },
          idempotencyKey: `remind_72h_${createdReservation.id}`,
        });
      }

      // 7c. Contactless Self Check-In Pass & Location (24 hours before check-in)
      const t24h = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      const scheduled24h = t24h > new Date() ? t24h : new Date();
      await enqueueJob({
        jobType: 'SEND_COMMUNICATION',
        eventType: 'reservation.confirmed',
        entityType: 'Reservation',
        entityId: createdReservation.id,
        reservationId: createdReservation.id,
        recipient: guest.phoneNumber || guest.email,
        scheduledAt: scheduled24h,
        payload: {
          channel: guest.phoneNumber ? CommunicationChannel.WHATSAPP : CommunicationChannel.EMAIL,
          templateName: 'SELF_CHECKIN_INSTRUCTION',
          recipient: guest.phoneNumber || guest.email,
          templateData: {
            guestName: guest.name,
            reservationNumber,
            roomNumber: targetRoom.roomNumber,
            selfCheckinUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pms.hotelsherpasoul.com'}/self-checkin?token=${selfCheckinToken}`,
          },
        },
        idempotencyKey: `self_checkin_24h_${createdReservation.id}`,
      });

      // 7d. Post-checkout Genuine Review Request (+24h after check-out)
      const postCheckout24h = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      await enqueueJob({
        jobType: 'SEND_COMMUNICATION',
        eventType: 'review_request.scheduled',
        entityType: 'Reservation',
        entityId: createdReservation.id,
        reservationId: createdReservation.id,
        recipient: guest.phoneNumber || guest.email,
        scheduledAt: postCheckout24h,
        payload: {
          channel: guest.phoneNumber ? CommunicationChannel.WHATSAPP : CommunicationChannel.EMAIL,
          templateName: 'REVIEW_REQUEST',
          recipient: guest.phoneNumber || guest.email,
          templateData: {
            guestName: guest.name,
            reservationNumber,
          },
        },
        idempotencyKey: `review_req_${createdReservation.id}`,
      });

      // 7e. If guest has previous due / risk status, create Manager Review Task
      if (guestEval.requiresManagerReview) {
        await prisma.notification.create({
          data: {
            title: `⚠️ Manager Review Required: ${guest.name}`,
            detail: `Booking #${reservationNumber} created for guest with ${guestEval.riskStatus}. Reason: ${guestEval.riskReason || 'Flagged profile'}. Previous Due: NPR ${guestEval.previousDueAmount.toLocaleString()}.`,
            type: 'Billing',
            channel: 'In-App',
            status: 'Action Required',
          },
        });
      }

      // 7f. Send official hotel notification email
      sendBookingNotificationToOfficialMail({
        id: createdReservation.id,
        guestName: guest.name,
        email: guest.email,
        phone: guest.phoneNumber,
        nationality: guest.nationality,
        roomNumber: targetRoom.roomNumber,
        roomType: targetRoom.roomType.name,
        checkInDate: start,
        checkOutDate: end,
        adults: createdReservation.adults,
        children: createdReservation.children,
        totalAmount: computedTotal,
        paidAmount: paid,
        source: input.source,
        specialRequests: input.specialRequests || undefined,
        otaReference: input.externalBookingId || undefined,
      }).catch((err) => console.warn('Official email send error:', err));
    } catch (jobErr) {
      console.warn('Background automation queue warning:', jobErr);
    }

    // Retrieve full formatted reservation
    const fullReservation = await prisma.reservation.findUnique({
      where: { id: createdReservation.id },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        folio: { include: { items: true, payments: true } },
      },
    });

    return {
      success: true,
      reservation: fullReservation,
      requiresManagerReview: guestEval.requiresManagerReview,
      managerReviewReason: guestEval.riskReason,
    };
  } catch (error: any) {
    console.error('Unified Reservation Service Exception:', error);
    return {
      success: false,
      error: error.message || 'Internal error creating reservation',
    };
  }
}

/**
 * Cancels a reservation, releases room inventory, updates folio, and notifies guest
 */
export async function cancelUnifiedReservation(
  reservationId: string,
  reason: string,
  staffUserId?: string
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true, guest: true },
  });

  if (!reservation) {
    throw new Error(`Reservation ${reservationId} not found`);
  }

  // Update reservation status and release inventory in transaction
  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.CANCELLED,
        cancellationReason: reason,
      },
    });

    await releaseRoomInventory(reservationId, tx);

    if (reservation.roomId) {
      await tx.room.update({
        where: { id: reservation.roomId },
        data: {
          status: RoomStatus.AVAILABLE,
          currentGuest: null,
        },
      });
    }

    await emitDomainEvent(
      {
        eventType: 'reservation.cancelled',
        entityType: 'Reservation',
        entityId: reservationId,
        reservationId,
        source: 'PMS_FRONT_DESK',
        payload: {
          reservationId,
          reservationNumber: reservation.reservationNumber,
          guestName: reservation.guest.name,
          reason,
        },
      },
      tx
    );

    await recordAuditLog(
      {
        userId: staffUserId || 'SYSTEM',
        action: 'CANCEL_RESERVATION',
        entityType: 'Reservation',
        entityId: reservationId,
        beforeData: { status: reservation.status },
        afterData: { status: 'CANCELLED', cancellationReason: reason },
        reason,
      },
      tx
    );
  });

  return { success: true, message: 'Reservation successfully cancelled and inventory released' };
}
