import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Hotel Sherpa Soul Thamel',
  description: 'Terms and conditions for room reservations at Hotel Sherpa Soul in Thamel, Kathmandu.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8 text-slate-700 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms & Conditions</h1>
      <p className="text-xs text-slate-400">Last updated: January 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. Room Inventory & Capacity Limits</h2>
        <p>
          Hotel Sherpa Soul has exactly 6 sellable guest rooms. Guests must respect category maximum occupancy limits (Budget Family: 3 Adults + 1 Child; Family: 3 Adults + 1 Child; Deluxe: 2 Adults + 1 Child). Exceeding maximum permitted guest counts is not allowed.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. Check-in & Check-out Policies</h2>
        <p>
          Standard check-in is from 14:00 onwards. Check-out is strictly until 12:00 noon to allow proper sanitation. Valid passport or government ID is required at check-in.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">3. Peaceful Stay Commitment</h2>
        <p>
          Our hotel operates under the standard: <strong>“No Restaurant. No Noise. Sleep Well.”</strong> Quiet hours are observed from 22:00 (10:00 PM) to 07:00 (7:00 AM).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">4. Shared Kitchen (Area 102)</h2>
        <p>
          The Shared Kitchen is intended for long-stay guests (14+ nights). Guests are expected to wash and return all cookware and utensils after use.
        </p>
      </section>
    </div>
  );
}
