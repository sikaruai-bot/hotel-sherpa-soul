import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const OTA_PLATFORMS = [
  { id: 'BOOKING_COM', name: 'Booking.com', logo: 'B.', defaultColor: 'blue' },
  { id: 'AIRBNB', name: 'Airbnb', logo: 'airbnb', defaultColor: 'rose' },
  { id: 'AGODA', name: 'Agoda', logo: 'agoda', defaultColor: 'purple' },
  { id: 'EXPEDIA', name: 'Expedia', logo: 'expedia', defaultColor: 'amber' },
  { id: 'TRIP_COM', name: 'Trip.com', logo: 'trip', defaultColor: 'sky' },
  { id: 'VRBO', name: 'Vrbo', logo: 'vrbo', defaultColor: 'indigo' },
  { id: 'CUSTOM', name: 'Custom Channel / Direct Webhook', logo: 'OTA', defaultColor: 'slate' },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const host = request.headers.get('host') || 'pms.hotelsherpasoul.com';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Get rooms from DB
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        roomNumber: true,
        roomType: { select: { name: true } },
      },
      orderBy: { roomNumber: 'asc' },
    });

    // Get all existing connections
    const existingConnections = await prisma.otaConnection.findMany();
    const connectionMap = new Map<string, typeof existingConnections[0]>();
    for (const conn of existingConnections) {
      connectionMap.set(`${conn.channel}:${conn.roomNumber}`, conn);
    }

    // Build unified list for each channel and room
    const roomList = [
      { roomNumber: 'ALL', roomTypeName: 'All 6 Rooms (Combined Feed)' },
      ...rooms.map((r) => ({
        roomNumber: r.roomNumber,
        roomTypeName: r.roomType.name,
      })),
    ];

    const channelsData = OTA_PLATFORMS.map((platform) => {
      const roomConnections = roomList.map((room) => {
        const key = `${platform.id}:${room.roomNumber}`;
        const existing = connectionMap.get(key);

        const exportUrl = `${baseUrl}/api/ota/ical/export?room=${room.roomNumber}&channel=${platform.id.toLowerCase()}${
          existing?.exportToken ? `&token=${existing.exportToken}` : ''
        }`;

        return {
          channel: platform.id,
          channelName: platform.name,
          roomNumber: room.roomNumber,
          roomTypeName: room.roomTypeName,
          importUrl: existing?.importUrl || '',
          exportUrl,
          exportToken: existing?.exportToken || 'default-token',
          isActive: existing ? existing.isActive : true,
          syncStatus: existing?.syncStatus || (existing?.importUrl ? 'CONFIGURED' : 'UNCONFIGURED'),
          syncMessage: existing?.syncMessage || null,
          lastSyncedAt: existing?.lastSyncedAt?.toISOString() || null,
          eventsCount: existing?.eventsCount || 0,
        };
      });

      const activeCount = roomConnections.filter((rc) => rc.importUrl && rc.importUrl.trim().length > 0).length;

      return {
        id: platform.id,
        name: platform.name,
        logo: platform.logo,
        color: platform.defaultColor,
        activeListingsCount: activeCount,
        rooms: roomConnections,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        channels: channelsData,
        rooms: roomList,
        baseUrl,
        webhookUrl: `${baseUrl}/api/ota/webhook`,
      },
    });
  } catch (error: any) {
    console.error('Error in OTA channels GET:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, roomNumber, importUrl, isActive } = body;

    if (!channel || !roomNumber) {
      return NextResponse.json(
        { success: false, error: 'Channel and roomNumber are required' },
        { status: 400 }
      );
    }

    const trimmedUrl = importUrl !== undefined ? String(importUrl).trim() : undefined;

    const connection = await prisma.otaConnection.upsert({
      where: {
        channel_roomNumber: {
          channel,
          roomNumber: String(roomNumber),
        },
      },
      update: {
        ...(trimmedUrl !== undefined && { importUrl: trimmedUrl }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(trimmedUrl ? { syncStatus: 'CONFIGURED' } : { syncStatus: 'UNCONFIGURED' }),
      },
      create: {
        channel,
        roomNumber: String(roomNumber),
        importUrl: trimmedUrl || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        syncStatus: trimmedUrl ? 'CONFIGURED' : 'UNCONFIGURED',
      },
    });

    // Log the update
    await prisma.otaSyncLog.create({
      data: {
        channel,
        roomNumber: String(roomNumber),
        action: 'UPDATE_CONFIG',
        status: 'SUCCESS',
        message: trimmedUrl
          ? `External iCal link configured for ${channel} (Room ${roomNumber})`
          : `Configuration updated for ${channel} (Room ${roomNumber})`,
      },
    });

    return NextResponse.json({
      success: true,
      data: connection,
      message: 'OTA Connection link saved successfully!',
    });
  } catch (error: any) {
    console.error('Error updating OTA connection:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
