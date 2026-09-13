import React from 'react';
import Link from 'next/link';
import { Home, BedDouble, CalendarCheck } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <span className="text-6xl font-black text-amber-500 block">404</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          We could not locate the page you requested. You may explore our guest rooms or return to the homepage.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          <Link
            href="/rooms"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2"
          >
            <BedDouble className="w-4 h-4" />
            <span>Explore Rooms</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
