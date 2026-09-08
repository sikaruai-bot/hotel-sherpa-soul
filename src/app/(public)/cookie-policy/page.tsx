import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Understand how Hotel Sherpa Soul uses essential cookies to ensure seamless online room booking and secure guest session management.',
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8 text-slate-700 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cookie Policy</h1>
      <p className="text-xs text-slate-400">Last updated: January 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. What Are Cookies</h2>
        <p>
          Cookies are small text files stored in your browser to remember preferences and track anonymous website performance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. Cookies We Use</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Essential Cookies:</strong> Required to maintain direct booking cart and dates.</li>
          <li><strong>Analytics Cookies:</strong> Anonymous Google Analytics 4 and Meta Pixel tracking to understand website traffic.</li>
        </ul>
      </section>
    </div>
  );
}
