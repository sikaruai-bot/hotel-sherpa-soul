"use client";

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  bookingNumber: string;
  roomType: string;
  bookingValue: number;
}

export default function ConfirmationAnalytics({ bookingNumber, roomType, bookingValue }: Props) {
  useEffect(() => {
    trackEvent('booking_confirmed', {
      booking_number: bookingNumber,
      room_type: roomType,
      booking_value: bookingValue,
      currency: 'USD',
    });
  }, [bookingNumber, roomType, bookingValue]);

  return null;
}
