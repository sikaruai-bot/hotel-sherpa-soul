import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assignedTechnician, priority } = body;

    const ticket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(assignedTechnician !== undefined && { assignedTechnician }),
        ...(priority && { priority }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        location: ticket.location,
        issue: ticket.issue,
        reportedBy: ticket.reportedBy,
        reportedAt: ticket.reportedAt.toISOString().split('T')[0],
        priority: ticket.priority,
        status: ticket.status,
        assignedTechnician: ticket.assignedTechnician || undefined,
      },
    });
  } catch (error: any) {
    console.error('Error updating maintenance ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
