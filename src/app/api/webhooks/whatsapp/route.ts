import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CommunicationChannel, MessageDirection, MessageStatus } from '@prisma/client';
import { normalizeWhatsAppBooking } from '@/lib/sourceAdapters';
import { createUnifiedReservation } from '@/lib/reservationService';
import { sendWhatsAppMessage } from '@/lib/smsWhatsappAdapter';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Meta WhatsApp Webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'sherpasoul_whatsapp_secret';

  if (mode === 'subscribe' && token === expectedToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification token mismatch' }, { status: 403 });
}

// POST: Incoming WhatsApp message processor
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Check if this is a standard Meta Cloud API payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Could be mock testing or direct payload
      const testPhone = body.phone || body.from;
      const testText = body.text || body.message || '';

      if (testPhone && testText) {
        return await handleIncomingMessage(testPhone, testText, body.name);
      }

      return NextResponse.json({ success: true, message: 'No message payload' });
    }

    const fromNumber = message.from;
    const textBody = message.text?.body || '';
    const senderName = value?.contacts?.[0]?.profile?.name || 'WhatsApp Guest';

    return await handleIncomingMessage(fromNumber, textBody, senderName);
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleIncomingMessage(phone: string, text: string, senderName?: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const messageId = `wa_${randomUUID().replace(/-/g, '')}`;

  // 1. Locate existing Guest by phone
  const guest = await prisma.guest.findFirst({
    where: { phoneNumber: { contains: cleanPhone.slice(-8) } },
    include: { reservations: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  const latestRes = guest?.reservations?.[0];

  // 2. Check if this is a complex question requiring human staff handover
  const lowerText = text.toLowerCase();
  const isComplex =
    lowerText.includes('complaint') ||
    lowerText.includes('discount') ||
    lowerText.includes('manager') ||
    lowerText.includes('refund') ||
    lowerText.includes('problem') ||
    lowerText.includes('emergency') ||
    lowerText.includes('custom') ||
    lowerText.length > 200;

  // 3. Save incoming message to UnifiedMessage
  const loggedMsg = await prisma.unifiedMessage.create({
    data: {
      messageId,
      reservationId: latestRes?.id || null,
      guestId: guest?.id || null,
      channel: CommunicationChannel.WHATSAPP,
      direction: MessageDirection.INBOUND,
      sender: phone,
      recipient: 'Hotel Sherpa Soul',
      content: text,
      status: MessageStatus.DELIVERED,
      requiresStaffAction: isComplex,
      assignedStaff: isComplex ? 'Front Desk Receptionist' : null,
      isRead: false,
    },
  });

  if (isComplex) {
    // Notify front desk staff of handoff
    await prisma.notification.create({
      data: {
        title: `💬 WhatsApp Staff Handover: ${senderName || phone}`,
        detail: `Guest message flagged for human follow-up: "${text.slice(0, 100)}..."`,
        type: 'General',
        channel: 'In-App',
        status: 'Action Required',
      },
    });

    // Send handoff notice to guest
    await sendWhatsAppMessage(
      phone,
      `Namaste ${senderName || 'Guest'}! 🙏 Our front desk team has received your message and will reply to you personally in a few moments.`
    );

    return NextResponse.json({
      success: true,
      handedOver: true,
      messageId: loggedMsg.id,
    });
  }

  // 4. Booking intent parsing (e.g. "Book standard room from 2026-10-01 to 2026-10-04")
  const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/g;
  const matchedDates = text.match(dateRegex);

  if (matchedDates && matchedDates.length >= 2) {
    const checkIn = matchedDates[0];
    const checkOut = matchedDates[1];

    const normalized = normalizeWhatsAppBooking({
      guestName: senderName || 'WhatsApp Inquirer',
      phone,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      notes: text,
    });

    const bookingResult = await createUnifiedReservation(normalized, {
      staffUserId: 'WHATSAPP_BOT',
    });

    if (bookingResult.success) {
      await sendWhatsAppMessage(
        phone,
        `Tashi Delek ${senderName}! 🙏 We have placed your provisional booking #${bookingResult.reservation.reservationNumber} for ${checkIn} to ${checkOut} (Room ${bookingResult.reservation.room.roomNumber}). Total: NPR ${bookingResult.reservation.totalAmount.toLocaleString()}. Our reception will confirm your payment link shortly.`
      );

      return NextResponse.json({
        success: true,
        bookingCreated: true,
        reservationNumber: bookingResult.reservation.reservationNumber,
      });
    }
  }

  // 5. Default friendly concierge reply
  await sendWhatsAppMessage(
    phone,
    `Namaste from Hotel Sherpa Soul, Thamel, Kathmandu! 🙏\nHow can we assist your stay today?\n• Type 'Dates: YYYY-MM-DD to YYYY-MM-DD' to check rooms\n• Type 'Manager' to speak directly with our front desk.`
  );

  return NextResponse.json({
    success: true,
    autoReplied: true,
    messageId: loggedMsg.id,
  });
}
