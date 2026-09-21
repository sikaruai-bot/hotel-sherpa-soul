import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateBookingNumber, buildWhatsAppBookingUrl } from '@/lib/bookingEngine';
import { sendBookingNotifications } from '@/lib/email';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(request: Request) {
  // 1. Rate limiting protection: Max 12 bookings per hour per IP
  const rateLimit = checkRateLimit(request, 'booking_submit', {
    windowMs: 60 * 60 * 1000,
    max: 12,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many booking requests. Please wait a few minutes before submitting again or contact us directly on WhatsApp.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const {
      checkIn,
      checkOut,
      adults,
      children = 0,
      categoryId,
      guestName,
      guestEmail,
      guestPhone,
      guestWhatsApp,
      guestCountry,
      guestIdType,
      guestIdNumber,
      guestIdDocument,
      specialRequests,
      promoCode,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    // 2. Input validation
    if (!checkIn || !checkOut || !categoryId || !guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ error: 'Missing required booking information.' }, { status: 400 });
    }

    if (guestName.length > 100 || guestEmail.length > 100 || guestPhone.length > 30) {
      return NextResponse.json({ error: 'Input exceeds permissible length.' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Invalid check-in and check-out dates.' }, { status: 400 });
    }

    // Past date check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past.' }, { status: 400 });
    }

    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (nights > 90) {
      return NextResponse.json({ error: 'For stays over 90 days, please contact hotel management directly.' }, { status: 400 });
    }

    // 3. Atomic Database Transaction with Overbooking Lock
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Fetch Category with its physical rooms
      const category = await tx.roomCategory.findUnique({
        where: { id: categoryId },
        include: {
          rooms: {
            where: { isSellable: true }, // Exactly 6 sellable physical rooms
          },
        },
      });

      if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
      }

      // Capacity check
      const totalGuests = (parseInt(adults) || 1) + (parseInt(children) || 0);
      if (adults > category.maxAdults || children > category.maxChildren || totalGuests > category.maxGuests) {
        throw new Error('CAPACITY_EXCEEDED');
      }

      // Find all overlapping non-cancelled bookings across all rooms
      const conflictingBookings = await tx.booking.findMany({
        where: {
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          AND: [
            { checkIn: { lt: checkOutDate } },
            { checkOut: { gt: checkInDate } },
          ],
        },
        select: {
          id: true,
          categoryId: true,
          physicalRoomId: true,
        },
      });

      // Filter available physical rooms assigned to this category
      const bookedRoomIds = new Set(conflictingBookings.map((b) => b.physicalRoomId).filter(Boolean));
      const availablePhysicalRooms = category.rooms.filter((r) => !bookedRoomIds.has(r.id));

      if (availablePhysicalRooms.length === 0) {
        throw new Error('NO_ROOMS_AVAILABLE');
      }

      // Select first available physical room
      const allocatedRoom = availablePhysicalRooms[0];

      // Calculate price and promo discount
      let subtotalUSD = category.rateUSD * nights;
      let discountUSD = 0;

      if (promoCode) {
        const codeUpper = promoCode.trim().toUpperCase();
        const offer = await tx.offer.findFirst({
          where: {
            code: codeUpper,
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        });
        if (offer) {
          discountUSD = (subtotalUSD * offer.discountPct) / 100;
        }
      }

      const totalAmountUSD = Math.max(0, subtotalUSD - discountUSD);
      const bookingNumber = generateBookingNumber();

      // Create Booking atomically
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults: parseInt(adults),
          children: parseInt(children),
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim().toLowerCase(),
          guestPhone: guestPhone.trim(),
          guestWhatsApp: (guestWhatsApp || guestPhone).trim(),
          guestCountry: guestCountry || null,
          guestIdType: guestIdType || null,
          guestIdNumber: guestIdNumber || null,
          guestIdDocumentUrl: guestIdDocument || null,
          specialRequests: specialRequests || null,
          categoryId: category.id,
          physicalRoomId: allocatedRoom.id,
          totalAmountUSD,
          paymentStatus: 'UNPAID',
          status: 'CONFIRMED',
          source: 'DIRECT_WEBSITE',
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          notes: `Direct website booking. Allocated Room ${allocatedRoom.roomNumber} (Floor ${allocatedRoom.floor}).`,
        },
        include: {
          category: true,
          physicalRoom: true,
        },
      });

      return {
        booking,
        category,
        allocatedRoom,
        totalAmountUSD,
        nights,
      };
    });

    const { booking, category, allocatedRoom, totalAmountUSD } = transactionResult;

    const whatsAppUrl = buildWhatsAppBookingUrl({
      bookingNumber: booking.bookingNumber,
      categoryName: category.name,
      checkIn: checkIn,
      checkOut: checkOut,
      nights,
      guestName,
      totalUSD: totalAmountUSD,
    });

    // 4. Non-blocking automated email notifications (Staff Alert + Guest Confirmation)
    try {
      await sendBookingNotifications({
        bookingNumber: booking.bookingNumber,
        categoryName: category.name,
        roomNumber: allocatedRoom.roomNumber,
        floor: allocatedRoom.floor,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        adults: parseInt(adults),
        children: parseInt(children),
        guestName,
        guestEmail,
        guestPhone,
        guestWhatsApp: guestWhatsApp || guestPhone,
        guestCountry: guestCountry || undefined,
        guestIdType: guestIdType || undefined,
        guestIdNumber: guestIdNumber || undefined,
        specialRequests: specialRequests || undefined,
        totalUSD: totalAmountUSD,
      });
    } catch (emailErr) {
      console.error('[Booking API] Non-fatal email error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      whatsAppUrl,
      allocatedRoom: allocatedRoom.roomNumber,
      allocatedFloor: allocatedRoom.floor,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    if (errorMsg === 'NO_ROOMS_AVAILABLE') {
      return NextResponse.json(
        { error: 'Sorry, this room category is fully booked for the selected dates. Please select different dates or another room category.' },
        { status: 409 }
      );
    }

    if (errorMsg === 'CAPACITY_EXCEEDED') {
      return NextResponse.json(
        { error: 'Selected guest count exceeds room capacity.' },
        { status: 400 }
      );
    }

    if (errorMsg === 'CATEGORY_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Selected room category does not exist.' },
        { status: 404 }
      );
    }

    console.error('[Booking API] Submission error:', err);
    return NextResponse.json(
      { error: 'An error occurred processing your reservation. Please try again or contact us on WhatsApp.' },
      { status: 500 }
    );
  }
}
