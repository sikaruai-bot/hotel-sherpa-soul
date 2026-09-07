"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('hss_cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('hss_cookie_consent', 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem('hss_cookie_consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs text-slate-300 leading-relaxed">
          We use essential cookies and anonymous analytics to provide direct booking functionality and improve your experience. See our{' '}
          <Link href="/cookie-policy" className="text-amber-400 hover:underline">
            Cookie Policy
          </Link>.
        </div>
        <button
          onClick={decline}
          className="text-slate-400 hover:text-white"
          aria-label="Close notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-xs font-semibold">
        <button
          onClick={decline}
          className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Essential Only
        </button>
        <button
          onClick={accept}
          className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
