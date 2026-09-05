import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      detail: n.detail,
      timestamp: n.createdAt.toISOString(),
      type: n.type,
      channel: n.channel,
      status: n.status,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, detail, type = 'Booking', channel = 'WhatsApp', status = 'Delivered' } = body;

    const notif = await prisma.notification.create({
      data: {
        title,
        detail,
        type,
        channel,
        status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: notif.id,
          title: notif.title,
          detail: notif.detail,
          timestamp: notif.createdAt.toISOString(),
          type: notif.type,
          channel: notif.channel,
          status: notif.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
