import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();

    const bookings = await prisma.booking.findMany({
      include: { category: true, physicalRoom: true },
      orderBy: { createdAt: 'desc' },
    });

    // Group by email or phone to build guest profile
    const guestMap = new Map<string, any>();

    for (const b of bookings) {
      const key = (b.guestEmail || b.guestPhone || b.guestName).toLowerCase();
      if (!guestMap.has(key)) {
        guestMap.set(key, {
          id: b.id,
          name: b.guestName,
          email: b.guestEmail,
          phone: b.guestPhone,
          whatsApp: b.guestWhatsApp,
          country: b.guestCountry || 'International',
          totalStays: 0,
          totalSpendUSD: 0,
          lastCheckIn: b.checkIn,
          lastRoom: b.physicalRoom?.roomNumber || 'Assigned',
          bookings: [],
        });
      }

      const guest = guestMap.get(key);
      guest.totalStays++;
      guest.totalSpendUSD += b.totalAmountUSD;
      guest.bookings.push({
        bookingNumber: b.bookingNumber,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        category: b.category.name,
        roomNumber: b.physicalRoom?.roomNumber || 'Unassigned',
        status: b.status,
        amountUSD: b.totalAmountUSD,
      });
    }

    let guests = Array.from(guestMap.values());

    if (query) {
      guests = guests.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.email.toLowerCase().includes(query) ||
        g.phone.toLowerCase().includes(query) ||
        g.country.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      count: guests.length,
      guests,
    });
  } catch (error: any) {
    console.error('Guests GET error:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching guest CRM records' }, { status: 500 });
  }
}
