import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export interface BookingEmailData {
  id: string;
  guestName: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  roomNumber: string;
  roomType: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  adults?: number;
  children?: number;
  totalAmount: number;
  paidAmount?: number;
  source?: string;
  specialRequests?: string | null;
  otaReference?: string | null;
}

export async function getHotelSettings() {
  try {
    let setting = await prisma.hotelSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await prisma.hotelSetting.create({
        data: {
          id: 'default',
          hotelName: 'Hotel Sherpa Soul',
          officialEmail: process.env.HOTEL_OFFICIAL_EMAIL || 'info@hotelsherpasoul.com',
          managerEmail: process.env.HOTEL_MANAGER_EMAIL || 'manager@hotelsherpasoul.com',
          phone: '+977-1-4530311 / 9851068219',
          address: 'Bhagawati Marg -26, Thamel, Kathmandu, Nepal',
          notifyOnBooking: true,
          notifyGuestOnBooking: true,
          notifyOnRoomFull: true,
        },
      });
    }

    return setting;
  } catch (err) {
    console.warn('Error reading hotel settings, using defaults:', err);
    return {
      id: 'default',
      hotelName: 'Hotel Sherpa Soul',
      officialEmail: process.env.HOTEL_OFFICIAL_EMAIL || 'info@hotelsherpasoul.com',
      managerEmail: process.env.HOTEL_MANAGER_EMAIL || 'manager@hotelsherpasoul.com',
      phone: '+977-1-4530311 / 9851068219',
      address: 'Bhagawati Marg -26, Thamel, Kathmandu, Nepal',
      notifyOnBooking: true,
      notifyGuestOnBooking: true,
      notifyOnRoomFull: true,
      smtpHost: process.env.SMTP_HOST || null,
      smtpPort: Number(process.env.SMTP_PORT) || 587,
      smtpUser: process.env.SMTP_USER || null,
      smtpPass: process.env.SMTP_PASS || null,
      smtpSecure: process.env.SMTP_SECURE === 'true',
    };
  }
}

function getMailTransporter(settings: any) {
  const host = settings.smtpHost || process.env.SMTP_HOST;
  const user = settings.smtpUser || process.env.SMTP_USER;
  const pass = settings.smtpPass || process.env.SMTP_PASS;
  const port = Number(settings.smtpPort || process.env.SMTP_PORT) || 587;
  const secure = Boolean(settings.smtpSecure || process.env.SMTP_SECURE === 'true');

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  // Fallback / simulation transporter if SMTP credentials aren't set in environment
  return null;
}

/**
 * Sends a rich, instant booking notification to the Hotel's Official Email
 */
export async function sendBookingNotificationToOfficialMail(booking: BookingEmailData) {
  const settings = await getHotelSettings();
  if (!settings.notifyOnBooking) {
    console.log('[EmailService] Booking notifications to official mail are disabled in settings.');
    return { success: true, skipped: true };
  }

  const officialEmail = settings.officialEmail || 'info@hotelsherpasoul.com';
  const startStr = typeof booking.checkInDate === 'string' 
    ? booking.checkInDate.split('T')[0] 
    : booking.checkInDate.toISOString().split('T')[0];
  const endStr = typeof booking.checkOutDate === 'string' 
    ? booking.checkOutDate.split('T')[0] 
    : booking.checkOutDate.toISOString().split('T')[0];

  const nights = Math.max(
    1,
    Math.round((new Date(endStr).getTime() - new Date(startStr).getTime()) / (1000 * 60 * 60 * 24))
  );

  const balanceDue = Math.max(0, booking.totalAmount - (booking.paidAmount || 0));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pms.hotelsherpasoul.com';
  const reservationUrl = `${appUrl}/reservations`;

  const subject = `🏨 [New Booking Alert] ${booking.guestName} - ${booking.roomType} (Room ${booking.roomNumber}) | NPR ${booking.totalAmount.toLocaleString()}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #f8fafc; }
        .header p { margin: 0; font-size: 13px; color: #93c5fd; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; background: #22c55e; color: #ffffff; }
        .content { padding: 24px; }
        .section-title { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 18px 0 10px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; }
        .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .detail-table td { padding: 8px 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
        .detail-table td.label { font-weight: 600; color: #64748b; width: 40%; }
        .detail-table td.val { font-weight: 700; color: #0f172a; }
        .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; margin: 16px 0; text-align: center; }
        .highlight-box .amount { font-size: 22px; font-weight: 900; color: #15803d; }
        .highlight-box .balance { font-size: 12px; color: #166534; margin-top: 4px; }
        .cta-btn { display: inline-block; width: 100%; box-sizing: border-box; background: #2563eb; color: #ffffff !important; text-align: center; padding: 14px 20px; font-size: 14px; font-weight: 700; border-radius: 12px; text-decoration: none; margin-top: 16px; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Hotel Sherpa Soul, Thamel</h1>
          <p>नयाँ बुकिङ सूचना (New Reservation Notification)</p>
          <span class="badge">${booking.source || 'Direct Website'}</span>
        </div>

        <div class="content">
          <p style="font-size: 14px; margin-top: 0; color: #334155;">
            नमस्ते! हाम्रो वेबसाइट / PMS मार्फत नयाँ कोठा बुकिङ प्राप्त भएको छ। विवरण निम्नानुसार छ:
          </p>

          <div class="section-title">👤 पाहुनाको विवरण (Guest Details)</div>
          <table class="detail-table">
            <tr><td class="label">पाहुनाको नाम:</td><td class="val">${booking.guestName}</td></tr>
            <tr><td class="label">सम्पर्क नम्बर:</td><td class="val">${booking.phone || 'उपलब्ध छैन'}</td></tr>
            <tr><td class="label">इमेल:</td><td class="val">${booking.email || 'उपलब्ध छैन'}</td></tr>
            <tr><td class="label">राष्ट्रियता:</td><td class="val">${booking.nationality || 'Nepal'}</td></tr>
          </table>

          <div class="section-title">🛏️ कोठा र बसाइ विवरण (Stay Details)</div>
          <table class="detail-table">
            <tr><td class="label">कोठा क्याटागोरी:</td><td class="val">${booking.roomType}</td></tr>
            <tr><td class="label">कोठा नम्बर:</td><td class="val">Room ${booking.roomNumber}</td></tr>
            <tr><td class="label">चेक-इन मिति:</td><td class="val">${startStr}</td></tr>
            <tr><td class="label">चेक-आउट मिति:</td><td class="val">${endStr}</td></tr>
            <tr><td class="label">अवधि (Nights):</td><td class="val">${nights} रात (Nights)</td></tr>
            <tr><td class="label">पाहुना संख्या:</td><td class="val">${booking.adults || 1} बालिग (Adults), ${booking.children || 0} बालबालिका</td></tr>
            ${booking.specialRequests ? `<tr><td class="label">विशेष अनुरोध:</td><td class="val">${booking.specialRequests}</td></tr>` : ''}
          </table>

          <div class="highlight-box">
            <div style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 700; margin-bottom: 2px;">कुल बुकिङ रकम (Total Amount)</div>
            <div class="amount">NPR ${booking.totalAmount.toLocaleString()}</div>
            <div class="balance">
              भुक्तानी भएको: <b>NPR ${(booking.paidAmount || 0).toLocaleString()}</b> | 
              बाँकी बक्यौता: <b>NPR ${balanceDue.toLocaleString()}</b>
            </div>
          </div>

          <a href="${reservationUrl}" class="cta-btn">
            ड्यासबोर्डमा यो बुकिङ खोल्नुहोस् (Open in PMS)
          </a>
        </div>

        <div class="footer">
          Hotel Sherpa Soul PMS • Bhagawati Marg -26, Thamel, Kathmandu • Phone: +977-1-4530311 / 9851068219<br>
          यो सन्देश आधिकारिक होटल इमेल (${officialEmail}) मा स्वचालित रूपमा पठाइएको हो।
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
[HOTEL SHERPA SOUL - NEW BOOKING NOTIFICATION]
A new booking has been created on the website/PMS!

Guest Name: ${booking.guestName}
Phone: ${booking.phone || 'N/A'}
Email: ${booking.email || 'N/A'}
Nationality: ${booking.nationality || 'Nepal'}

Room: Room ${booking.roomNumber} (${booking.roomType})
Check-in: ${startStr}
Check-out: ${endStr} (${nights} nights)
Guests: ${booking.adults || 1} adults, ${booking.children || 0} children
Source: ${booking.source || 'Direct Website'}

Total Amount: NPR ${booking.totalAmount.toLocaleString()}
Paid Amount: NPR ${(booking.paidAmount || 0).toLocaleString()}
Balance Due: NPR ${balanceDue.toLocaleString()}

PMS Link: ${reservationUrl}
  `.trim();

  const transporter = getMailTransporter(settings);

  let deliveryStatus = 'Simulated / Logged';
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${settings.hotelName}" <${settings.smtpUser || officialEmail}>`,
        to: officialEmail,
        replyTo: booking.email || officialEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      deliveryStatus = `Delivered to ${officialEmail} via SMTP`;
    } catch (err: any) {
      console.warn('[EmailService] SMTP send error:', err);
      deliveryStatus = `SMTP Failed: ${err.message}`;
    }
  } else {
    console.log(`[EmailService Simulated to ${officialEmail}]: ${subject}`);
    deliveryStatus = `Simulated (Official Email: ${officialEmail})`;
  }

  // Record in-app notification in PMS
  await prisma.notification.create({
    data: {
      title: `📧 Email Alert: New Booking (${booking.guestName})`,
      detail: `कोठा ${booking.roomNumber} (${booking.roomType}) को नयाँ बुकिङ अफिसियल इमेल (${officialEmail}) मा पठाइयो [${deliveryStatus}]।`,
      type: 'Booking',
      channel: 'Email',
      status: 'Delivered',
    },
  }).catch((err) => console.warn('Notification log error:', err));

  return {
    success: true,
    deliveryStatus,
    officialEmail,
    subject,
  };
}

/**
 * Sends a welcome confirmation voucher to the guest's email
 */
export async function sendBookingConfirmationToGuest(booking: BookingEmailData) {
  if (!booking.email || !booking.email.includes('@')) {
    return { success: false, reason: 'No valid guest email' };
  }

  const settings = await getHotelSettings();
  if (!settings.notifyGuestOnBooking) {
    return { success: true, skipped: true };
  }

  const officialEmail = settings.officialEmail || 'info@hotelsherpasoul.com';
  const startStr = typeof booking.checkInDate === 'string' 
    ? booking.checkInDate.split('T')[0] 
    : booking.checkInDate.toISOString().split('T')[0];
  const endStr = typeof booking.checkOutDate === 'string' 
    ? booking.checkOutDate.split('T')[0] 
    : booking.checkOutDate.toISOString().split('T')[0];

  const subject = `Confirmation: Your Stay at Hotel Sherpa Soul, Thamel (${startStr} to ${endStr})`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0 0 6px 0; font-size: 20px;">Hotel Sherpa Soul</h1>
          <p style="margin: 0; color: #93c5fd; font-size: 13px;">Thamel, Kathmandu, Nepal</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="font-size: 16px; margin-top: 0; color: #0f172a;">Namaste & Tashi Delek, ${booking.guestName}! 🙏</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #475569;">
            Thank you for choosing Hotel Sherpa Soul. Your reservation for <b>${booking.roomType} (Room ${booking.roomNumber})</b> is confirmed!
          </p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><b>Check-in Date:</b> ${startStr} (From 01:00 PM)</p>
            <p style="margin: 4px 0;"><b>Check-out Date:</b> ${endStr} (Until 11:00 AM)</p>
            <p style="margin: 4px 0;"><b>Total Amount:</b> NPR ${booking.totalAmount.toLocaleString()}</p>
            <p style="margin: 4px 0;"><b>High-Speed WiFi:</b> SherpaSoul-Guest (Password: <i>sherpa2026</i>)</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Location: Bhagawati Marg -26, Thamel (Near Chhaya Center). 
            If you need airport transfer or assistance, WhatsApp us anytime at <b>${settings.phone}</b>.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Hotel Sherpa Soul • Email: ${officialEmail} • Phone: ${settings.phone}
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getMailTransporter(settings);
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${settings.hotelName}" <${settings.smtpUser || officialEmail}>`,
        to: booking.email,
        replyTo: officialEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, delivered: true, to: booking.email };
    } catch (e: any) {
      console.warn('[EmailService] Guest email send failed:', e);
      return { success: false, error: e.message };
    }
  }

  console.log(`[EmailService Simulated to Guest ${booking.email}]: ${subject}`);
  return { success: true, simulated: true, to: booking.email };
}
