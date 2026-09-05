import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = endpoints.map((ep) => {
      let events: string[] = [];
      try {
        events = JSON.parse(ep.events);
      } catch {
        events = [];
      }
      return {
        id: ep.id,
        name: ep.name,
        url: ep.url,
        secret: ep.secret,
        events,
        isActive: ep.isActive,
        createdAt: ep.createdAt.toISOString(),
        recentLogs: ep.logs.map((log) => ({
          id: log.id,
          event: log.event,
          status: log.status,
          response: log.response,
          createdAt: log.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, secret, events = ['*'], isActive = true } = body;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: 'Name and URL are required.' },
        { status: 400 }
      );
    }

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        name,
        url,
        secret: secret || null,
        events: JSON.stringify(events),
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: endpoint.id,
          name: endpoint.name,
          url: endpoint.url,
          events,
          isActive: endpoint.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    await prisma.webhookEndpoint.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
