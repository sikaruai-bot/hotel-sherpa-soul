import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin or Owner role required' }, { status: 403 });
  }

  try {
    const [bookings, physicalRooms, categories, inquiries, users] = await Promise.all([
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          physicalRoom: true,
        },
      }),
      prisma.physicalRoom.findMany({
        orderBy: { roomNumber: 'asc' },
      }),
      prisma.roomCategory.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Exclude passwordHash for security
        },
      }),
    ]);

    const backupPayload = {
      meta: {
        hotelName: 'Hotel Sherpa Soul',
        propertyLocation: 'Thamel, Kathmandu, Nepal',
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        version: '1.0.0',
        summary: {
          totalBookings: bookings.length,
          totalPhysicalRooms: physicalRooms.length,
          totalCategories: categories.length,
          totalInquiries: inquiries.length,
          totalUsers: users.length,
        },
      },
      data: {
        bookings,
        physicalRooms,
        categories,
        inquiries,
        users,
      },
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `hotel_sherpa_soul_backup_${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    console.error('[BackupAPI] Error generating database backup:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error generating backup' },
      { status: 500 }
    );
  }
}
