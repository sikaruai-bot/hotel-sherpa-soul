import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [users, incidents, inventory] = await Promise.all([
      prisma.kitchenUser.findMany({
        include: { guest: true, room: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.kitchenIncident.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.kitchenInventory.findMany({
        orderBy: { itemName: 'asc' },
      }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      guestName: u.guest.name,
      roomNumber: u.room.roomNumber,
      passType: u.passType,
      validFrom: u.accessStartDate.toISOString().split('T')[0],
      validTo: u.accessEndDate.toISOString().split('T')[0],
      depositAmount: u.depositHeld,
      depositStatus: u.depositStatus,
      status: u.status,
    }));

    const formattedIncidents = incidents.map((inc) => ({
      id: inc.id,
      date: inc.incidentDate.toISOString().split('T')[0],
      type: inc.type,
      guestName: inc.guestName,
      roomNumber: inc.roomNumber,
      costNpr: inc.costNpr,
      status: inc.status,
      note: inc.note,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        incidents: formattedIncidents,
        inventory,
      },
    });
  } catch (error: any) {
    console.error('Error fetching kitchen data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is an Incident or a Pass
    if (body.action === 'incident' || body.costNpr !== undefined) {
      const { type, guestName, roomNumber, costNpr, status = 'Pending Review', note } = body;

      const incident = await prisma.kitchenIncident.create({
        data: {
          type,
          guestName,
          roomNumber,
          costNpr: Number(costNpr),
          status,
          note: note || '',
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            id: incident.id,
            date: incident.incidentDate.toISOString().split('T')[0],
            type: incident.type,
            guestName: incident.guestName,
            roomNumber: incident.roomNumber,
            costNpr: incident.costNpr,
            status: incident.status,
            note: incident.note,
          },
        },
        { status: 201 }
      );
    }

    // Otherwise create a Kitchen Pass
    const {
      guestName,
      roomNumber,
      passType = 'Short Stay Add-on',
      validFrom,
      validTo,
      depositAmount = 5000,
      depositStatus = 'HELD',
      status = 'ACTIVE',
    } = body;

    const room = await prisma.room.findUnique({
      where: { roomNumber: String(roomNumber) },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Room ${roomNumber} not found` },
        { status: 404 }
      );
    }

    let guest = await prisma.guest.findFirst({
      where: { name: guestName },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: { name: guestName },
      });
    }

    const pass = await prisma.kitchenUser.create({
      data: {
        guestId: guest.id,
        roomId: room.id,
        passType,
        accessStartDate: new Date(validFrom),
        accessEndDate: new Date(validTo),
        depositHeld: Number(depositAmount),
        depositStatus,
        status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: pass.id,
          guestName,
          roomNumber,
          passType: pass.passType,
          validFrom: pass.accessStartDate.toISOString().split('T')[0],
          validTo: pass.accessEndDate.toISOString().split('T')[0],
          depositAmount: pass.depositHeld,
          depositStatus: pass.depositStatus,
          status: pass.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating kitchen record:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
