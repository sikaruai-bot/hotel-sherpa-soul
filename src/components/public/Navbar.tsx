"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, MessageCircle, CalendarCheck, ShieldCheck } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import LanguageSelector from '@/components/public/LanguageSelector';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWhatsApp = (placement: string) => {
    trackEvent('whatsapp_click', { placement });
  };

  const handlePhone = (placement: string) => {
    trackEvent('phone_click', { placement, phone_number: '+9779851068219' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      {/* Top Notification / Direct Booking Bar */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span className="hidden sm:inline">📍 Thamel, Kathmandu, Nepal</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="text-amber-400 font-semibold">“No Restaurant. No Noise. Sleep Well.”</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Multi-Language Selector Dropdown */}
            <LanguageSelector variant="topbar" />

            <a
              href="tel:+9779851068219"
              onClick={() => handlePhone('topbar')}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">+977 9851068219</span>
            </a>
            <a
              href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleWhatsApp('topbar')}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group py-1" aria-label="Hotel Sherpa Soul Homepage">
          <div className="relative h-12 w-28 sm:h-14 sm:w-36 md:h-16 md:w-44 flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Hotel Sherpa Soul Thamel Kathmandu"
              fill
              className="object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </div>
        </Link>

        {/* Desktop Menu Links */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link href="/rooms" className="hover:text-amber-600 transition-colors">
            Rooms
          </Link>
          <Link href="/about" className="hover:text-amber-600 transition-colors">
            About
          </Link>
          <Link href="/gallery" className="hover:text-amber-600 transition-colors">
            Gallery
          </Link>
          <Link href="/location" className="hover:text-amber-600 transition-colors">
            Location
          </Link>
          <Link href="/long-stay" className="hover:text-amber-600 transition-colors">
            Long Stay / Kitchen
          </Link>
          <Link href="/offers" className="hover:text-amber-600 transition-colors flex items-center gap-1 text-amber-700">
            Offers
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">10% OFF</span>
          </Link>
          <Link href="/faq" className="hover:text-amber-600 transition-colors">
            FAQ
          </Link>
          <Link href="/contact" className="hover:text-amber-600 transition-colors">
            Contact
          </Link>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleWhatsApp('nav_btn')}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Chat</span>
          </a>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Book Direct</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/book"
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
          >
            Book
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            <a
              href="tel:+9779851068219"
              onClick={() => handlePhone('mobile_drawer')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-100 text-slate-800 text-sm font-semibold"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              Call Now
            </a>
            <a
              href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleWhatsApp('mobile_drawer')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              href="/rooms"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Rooms & Rates
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              About Hotel Sherpa Soul
            </Link>
            <Link
              href="/gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Photo Gallery
            </Link>
            <Link
              href="/location"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Location & Directions
            </Link>
            <Link
              href="/long-stay"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Long Stay & Shared Kitchen (102)
            </Link>
            <Link
              href="/offers"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-700 hover:bg-amber-50"
            >
              Special Direct Offers (10% Off)
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Frequently Asked Questions
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile Multi-Language Selector */}
          <div className="pt-3 border-t border-slate-100">
            <LanguageSelector variant="mobile" />
          </div>

          <div className="pt-2">
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-lg bg-amber-600 text-white text-center font-bold block shadow-md"
            >
              Book Direct Online
            </Link>
          </div>
        </div>
      )}

      {/* Hidden Google Translate Target */}
      <div id="google_translate_element" style={{ display: 'none' }} />
    </header>
  );
}
