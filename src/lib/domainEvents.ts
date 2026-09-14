import { prisma } from './prisma';
import { EventStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

export type DomainEventType =
  | 'guest.created'
  | 'guest.updated'
  | 'reservation.created'
  | 'reservation.confirmed'
  | 'reservation.modified'
  | 'reservation.cancelled'
  | 'reservation.no_show'
  | 'payment.created'
  | 'payment.received'
  | 'payment.failed'
  | 'payment.refunded'
  | 'guest.checked_in'
  | 'guest.checked_out'
  | 'room.status_changed'
  | 'room.assigned'
  | 'room.maintenance_created'
  | 'self_checkin.started'
  | 'self_checkin.completed'
  | 'ota.sync_failed'
  | 'notification.failed'
  | 'review_request.scheduled'
  | 'review_request.sent';

export interface DomainEventInput {
  eventType: DomainEventType;
  entityType: 'Reservation' | 'Guest' | 'Payment' | 'Room' | 'Folio' | 'System';
  entityId: string;
  reservationId?: string | null;
  correlationId?: string | null;
  payload: Record<string, any>;
  source: string;
}

type EventHandler = (event: {
  id: string;
  eventId: string;
  eventType: DomainEventType;
  entityType: string;
  entityId: string;
  reservationId: string | null;
  payload: any;
  source: string;
}) => Promise<void>;

const eventSubscribers: Map<DomainEventType | '*', EventHandler[]> = new Map();

/**
 * Register a programmatic subscriber for domain events.
 */
export function subscribeDomainEvent(
  eventType: DomainEventType | '*',
  handler: EventHandler
) {
  const current = eventSubscribers.get(eventType) || [];
  eventSubscribers.set(eventType, [...current, handler]);
}

/**
 * Emits and commits a domain event to the outbox table (`DomainEvent`).
 * Can be executed inside an existing Prisma transaction or standalone.
 */
export async function emitDomainEvent(input: DomainEventInput, tx?: any) {
  const db = tx || prisma;
  const eventId = `evt_${randomUUID().replace(/-/g, '')}`;

  // Sanitize payload to strip sensitive credentials
  const sanitizedPayload = { ...input.payload };
  delete sanitizedPayload.password;
  delete sanitizedPayload.pinCode;
  delete sanitizedPayload.secret;

  const eventRecord = await db.domainEvent.create({
    data: {
      eventId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      reservationId: input.reservationId || null,
      correlationId: input.correlationId || eventId,
      payload: sanitizedPayload,
      source: input.source,
      status: EventStatus.PENDING,
    },
  });

  return eventRecord;
}

/**
 * Dispatches a recorded domain event to in-memory subscribers and updates its status.
 */
export async function dispatchDomainEvent(eventId: string) {
  const event = await prisma.domainEvent.findUnique({
    where: { eventId },
  });

  if (!event || event.status === EventStatus.COMPLETED) {
    return;
  }

  await prisma.domainEvent.update({
    where: { id: event.id },
    data: { status: EventStatus.PROCESSING, attempts: { increment: 1 } },
  });

  try {
    const handlers = [
      ...(eventSubscribers.get(event.eventType as DomainEventType) || []),
      ...(eventSubscribers.get('*') || []),
    ];

    for (const handler of handlers) {
      await handler({
        id: event.id,
        eventId: event.eventId,
        eventType: event.eventType as DomainEventType,
        entityType: event.entityType,
        entityId: event.entityId,
        reservationId: event.reservationId,
        payload: event.payload,
        source: event.source,
      });
    }

    await prisma.domainEvent.update({
      where: { id: event.id },
      data: { status: EventStatus.COMPLETED, processedAt: new Date() },
    });
  } catch (err: any) {
    console.error(`Domain event dispatch failure [${event.eventType}]:`, err);
    await prisma.domainEvent.update({
      where: { id: event.id },
      data: {
        status: EventStatus.FAILED,
        errorMessage: err.message || 'Dispatch failed',
      },
    });
  }
}
