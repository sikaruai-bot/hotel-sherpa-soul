import React from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Clock, Plane, Compass, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Location & Map | Hotel Sherpa Soul Thamel Kathmandu',
  description: 'How to find Hotel Sherpa Soul in Thamel Kathmandu. Travel times from Kathmandu Airport (TIA ~20 min), Pashupatinath (~15 min), and taxi directions.',
  alternates: { canonical: 'https://hotelsherpasoul.com/location' },
};

export default function LocationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Prime Location
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Location & Transportation Guide
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Hotel Sherpa Soul is situated in central Thamel, Kathmandu, in an authentic pedestrian alleyway away from busy vehicular traffic.
        </p>
      </div>

      {/* Approximate Travel Times Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
          <Plane className="w-8 h-8 text-amber-600 mx-auto" />
          <span className="text-2xl font-extrabold text-slate-900 block">~ 20 min</span>
          <h3 className="font-bold text-sm text-slate-800">Kathmandu Airport (TIA)</h3>
          <p className="text-xs text-slate-500">Approx. 6 km. Pre-paid airport taxis readily available.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
          <Compass className="w-8 h-8 text-emerald-600 mx-auto" />
          <span className="text-2xl font-extrabold text-slate-900 block">~ 15 min</span>
          <h3 className="font-bold text-sm text-slate-800">Pashupatinath Temple</h3>
          <p className="text-xs text-slate-500">Approx. 5 km. Sacred Hindu temple along Bagmati river.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
          <Compass className="w-8 h-8 text-blue-600 mx-auto" />
          <span className="text-2xl font-extrabold text-slate-900 block">~ 20 min</span>
          <h3 className="font-bold text-sm text-slate-800">Boudhanath Stupa</h3>
          <p className="text-xs text-slate-500">Approx. 7 km. Major Buddhist pilgrimage landmark.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
          <MapPin className="w-8 h-8 text-purple-600 mx-auto" />
          <span className="text-2xl font-extrabold text-slate-900 block">~ 15 min walk</span>
          <h3 className="font-bold text-sm text-slate-800">Kathmandu Durbar Square</h3>
          <p className="text-xs text-slate-500">Historic Newari palaces, temples, and Kumari house.</p>
        </div>
      </div>

      {/* Embedded Map Section */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-lg grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 lg:h-auto min-h-[400px] relative bg-slate-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.2278453472017!2d85.3101569!3d27.7154212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb18fc81c9a625%3A0x6b4458f2eec91e2b!2sThamel%2C%20Kathmandu%2044600!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Hotel Sherpa Soul Google Map"
            className="w-full h-full min-h-[400px]"
          />
        </div>

        <div className="p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">How to Reach Us</h2>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>From Airport by Taxi:</strong> Ask your taxi driver to head to Thamel. Pre-paid taxi counters are right outside TIA arrivals. Fixed fair is generally NPR 800 - 1000 (~ USD 7 - 9).
              </p>
              <p>
                <strong>Ride-Sharing:</strong> You can download the <em>Pathao</em> or <em>InDrive</em> apps on your phone once you get a local SIM at the airport.
              </p>
              <p>
                <strong>Need Help on Arrival?</strong> Message owner Mingma Sherpa on WhatsApp with your location or taxi driver, and we will gladly guide you right to our doorstep!
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <a
              href="https://wa.me/9779851068219?text=Hello%20Mingma,%20I%20need%20directions%20to%20Hotel%20Sherpa%20Soul"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Us for Directions</span>
            </a>
            <a
              href="tel:+9779851068219"
              className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold text-center flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>Call Front Desk: +977 9851068219</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
