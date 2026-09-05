import { prisma } from './prisma';

export type PmsEventName =
  | 'booking.created'
  | 'guest.checked_in'
  | 'guest.checked_out'
  | 'payment.received'
  | 'housekeeping.assigned'
  | 'maintenance.created'
  | 'kitchen.alert';

export interface PmsEventPayload {
  event: PmsEventName;
  timestamp: string;
  hotel: string;
  environment: string;
  data: any;
}

/**
 * Emits a PMS business event asynchronously.
 * Finds all matching registered webhooks (Zapier, Make, n8n, custom URLs),
 * dispatches the JSON payload, and records the delivery result in WebhookLog.
 */
export async function emitPmsEvent(event: PmsEventName, data: any) {
  const payload: PmsEventPayload = {
    event,
    timestamp: new Date().toISOString(),
    hotel: 'Hotel Sherpa Soul',
    environment: process.env.NODE_ENV || 'development',
    data,
  };

  // Run in background without blocking response
  (async () => {
    try {
      // Find all active webhook endpoints
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: { isActive: true },
      });

      for (const ep of endpoints) {
        let subscribedEvents: string[] = [];
        try {
          subscribedEvents = JSON.parse(ep.events);
        } catch {
          subscribedEvents = [];
        }

        // Check if endpoint is subscribed to this event or wildcard '*'
        if (subscribedEvents.includes('*') || subscribedEvents.includes(event)) {
          dispatchWebhook(ep.id, ep.url, ep.secret || '', payload);
        }
      }
    } catch (err) {
      console.warn('Error querying webhook endpoints:', err);
    }
  })();
}

async function dispatchWebhook(
  endpointId: string,
  url: string,
  secret: string,
  payload: PmsEventPayload
) {
  const jsonBody = JSON.stringify(payload);
  let status = 0;
  let responseText = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HotelSherpaSoul-PMS-Webhook/1.0',
        'X-SherpaSoul-Event': payload.event,
        'X-SherpaSoul-Delivery': Date.now().toString(),
        ...(secret && { 'X-SherpaSoul-Secret': secret }),
      },
      body: jsonBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    status = res.status;
    responseText = await res.text().catch(() => '');
  } catch (err: any) {
    status = 500;
    responseText = err.message || 'Connection failed';
  }

  // Save delivery log in database
  try {
    await prisma.webhookLog.create({
      data: {
        endpointId,
        event: payload.event,
        status,
        response: responseText.slice(0, 500), // Keep first 500 chars
        payload: jsonBody,
      },
    });
  } catch (logErr) {
    console.warn('Failed to save webhook delivery log:', logErr);
  }
}
