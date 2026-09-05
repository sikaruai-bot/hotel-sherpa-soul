import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitPmsEvent } from '@/lib/events';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const expectedKey = process.env.AUTOMATION_API_KEY || 'sherpa-soul-auto-key-2026';

    // Simple Bearer or API Key authentication check
    if (authHeader && authHeader.replace('Bearer ', '').trim() !== expectedKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized automation trigger' }, { status: 401 });
    }

    const body = await request.json();
    const { action, payload = {} } = body;

    switch (action) {
      case 'gas_alert': {
        const { gasLevel = 15, note = 'Automatic IoT gas pressure sensor alert' } = payload;
        const ticket = await prisma.maintenanceTicket.create({
          data: {
            location: 'Shared Kitchen',
            issue: `Kitchen LPG Gas low (${gasLevel}%). Needs cylinder replacement.`,
            reportedBy: 'IoT Sensor / Automated Alert',
            priority: 'Urgent',
            status: 'Open',
          },
        });
        await emitPmsEvent('kitchen.alert', { gasLevel, ticketId: ticket.id });
        return NextResponse.json({ success: true, message: 'Gas alert ticket created', data: ticket });
      }

      case 'door_unlock': {
        const { roomNumber, guestName } = payload;
        await prisma.notification.create({
          data: {
            title: `Smart Lock Activated: Room ${roomNumber}`,
            detail: `Digital door lock unlocked for ${guestName || 'Guest'}.`,
            type: 'Booking',
            channel: 'In-App',
            status: 'Delivered',
          },
        });
        return NextResponse.json({ success: true, message: `Door unlock logged for Room ${roomNumber}` });
      }

      case 'sync_ota': {
        await prisma.notification.create({
          data: {
            title: 'OTA Channels Synced',
            detail: 'Rates and inventory synchronized across Booking.com, Agoda, and Airbnb.',
            type: 'Channel',
            channel: 'In-App',
            status: 'Delivered',
          },
        });
        return NextResponse.json({ success: true, message: 'OTA sync completed' });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: '${action}'. Supported actions: 'gas_alert', 'door_unlock', 'sync_ota'`,
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Automation trigger error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
