import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Hotel Sherpa Soul Thamel',
  description: 'Flexible direct booking cancellation policies at Hotel Sherpa Soul in Thamel Kathmandu.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8 text-slate-700 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cancellation & Refund Policy</h1>
      <p className="text-xs text-slate-400">Last updated: January 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. Direct Booking Flexibility</h2>
        <p>
          We understand travel plans in Nepal change due to mountain weather, domestic flight delays (e.g. Lukla), or road conditions. Direct reservations made through our website or WhatsApp can be cancelled or rescheduled free of charge up to <strong>24 hours prior to check-in</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. Late Cancellations & No-Shows</h2>
        <p>
          Cancellations received less than 24 hours prior to arrival or no-shows may incur a 1-night charge. Please notify us on WhatsApp (+977 9851068219) as early as possible if your flights or trek dates change.
        </p>
      </section>
    </div>
  );
}
