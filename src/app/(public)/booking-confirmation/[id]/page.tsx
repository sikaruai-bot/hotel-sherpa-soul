import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Calendar, Users, MapPin, Phone, MessageCircle, Printer, ArrowRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import ConfirmationAnalytics from '@/components/public/ConfirmationAnalytics';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Booking Confirmation | Hotel Sherpa Soul Thamel',
  description: 'Your direct reservation confirmation at Hotel Sherpa Soul in Thamel, Kathmandu.',
};

export default async function BookingConfirmationPage({ params }: Props) {
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { id },
        { bookingNumber: id }
      ]
    },
    include: {
      category: true,
      physicalRoom: true,
    }
  });

  if (!booking) notFound();

  const nights = Math.max(1, Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const formattedCheckIn = booking.checkIn.toISOString().split('T')[0];
  const formattedCheckOut = booking.checkOut.toISOString().split('T')[0];

  const whatsAppText = `Hello Hotel Sherpa Soul! I just booked direct:
` +
    `*Ref:* ${booking.bookingNumber}
` +
    `*Guest:* ${booking.guestName}
` +
    `*Room:* ${booking.category.name}
` +
    `*Dates:* ${formattedCheckIn} to ${formattedCheckOut} (${nights} nights)
` +
    `*Total:* USD $${booking.totalAmountUSD}
` +
    `Looking forward to staying with you!`;

  const waUrl = `https://wa.me/9779851068219?text=${encodeURIComponent(whatsAppText)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      {/* Analytics Event Dispatcher */}
      <ConfirmationAnalytics
        bookingNumber={booking.bookingNumber}
        roomType={booking.category.name}
        bookingValue={booking.totalAmountUSD}
      />

      {/* Success Badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
            Reservation Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Thank You, {booking.guestName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Your direct booking reference is <strong className="text-slate-900 font-mono text-base">{booking.bookingNumber}</strong>
          </p>
        </div>

        {/* WhatsApp Fast Confirmation CTA */}
        <div className="pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Confirm Instant Receipt on WhatsApp</span>
          </a>
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
            <strong className="text-slate-900 text-base">{booking.category.name}</strong>
            <span className="text-xs text-slate-500 block">
              Floor {booking.physicalRoom?.floor || 2} • {booking.adults} Adults {booking.children > 0 ? `+ ${booking.children} Child` : ''}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Stay Duration</span>
            <strong className="text-slate-900 text-base">{nights} Nights</strong>
            <span className="text-xs text-slate-500 block">
              {formattedCheckIn} → {formattedCheckOut}
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
          <p>📍 <strong>Address:</strong> Thamel, Kathmandu, Nepal</p>
          <p>⏰ <strong>Check-in Time:</strong> 14:00 onwards • <strong>Check-out:</strong> 12:00 noon</p>
          <p>📞 <strong>Need Directions or Airport Pickup?</strong> Message owner Mingma Sherpa at <a href="tel:+9779851068219" className="text-amber-400 underline">+977 9851068219</a></p>
          <p>🧳 <strong>Trekking Luggage:</strong> Free secure storage available for your bags during your mountain trek.</p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
            <span>← Return to Home</span>
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
