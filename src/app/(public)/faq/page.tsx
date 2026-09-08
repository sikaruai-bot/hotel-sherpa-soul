import React from 'react';
import Link from 'next/link';
import { HelpCircle, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ)',
  description: 'Common questions about Hotel Sherpa Soul: Thamel location, airport distance, no-restaurant policy, Wi-Fi, 24/7 hot water, and direct booking perks.',
  alternates: { canonical: 'https://hotelsherpasoul.com/faq' },
};

export default function FAQPage() {
  const faqs = [
    {
      q: 'Where is Hotel Sherpa Soul located?',
      a: 'We are situated in Thamel, Kathmandu, Nepal, in a quiet alleyway just a minute from the bustling tourist streets. You enjoy the convenience of Thamel with none of the late-night street noise.'
    },
    {
      q: 'Does Hotel Sherpa Soul have an on-site restaurant?',
      a: 'No. We deliberately do NOT operate an in-house restaurant or bar. Our core philosophy is: “No Restaurant. No Noise. Sleep Well.” Hundreds of restaurants, bakeries, and cafes are within a 1-5 minute walk.'
    },
    {
      q: 'Does the hotel have private car parking?',
      a: 'No. The hotel is located in a pedestrian-friendly Thamel alleyway and does not have private parking. Taxis can drop you off a short distance away at the alley entrance.'
    },
    {
      q: 'How many guest rooms does Hotel Sherpa Soul have?',
      a: 'The hotel has exactly 6 sellable guest rooms: Floor 2 (201, 202, 203) and Floor 3 (301, 302, 303), organized into Budget Family Room, Family Room, and Deluxe Room.'
    },
    {
      q: 'How far is the hotel from Tribhuvan International Airport (TIA)?',
      a: 'The airport is approximately 6 km away, which translates to a 20 to 30 minute taxi ride depending on Kathmandu traffic conditions.'
    },
    {
      q: 'Is hot water available 24/7?',
      a: 'Yes. We utilize a dual solar and electric continuous water heating system to ensure consistent hot water throughout all seasons.'
    },
    {
      q: 'How does the Shared Kitchen (Room 102) work?',
      a: 'Room 102 on Floor 1 is a dedicated shared kitchen facility available for our long-stay guests (minimum recommended stay of 2 weeks). It features gas cookers, refrigerator, cookware, and personal storage.'
    },
    {
      q: 'Can I store my luggage while on a trek?',
      a: 'Yes! We offer complimentary locked luggage storage for our guests while they are trekking in the Himalayas.'
    },
    {
      q: 'What are the check-in and check-out times?',
      a: 'Check-in is from 14:00 onwards, and check-out is until 12:00 noon. Early check-in or late check-out is accommodated when possible upon request.'
    },
    {
      q: 'How can I book directly and save?',
      a: 'You can book directly on our website through our Book page or message us directly on WhatsApp (+977 9851068219). Direct bookings receive our best rates with zero OTA commission markups.'
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Knowledge Base
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Clear, honest answers about staying at Hotel Sherpa Soul in Thamel, Kathmandu.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <details
            key={idx}
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <span>{item.q}</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-amber-600">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white text-center space-y-4">
        <h3 className="text-xl font-bold">Have another question?</h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Owner Mingma Sherpa is available directly on WhatsApp to assist with questions or flight details.
        </p>
        <a
          href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20have%20a%20question"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Ask Us on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
