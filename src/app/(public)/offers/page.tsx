import React from 'react';
import Link from 'next/link';
import { Tag, CalendarCheck, Check } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Direct Booking Offers & 10% Discount Codes',
  description: 'Exclusive direct booking specials: 10% instant discount code DIRECT10 and 15% long-stay discount LONGSTAY15 at Hotel Sherpa Soul in Thamel Kathmandu.',
  alternates: { canonical: 'https://hotelsherpasoul.com/offers' },
};

export default async function OffersPage() {
  const offers = await prisma.offer.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Book Direct & Save
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Special Direct Offers
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Save by booking directly with the owner with zero third-party commissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {offers.map(off => (
          <div
            key={off.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-amber-600">{off.discountPct}% OFF</span>
                <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                  CODE: {off.code}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{off.title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{off.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Valid for Direct Stays</span>
              <Link
                href={`/book?promo=${off.code}`}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
              >
                Apply Offer & Book
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
