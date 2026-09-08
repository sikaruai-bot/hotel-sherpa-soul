import React from 'react';
import prisma from '@/lib/prisma';
import BookingConfirmationClientView, { BookingDisplayData } from '@/components/public/BookingConfirmationClientView';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'Booking Voucher & Confirmation',
  description: 'Your direct reservation confirmation at Hotel Sherpa Soul in Thamel, Kathmandu.',
};

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sParams = await searchParams;

  let serverBooking: BookingDisplayData | null = null;

  try {
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

    if (booking) {
      const nights = Math.max(1, Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      serverBooking = {
        bookingNumber: booking.bookingNumber,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        categoryName: booking.category.name,
        checkIn: booking.checkIn.toISOString().split('T')[0],
        checkOut: booking.checkOut.toISOString().split('T')[0],
        nights,
        adults: booking.adults,
        children: booking.children,
        totalAmountUSD: booking.totalAmountUSD,
        roomNumber: booking.physicalRoom?.roomNumber || '201',
        floor: booking.physicalRoom?.floor || 2,
        specialRequests: booking.specialRequests,
      };
    }
  } catch (err) {
    console.error('Failed to query booking from database:', err);
  }

  // Fallback from query params if database row wasn't found across serverless instances
  if (!serverBooking && sParams && (sParams.name || sParams.cat)) {
    serverBooking = {
      bookingNumber: id,
      guestName: String(sParams.name || 'Valued Guest'),
      guestEmail: String(sParams.email || ''),
      guestPhone: String(sParams.phone || ''),
      categoryName: String(sParams.cat || 'Deluxe Room'),
      checkIn: String(sParams.in || new Date().toISOString().split('T')[0]),
      checkOut: String(sParams.out || new Date(Date.now() + 86400000).toISOString().split('T')[0]),
      nights: parseInt(String(sParams.nights || '1'), 10),
      adults: parseInt(String(sParams.adults || '2'), 10),
      children: parseInt(String(sParams.children || '0'), 10),
      totalAmountUSD: parseFloat(String(sParams.total || '20')),
      roomNumber: String(sParams.room || '201'),
      floor: parseInt(String(sParams.floor || '2'), 10),
      specialRequests: null,
    };
  }

  return (
    <BookingConfirmationClientView
      bookingNumber={id}
      serverBooking={serverBooking}
    />
  );
}
