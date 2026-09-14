import { prisma } from './prisma';
import { RiskStatus } from '@prisma/client';

/**
 * Fetch recent failed automation jobs (including dead‑lettered).
 */
export async function getFailedAutomationJobs(limit = 20) {
  return prisma.automationJob.findMany({
    where: {
      status: { in: ['FAILED', 'DEAD_LETTER'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Fetch recent webhook errors (HTTP status >= 400 or status not 200).
 */
export async function getWebhookErrors(limit = 20) {
  return prisma.webhookLog.findMany({
    where: {
      OR: [
        { status: { gte: 400 } },
        { status: { lt: 200 } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Fetch recent payment failures.
 */
export async function getPaymentFailures(limit = 20) {
  return prisma.payment.findMany({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Fetch guests with elevated risk status.
 */
export async function getHighRiskGuests(limit = 20) {
  return prisma.guest.findMany({
    where: {
      riskStatus: {
        in: [RiskStatus.PAYMENT_ALERT, RiskStatus.MANAGER_REVIEW, RiskStatus.DO_NOT_RENT],
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
}

/**
 * Aggregate all exception data for the dashboard.
 */
export async function getExceptionDashboardData() {
  const [jobs, webhooks, payments, guests] = await Promise.all([
    getFailedAutomationJobs(),
    getWebhookErrors(),
    getPaymentFailures(),
    getHighRiskGuests(),
  ]);
  return { jobs, webhooks, payments, guests };
}
