import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assignedTo, note } = body;

    const task = await prisma.housekeepingTask.update({
      where: { id },
      data: {
        ...(status && { status: status as TaskStatus }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(note !== undefined && { notes: note }),
      },
      include: { room: true },
    });

    // If task is completed and room was CLEANING_REQUIRED, set room to AVAILABLE
    if (status === 'COMPLETED' && task.room.status === 'CLEANING_REQUIRED') {
      await prisma.room.update({
        where: { id: task.roomId },
        data: { status: 'AVAILABLE', cleaningStaff: task.assignedTo },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        roomNumber: task.room.roomNumber,
        type: task.taskType,
        status: task.status,
        assignedTo: task.assignedTo || 'Unassigned',
        priority: task.priority,
        scheduledTime: task.scheduledFor.toISOString().split('T')[0],
        note: task.notes || undefined,
      },
    });
  } catch (error: any) {
    console.error('Error updating housekeeping task:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
