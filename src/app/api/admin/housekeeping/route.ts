import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rooms = await prisma.physicalRoom.findMany({
      where: { isSellable: true },
      include: { category: true },
      orderBy: { roomNumber: 'asc' },
    });

    const tasks = await prisma.housekeepingTask.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const statusCounts = {
      CLEAN: rooms.filter(r => r.status === 'AVAILABLE').length,
      DIRTY: rooms.filter(r => r.status === 'DIRTY').length,
      OCCUPIED: rooms.filter(r => r.status === 'OCCUPIED').length,
      MAINTENANCE: rooms.filter(r => r.status === 'MAINTENANCE').length,
    };

    return NextResponse.json({
      success: true,
      stats: statusCounts,
      rooms,
      tasks,
    });
  } catch (error: any) {
    console.error('Housekeeping GET error:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching housekeeping data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, taskId, roomId, roomNumber, roomStatus, taskType, assignedTo, notes } = body;

    // 1. Update Room Cleaning Status directly
    if (action === 'UPDATE_ROOM_STATUS') {
      let targetId = roomId;
      if (!targetId && roomNumber) {
        const r = await prisma.physicalRoom.findUnique({ where: { roomNumber } });
        if (r) targetId = r.id;
      }

      if (!targetId) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      const updatedRoom = await prisma.physicalRoom.update({
        where: { id: targetId },
        data: { status: roomStatus }, // AVAILABLE, DIRTY, CLEANING, MAINTENANCE
      });

      return NextResponse.json({ success: true, room: updatedRoom });
    }

    // 2. Complete a Housekeeping Task
    if (action === 'COMPLETE_TASK') {
      if (!taskId) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });

      const task = await prisma.housekeepingTask.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' },
        include: { room: true },
      });

      // If room was DIRTY, mark as AVAILABLE
      if (task.room && task.room.status === 'DIRTY') {
        await prisma.physicalRoom.update({
          where: { id: task.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      return NextResponse.json({ success: true, task });
    }

    // 3. Create a new cleaning task
    if (action === 'CREATE_TASK') {
      let targetId = roomId;
      if (!targetId && roomNumber) {
        const r = await prisma.physicalRoom.findUnique({ where: { roomNumber } });
        if (r) targetId = r.id;
      }

      const newTask = await prisma.housekeepingTask.create({
        data: {
          roomId: targetId,
          taskType: taskType || 'Daily Clean',
          assignedTo: assignedTo || 'Duty Staff',
          status: 'PENDING',
          notes: notes || null,
        },
        include: { room: true },
      });

      return NextResponse.json({ success: true, task: newTask });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Housekeeping POST error:', error);
    return NextResponse.json({ error: error?.message || 'Error processing housekeeping action' }, { status: 500 });
  }
}
