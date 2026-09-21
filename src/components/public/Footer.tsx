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
            <div className="flex items-center">
              <div className="relative h-14 w-40 bg-white rounded-xl p-1.5 shadow-md">
                <Image
                  src="/images/logo.png"
                  alt="Hotel Sherpa Soul Thamel Kathmandu"
                  fill
                  className="object-contain"
                />
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

            {/* Social Media Links */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Connect With Us</span>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/Sherpasoul/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('social_click', { platform: 'facebook' })}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 shadow-sm group"
                  aria-label="Hotel Sherpa Soul Facebook Page"
                >
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/hotelsherpasoul/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('social_click', { platform: 'instagram' })}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-600 hover:to-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700 shadow-sm group"
                  aria-label="Hotel Sherpa Soul Instagram Profile"
                >
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@hotelsherpasoul"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('social_click', { platform: 'tiktok' })}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-black hover:text-[#00f2fe] text-slate-300 flex items-center justify-center transition-all border border-slate-700 shadow-sm group"
                  aria-label="Hotel Sherpa Soul TikTok Profile"
                >
                  <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                  </svg>
                </a>
                <a
                  href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('whatsapp_click', { placement: 'footer_social_icon' })}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 shadow-sm group"
                  aria-label="Chat on WhatsApp +977 9851068219"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:text-white group-hover:scale-110 transition-transform" />
                </a>
              </div>
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
