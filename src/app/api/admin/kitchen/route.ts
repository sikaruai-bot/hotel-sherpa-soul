import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const facility = await prisma.facility.findUnique({
      where: { code: 'KITCHEN_102' },
    });

    const activeUsers = await prisma.kitchenUser.findMany({
      where: { status: 'ACTIVE' },
      include: { room: true },
      orderBy: { validTo: 'asc' },
    });

    const longStayContracts = await prisma.longStayContract.findMany({
      where: { status: 'ACTIVE' },
      include: { room: true },
      orderBy: { endDate: 'asc' },
    });

    return NextResponse.json({
      success: true,
      facility: {
        code: 'KITCHEN_102',
        name: 'Shared Kitchen (Room 102, Floor 1)',
        isSellable: false,
        minStayDays: 14,
        description: 'Dedicated cooking facility for long-stay guests (14+ nights). Non-sellable, zero inventory.',
      },
      stats: {
        activePasses: activeUsers.length,
        activeContracts: longStayContracts.length,
        gasStatus: 'Nominal (70% full, backup cylinder available)',
      },
      activeUsers,
      longStayContracts,
    });
  } catch (error: any) {
    console.error('Kitchen GET error:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching kitchen data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, guestName, roomNumber, validFrom, validTo, depositUSD = 0, notes } = body;

    let targetRoom = await prisma.physicalRoom.findUnique({
      where: { roomNumber },
    });

    if (!targetRoom) {
      return NextResponse.json({ error: `Room ${roomNumber} not found` }, { status: 404 });
    }

    const start = new Date(validFrom);
    const end = new Date(validTo);
    const stayNights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (stayNights < 14) {
      return NextResponse.json(
        {
          error: `Shared Kitchen eligibility requires a minimum stay of 14 nights (requested: ${stayNights} nights).`,
          minStayRequired: 14,
        },
        { status: 400 }
      );
    }

    const pass = await prisma.kitchenUser.create({
      data: {
        guestName,
        roomId: targetRoom.id,
        validFrom: start,
        validTo: end,
        depositUSD: parseFloat(depositUSD),
        status: 'ACTIVE',
      },
      include: { room: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Kitchen pass successfully issued for Area 102',
      pass,
    });
  } catch (error: any) {
    console.error('Kitchen POST error:', error);
    return NextResponse.json({ error: error?.message || 'Error issuing kitchen pass' }, { status: 500 });
  }
}
