import { prisma } from './prisma';
import { JobStatus } from '@prisma/client';

export interface EnqueueJobOptions {
  jobType: string;
  eventType: string;
  entityType: string;
  entityId: string;
  reservationId?: string | null;
  recipient?: string | null;
  payload: Record<string, any>;
  scheduledAt?: Date;
  idempotencyKey?: string;
  maxAttempts?: number;
}

// Configurable backoff schedule in seconds: 1m, 5m, 15m, 1h, 6h
export const RETRY_BACKOFF_SECONDS = [60, 300, 900, 3600, 21600];

type JobHandler = (payload: any, job: any) => Promise<void>;
const jobHandlers: Map<string, JobHandler> = new Map();

/**
 * Register a worker processor for a specific jobType
 */
export function registerJobHandler(jobType: string, handler: JobHandler) {
  jobHandlers.set(jobType, handler);
}

/**
 * Enqueue an automation job into the durable database queue
 */
export async function enqueueJob(options: EnqueueJobOptions, tx?: any) {
  const db = tx || prisma;
  const scheduledAt = options.scheduledAt || new Date();
  const idempotencyKey =
    options.idempotencyKey ||
    `${options.jobType}:${options.entityId}:${scheduledAt.getTime()}`;

  // Check if job with this idempotency key already exists
  const existing = await db.automationJob.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  return await db.automationJob.create({
    data: {
      jobType: options.jobType,
      eventType: options.eventType,
      entityType: options.entityType,
      entityId: options.entityId,
      reservationId: options.reservationId || null,
      recipient: options.recipient || null,
      payload: options.payload,
      scheduledAt,
      idempotencyKey,
      maxAttempts: options.maxAttempts || 5,
      status: JobStatus.PENDING,
    },
  });
}

/**
 * Executes a single job, handling status transitions and exponential backoff retries.
 */
export async function executeJob(jobId: string) {
  const job = await prisma.automationJob.findUnique({
    where: { id: jobId },
  });

  if (!job || job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
    return;
  }

  // Mark processing
  await prisma.automationJob.update({
    where: { id: job.id },
    data: {
      status: JobStatus.PROCESSING,
      attempts: { increment: 1 },
    },
  });

  const handler = jobHandlers.get(job.jobType);
  if (!handler) {
    console.warn(`No handler registered for job type: ${job.jobType}`);
    await prisma.automationJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.FAILED,
        lastError: `No worker handler registered for job type '${job.jobType}'`,
      },
    });
    return;
  }

  try {
    await handler(job.payload, job);

    await prisma.automationJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED,
        processedAt: new Date(),
        lastError: null,
      },
    });
  } catch (err: any) {
    const nextAttempt = job.attempts + 1;
    const errorMsg = err.message || 'Automation execution error';
    console.error(`Automation Job [${job.jobType}:${job.id}] failed on attempt ${nextAttempt}:`, errorMsg);

    if (nextAttempt >= job.maxAttempts) {
      // Move to Dead Letter Queue (DLQ)
      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.DEAD_LETTER,
          lastError: `Dead Letter: Exceeded max attempts (${job.maxAttempts}). Last error: ${errorMsg}`,
          processedAt: new Date(),
        },
      });

      // Create an alert notification for front desk/manager
      await prisma.notification.create({
        data: {
          title: `⚠️ Job Dead-Lettered: ${job.jobType}`,
          detail: `Job ${job.id.slice(0, 8)} permanently failed after ${job.maxAttempts} attempts: ${errorMsg}`,
          type: 'Automation',
          channel: 'In-App',
          status: 'Action Required',
        },
      }).catch(() => {});
    } else {
      // Schedule next retry with exponential backoff
      const backoffSec =
        RETRY_BACKOFF_SECONDS[Math.min(nextAttempt - 1, RETRY_BACKOFF_SECONDS.length - 1)];
      const nextSchedule = new Date(Date.now() + backoffSec * 1000);

      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.RETRYING,
          scheduledAt: nextSchedule,
          lastError: `Attempt ${nextAttempt} failed: ${errorMsg}`,
        },
      });
    }
  }
}

/**
 * Processes ready jobs from the database queue (e.g., triggered by cron or API worker).
 */
export async function processReadyJobs(batchSize = 20) {
  const now = new Date();

  const readyJobs = await prisma.automationJob.findMany({
    where: {
      status: { in: [JobStatus.PENDING, JobStatus.RETRYING] },
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: batchSize,
  });

  const results = [];
  for (const job of readyJobs) {
    try {
      await executeJob(job.id);
      results.push({ id: job.id, success: true });
    } catch (e: any) {
      results.push({ id: job.id, success: false, error: e.message });
    }
  }

  return { processed: results.length, details: results };
}

/**
 * Manually retry a failed or dead-lettered job from the admin dashboard
 */
export async function manualRetryJob(jobId: string) {
  const job = await prisma.automationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  await prisma.automationJob.update({
    where: { id: jobId },
    data: {
      status: JobStatus.PENDING,
      scheduledAt: new Date(),
      lastError: `Manually requeued by staff on ${new Date().toISOString()}`,
    },
  });

  return await executeJob(jobId);
}
