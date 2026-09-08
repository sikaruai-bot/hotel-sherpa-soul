import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Users, ShieldCheck, BedDouble, CalendarCheck } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guest Rooms & Direct Rates ($20 - $30)',
  description: 'Explore the 3 room categories at Hotel Sherpa Soul: Budget Family Room ($20), Family Room ($30), and Deluxe Room ($20). Exactly 6 sellable quiet guest rooms in central Thamel.',
  alternates: { canonical: 'https://hotelsherpasoul.com/rooms' },
};

export const revalidate = 60;

export default async function RoomsPage() {
  const categories = await prisma.roomCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      rooms: {
        where: { isSellable: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Transparent Direct Rates
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Guest Rooms & Accommodations
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Hotel Sherpa Soul maintains exactly <strong>6 sellable rooms</strong> across Floor 2 and Floor 3. Every room is configured for peaceful sleep with no restaurant noise, high-speed Wi-Fi, and 24/7 hot water.
        </p>
      </div>

      {/* Room Category Cards */}
      <div className="space-y-12">
        {categories.map((cat, idx) => {
          let amenities: string[] = [];
          let images: string[] = [];
          try { amenities = JSON.parse(cat.amenities); } catch { amenities = []; }
          try { images = JSON.parse(cat.images); } catch { images = []; }

          const isEven = idx % 2 === 1;

          return (
            <div
              key={cat.id}
              className={`bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
            >
              {/* Photo Area */}
              <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-[420px] bg-slate-100">
                <Image
                  src={images[0] || '/images/doubleBedRoom.jpeg'}
                  alt={`${cat.name} Hotel Sherpa Soul Thamel`}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md text-amber-400 font-extrabold text-base px-4 py-2 rounded-xl border border-slate-700 shadow-lg">
                  USD ${cat.rateUSD} <span className="text-xs text-white font-normal">/ night</span>
                </div>
              </div>

              {/* Details Area */}
              <div className="lg:w-1/2 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {cat.name}
                    </h2>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Max: {cat.maxAdults} Adults {cat.maxChildren > 0 ? `+ ${cat.maxChildren} Child` : ''}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Room Features:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      {amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Booking CTAs */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href={`/book?category=${cat.id}`}
                    className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm text-center transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>Book Direct (Save 10%)</span>
                  </Link>

                  <Link
                    href={`/rooms/${cat.slug}`}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm text-center transition-colors"
                  >
                    View Room Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Room Category Comparison</h2>
          <p className="text-xs text-slate-500">Quick side-by-side comparison of our 3 room categories.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Room Category</th>
                <th className="py-3 px-4">Nightly Rate</th>
                <th className="py-3 px-4">Max Adults</th>
                <th className="py-3 px-4">Max Children</th>
                <th className="py-3 px-4">Total Max Guests</th>
                <th className="py-3 px-4">Hot Water 24/7</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 font-extrabold text-amber-600">USD ${c.rateUSD}</td>
                  <td className="py-3 px-4">{c.maxAdults} Adults</td>
                  <td className="py-3 px-4">{c.maxChildren} Child</td>
                  <td className="py-3 px-4">{c.maxGuests} Guests</td>
                  <td className="py-3 px-4 text-emerald-600">✓ Yes (Solar + Electric)</td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/book?category=${c.id}`}
                      className="inline-block px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold"
                    >
                      Book
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
