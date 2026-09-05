import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContractStatus, RoomStatus } from '@prisma/client';

export async function GET() {
  try {
    const contracts = await prisma.longStayContract.findMany({
      include: {
        guest: true,
        room: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = contracts.map((c) => ({
      id: c.id,
      guestName: c.guest.name,
      email: c.guest.email || '',
      phone: c.guest.phoneNumber || '',
      passport: c.guest.passportNumber || '',
      roomNumber: c.room.roomNumber,
      startDate: c.startDate.toISOString().split('T')[0],
      endDate: c.endDate.toISOString().split('T')[0],
      monthlyRent: c.monthlyRent,
      securityDeposit: c.securityDeposit,
      kitchenAccess: c.kitchenAccess,
      depositStatus: c.depositStatus,
      rentPaidUntil: c.rentPaidUntil ? c.rentPaidUntil.toISOString().split('T')[0] : c.startDate.toISOString().split('T')[0],
      status: c.status,
      notes: c.notes || undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching long-stay contracts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      guestName,
      email,
      phone,
      passport,
      roomNumber,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      kitchenAccess = true,
      notes,
    } = body;

    // 1. Find Room
    const room = await prisma.room.findUnique({
      where: { roomNumber: String(roomNumber) },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Room ${roomNumber} not found` },
        { status: 404 }
      );
    }

    // 2. Find or create Guest
    let guest = await prisma.guest.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phoneNumber: phone }] : []),
          ...(passport ? [{ passportNumber: passport }] : []),
          { name: guestName },
        ],
      },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: guestName,
          email: email || null,
          phoneNumber: phone || null,
          passportNumber: passport || null,
        },
      });
    }

    // 3. Create Contract
    const contract = await prisma.longStayContract.create({
      data: {
        guestId: guest.id,
        roomId: room.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
        kitchenAccess: Boolean(kitchenAccess),
        depositStatus: 'HELD',
        status: ContractStatus.ACTIVE,
        notes: notes || null,
      },
    });

    // 4. Update room status to LONG_STAY_OCCUPIED
    await prisma.room.update({
      where: { id: room.id },
      data: {
        status: RoomStatus.LONG_STAY_OCCUPIED,
        currentGuest: guestName,
      },
    });

    // 5. If kitchen access granted, auto-create KitchenUser
    if (kitchenAccess) {
      await prisma.kitchenUser.create({
        data: {
          guestId: guest.id,
          roomId: room.id,
          passType: 'Long Stay',
          accessStartDate: new Date(startDate),
          accessEndDate: new Date(endDate),
          depositHeld: 5000,
          depositStatus: 'HELD',
          status: 'ACTIVE',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: contract.id,
          guestName,
          email: guest.email || '',
          phone: guest.phoneNumber || '',
          passport: guest.passportNumber || '',
          roomNumber,
          startDate,
          endDate,
          monthlyRent: contract.monthlyRent,
          securityDeposit: contract.securityDeposit,
          kitchenAccess: contract.kitchenAccess,
          depositStatus: contract.depositStatus,
          rentPaidUntil: startDate,
          status: contract.status,
          notes: contract.notes || undefined,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating long-stay contract:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
