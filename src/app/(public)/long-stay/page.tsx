import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Calendar, Clock, Check, Users, MessageCircle, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Long Stay Accommodation & Shared Kitchen | Hotel Sherpa Soul Kathmandu',
  description: 'Extended stay rooms in Thamel Kathmandu with full access to our fully equipped Shared Guest Kitchen (Room 102). Ideal for digital nomads and trekkers staying 2+ weeks.',
  alternates: { canonical: 'https://hotelsherpasoul.com/long-stay' },
};

export default async function LongStayPage() {
  const facility = await prisma.facility.findUnique({
    where: { code: 'KITCHEN_102' }
  });

  let amenities: string[] = [];
  try { amenities = JSON.parse(facility?.amenities || '[]'); } catch { amenities = []; }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Extended Stays in Thamel
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Long Stay & Shared Guest Kitchen
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Planning to base yourself in Kathmandu for 2 weeks, a month, or longer? Hotel Sherpa Soul provides a peaceful residential environment with exclusive access to our <strong>Shared Kitchen (Room 102)</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
          <Image
            src="/images/singlesitter.jpeg"
            alt="Shared Kitchen Area 102 Hotel Sherpa Soul Thamel"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700">
            Dedicated Area: Room 102 (Floor 1)
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Min. Recommended Stay: 14 Nights
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Cook Your Own Meals & Feel at Home
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dining out three times a day in Kathmandu can get tiring and costly. Our dedicated Shared Kitchen allows eligible long-stay guests to brew their own morning coffee, cook comfort meals, and store groceries safely.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Included Kitchen Equipment:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              {amenities.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20am%20interested%20in%20a%20long%20stay%20with%20Shared%20Kitchen%20access"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire for Monthly Rates on WhatsApp</span>
            </a>
            <Link
              href="/book"
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm text-center transition-colors"
            >
              Book Direct Online
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
