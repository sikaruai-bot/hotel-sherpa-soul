import { prisma } from './prisma';
import { RiskStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { recordAuditLog } from './auditLogger';

export interface GuestLookupParams {
  idNumber?: string | null;
  passportNumber?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  name?: string | null;
}

export interface GuestEvaluationResult {
  guest: any;
  isNew: boolean;
  hasRisk: boolean;
  riskStatus: RiskStatus;
  riskReason: string | null;
  hasPreviousDue: boolean;
  previousDueAmount: number;
  requiresManagerReview: boolean;
  stayCount: number;
}

/**
 * Hash identification number (Passport, Citizenship, National ID) for zero-knowledge deduplication
 */
export function hashIdNumber(idStr?: string | null): string | null {
  if (!idStr) return null;
  const clean = idStr.trim().replace(/[\s-_]/g, '').toUpperCase();
  if (clean.length < 3) return null;
  return createHash('sha256').update(clean).digest('hex');
}

/**
 * Normalizes phone numbers (handles Nepal +977 and common formats)
 */
export function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 6) return null;
  return digits;
}

/**
 * Identifies and retrieves an existing guest profile using a strict 3-tier hierarchy:
 * 1. Government ID / Passport Number (hash or exact match)
 * 2. Verified Phone Number
 * 3. Email Address
 * (NEVER matches purely on guest name to prevent false blacklisting/due attribution)
 */
export async function findOrCreateGuest(
  params: GuestLookupParams & {
    nationality?: string | null;
    idType?: string | null;
    photoUrl?: string | null;
    livePhotoReference?: string | null;
    consentStatus?: boolean;
  },
  tx?: any
): Promise<GuestEvaluationResult> {
  const db = tx || prisma;
  const idStr = (params.idNumber || params.passportNumber || '').trim();
  const idHash = hashIdNumber(idStr);
  const normPhone = normalizePhoneNumber(params.phoneNumber);
  const cleanEmail = params.email?.trim().toLowerCase() || null;
  const guestName = params.name?.trim() || 'Guest';

  let guest: any = null;

  // 1. Primary Lookup: Government ID / Passport / National ID
  if (idStr && idStr.length >= 3) {
    guest = await db.guest.findFirst({
      where: {
        OR: [
          ...(idHash ? [{ idNumberHash: idHash }] : []),
          { idNumber: { equals: idStr, mode: 'insensitive' } },
          { passportNumber: { equals: idStr, mode: 'insensitive' } },
        ],
      },
    });
  }

  // 2. Secondary Lookup: Phone Number
  if (!guest && normPhone) {
    guest = await db.guest.findFirst({
      where: {
        phoneNumber: { contains: normPhone.slice(-8) },
      },
    });
  }

  // 3. Fallback Lookup: Email
  if (!guest && cleanEmail && cleanEmail.includes('@')) {
    guest = await db.guest.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });
  }

  let isNew = false;
  if (!guest) {
    isNew = true;
    guest = await db.guest.create({
      data: {
        name: guestName,
        fullName: guestName,
        normalizedName: guestName.toLowerCase(),
        email: cleanEmail,
        phoneNumber: params.phoneNumber?.trim() || null,
        nationality: params.nationality?.trim() || 'Nepal',
        idType: params.idType || null,
        idNumber: idStr || null,
        passportNumber: idStr || null,
        idNumberHash: idHash,
        photoUrl: params.photoUrl || null,
        livePhotoReference: params.livePhotoReference || null,
        consentStatus: Boolean(params.consentStatus),
        riskStatus: RiskStatus.NORMAL,
      },
    });
  } else {
    // Update profile data without overwriting verified fields or risk status
    const updatePayload: any = {};
    if (params.photoUrl) updatePayload.photoUrl = params.photoUrl;
    if (params.livePhotoReference) updatePayload.livePhotoReference = params.livePhotoReference;
    if (params.consentStatus !== undefined) updatePayload.consentStatus = Boolean(params.consentStatus);
    if (!guest.idNumber && idStr) {
      updatePayload.idNumber = idStr;
      updatePayload.passportNumber = idStr;
      updatePayload.idNumberHash = idHash;
    }
    if (!guest.phoneNumber && params.phoneNumber) updatePayload.phoneNumber = params.phoneNumber.trim();
    if (!guest.email && cleanEmail) updatePayload.email = cleanEmail;

    if (Object.keys(updatePayload).length > 0) {
      guest = await db.guest.update({
        where: { id: guest.id },
        data: updatePayload,
      });
    }
  }

  // Calculate past stay count and any outstanding balances
  const pastReservations = await db.reservation.findMany({
    where: {
      guestId: guest.id,
      status: { notIn: ['CANCELLED', 'INQUIRY'] },
    },
    select: {
      id: true,
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
    },
  });

  let calculatedDue = 0;
  for (const r of pastReservations) {
    const itemDue = Math.max(0, (r.dueAmount || 0) || (r.totalAmount - r.paidAmount));
    calculatedDue += itemDue;
  }

  // Check if guest has existing recorded previousDueAmount
  const finalDue = Math.max(calculatedDue, guest.previousDueAmount || 0);

  const hasPreviousDue = finalDue > 0;
  let riskStatus: RiskStatus = guest.riskStatus;

  // Auto-flag payment alert if unpaid due exists and guest was NORMAL
  if (hasPreviousDue && riskStatus === RiskStatus.NORMAL) {
    riskStatus = RiskStatus.PAYMENT_ALERT;
  }

  const requiresManagerReview =
    riskStatus === RiskStatus.MANAGER_REVIEW ||
    riskStatus === RiskStatus.DO_NOT_RENT ||
    guest.isBlacklisted ||
    hasPreviousDue;

  return {
    guest,
    isNew,
    hasRisk: riskStatus !== RiskStatus.NORMAL || guest.isBlacklisted,
    riskStatus,
    riskReason: guest.riskReason || guest.blacklistReason || (hasPreviousDue ? `Previous unsettled balance of NPR ${finalDue.toLocaleString()}` : null),
    hasPreviousDue,
    previousDueAmount: finalDue,
    requiresManagerReview,
    stayCount: pastReservations.length,
  };
}

/**
 * Updates or clears a guest's risk status with mandatory audit logging
 */
export async function updateGuestRiskStatus(
  guestId: string,
  newStatus: RiskStatus,
  reason: string,
  reviewedByStaff: string,
  ipAddress?: string
) {
  const existing = await prisma.guest.findUnique({
    where: { id: guestId },
  });

  if (!existing) {
    throw new Error('Guest not found');
  }

  const updated = await prisma.guest.update({
    where: { id: guestId },
    data: {
      riskStatus: newStatus,
      riskReason: reason,
      riskReviewedBy: reviewedByStaff,
      riskReviewedAt: new Date(),
      isBlacklisted: newStatus === RiskStatus.DO_NOT_RENT,
      blacklistReason: newStatus === RiskStatus.DO_NOT_RENT ? reason : null,
    },
  });

  await recordAuditLog({
    userId: reviewedByStaff,
    action: 'UPDATE_GUEST_RISK_STATUS',
    entityType: 'Guest',
    entityId: guestId,
    beforeData: { riskStatus: existing.riskStatus, riskReason: existing.riskReason },
    afterData: { riskStatus: newStatus, riskReason: reason },
    reason,
    ipAddress,
  });

  return updated;
}
