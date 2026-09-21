import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = body;

    // Action A: Update Physical Room Status or Category
    if (action === 'update_physical_room') {
      const { roomId, status, categoryId, notes } = body;
      const updated = await prisma.physicalRoom.update({
        where: { id: roomId },
        data: {
          status: status || undefined,
          categoryId: categoryId || undefined,
          notes: notes !== undefined ? notes : undefined,
        },
        include: { category: true }
      });
      return NextResponse.json({ success: true, room: updated });
    }

    // Action B: Update Room Category Rate or Occupancy
    if (action === 'update_category') {
      const { categoryId, rateUSD, maxAdults, maxChildren, maxGuests, description, amenities, seoTitle, seoDescription } = body;
      const updated = await prisma.roomCategory.update({
        where: { id: categoryId },
        data: {
          rateUSD: rateUSD !== undefined ? parseFloat(rateUSD) : undefined,
          maxAdults: maxAdults !== undefined ? parseInt(maxAdults) : undefined,
          maxChildren: maxChildren !== undefined ? parseInt(maxChildren) : undefined,
          maxGuests: maxGuests !== undefined ? parseInt(maxGuests) : undefined,
          description: description || undefined,
          amenities: amenities ? (typeof amenities === 'string' ? amenities : JSON.stringify(amenities)) : undefined,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
        }
      });
      return NextResponse.json({ success: true, category: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update' }, { status: 500 });
  }
}
