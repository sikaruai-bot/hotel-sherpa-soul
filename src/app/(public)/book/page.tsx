import React, { Suspense } from 'react';
import BookingEngineClient from '@/components/public/BookingEngineClient';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Direct Online Booking | Hotel Sherpa Soul Thamel',
  description: 'Book your quiet room directly with Hotel Sherpa Soul in Thamel, Kathmandu. Guaranteed best rate from USD $20/night, 10% direct booking discount, zero commission.',
  alternates: { canonical: 'https://hotelsherpasoul.com/book' },
};

export default async function BookPage() {
  const categories = await prisma.roomCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      rooms: {
        where: { isSellable: true }
      }
    }
  });

  const plainCategories = categories.map(c => ({
    id: c.id,
    code: c.code,
    slug: c.slug,
    name: c.name,
    rateUSD: c.rateUSD,
    maxAdults: c.maxAdults,
    maxChildren: c.maxChildren,
    maxGuests: c.maxGuests,
    description: c.description,
    amenities: JSON.parse(c.amenities || '[]'),
    images: JSON.parse(c.images || '[]'),
    totalAssignedRooms: c.rooms.length,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Direct Reservation Engine
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Reserve Your Stay at Hotel Sherpa Soul
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Instant direct confirmation • Best rate guarantee • No credit card required to hold reservation
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-20 font-bold text-slate-500">Loading booking engine...</div>}>
        <BookingEngineClient initialCategories={plainCategories} />
      </Suspense>
    </div>
  );
}
