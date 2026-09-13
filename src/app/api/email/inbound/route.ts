import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkCategoryCapacity, getAvailableAlternatives, dispatchRoomFullAlert } from '@/lib/roomCategoryShield';
import { sendBookingNotificationToOfficialMail } from '@/lib/emailService';
import { emitPmsEvent } from '@/lib/events';
import { ReservationStatus } from '@prisma/client';

/**
 * Inbound Email Webhook:
 * Automatically receives forwarded booking emails from the official hotel email inbox (cPanel / Gmail / Zapier / SendGrid)
 * Parses booking details (Guest Name, Dates, Room Category, Phone, Source) and registers into PMS!
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: any = {};

    if (contentType.includes('application/json')) {
      payload = await request.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const entries: Record<string, any> = {};
      formData.forEach((val, key) => {
        entries[key] = val;
      });
      payload = entries;
    }

    // Extract raw text or structured fields from email payload
    const rawText = payload.text || payload.body || payload.html || payload.content || '';
    const subject = payload.subject || payload.Subject || '';
    const sender = payload.from || payload.sender || payload.From || '';

    // Extract fields or use provided structured fields
    let guestName = payload.guestName || payload.name;
    let phone = payload.phone || payload.phoneNumber;
    let email = payload.email || payload.guestEmail;
    let roomNumber = payload.roomNumber;
    let checkInDate = payload.checkInDate || payload.startDate;
    let checkOutDate = payload.checkOutDate || payload.endDate;
    let totalAmount = Number(payload.totalAmount) || 0;
    let source = payload.source || 'Website Official Email';

    // Heuristic extraction if raw text is sent from an email forwarder
    if (!guestName && rawText) {
      const nameMatch = rawText.match(/Guest Name:\s*([^\n\r]+)/i) || rawText.match(/Name:\s*([^\n\r]+)/i);
      if (nameMatch) guestName = nameMatch[1].trim();

      const phoneMatch = rawText.match(/Phone:\s*([+\d\s-]+)/i) || rawText.match(/Mobile:\s*([+\d\s-]+)/i);
      if (phoneMatch) phone = phoneMatch[1].trim();

      const emailMatch = rawText.match(/Email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) email = emailMatch[1].trim();

      const inMatch = rawText.match(/Check-in:\s*(\d{4}-\d{2}-\d{2})/i) || rawText.match(/Check in:\s*(\d{4}-\d{2}-\d{2})/i);
      if (inMatch) checkInDate = inMatch[1].trim();

      const outMatch = rawText.match(/Check-out:\s*(\d{4}-\d{2}-\d{2})/i) || rawText.match(/Check out:\s*(\d{4}-\d{2}-\d{2})/i);
      if (outMatch) checkOutDate = outMatch[1].trim();

      const roomMatch = rawText.match(/Room:\s*(?:Room\s*)?(\d{3})/i);
      if (roomMatch) roomNumber = roomMatch[1].trim();
    }

    // Default dates if missing
    if (!checkInDate) {
      checkInDate = new Date().toISOString().split('T')[0];
    }
    if (!checkOutDate) {
      checkOutDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }

    // Default room category if not specified: default to 201 (Deluxe)
    if (!roomNumber) {
      if (rawText.toLowerCase().includes('family') && !rawText.toLowerCase().includes('budget')) {
        roomNumber = '202';
      } else if (rawText.toLowerCase().includes('budget')) {
        roomNumber = '203';
      } else {
        roomNumber = '201';
      }
    }

    guestName = guestName || 'Email Guest';
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    // 1. CAPACITY SHIELD: Max 2 rooms per category per day
    const categoryCheck = await checkCategoryCapacity({
      categoryOrRoom: String(roomNumber),
      checkInDate: start,
      checkOutDate: end,
    });

    if (!categoryCheck.isAvailable) {
      const alternatives = await getAvailableAlternatives({
        checkInDate: start,
        checkOutDate: end,
        excludeCategoryId: categoryCheck.category.id,
      });

      const alertResult = await dispatchRoomFullAlert({
        guestName,
        phone,
        email,
        requestedCategory: categoryCheck.category.name,
        checkInDate: String(checkInDate),
        checkOutDate: String(checkOutDate),
        alternatives,
        source: 'EMAIL_INBOUND',
      });

      return NextResponse.json(
        {
          success: false,
          error: categoryCheck.conflictReason,
          roomFullMessage: alertResult.messageNepali,
          alternatives: alertResult.alternatives,
        },
        { status: 409 }
      );
    }

    // Find target room
    const room = await prisma.room.findUnique({
      where: { roomNumber: String(roomNumber) },
      include: { roomType: true },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Room ${roomNumber} not found` },
        { status: 404 }
      );
    }

    if (totalAmount <= 0) {
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
      totalAmount = room.roomType.dailyRate * days;
    }

    // Retrieve or create guest
    let guest = await prisma.guest.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { name: guestName },
        ],
      },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: guestName,
          email: email || `${guestName.toLowerCase().replace(/\s+/g, '.')}@guest.com`,
          phoneNumber: phone || null,
          nationality: 'Nepal',
        },
      });
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        guestId: guest.id,
        roomId: room.id,
        checkInDate: start,
        checkOutDate: end,
        adults: 2,
        children: 0,
        totalAmount,
        paidAmount: 0,
        status: ReservationStatus.CONFIRMED,
        source: source || 'Website Email Inbound',
        specialRequests: `Email Subject: ${subject || 'Direct Inquiry'} | Sender: ${sender || 'N/A'}`,
      },
    });

    // Notify official email
    await sendBookingNotificationToOfficialMail({
      id: reservation.id,
      guestName: guest.name,
      email: guest.email,
      phone: guest.phoneNumber,
      roomNumber: room.roomNumber,
      roomType: room.roomType.name,
      checkInDate: start,
      checkOutDate: end,
      adults: 2,
      children: 0,
      totalAmount,
      paidAmount: 0,
      source: 'Website Email Link',
    });

    emitPmsEvent('booking.created', {
      reservationId: reservation.id,
      guestName: guest.name,
      roomNumber: room.roomNumber,
      source: 'Website Email Link',
    });

    return NextResponse.json({
      success: true,
      message: 'Booking successfully extracted from email and created in Hotel Sherpa Soul PMS!',
      data: {
        reservationId: reservation.id,
        guestName: guest.name,
        roomNumber: room.roomNumber,
        checkInDate: start.toISOString().split('T')[0],
        checkOutDate: end.toISOString().split('T')[0],
        totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Inbound email parse error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
