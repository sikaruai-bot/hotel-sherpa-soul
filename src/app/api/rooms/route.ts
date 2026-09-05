import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        roomType: true,
      },
      orderBy: {
        roomNumber: 'asc',
      },
    });

    const formattedRooms = rooms.map((r) => ({
      id: r.id,
      number: r.roomNumber,
      floor: r.floor,
      type: r.roomType.name,
      capacity: r.roomType.capacity,
      bedType: r.roomType.bedType,
      dailyRate: r.roomType.dailyRate,
      weeklyRate: r.roomType.weeklyRate,
      monthlyRate: r.roomType.monthlyRate,
      status: r.status,
      kitchenEligible: r.kitchenEligible,
      longStayEligible: r.longStayEligible,
      currentGuest: r.currentGuest || undefined,
      cleaningStaff: r.cleaningStaff || undefined,
      maintenanceNote: r.maintenanceNote || undefined,
    }));

    return NextResponse.json({ success: true, data: formattedRooms });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database connection error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomNumber,
      floor,
      roomTypeId,
      roomTypeName,
      status = 'AVAILABLE',
      kitchenEligible = true,
      longStayEligible = true,
    } = body;

    let targetTypeId = roomTypeId;
    if (!targetTypeId && roomTypeName) {
      const existingType = await prisma.roomType.findFirst({
        where: { name: roomTypeName },
      });
      if (existingType) {
        targetTypeId = existingType.id;
      }
    }

    if (!targetTypeId) {
      return NextResponse.json(
        { success: false, error: 'Valid roomType or roomTypeId is required' },
        { status: 400 }
      );
    }

    const newRoom = await prisma.room.create({
      data: {
        roomNumber,
        floor: Number(floor),
        roomTypeId: targetTypeId,
        status,
        kitchenEligible,
        longStayEligible,
      },
      include: {
        roomType: true,
      },
    });

    return NextResponse.json({ success: true, data: newRoom }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
