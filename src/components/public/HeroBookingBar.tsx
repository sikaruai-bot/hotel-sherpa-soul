"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Search, ChevronRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function HeroBookingBar() {
  const router = useRouter();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(formatDate(tomorrow));
  const [checkOut, setCheckOut] = useState(formatDate(dayAfter));
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    trackEvent('check_availability', {
      check_in: checkIn,
      check_out: checkOut,
      adults: parseInt(adults),
      children: parseInt(children),
    });

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults,
      children,
    });

    router.push(`/book?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-3 sm:p-4 border border-white/20 text-slate-900 max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Check-In */}
        <div className="text-left bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Check-in</span>
          </label>
          <input
            type="date"
            value={checkIn}
            min={formatDate(today)}
            onChange={(e) => setCheckIn(e.target.value)}
            required
            className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Check-Out */}
        <div className="text-left bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Check-out</span>
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || formatDate(tomorrow)}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Guests */}
        <div className="text-left bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 transition-colors">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Guests</span>
          </label>
          <div className="flex gap-2 text-xs font-semibold">
            <select
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="1">1 Adult</option>
              <option value="2">2 Adults</option>
              <option value="3">3 Adults</option>
            </select>
            <select
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="0">0 Child</option>
              <option value="1">1 Child</option>
            </select>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="flex items-center">
          <button
            type="submit"
            className="w-full h-full min-h-[50px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-slate-950" />
            <span>Check Availability</span>
          </button>
        </div>
      </div>
    </form>
  );
}
