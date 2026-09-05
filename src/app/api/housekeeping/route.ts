import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

export async function GET() {
  try {
    const tasks = await prisma.housekeepingTask.findMany({
      include: {
        room: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = tasks.map((t) => ({
      id: t.id,
      roomNumber: t.room.roomNumber,
      type: t.taskType,
      status: t.status,
      assignedTo: t.assignedTo || 'Unassigned',
      priority: t.priority,
      scheduledTime: t.scheduledFor.toISOString().split('T')[0],
      note: t.notes || undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching housekeeping tasks:', error);
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
      roomNumber,
      type = 'Regular Clean',
      status = 'PENDING',
      assignedTo,
      priority = 'NORMAL',
      scheduledTime,
      note,
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

    const task = await prisma.housekeepingTask.create({
      data: {
        roomId: room.id,
        taskType: type,
        status: status as TaskStatus,
        priority,
        assignedTo: assignedTo || null,
        scheduledFor: scheduledTime ? new Date(scheduledTime) : new Date(),
        notes: note || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: task.id,
          roomNumber,
          type: task.taskType,
          status: task.status,
          assignedTo: task.assignedTo || 'Unassigned',
          priority: task.priority,
          scheduledTime: task.scheduledFor.toISOString().split('T')[0],
          note: task.notes || undefined,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating housekeeping task:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
