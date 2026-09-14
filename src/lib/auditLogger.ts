import { prisma } from './prisma';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: any;
  afterData?: any;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Records an immutable audit log entry in the PMS.
 * Sensitive credentials, tokens, or plaintext identity numbers are sanitized before storage.
 */
export async function recordAuditLog(input: AuditLogInput, tx?: any) {
  const db = tx || prisma;

  const sanitize = (data: any) => {
    if (!data) return null;
    try {
      const clone = JSON.parse(JSON.stringify(data));
      const sensitiveKeys = ['password', 'pinCode', 'secret', 'token', 'apiKey', 'creditCard'];
      const scrub = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          if (sensitiveKeys.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
            obj[k] = '***REDACTED***';
          } else if (typeof obj[k] === 'object') {
            scrub(obj[k]);
          }
        }
      };
      scrub(clone);
      return clone;
    } catch {
      return null;
    }
  };

  try {
    return await db.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeData: sanitize(input.beforeData),
        afterData: sanitize(input.afterData),
        reason: input.reason || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });
  } catch (err) {
    console.warn('Failed to write audit log:', err);
    return null;
  }
}
