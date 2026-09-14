import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRoomAvailability, normalizeDateOnly } from '@/lib/inventoryService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkInDate = searchParams.get('checkInDate') || searchParams.get('checkIn');
  const checkOutDate = searchParams.get('checkOutDate') || searchParams.get('checkOut');
  const roomType = searchParams.get('roomType') || undefined;
  const adults = Number(searchParams.get('adults')) || 1;

  return processAvailabilityCheck({ checkInDate, checkOutDate, roomType, adults });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { checkInDate, checkOutDate, roomType, adults = 1 } = body;

  return processAvailabilityCheck({ checkInDate, checkOutDate, roomType, adults });
}

async function processAvailabilityCheck(params: {
  checkInDate: any;
  checkOutDate: any;
  roomType?: string;
  adults?: number;
}) {
  try {
    const { checkInDate, checkOutDate, roomType } = params;

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'checkInDate and checkOutDate are required.' },
        { status: 400 }
      );
    }

    const start = normalizeDateOnly(checkInDate);
    const end = normalizeDateOnly(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { success: false, error: 'Invalid dates: Check-out must be strictly after check-in date.' },
        { status: 400 }
      );
    }

    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Fetch rooms with room types
    const rooms = await prisma.room.findMany({
      where: {
        ...(roomType ? { roomType: { name: { equals: String(roomType), mode: 'insensitive' } } } : {}),
      },
      include: { roomType: true },
      orderBy: { roomNumber: 'asc' },
    });

    const availableRooms = [];
    const categorySummary: Record<string, { availableCount: number; dailyRate: number; totalCost: number; capacity: number; bedType: string }> = {};

    for (const room of rooms) {
      const avail = await checkRoomAvailability(room.id, start, end);
      if (avail.isAvailable) {
        const typeName = room.roomType.name;
        const dailyRate = room.roomType.dailyRate;
        const totalCost = dailyRate * nights;

        availableRooms.push({
          roomId: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          roomType: typeName,
          bedType: room.roomType.bedType,
          capacity: room.roomType.capacity,
          dailyRate,
          totalCost,
          kitchenEligible: room.kitchenEligible,
        });

        if (!categorySummary[typeName]) {
          categorySummary[typeName] = {
            availableCount: 0,
            dailyRate,
            totalCost,
            capacity: room.roomType.capacity,
            bedType: room.roomType.bedType,
          };
        }
        categorySummary[typeName].availableCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checkInDate: start.toISOString().split('T')[0],
        checkOutDate: end.toISOString().split('T')[0],
        nights,
        totalAvailableRooms: availableRooms.length,
        categories: categorySummary,
        rooms: availableRooms,
      },
    });
  } catch (error: any) {
    console.error('Availability check error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
