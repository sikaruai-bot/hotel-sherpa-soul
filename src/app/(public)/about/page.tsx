import React from 'react';
import Image from 'next/image';
import { VolumeX, Sparkles, MapPin, Heart, ShieldCheck, Clock, Users, Coffee } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Our Quiet Hotel & Story in Thamel',
  description: 'Learn the story of Hotel Sherpa Soul in Thamel, Kathmandu. Managed with personal Sherpa hospitality, offering 6 quiet guest rooms and a shared kitchen for long stays.',
  alternates: { canonical: 'https://hotelsherpasoul.com/about' },
};

export default function AboutPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://hotelsherpasoul.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'About',
        item: 'https://hotelsherpasoul.com/about',
      },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Our Story & Philosophy
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          About Hotel Sherpa Soul
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          A peaceful, clean, and honest hotel in Thamel, Kathmandu, founded with a clear promise: <strong>“No Restaurant. No Noise. Sleep Well.”</strong>
        </p>
      </div>

      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100">
        <Image
          src="/images/viewSeen.jpeg"
          alt="Hotel Sherpa Soul Thamel Balcony & Mountain View"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm sm:text-base text-slate-700 leading-relaxed">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">A Tranquil Haven in Bustling Thamel</h2>
          <p>
            Thamel is widely renowned as the vibrant heart of international travelers and mountaineers in Kathmandu. It offers everything from gear shops and cafes to cultural bookstores and trekking agencies.
          </p>
          <p>
            However, most visitors quickly realize that standard Thamel hotels are situated above loud bars, dance clubs, and restaurants with noise lasting into the early morning hours. For tired trekkers preparing for Everest or returning from the Himalayas, quality sleep is vital.
          </p>
          <p>
            At Hotel Sherpa Soul, we made the deliberate architectural decision <strong>never to build an on-site restaurant or bar</strong>. By keeping our building peaceful and residential, our guests enjoy deep, undisturbed sleep.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Genuine Sherpa Hospitality</h2>
          <p>
            Owned and operated with authentic Sherpa warmth by Mr. Mingma Sherpa, our hotel treats every guest as a member of our family. Whether you need honest trekking route recommendations, flight advice for Lukla or Pokhara, or free secure luggage storage while you are on trek, we are always here to assist.
          </p>
          <p>
            With exactly <strong>6 sellable rooms</strong>, we focus on intimate quality rather than impersonal volume. Every room receives attentive daily cleaning, fresh linens, and personal care.
          </p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold space-y-1">
            <span>✨ Exactly 6 Guest Rooms • Floor 2 & Floor 3</span>
            <span className="block">🍳 Shared Kitchen (Room 102) for Long-Stay Guests (2+ Weeks)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
