import { prisma } from './prisma';
import { FolioItemCategory, FolioStatus, PaymentMethod, PaymentRecordStatus } from '@prisma/client';

export interface AddFolioItemInput {
  folioId: string;
  category: FolioItemCategory;
  description: string;
  quantity?: number;
  unitPrice: number;
  taxRate?: number; // Default 0 (Hotel registered in PAN only - Non-VAT)
  serviceChargeRate?: number; // Default 0
  source?: string;
  referenceId?: string | null;
  createdBy?: string | null;
}

export interface PostPaymentInput {
  folioId: string;
  amount: number;
  method: PaymentMethod;
  currency?: string;
  provider?: string | null;
  providerTransactionId?: string | null;
  verifiedBy?: string | null;
  idempotencyKey?: string | null;
}

/**
 * Creates or retrieves the financial folio for a reservation
 */
export async function getOrCreateFolio(reservationId: string, guestId: string, tx?: any) {
  const db = tx || prisma;

  let folio = await db.folio.findUnique({
    where: { reservationId },
    include: { items: true, payments: true },
  });

  if (!folio) {
    folio = await db.folio.create({
      data: {
        reservationId,
        guestId,
        status: FolioStatus.OPEN,
        totalCharges: 0,
        totalPayments: 0,
        totalDiscounts: 0,
        totalTax: 0,
        totalServiceCharge: 0,
        balanceDue: 0,
        currency: 'NPR',
      },
      include: { items: true, payments: true },
    });
  }

  return folio;
}

/**
 * Recalculates all totals, taxes, service charges, payments, and balance due for a folio
 */
export async function recalculateFolio(folioId: string, tx?: any) {
  const db = tx || prisma;

  const folio = await db.folio.findUnique({
    where: { id: folioId },
    include: { items: true, payments: true, reservation: true },
  });

  if (!folio) {
    throw new Error(`Folio ${folioId} not found`);
  }

  let totalCharges = 0;
  let totalDiscounts = 0;
  let totalTax = 0;
  let totalServiceCharge = 0;

  for (const item of folio.items) {
    if (item.category === FolioItemCategory.DISCOUNT) {
      totalDiscounts += Math.abs(item.amount);
    } else if (item.category === FolioItemCategory.REFUND) {
      totalCharges -= Math.abs(item.amount);
    } else {
      totalCharges += item.amount;
      if (item.serviceChargeRate > 0) {
        totalServiceCharge += item.amount * item.serviceChargeRate;
      }
      if (item.taxRate > 0) {
        const taxableAmount = item.amount + (item.amount * (item.serviceChargeRate || 0));
        totalTax += taxableAmount * item.taxRate;
      }
    }
  }

  const grandTotal = totalCharges - totalDiscounts + totalTax + totalServiceCharge;

  // Sum successful payments
  let totalPayments = 0;
  for (const p of folio.payments) {
    if (p.status === PaymentRecordStatus.COMPLETED) {
      totalPayments += p.amount;
    }
  }

  const balanceDue = Math.max(0, grandTotal - totalPayments);

  const updatedFolio = await db.folio.update({
    where: { id: folioId },
    data: {
      totalCharges,
      totalDiscounts,
      totalTax,
      totalServiceCharge,
      totalPayments,
      balanceDue,
    },
    include: { items: true, payments: true },
  });

  // Sync back to reservation totalAmount, paidAmount, and dueAmount
  if (folio.reservationId) {
    await db.reservation.update({
      where: { id: folio.reservationId },
      data: {
        totalAmount: grandTotal,
        paidAmount: totalPayments,
        dueAmount: balanceDue,
        paymentStatus:
          balanceDue <= 0 && grandTotal > 0
            ? 'PAID'
            : totalPayments > 0
            ? 'PARTIAL'
            : 'UNPAID',
      },
    });
  }

  return updatedFolio;
}

/**
 * Adds an item/charge to a folio (e.g. room charges, restaurant POS, laundry, airport pickup)
 */
export async function addFolioItem(input: AddFolioItemInput, tx?: any) {
  const db = tx || prisma;
  const qty = input.quantity || 1;
  const amount = input.unitPrice * qty;

  const item = await db.folioItem.create({
    data: {
      folioId: input.folioId,
      category: input.category,
      description: input.description,
      quantity: qty,
      unitPrice: input.unitPrice,
      amount,
      taxRate: input.taxRate !== undefined ? input.taxRate : 0,
      serviceChargeRate: input.serviceChargeRate !== undefined ? input.serviceChargeRate : 0,
      source: input.source || 'PMS',
      referenceId: input.referenceId || null,
      createdBy: input.createdBy || null,
    },
  });

  const updatedFolio = await recalculateFolio(input.folioId, tx);
  return { item, folio: updatedFolio };
}

/**
 * Records a payment against a folio and reconciles the balance
 */
export async function postFolioPayment(input: PostPaymentInput, tx?: any) {
  const db = tx || prisma;

  const folio = await db.folio.findUnique({
    where: { id: input.folioId },
  });

  if (!folio) {
    throw new Error(`Folio ${input.folioId} not found`);
  }

  // Idempotency check
  if (input.idempotencyKey) {
    const existingPayment = await db.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existingPayment) {
      return { payment: existingPayment, folio };
    }
  }

  const payment = await db.payment.create({
    data: {
      folioId: input.folioId,
      reservationId: folio.reservationId,
      amount: input.amount,
      currency: input.currency || 'NPR',
      method: input.method,
      status: PaymentRecordStatus.COMPLETED,
      provider: input.provider || null,
      providerTransactionId: input.providerTransactionId || null,
      verifiedAt: new Date(),
      verifiedBy: input.verifiedBy || 'PMS Automated Ledger',
      idempotencyKey: input.idempotencyKey || null,
    },
  });

  const updatedFolio = await recalculateFolio(input.folioId, tx);
  return { payment, folio: updatedFolio };
}
