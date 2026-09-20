import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoomStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, currentGuest, cleaningStaff, maintenanceNote } = body;

    // Find room by id or roomNumber
    const room = await prisma.room.findFirst({
      where: {
        OR: [{ id }, { roomNumber: id }],
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.room.update({
      where: { id: room.id },
      data: {
        ...(status && { status: status as RoomStatus }),
        ...(currentGuest !== undefined && { currentGuest }),
        ...(cleaningStaff !== undefined && { cleaningStaff }),
        ...(maintenanceNote !== undefined && { maintenanceNote }),
      },
      include: {
        roomType: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
