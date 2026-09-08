import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Hotel Sherpa Soul safeguards guest personal details, direct reservation data, and communications under strict privacy guidelines.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8 text-slate-700 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
      <p className="text-xs text-slate-400">Last updated: January 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
        <p>
          When you make a direct reservation or contact Hotel Sherpa Soul, we collect basic guest information including your name, email address, phone/WhatsApp number, country of origin, and check-in/check-out dates.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. How We Use Your Information</h2>
        <p>
          Your information is used strictly to confirm your room reservation, communicate directions, respond to your inquiries, and fulfill Nepalese hotel guest registration laws. We never sell, rent, or trade guest personal information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">3. Direct Booking & Communications</h2>
        <p>
          If you opt to confirm your reservation via WhatsApp or email, communications occur directly between you and hotel management.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">4. Contact Us</h2>
        <p>
          For questions regarding your privacy, contact owner Mingma Sherpa at <a href="mailto:info@hotelsherpasoul.com" className="text-amber-600 underline">info@hotelsherpasoul.com</a>.
        </p>
      </section>
    </div>
  );
}
