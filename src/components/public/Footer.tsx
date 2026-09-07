"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, MessageCircle, Clock, ShieldCheck, Heart } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Top Highlight strip */}
      <div className="bg-slate-950/80 border-b border-slate-800 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Direct Booking Guarantee</h4>
              <p className="text-xs text-slate-400">Best rate direct, fast confirmation, zero middleman markups</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Check-in / Check-out</h4>
              <p className="text-xs text-slate-400">Check-in: 14:00 • Check-out: 12:00 (Flexible upon request)</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Pure Quiet Haven</h4>
              <p className="text-xs text-slate-400">No Restaurant • No Noise • Restful Kathmandu Stay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: About & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700">
                <Image
                  src="/images/logo.png"
                  alt="Hotel Sherpa Soul Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-white block">Hotel Sherpa Soul</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Thamel, Kathmandu</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A peaceful, clean, and affordable boutique hotel in the heart of Thamel. We deliberately operate with <strong>no in-house restaurant</strong> to ensure deep, undisturbed sleep for trekkers and international travelers.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                “No Restaurant. No Noise. Sleep Well.”
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Explore Hotel</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/rooms" className="text-slate-400 hover:text-white transition-colors">
                  Our Rooms & Rates
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Hotel Sherpa Soul
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-slate-400 hover:text-white transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/location" className="text-slate-400 hover:text-white transition-colors">
                  Location & Map
                </Link>
              </li>
              <li>
                <Link href="/long-stay" className="text-slate-400 hover:text-white transition-colors">
                  Shared Kitchen & Long Stays
                </Link>
              </li>
              <li>
                <Link href="/offers" className="text-slate-400 hover:text-white transition-colors">
                  Direct Booking Discounts
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-400 hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Room Categories */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Room Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/rooms/budget-family-room" className="text-slate-400 hover:text-white transition-colors block">
                  <span className="text-white font-medium">Budget Family Room</span>
                  <span className="text-xs text-amber-400 block">$20 / night • Up to 3 Adults + 1 Child</span>
                </Link>
              </li>
              <li>
                <Link href="/rooms/family-room" className="text-slate-400 hover:text-white transition-colors block">
                  <span className="text-white font-medium">Family Room</span>
                  <span className="text-xs text-amber-400 block">$30 / night • Up to 3 Adults + 1 Child</span>
                </Link>
              </li>
              <li>
                <Link href="/rooms/deluxe-room" className="text-slate-400 hover:text-white transition-colors block">
                  <span className="text-white font-medium">Deluxe Room</span>
                  <span className="text-xs text-amber-400 block">$20 / night • Up to 2 Adults + 1 Child</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-slate-800">
                <Link href="/long-stay" className="text-slate-400 hover:text-emerald-400 transition-colors block text-xs">
                  🍳 Shared Kitchen (Room 102) for stays 2+ weeks
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Verified Contact Info */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Contact & Booking</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Thamel, Kathmandu, Nepal</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div className="flex flex-col text-sm">
                  <a
                    href="tel:+9779851068219"
                    onClick={() => trackEvent('phone_click', { placement: 'footer' })}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    +977 9851068219 (Mobile)
                  </a>
                  <a
                    href="tel:+97714530311"
                    onClick={() => trackEvent('phone_click', { placement: 'footer_landline' })}
                    className="text-slate-400 hover:text-white transition-colors text-xs"
                  >
                    +977-1 4530311 (Landline)
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('whatsapp_click', { placement: 'footer' })}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  WhatsApp: +977 9851068219
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <a
                  href="mailto:info@hotelsherpasoul.com"
                  onClick={() => trackEvent('email_click', { placement: 'footer' })}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  info@hotelsherpasoul.com
                </a>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/book"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold text-center block shadow-sm transition-colors"
              >
                Instant Direct Reservation
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Hotel Sherpa Soul. All rights reserved. Thamel, Kathmandu, Nepal.
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/cancellation-policy" className="hover:text-slate-300 transition-colors">
              Cancellation Policy
            </Link>
            <Link href="/cookie-policy" className="hover:text-slate-300 transition-colors">
              Cookie Policy
            </Link>
            <Link href="/admin/login" className="hover:text-slate-400 transition-colors opacity-60">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
