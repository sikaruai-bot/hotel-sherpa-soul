"use client";

import React from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, CalendarCheck } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function MobileStickyBar() {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2 shadow-lg">
      <div className="grid grid-cols-3 gap-2">
        <a
          href="tel:+9779851068219"
          onClick={() => trackEvent('phone_click', { placement: 'mobile_sticky' })}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold active:bg-slate-200 transition-colors"
        >
          <Phone className="w-4 h-4 text-blue-600 mb-0.5" />
          <span>Call Now</span>
        </a>

        <a
          href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20would%20like%20to%20inquire%20about%20room%20availability"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('whatsapp_click', { placement: 'mobile_sticky' })}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold active:bg-emerald-700 transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4 mb-0.5" />
          <span>WhatsApp</span>
        </a>

        <Link
          href="/book"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-amber-600 text-white text-xs font-bold active:bg-amber-700 transition-colors shadow-sm"
        >
          <CalendarCheck className="w-4 h-4 mb-0.5" />
          <span>Book Direct</span>
        </Link>
      </div>
    </div>
  );
}
