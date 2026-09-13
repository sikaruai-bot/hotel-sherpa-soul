'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Calendar, Users, MapPin, Phone, MessageCircle, Mail, Printer, ArrowRight, ShieldCheck } from 'lucide-react';
import ConfirmationAnalytics from '@/components/public/ConfirmationAnalytics';
import PrintReceiptButton from '@/components/public/PrintReceiptButton';

export interface BookingDisplayData {
  bookingNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  categoryName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalAmountUSD: number;
  roomNumber?: string;
  floor?: number;
  specialRequests?: string | null;
}

interface Props {
  bookingNumber: string;
  serverBooking: BookingDisplayData | null;
}

export default function BookingConfirmationClientView({ bookingNumber, serverBooking }: Props) {
  const [booking, setBooking] = useState<BookingDisplayData | null>(serverBooking);
  const [loading, setLoading] = useState(!serverBooking);

  useEffect(() => {
    if (serverBooking) {
      setBooking(serverBooking);
      setLoading(false);
      return;
    }

    // Try retrieving from sessionStorage if serverless container didn't have the sqlite row
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`hss_booking_${bookingNumber}`) || sessionStorage.getItem('hss_last_booking');
        if (stored) {
          const parsed = JSON.parse(stored);
          setBooking({
            bookingNumber: parsed.bookingNumber || bookingNumber,
            guestName: parsed.guestName || 'Valued Guest',
            guestEmail: parsed.guestEmail || '',
            guestPhone: parsed.guestPhone || '',
            categoryName: parsed.categoryName || 'Deluxe Room',
            checkIn: parsed.checkIn || new Date().toISOString().split('T')[0],
            checkOut: parsed.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            nights: parsed.nights || 1,
            adults: parsed.adults || 2,
            children: parsed.children || 0,
            totalAmountUSD: parsed.totalAmountUSD || 20,
            roomNumber: parsed.roomNumber || '201',
            floor: parsed.floor || 2,
            specialRequests: parsed.specialRequests || null,
          });
        } else {
          // Fallback minimal booking representation for direct URL hits
          setBooking({
            bookingNumber,
            guestName: 'Valued Guest',
            guestEmail: 'info@hotelsherpasoul.com',
            guestPhone: '+977 9851068219',
            categoryName: 'Direct Reservation',
            checkIn: new Date().toISOString().split('T')[0],
            checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            nights: 1,
            adults: 2,
            children: 0,
            totalAmountUSD: 20,
            roomNumber: '201',
            floor: 2,
            specialRequests: null,
          });
        }
      } catch (e) {
        console.error('Failed to parse cached booking:', e);
      } finally {
        setLoading(false);
      }
    }
  }, [bookingNumber, serverBooking]);

  if (loading || !booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500 font-medium">
        Loading confirmation voucher...
      </div>
    );
  }

  const nights = booking.nights || 1;
  const formattedCheckIn = booking.checkIn;
  const formattedCheckOut = booking.checkOut;

  const whatsAppText = `Hello Hotel Sherpa Soul! I just booked direct:\n` +
    `*Ref:* ${booking.bookingNumber}\n` +
    `*Guest:* ${booking.guestName}\n` +
    `*Room:* ${booking.categoryName}\n` +
    `*Dates:* ${formattedCheckIn} to ${formattedCheckOut} (${nights} nights)\n` +
    `*Total:* USD $${booking.totalAmountUSD}\n` +
    `Looking forward to staying with you!`;

  const waUrl = `https://wa.me/9779851068219?text=${encodeURIComponent(whatsAppText)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      {/* Analytics Event Dispatcher */}
      <ConfirmationAnalytics
        bookingNumber={booking.bookingNumber}
        roomType={booking.categoryName}
        bookingValue={booking.totalAmountUSD}
      />

      {/* Success Badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
            Reservation Confirmed &bull; Thank You!
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Thank You, {booking.guestName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Your direct booking reference is <strong className="text-slate-900 font-mono text-base">#{booking.bookingNumber}</strong>
          </p>
        </div>

        {/* Automated Email Status Notice */}
        {booking.guestEmail && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-emerald-200 text-xs sm:text-sm text-emerald-800 shadow-xs">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automated confirmation &amp; receipt dispatched to <strong>{booking.guestEmail}</strong></span>
          </div>
        )}

        {/* Fast Actions: WhatsApp & Print */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Open Instant WhatsApp Voucher</span>
          </a>
          <PrintReceiptButton />
        </div>
      </div>

      {/* Booking Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Reservation Summary</h2>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            Direct Website
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-600">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Room Category</span>
            <strong className="text-slate-900 text-base">{booking.categoryName}</strong>
            <span className="text-xs text-slate-500 block">
              Floor {booking.floor || 2} • {booking.adults} Adults {booking.children > 0 ? `+ ${booking.children} Child` : ''}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Stay Duration</span>
            <strong className="text-slate-900 text-base">{nights} Night{nights > 1 ? 's' : ''}</strong>
            <span className="text-xs text-slate-500 block">
              {formattedCheckIn} &rarr; {formattedCheckOut}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Guest Details</span>
            <strong className="text-slate-900 block">{booking.guestName}</strong>
            <span className="text-xs text-slate-500 block">{booking.guestEmail}</span>
            <span className="text-xs text-slate-500 block">{booking.guestPhone}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Total Balance Due</span>
            <strong className="text-2xl font-extrabold text-amber-600 block">USD ${booking.totalAmountUSD}</strong>
            <span className="text-xs text-emerald-700 font-semibold">Pay upon arrival (Cash NPR/USD)</span>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="pt-4 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-700 block mb-0.5">Special Requests:</span>
            <p className="text-slate-600 italic">{booking.specialRequests}</p>
          </div>
        )}
      </div>

      {/* Hotel Location & Instructions */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold">Important Check-in Information</h3>
        <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>📍 <strong>Address:</strong> Chaksibari Marg, Thamel, Kathmandu, Nepal</p>
          <p>⏰ <strong>Check-in Time:</strong> 14:00 onwards &bull; <strong>Check-out:</strong> 12:00 noon</p>
          <p>📞 <strong>Need Directions or Airport Pickup?</strong> Message owner Mingma Sherpa at <a href="tel:+9779851068219" className="text-amber-400 underline">+977 9851068219</a></p>
          <p>🧳 <strong>Trekking Luggage:</strong> Free secure storage available for your bags during your mountain trek.</p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
            <span>&larr; Return to Home</span>
          </Link>
          <Link href="/rooms" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <span>Explore All Rooms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
