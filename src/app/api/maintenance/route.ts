import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tickets = await prisma.maintenanceTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tickets.map((t) => ({
      id: t.id,
      location: t.location,
      issue: t.issue,
      reportedBy: t.reportedBy,
      reportedAt: t.reportedAt.toISOString().split('T')[0],
      priority: t.priority,
      status: t.status,
      assignedTechnician: t.assignedTechnician || undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching maintenance tickets:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location, issue, reportedBy = 'Staff', priority = 'Medium', assignedTechnician } = body;

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        location,
        issue,
        reportedBy,
        priority,
        status: 'Open',
        assignedTechnician: assignedTechnician || null,
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating maintenance ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
