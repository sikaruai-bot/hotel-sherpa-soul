import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingSource, PaymentStatus } from '@prisma/client';
import { createUnifiedReservation } from '@/lib/reservationService';
import { normalizeDateOnly } from '@/lib/inventoryService';

export const dynamic = 'force-dynamic';

function verifyBotAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key');
  const expectedKey = process.env.CHATBOT_API_KEY || 'sherpa-bot-key-2026';

  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  return token === expectedKey;
}

/**
 * POST /api/bot/booking
 * Creates a real-time reservation from WhatsApp, Messenger, or Instagram Chatbot.
 */
export async function POST(request: Request) {
  try {
    if (!verifyBotAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing x-api-key header' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      guestName,
      phone,
      email,
      channel = 'WHATSAPP',
      checkInDate,
      checkOutDate,
      roomNumber,
      roomTypeName,
      adults = 1,
      children = 0,
      totalAmount,
      paidAmount = 0,
      paymentStatus = 'UNPAID',
      specialRequests,
      externalMessageId,
      threadId,
    } = body;

    // 1. Validate required fields
    if (!guestName || !guestName.trim()) {
      return NextResponse.json({ success: false, error: 'guestName is required.' }, { status: 400 });
    }

    if (!phone && !email) {
      return NextResponse.json({ success: false, error: 'Either phone or email is required.' }, { status: 400 });
    }

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json({ success: false, error: 'checkInDate and checkOutDate (YYYY-MM-DD) are required.' }, { status: 400 });
    }

    const start = normalizeDateOnly(checkInDate);
    const end = normalizeDateOnly(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ success: false, error: 'Invalid dates: checkOutDate must be after checkInDate.' }, { status: 400 });
    }

    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // 2. Identify target room or auto-assign room by type
    let targetRoomNumber = roomNumber ? String(roomNumber).trim() : null;

    if (!targetRoomNumber && roomTypeName) {
      // Find available room of this type
      const roomsOfType = await prisma.room.findMany({
        where: { roomType: { name: { contains: roomTypeName, mode: 'insensitive' } } },
        include: { roomType: true },
      });

      for (const r of roomsOfType) {
        // Quick conflict check
        const conflict = await prisma.reservation.findFirst({
          where: {
            roomId: r.id,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'HOLD', 'PENDING'] },
            AND: [{ checkInDate: { lt: end } }, { checkOutDate: { gt: start } }],
          },
        });
        if (!conflict) {
          targetRoomNumber = r.roomNumber;
          break;
        }
      }

      if (!targetRoomNumber && roomsOfType.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `All rooms of type "${roomTypeName}" are already booked for the selected dates.`,
          },
          { status: 409 }
        );
      }
    }

    // Default to first available room if neither specified
    if (!targetRoomNumber) {
      const allRooms = await prisma.room.findMany({
        include: { roomType: true },
        orderBy: { roomNumber: 'asc' },
      });

      for (const r of allRooms) {
        const conflict = await prisma.reservation.findFirst({
          where: {
            roomId: r.id,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'HOLD', 'PENDING'] },
            AND: [{ checkInDate: { lt: end } }, { checkOutDate: { gt: start } }],
          },
        });
        if (!conflict) {
          targetRoomNumber = r.roomNumber;
          break;
        }
      }
    }

    if (!targetRoomNumber) {
      return NextResponse.json(
        { success: false, error: 'No rooms available for the requested dates.' },
        { status: 409 }
      );
    }

    // Retrieve target room rate for auto-calculation
    const targetRoom = await prisma.room.findUnique({
      where: { roomNumber: targetRoomNumber },
      include: { roomType: true },
    });

    if (!targetRoom) {
      return NextResponse.json({ success: false, error: `Room ${targetRoomNumber} not found.` }, { status: 404 });
    }

    const calculatedTotal = totalAmount ? Number(totalAmount) : targetRoom.roomType.dailyRate * nights;

    // 3. Map Channel to BookingSource & Metadata
    const normalizedChannel = String(channel).toUpperCase();
    let source: BookingSource = BookingSource.WHATSAPP;
    if (normalizedChannel === 'MESSENGER' || normalizedChannel === 'FACEBOOK') {
      source = BookingSource.DIRECT;
    } else if (normalizedChannel === 'INSTAGRAM') {
      source = BookingSource.DIRECT;
    }

    const extId = externalMessageId || threadId || `BOT-${Date.now()}`;
    const cleanNotes = `[Chatbot ${normalizedChannel}] MsgRef: ${extId} | ${specialRequests || 'No special requests'}`;

    // 4. Create Unified Reservation through PMS engine
    const result = await createUnifiedReservation({
      guestName: guestName.trim(),
      phone: phone ? String(phone).trim() : null,
      email: email ? String(email).trim() : null,
      roomNumber: targetRoomNumber,
      checkInDate: start,
      checkOutDate: end,
      adults: Number(adults) || 1,
      children: Number(children) || 0,
      totalAmount: calculatedTotal,
      paidAmount: Number(paidAmount) || 0,
      paymentStatus: paymentStatus as PaymentStatus,
      source,
      externalBookingId: extId,
      whatsappThreadId: threadId || (phone ? String(phone).replace(/[^0-9]/g, '') : null),
      specialRequests: cleanNotes,
      internalNotes: `Automated booking via Hotel Sherpa Soul AI Chatbot (${normalizedChannel})`,
      createdBy: `AI-BOT-${normalizedChannel}`,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflict: result.conflict,
        },
        { status: 409 }
      );
    }

    const res = result.reservation;

    // Return friendly, structured response for Chatbot
    return NextResponse.json(
      {
        success: true,
        message: 'Reservation confirmed successfully!',
        isDuplicate: Boolean(result.isDuplicate),
        data: {
          id: res.id,
          reservationNumber: res.reservationNumber,
          guestName: res.guest?.name || guestName,
          phone: res.guest?.phoneNumber || phone,
          email: res.guest?.email || email,
          roomNumber: res.room?.roomNumber || targetRoomNumber,
          roomType: res.room?.roomType?.name || targetRoom.roomType.name,
          checkInDate: start.toISOString().split('T')[0],
          checkOutDate: end.toISOString().split('T')[0],
          nights,
          adults: res.adults,
          children: res.children,
          totalAmount: res.totalAmount,
          paidAmount: res.paidAmount,
          dueAmount: res.dueAmount,
          currency: res.currency,
          status: res.status,
          paymentStatus: res.paymentStatus,
          channel: normalizedChannel,
          voucherUrl: `https://pms.hotelsherpasoul.com/self-checkin?token=${res.selfCheckinToken || res.id}`,
          supportContact: {
            hotel: 'Hotel Sherpa Soul',
            phone: '+977 9851068219',
            landline: '+977-1 4530311',
            location: 'Thamel, Kathmandu, Nepal',
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Bot booking creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error creating booking' },
      { status: 500 }
    );
  }
}
