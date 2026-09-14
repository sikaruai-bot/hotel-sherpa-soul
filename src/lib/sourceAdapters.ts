import { BookingSource, ReservationStatus, PaymentStatus } from '@prisma/client';

export interface UnifiedReservationInput {
  // Guest Identity
  guestName: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string;
  idNumber?: string | null;
  passportNumber?: string | null;
  idType?: string | null;
  photoUrl?: string | null;
  livePhotoReference?: string | null;
  consentStatus?: boolean;

  // Reservation Core
  roomNumber?: string;
  roomTypeName?: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  adults?: number;
  children?: number;
  totalAmount?: number;
  paidAmount?: number;
  currency?: string;
  status?: ReservationStatus;
  paymentStatus?: PaymentStatus;
  source: BookingSource;
  externalBookingId?: string | null;
  specialRequests?: string | null;
  internalNotes?: string | null;

  // Source Metadata
  whatsappThreadId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  createdBy?: string | null;
  isInstantCheckIn?: boolean;
}

/**
 * Normalizes Direct Website Booking payloads
 */
export function normalizeWebsiteBooking(payload: any): UnifiedReservationInput {
  return {
    guestName: payload.guestName || payload.name || 'Website Guest',
    email: payload.email?.trim() || null,
    phone: payload.phoneNumber || payload.phone || null,
    nationality: payload.nationality || 'Nepal',
    idNumber: payload.idNumber || payload.passportNumber || null,
    passportNumber: payload.passportNumber || payload.idNumber || null,
    idType: payload.idType || 'Passport',
    roomNumber: payload.roomNumber,
    roomTypeName: payload.roomType || payload.roomTypeName,
    checkInDate: payload.checkInDate,
    checkOutDate: payload.checkOutDate,
    adults: Number(payload.adults) || 1,
    children: Number(payload.children) || 0,
    totalAmount: payload.totalAmount ? Number(payload.totalAmount) : undefined,
    paidAmount: payload.paidAmount ? Number(payload.paidAmount) : 0,
    currency: payload.currency || 'NPR',
    source: BookingSource.WEBSITE,
    externalBookingId: payload.bookingId || payload.externalBookingId || null,
    specialRequests: payload.specialRequests || null,
    internalNotes: payload.internalNotes || null,
    utmSource: payload.utm_source || payload.utmSource || null,
    utmMedium: payload.utm_medium || payload.utmMedium || null,
    utmCampaign: payload.utm_campaign || payload.utmCampaign || null,
    utmContent: payload.utm_content || payload.utmContent || null,
    gclid: payload.gclid || null,
    fbclid: payload.fbclid || null,
    createdBy: 'Website Direct Booking Engine',
  };
}

/**
 * Normalizes WhatsApp Bot / Conversation Booking payloads
 */
export function normalizeWhatsAppBooking(payload: any): UnifiedReservationInput {
  return {
    guestName: payload.guestName || payload.profileName || 'WhatsApp Guest',
    email: payload.email || null,
    phone: payload.phone || payload.from || payload.senderPhone,
    nationality: payload.nationality || 'International',
    roomNumber: payload.roomNumber,
    roomTypeName: payload.roomType || payload.roomTypeName,
    checkInDate: payload.checkInDate,
    checkOutDate: payload.checkOutDate,
    adults: Number(payload.adults) || 1,
    children: Number(payload.children) || 0,
    totalAmount: payload.totalAmount ? Number(payload.totalAmount) : undefined,
    paidAmount: payload.paidAmount ? Number(payload.paidAmount) : 0,
    currency: payload.currency || 'NPR',
    source: BookingSource.WHATSAPP,
    externalBookingId: payload.messageId || payload.threadId || `WA-${Date.now()}`,
    whatsappThreadId: payload.threadId || payload.conversationId || payload.phone,
    specialRequests: payload.specialRequests || payload.notes || 'Booked via WhatsApp concierge',
    createdBy: 'WhatsApp Automated Bot',
  };
}

/**
 * Normalizes OTA webhooks (Booking.com, Agoda, Airbnb, etc.)
 */
export function normalizeOtaBooking(payload: any, channel: string): UnifiedReservationInput {
  const channelUpper = channel.toUpperCase().replace(/[\.\s]/g, '_');
  let sourceEnum: BookingSource = BookingSource.BOOKING_COM;
  if (channelUpper.includes('AGODA')) sourceEnum = BookingSource.AGODA;
  else if (channelUpper.includes('AIRBNB')) sourceEnum = BookingSource.AIRBNB;
  else if (channelUpper.includes('EXPEDIA')) sourceEnum = BookingSource.EXPEDIA;
  else if (channelUpper.includes('TRIP')) sourceEnum = BookingSource.TRIP_COM;
  else if (channelUpper.includes('VRBO')) sourceEnum = BookingSource.VRBO;

  const otaRef = payload.otaReference || payload.reservation_id || payload.booking_number || payload.code || `OTA-${Date.now()}`;

  return {
    guestName: payload.guestName || payload.guest_name || `${channel} Guest`,
    email: payload.email || payload.guest_email || null,
    phone: payload.phone || payload.guest_phone || null,
    nationality: payload.nationality || 'International',
    idNumber: payload.passportNumber || payload.idNumber || null,
    passportNumber: payload.passportNumber || null,
    roomNumber: payload.roomNumber || payload.room_number,
    roomTypeName: payload.roomType || payload.room_type,
    checkInDate: payload.checkInDate || payload.start_date || payload.checkin,
    checkOutDate: payload.checkOutDate || payload.end_date || payload.checkout,
    adults: Number(payload.adults || payload.number_of_guests) || 2,
    children: Number(payload.children) || 0,
    totalAmount: payload.totalAmount ? Number(payload.totalAmount) : Number(payload.total_price || payload.payout_price || 0),
    paidAmount: payload.paidAmount !== undefined ? Number(payload.paidAmount) : Number(payload.totalAmount || payload.total_price || 0),
    currency: payload.currency || 'NPR',
    source: sourceEnum,
    externalBookingId: String(otaRef),
    specialRequests: payload.specialRequests || payload.notes || `Channel Webhook Booking: ${channel}`,
    internalNotes: `OTA Channel Sync [${channel}] Reference: ${otaRef}`,
    createdBy: `OTA Sync Adapter (${channel})`,
  };
}

/**
 * Normalizes Front Desk Phone Booking
 */
export function normalizePhoneBooking(payload: any, staffUserId?: string): UnifiedReservationInput {
  return {
    guestName: payload.guestName || 'Phone Inquirer',
    phone: payload.phone,
    email: payload.email || null,
    nationality: payload.nationality || 'Nepal',
    roomNumber: payload.roomNumber,
    roomTypeName: payload.roomTypeName || payload.roomType,
    checkInDate: payload.checkInDate,
    checkOutDate: payload.checkOutDate,
    adults: Number(payload.adults) || 1,
    children: Number(payload.children) || 0,
    totalAmount: payload.totalAmount ? Number(payload.totalAmount) : undefined,
    paidAmount: payload.paidAmount ? Number(payload.paidAmount) : 0,
    currency: payload.currency || 'NPR',
    source: BookingSource.PHONE,
    externalBookingId: `PH-${Date.now()}`,
    specialRequests: payload.specialRequests || null,
    internalNotes: payload.internalNotes || null,
    createdBy: staffUserId || 'Front Desk Staff',
  };
}

/**
 * Normalizes Front Desk Walk-In Booking
 */
export function normalizeWalkInBooking(payload: any, staffUserId?: string): UnifiedReservationInput {
  return {
    guestName: payload.guestName || 'Walk-In Guest',
    phone: payload.phone,
    email: payload.email || null,
    nationality: payload.nationality || 'Nepal',
    idType: payload.idType || 'Citizenship (नागरिकता)',
    idNumber: payload.idNumber,
    passportNumber: payload.passportNumber || payload.idNumber,
    photoUrl: payload.photoUrl || null,
    livePhotoReference: payload.livePhotoReference || payload.photoUrl || null,
    consentStatus: Boolean(payload.consentStatus),
    roomNumber: payload.roomNumber,
    roomTypeName: payload.roomTypeName || payload.roomType,
    checkInDate: payload.checkInDate || new Date(),
    checkOutDate: payload.checkOutDate,
    adults: Number(payload.adults) || 1,
    children: Number(payload.children) || 0,
    totalAmount: payload.totalAmount ? Number(payload.totalAmount) : undefined,
    paidAmount: payload.paidAmount ? Number(payload.paidAmount) : 0,
    currency: payload.currency || 'NPR',
    source: BookingSource.WALK_IN,
    externalBookingId: `WI-${Date.now()}`,
    specialRequests: payload.specialRequests || null,
    internalNotes: payload.internalNotes || 'Walk-In registration verified by Front Desk',
    createdBy: staffUserId || 'Front Desk Receptionist',
    isInstantCheckIn: true,
  };
}
