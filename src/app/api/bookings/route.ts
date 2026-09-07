import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateBookingNumber, buildWhatsAppBookingUrl } from '@/lib/bookingEngine';
import { sendBookingNotifications } from '@/lib/email';

export async function POST(request: Request) {
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
      specialRequests,
      promoCode,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!checkIn || !checkOut || !categoryId || !guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ error: 'Missing required booking information.' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Invalid check-in and check-out dates.' }, { status: 400 });
    }

    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Fetch Category
    const category = await prisma.roomCategory.findUnique({
      where: { id: categoryId },
      include: {
        rooms: {
          where: { isSellable: true } // Only the 6 sellable physical rooms!
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Selected room category does not exist.' }, { status: 404 });
    }

    // Capacity check
    const totalGuests = adults + children;
    if (adults > category.maxAdults || children > category.maxChildren || totalGuests > category.maxGuests) {
      return NextResponse.json({
        error: `Exceeds maximum occupancy for ${category.name} (Max ${category.maxAdults} adults + ${category.maxChildren} children, total ${category.maxGuests} guests).`
      }, { status: 400 });
    }

    // Find conflicting bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } }
        ]
      },
      select: {
        id: true,
        categoryId: true,
        physicalRoomId: true,
      }
    });

    // Determine available physical rooms mapped to this category
    const bookedRoomIds = new Set(conflictingBookings.map(b => b.physicalRoomId).filter(Boolean));
    const availablePhysicalRooms = category.rooms.filter(r => !bookedRoomIds.has(r.id));

    if (availablePhysicalRooms.length === 0) {
      return NextResponse.json({
        error: `Sorry, ${category.name} is fully booked for the selected dates.`
      }, { status: 409 });
    }

    // Allocate first available physical room
    const allocatedRoom = availablePhysicalRooms[0];

    // Price & Discount calculation
    let subtotalUSD = category.rateUSD * nights;
    let discountUSD = 0;

    if (promoCode) {
      const codeUpper = promoCode.trim().toUpperCase();
      const offer = await prisma.offer.findFirst({
        where: {
          code: codeUpper,
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });
      if (offer) {
        discountUSD = (subtotalUSD * offer.discountPct) / 100;
      }
    }

    const totalAmountUSD = Math.max(0, subtotalUSD - discountUSD);
    const bookingNumber = generateBookingNumber();

    // Create Booking in database
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: parseInt(adults),
        children: parseInt(children),
        guestName,
        guestEmail,
        guestPhone,
        guestWhatsApp: guestWhatsApp || guestPhone,
        guestCountry: guestCountry || null,
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
      }
    });

    const whatsAppUrl = buildWhatsAppBookingUrl({
      bookingNumber: booking.bookingNumber,
      categoryName: category.name,
      checkIn: checkIn,
      checkOut: checkOut,
      nights,
      guestName,
      totalUSD: totalAmountUSD,
    });

    // Dispatch automated confirmation emails (Hotel Official Alert + Guest Confirmation)
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
    console.error('Booking submission error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An error occurred processing the reservation.' },
      { status: 500 }
    );
  }
}
