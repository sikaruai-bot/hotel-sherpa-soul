import { prisma } from './prisma';
import { CommunicationChannel, MessageStatus, MessageDirection } from '@prisma/client';
import { sendBookingConfirmationToGuest, sendBookingNotificationToOfficialMail } from './emailService';
import { sendWhatsAppMessage, sendSparrowSms } from './smsWhatsappAdapter';
import { randomUUID } from 'crypto';

export interface DispatchMessageInput {
  reservationId?: string | null;
  guestId?: string | null;
  channel: CommunicationChannel;
  templateName: string;
  recipient: string; // phone or email
  sender?: string;
  subject?: string;
  templateData: Record<string, any>;
  requiresStaffAction?: boolean;
}

export const COMMUNICATION_TEMPLATES: Record<string, (d: any) => { subject: string; body: string; plainText: string }> = {
  // 1. Booking Confirmation
  BOOKING_CONFIRMATION: (d) => ({
    subject: `Booking Confirmed: #${d.reservationNumber} - Hotel Sherpa Soul, Kathmandu`,
    body: `Namaste ${d.guestName}! Your stay at Hotel Sherpa Soul is confirmed. Room: ${d.roomNumber} (${d.roomType}), Check-In: ${d.checkInDate}, Check-Out: ${d.checkOutDate}. Total: NPR ${Number(d.totalAmount).toLocaleString()}. We look forward to welcoming you to Thamel!`,
    plainText: `Namaste ${d.guestName}! Your booking #${d.reservationNumber} is confirmed at Hotel Sherpa Soul for ${d.checkInDate} to ${d.checkOutDate}. Room ${d.roomNumber}. Welcome!`,
  }),

  // 2. Booking Modification
  BOOKING_MODIFICATION: (d) => ({
    subject: `Booking Updated: #${d.reservationNumber} - Hotel Sherpa Soul`,
    body: `Dear ${d.guestName}, your reservation #${d.reservationNumber} has been updated. New Dates: ${d.checkInDate} to ${d.checkOutDate}, Room: ${d.roomNumber}. Total Balance Due: NPR ${Number(d.dueAmount || 0).toLocaleString()}.`,
    plainText: `Booking #${d.reservationNumber} updated: ${d.checkInDate} to ${d.checkOutDate}. Room ${d.roomNumber}. Total Due: NPR ${d.dueAmount || 0}.`,
  }),

  // 3. Cancellation Confirmation
  BOOKING_CANCELLATION: (d) => ({
    subject: `Booking Cancelled: #${d.reservationNumber} - Hotel Sherpa Soul`,
    body: `Dear ${d.guestName}, your reservation #${d.reservationNumber} has been cancelled per your request. Reason: ${d.cancellationReason || 'Standard cancellation'}. Hope to host you another time in Kathmandu!`,
    plainText: `Booking #${d.reservationNumber} has been cancelled. Hope to see you next time in Nepal!`,
  }),

  // 4. Payment Receipt
  PAYMENT_RECEIPT: (d) => ({
    subject: `Payment Receipt: NPR ${Number(d.amount).toLocaleString()} - Hotel Sherpa Soul`,
    body: `Thank you ${d.guestName}! We have received your payment of NPR ${Number(d.amount).toLocaleString()} via ${d.paymentMethod} (Txn: ${d.transactionId || 'PMS'}). Remaining Due: NPR ${Number(d.remainingDue || 0).toLocaleString()}.`,
    plainText: `Payment received: NPR ${Number(d.amount).toLocaleString()} via ${d.paymentMethod}. Remaining due: NPR ${d.remainingDue || 0}.`,
  }),

  // 5. Payment Due Reminder
  PAYMENT_DUE_REMINDER: (d) => ({
    subject: `Payment Reminder for Booking #${d.reservationNumber} - Hotel Sherpa Soul`,
    body: `Dear ${d.guestName}, this is a gentle reminder that your reservation has a pending balance of NPR ${Number(d.dueAmount).toLocaleString()}. Please settle online or upon arrival at front desk.`,
    plainText: `Gentle reminder: NPR ${Number(d.dueAmount).toLocaleString()} is pending for booking #${d.reservationNumber}. Settle at desk or online.`,
  }),

  // 6. Check-in Reminder (72h / 48h)
  CHECKIN_REMINDER_72H: (d) => ({
    subject: `Your upcoming stay in Kathmandu in 3 days! - Hotel Sherpa Soul`,
    body: `Namaste ${d.guestName}! We are preparing for your arrival on ${d.checkInDate}. Please let us know your flight details or arrival time so our front desk is ready for you.`,
    plainText: `Namaste ${d.guestName}! 3 days until your stay at Hotel Sherpa Soul on ${d.checkInDate}. Let us know your arrival time!`,
  }),

  // 7. Self-Check-In Instruction & QR Link (24h)
  SELF_CHECKIN_INSTRUCTION: (d) => ({
    subject: `Your Contactless Self Check-In Pass - Hotel Sherpa Soul`,
    body: `Skip the front desk queue! Complete your check-in and access your room digital key pass here: ${d.selfCheckinUrl}. Token valid for 24 hours.`,
    plainText: `Fast Check-In Pass for Hotel Sherpa Soul: ${d.selfCheckinUrl}. Room ${d.roomNumber}. Enjoy your stay!`,
  }),

  // 8. Hotel Location & Arrival Map (6h)
  HOTEL_LOCATION_MAP: (d) => ({
    subject: `Directions & Front Desk Contacts - Hotel Sherpa Soul, Thamel`,
    body: `We are ready to welcome you today! Hotel Sherpa Soul is located on Bhagawati Marg -26, Thamel, Kathmandu. Google Maps: https://maps.google.com/?q=Hotel+Sherpa+Soul+Thamel. Reception 24/7 Hotline: +977 9801234567.`,
    plainText: `Arriving today? Hotel Sherpa Soul is on Bhagawati Marg -26, Thamel. Google Maps: https://maps.google.com/?q=Hotel+Sherpa+Soul+Thamel. Phone: +977 9801234567.`,
  }),

  // 9. Airport Pickup Confirmation
  AIRPORT_PICKUP_CONFIRMATION: (d) => ({
    subject: `Tribhuvan International Airport (TIA) Pickup Confirmed - Hotel Sherpa Soul`,
    body: `Dear ${d.guestName}, our driver will meet you outside TIA International Arrivals with a 'Hotel Sherpa Soul' placard. Flight: ${d.flightNumber || 'Scheduled'}, Pickup Time: ${d.pickupTime || 'Flight Arrival'}. Driver contact: +977 9801234567.`,
    plainText: `TIA Airport Pickup Confirmed for ${d.guestName}! Driver waiting outside arrivals with Hotel Sherpa Soul sign. Phone: +977 9801234567.`,
  }),

  // 10. Wi-Fi & Hotel Guide (On Check-In)
  WIFI_HOTEL_GUIDE: (d) => ({
    subject: `Welcome to Room ${d.roomNumber}! Wi-Fi & Guest Directory - Hotel Sherpa Soul`,
    body: `Welcome to Hotel Sherpa Soul, ${d.guestName}! Free High-Speed Fiber Wi-Fi: 'SherpaSoul-Guest' (Password: sherpa2026). Breakfast: 7:00 AM - 10:30 AM. Front desk dial 0. Tashi Delek!`,
    plainText: `Welcome to Room ${d.roomNumber}! Wi-Fi: 'SherpaSoul-Guest' (Password: sherpa2026). Front desk dial 0. Enjoy Kathmandu!`,
  }),

  // 11. Checkout Invoice & Farewell
  CHECKOUT_INVOICE: (d) => ({
    subject: `Thank you for staying with us! - Official Tax Invoice - Hotel Sherpa Soul`,
    body: `Thank you for visiting Kathmandu and choosing Hotel Sherpa Soul, ${d.guestName}! Your bill of NPR ${Number(d.paidAmount).toLocaleString()} is settled in full. Safe travels on your onward journey!`,
    plainText: `Thank you for staying at Hotel Sherpa Soul, ${d.guestName}! Your bill of NPR ${Number(d.paidAmount).toLocaleString()} is settled. Safe travels!`,
  }),

  // 12. Review Request (24h post-checkout)
  REVIEW_REQUEST: (d) => ({
    subject: `How was your stay at Hotel Sherpa Soul, ${d.guestName}?`,
    body: `Namaste ${d.guestName}, we hope you enjoyed your time with us in Kathmandu! As a family-run Sherpa boutique hotel, your honest review means the world to our team. Could you take 1 minute to review us? Review Link: https://g.page/r/hotelsherpasoul/review. Dhanyabad!`,
    plainText: `Namaste ${d.guestName}! Hope you enjoyed your stay at Hotel Sherpa Soul. Please leave us a quick Google review: https://g.page/r/hotelsherpasoul/review. Dhanyabad!`,
  }),

  // 13. Failed Payment
  FAILED_PAYMENT: (d) => ({
    subject: `Payment Unsuccessful: Booking #${d.reservationNumber} - Hotel Sherpa Soul`,
    body: `Dear ${d.guestName}, your recent payment attempt for booking #${d.reservationNumber} could not be processed. Please try again or pay at the reception upon arrival.`,
    plainText: `Payment unsuccessful for booking #${d.reservationNumber}. Please try another card or settle at desk.`,
  }),

  // 14. Staff Manual Follow-Up
  STAFF_MANUAL_FOLLOWUP: (d) => ({
    subject: `Action Required: Guest Inquiry / Follow-up - Hotel Sherpa Soul`,
    body: `Staff Notice: Guest ${d.guestName} (${d.phone || d.email}) requested assistance regarding: ${d.detail}. Assigned to: ${d.assignedStaff || 'Front Desk'}.`,
    plainText: `[STAFF ALERT] Guest ${d.guestName} needs follow-up: ${d.detail}. Assigned: ${d.assignedStaff || 'Front Desk'}.`,
  }),
};

/**
 * Dispatches an automated communication via Email, WhatsApp, or SMS, and records it in UnifiedMessage
 */
export async function dispatchAutomatedMessage(input: DispatchMessageInput) {
  const templateFn = COMMUNICATION_TEMPLATES[input.templateName];
  if (!templateFn) {
    throw new Error(`Unknown communication template: ${input.templateName}`);
  }

  const { subject, body, plainText } = templateFn(input.templateData);
  const messageId = `msg_${randomUUID().replace(/-/g, '')}`;

  let status: MessageStatus = MessageStatus.PENDING;
  let providerMsgId: string | null = null;
  let errorMessage: string | null = null;

  try {
    if (input.channel === CommunicationChannel.WHATSAPP) {
      const res = await sendWhatsAppMessage(input.recipient, plainText);
      if (res.success) {
        status = MessageStatus.DELIVERED;
        providerMsgId = res.data?.messages?.[0]?.id || 'MOCK_WA_DELIVERED';
      } else {
        status = MessageStatus.FAILED;
        errorMessage = res.error || 'WhatsApp delivery failed';
      }
    } else if (input.channel === CommunicationChannel.EMAIL) {
      if (input.templateName === 'BOOKING_CONFIRMATION') {
        await sendBookingConfirmationToGuest({
          id: input.reservationId || 'N/A',
          guestName: input.templateData.guestName,
          email: input.recipient,
          phone: input.templateData.phone,
          roomNumber: input.templateData.roomNumber,
          roomType: input.templateData.roomType,
          checkInDate: new Date(input.templateData.checkInDate),
          checkOutDate: new Date(input.templateData.checkOutDate),
          totalAmount: Number(input.templateData.totalAmount || 0),
        });
      }
      status = MessageStatus.DELIVERED;
      providerMsgId = 'SMTP_SENT';
    } else if (input.channel === CommunicationChannel.SMS) {
      const res = await sendSparrowSms(input.recipient, plainText);
      if (res.success) {
        status = MessageStatus.DELIVERED;
        providerMsgId = res.data?.response || 'MOCK_SMS_DELIVERED';
      } else {
        status = MessageStatus.FAILED;
        errorMessage = res.error || 'SMS delivery failed';
      }
    } else {
      status = MessageStatus.DELIVERED;
    }
  } catch (err: any) {
    status = MessageStatus.FAILED;
    errorMessage = err.message || 'Dispatch failed';
  }

  // Record in UnifiedMessage table for unified inbox and audit
  const log = await prisma.unifiedMessage.create({
    data: {
      messageId,
      reservationId: input.reservationId || null,
      guestId: input.guestId || null,
      channel: input.channel,
      direction: MessageDirection.OUTBOUND,
      templateName: input.templateName,
      sender: input.sender || 'Hotel Sherpa Soul Automation',
      recipient: input.recipient,
      subject: input.subject || subject,
      content: body,
      status,
      providerMessageId: providerMsgId,
      errorMessage,
      requiresStaffAction: Boolean(input.requiresStaffAction),
    },
  });

  return log;
}
