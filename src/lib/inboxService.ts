import { prisma } from './prisma';
import { CommunicationChannel, MessageStatus, UnifiedMessage } from '@prisma/client';

/**
 * List inbox messages for a given staff user or filters.
 * Supports optional filters: status, channel, reservationId, guestId, staffId.
 */
export async function listInboxMessages(filters: {
  staffId?: string;
  status?: MessageStatus;
  channel?: CommunicationChannel;
  reservationId?: string;
  guestId?: string;
  requiresStaffAction?: boolean;
}): Promise<UnifiedMessage[]> {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.channel) where.channel = filters.channel;
  if (filters.reservationId) where.reservationId = filters.reservationId;
  if (filters.guestId) where.guestId = filters.guestId;
  if (filters.staffId) where.assignedStaff = filters.staffId;
  if (filters.requiresStaffAction !== undefined) where.requiresStaffAction = filters.requiresStaffAction;

  return prisma.unifiedMessage.findMany({ where, orderBy: { createdAt: 'desc' } });
}

/** Mark a message as read */
export async function markMessageRead(messageId: string): Promise<UnifiedMessage> {
  return prisma.unifiedMessage.update({
    where: { id: messageId },
    data: { isRead: true },
  });
}

/** Assign a staff member to handle the message */
export async function assignMessageToStaff(messageId: string, staffId: string): Promise<UnifiedMessage> {
  return prisma.unifiedMessage.update({
    where: { id: messageId },
    data: { requiresStaffAction: true, assignedStaff: staffId },
  });
}

/** Create a new inbox message */
export async function createInboxMessage(payload: {
  channel: CommunicationChannel;
  recipient: string;
  sender?: string;
  guestId?: string;
  reservationId?: string;
  subject?: string;
  content: string;
  requiresStaffAction?: boolean;
}): Promise<UnifiedMessage> {
  return prisma.unifiedMessage.create({
    data: {
      channel: payload.channel,
      recipient: payload.recipient,
      sender: payload.sender ?? 'SYSTEM',
      guestId: payload.guestId ?? null,
      reservationId: payload.reservationId ?? null,
      subject: payload.subject ?? null,
      content: payload.content,
      requiresStaffAction: payload.requiresStaffAction ?? false,
    },
  });
}
