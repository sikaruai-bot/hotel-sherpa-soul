import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRoomAvailability, normalizeDateOnly } from '@/lib/inventoryService';

export const dynamic = 'force-dynamic';

function verifyBotAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key');
  const expectedKey = process.env.CHATBOT_API_KEY || 'sherpa-bot-key-2026';

  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  return token === expectedKey;
}

/**
 * GET /api/bot/availability?checkIn=2026-10-01&checkOut=2026-10-04&adults=2&children=0
 * Checks room availability and rates for the chatbot.
 */
export async function GET(request: Request) {
  try {
    if (!verifyBotAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing x-api-key header' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkInStr = searchParams.get('checkIn');
    const checkOutStr = searchParams.get('checkOut');
    const adults = parseInt(searchParams.get('adults') || '2', 10);
    const children = parseInt(searchParams.get('children') || '0', 10);
    const totalGuests = adults + children;

    if (!checkInStr || !checkOutStr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameters checkIn and checkOut (YYYY-MM-DD) are required.',
        },
        { status: 400 }
      );
    }

    const checkIn = normalizeDateOnly(checkInStr);
    const checkOut = normalizeDateOnly(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn >= checkOut) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid dates: checkOut must be after checkIn.',
        },
        { status: 400 }
      );
    }

    const nights = Math.max(
      1,
      Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Get all rooms and their room types
    const rooms = await prisma.room.findMany({
      include: { roomType: true },
      orderBy: { roomNumber: 'asc' },
    });

    const roomTypes = await prisma.roomType.findMany({
      orderBy: { dailyRate: 'asc' },
    });

    const availableRooms: any[] = [];
    const categorySummaryMap = new Map<string, any>();

    // Initialize category summaries
    for (const rt of roomTypes) {
      const rateNpr = rt.dailyRate;
      // Fixed hotel standard conversion: 1 USD ≈ 135 NPR
      const rateUsd = Math.round(rateNpr / 135);
      categorySummaryMap.set(rt.name, {
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        capacity: rt.capacity,
        bedType: rt.bedType,
        dailyRateNpr: rateNpr,
        dailyRateUsd: rateUsd,
        totalPriceNpr: rateNpr * nights,
        totalPriceUsd: rateUsd * nights,
        availableCount: 0,
        availableRoomNumbers: [],
      });
    }

    // Check each room
    for (const room of rooms) {
      // Check capacity
      if (room.roomType.capacity < totalGuests && room.roomType.capacity < adults) {
        continue;
      }

      // Check atomic availability
      const avail = await checkRoomAvailability(room.id, checkIn, checkOut);
      if (avail.isAvailable) {
        const rateNpr = room.roomType.dailyRate;
        const rateUsd = Math.round(rateNpr / 135);

        availableRooms.push({
          roomId: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          roomType: room.roomType.name,
          capacity: room.roomType.capacity,
          bedType: room.roomType.bedType,
          dailyRateNpr: rateNpr,
          dailyRateUsd: rateUsd,
          totalNights: nights,
          totalPriceNpr: rateNpr * nights,
          totalPriceUsd: rateUsd * nights,
        });

        const cat = categorySummaryMap.get(room.roomType.name);
        if (cat) {
          cat.availableCount += 1;
          cat.availableRoomNumbers.push(room.roomNumber);
        }
      }
    }

    const availableCategories = Array.from(categorySummaryMap.values()).filter(
      (c) => c.availableCount > 0
    );

    return NextResponse.json({
      success: true,
      data: {
        hotel: 'Hotel Sherpa Soul',
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        nights,
        requestedGuests: { adults, children, totalGuests },
        isAnyAvailable: availableRooms.length > 0,
        totalAvailableRoomsCount: availableRooms.length,
        categories: availableCategories,
        rooms: availableRooms,
      },
    });
  } catch (error: any) {
    console.error('Bot availability check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error checking availability' },
      { status: 500 }
    );
  }
}
