import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CommunicationChannel, MessageDirection, MessageStatus } from '@prisma/client';
import { sendWhatsAppMessage } from '@/lib/smsWhatsappAdapter';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Fetch conversations & message history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, handover, unread
    const query = searchParams.get('q')?.trim().toLowerCase() || '';

    const messages = await prisma.unifiedMessage.findMany({
      where: {
        ...(filter === 'handover' ? { requiresStaffAction: true } : {}),
        ...(filter === 'unread' ? { isRead: false } : {}),
        ...(query
          ? {
              OR: [
                { sender: { contains: query, mode: 'insensitive' } },
                { recipient: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { guest: { name: { contains: query, mode: 'insensitive' } } },
                { reservation: { reservationNumber: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        reservation: { include: { room: true } },
        guest: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error: any) {
    console.error('Unified inbox fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Staff manual reply & handover resolution
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      recipientPhone,
      messageText,
      reservationId,
      guestId,
      resolveHandover = false,
      staffName = 'Front Desk Staff',
    } = body;

    if (!recipientPhone || !messageText) {
      return NextResponse.json(
        { success: false, error: 'recipientPhone and messageText are required.' },
        { status: 400 }
      );
    }

    // Send WhatsApp message
    const sendRes = await sendWhatsAppMessage(recipientPhone, messageText);

    // Record outbound staff message
    const messageId = `reply_${randomUUID().replace(/-/g, '')}`;
    const logged = await prisma.unifiedMessage.create({
      data: {
        messageId,
        reservationId: reservationId || null,
        guestId: guestId || null,
        channel: CommunicationChannel.WHATSAPP,
        direction: MessageDirection.OUTBOUND,
        sender: staffName,
        recipient: recipientPhone,
        content: messageText,
        status: sendRes.success ? MessageStatus.DELIVERED : MessageStatus.FAILED,
        assignedStaff: staffName,
        requiresStaffAction: false,
        isRead: true,
      },
    });

    // If resolving handover, update earlier pending messages
    if (resolveHandover) {
      await prisma.unifiedMessage.updateMany({
        where: {
          recipient: recipientPhone,
          requiresStaffAction: true,
        },
        data: {
          requiresStaffAction: false,
          isRead: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: logged,
    });
  } catch (error: any) {
    console.error('Inbox reply error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
