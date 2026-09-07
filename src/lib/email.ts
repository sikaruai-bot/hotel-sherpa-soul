import nodemailer from 'nodemailer';

export interface BookingEmailData {
  bookingNumber: string;
  categoryName: string;
  roomNumber?: string;
  floor?: number;
  checkIn: string | Date;
  checkOut: string | Date;
  nights: number;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestWhatsApp?: string;
  guestCountry?: string;
  specialRequests?: string;
  totalUSD: number;
  paymentStatus?: string;
}

export interface InquiryEmailData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

const DEFAULT_FROM = process.env.SMTP_FROM || 'Hotel Sherpa Soul <info@hotelsherpasoul.com>';
const HOTEL_OFFICIAL = process.env.HOTEL_OFFICIAL_EMAIL || 'info@hotelsherpasoul.com';
const HOTEL_ADMIN_CC = process.env.HOTEL_ADMIN_CC || 'mingmasaino@gmail.com';

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function sendBookingNotifications(data: BookingEmailData) {
  const transporter = getTransporter();
  const formattedCheckIn = formatDate(data.checkIn);
  const formattedCheckOut = formatDate(data.checkOut);

  if (!transporter) {
    console.warn(
      `[Email Service] SMTP credentials not configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASSWORD). ` +
      `Booking #${data.bookingNumber} saved to database, but automated email was not dispatched.`
    );
    return { success: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const hotelHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #f8fafc; padding: 24px; color: #1e293b;">
      <div style="background-color: #0B192C; padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0 0 6px 0; font-size: 24px; letter-spacing: 1px;">HOTEL SHERPA SOUL</h1>
        <p style="color: #94a3b8; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Front Desk &amp; PMS Alert</p>
      </div>

      <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; border-top: none;">
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; margin-bottom: 24px; border-radius: 4px;">
          <h2 style="color: #15803d; margin: 0 0 4px 0; font-size: 18px;">New Direct Website Reservation!</h2>
          <p style="margin: 0; color: #166534; font-size: 14px;">Booking Reference: <strong>#${data.bookingNumber}</strong></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 40%;">Guest Name:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${data.guestName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Guest Email:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;"><a href="mailto:${data.guestEmail}" style="color: #2563eb; text-decoration: none;">${data.guestEmail}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Phone / WhatsApp:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">
              <a href="https://wa.me/${(data.guestWhatsApp || data.guestPhone).replace(/[^0-9]/g, '')}" style="color: #16a34a; text-decoration: none;">${data.guestWhatsApp || data.guestPhone} (Open WhatsApp)</a>
            </td>
          </tr>
          ${data.guestCountry ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Nationality:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${data.guestCountry}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Room Category:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${data.categoryName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Allocated Physical Room:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #b45309; font-size: 15px;">Room ${data.roomNumber || 'Auto'} (Floor ${data.floor || '2/3'})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Stay Dates:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${formattedCheckIn} &rarr; ${formattedCheckOut} (${data.nights} night${data.nights > 1 ? 's' : ''})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Guests:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">${data.adults} Adults${data.children > 0 ? `, ${data.children} Children` : ''}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Total Amount:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #15803d; font-size: 17px;">$${data.totalUSD.toFixed(2)} USD</td>
          </tr>
          ${data.specialRequests ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; vertical-align: top;">Special Requests:</td>
            <td style="padding: 10px 0; color: #334155; font-style: italic;">"${data.specialRequests}"</td>
          </tr>` : ''}
        </table>

        <div style="text-align: center; margin-top: 28px;">
          <a href="https://hotelsherpasoul.com/admin/pms/reservations" style="display: inline-block; background-color: #0B192C; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-right: 12px;">Open PMS Dashboard</a>
          <a href="https://wa.me/${(data.guestWhatsApp || data.guestPhone).replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(data.guestName)},%20greetings%20from%20Hotel%20Sherpa%20Soul,%20Thamel.%20We%20received%20your%20booking%20#${data.bookingNumber}!" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Message Guest on WhatsApp</a>
        </div>
      </div>
    </div>
  `;

  const guestHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #f8fafc; padding: 24px; color: #1e293b;">
      <div style="background-color: #0B192C; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0 0 6px 0; font-size: 26px; letter-spacing: 1px;">HOTEL SHERPA SOUL</h1>
        <p style="color: #94a3b8; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Thamel, Kathmandu &bull; Nepal</p>
      </div>

      <div style="background-color: #ffffff; padding: 36px 28px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #0B192C; margin: 0 0 12px 0; font-size: 20px;">Namaste ${data.guestName},</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
          Thank you for choosing <strong>Hotel Sherpa Soul</strong>. Your direct reservation is confirmed with our <strong>Best Rate Guarantee</strong>! We look forward to welcoming you to the heart of Thamel.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 4px;">Reservation Number</div>
          <div style="font-size: 22px; font-weight: 700; color: #0B192C; margin-bottom: 16px;">#${data.bookingNumber}</div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Room Category:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.categoryName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Check-in:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${formattedCheckIn} (From 14:00)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Check-out:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${formattedCheckOut} (Until 12:00)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b;">Duration &amp; Guests:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.nights} Night${data.nights > 1 ? 's' : ''} &bull; ${data.adults} Adult${data.adults > 1 ? 's' : ''}${data.children > 0 ? `, ${data.children} Children` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 4px 0; font-weight: 600; color: #0f172a;">Total Price:</td>
              <td style="padding: 12px 0 4px 0; font-weight: 700; color: #16a34a; font-size: 18px; text-align: right;">$${data.totalUSD.toFixed(2)} USD</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 6px 0; color: #92400e; font-size: 14px;">Hotel Sherpa Soul Transparency Promise</h4>
          <p style="margin: 0; color: #b45309; font-size: 13px; line-height: 1.5;">
            <strong>No Restaurant. No Noise. Sleep Well.</strong> We specialize in quiet, peaceful sleep right in Thamel. Hundreds of top local &amp; international dining spots are within 2 minutes' walk.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px 0;"><strong>Need Airport Pickup or Have Questions?</strong></p>
          <p style="margin: 0 0 16px 0;">Chat with our 24/7 front desk team directly on WhatsApp or call us:</p>
          <div style="text-align: center;">
            <a href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20have%20a%20confirmed%20booking%20#${data.bookingNumber}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 12px;">WhatsApp Concierge: +977 9851068219</a>
          </div>
          <p style="margin: 12px 0 0 0; text-align: center; color: #94a3b8; font-size: 12px;">
            Hotel Sherpa Soul &bull; Chaksibari Marg, Thamel, Kathmandu &bull; Tel: +977-1 4530311
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const results = await Promise.allSettled([
      transporter.sendMail({
        from: DEFAULT_FROM,
        to: HOTEL_OFFICIAL,
        cc: HOTEL_ADMIN_CC,
        subject: `🛎️ New Direct Booking: #${data.bookingNumber} - ${data.guestName} (${data.categoryName})`,
        html: hotelHtml,
      }),
      transporter.sendMail({
        from: DEFAULT_FROM,
        to: data.guestEmail,
        subject: `Booking Confirmation - Hotel Sherpa Soul, Thamel (#${data.bookingNumber})`,
        html: guestHtml,
      }),
    ]);

    const hotelSuccess = results[0].status === 'fulfilled';
    const guestSuccess = results[1].status === 'fulfilled';

    if (!hotelSuccess) {
      console.error('[Email Service] Failed to send booking email to hotel:', (results[0] as PromiseRejectedResult).reason);
    }
    if (!guestSuccess) {
      console.error('[Email Service] Failed to send booking email to guest:', (results[1] as PromiseRejectedResult).reason);
    }

    return {
      success: hotelSuccess || guestSuccess,
      hotelDelivered: hotelSuccess,
      guestDelivered: guestSuccess,
    };
  } catch (e) {
    console.error('[Email Service] Error in sendBookingNotifications:', e);
    return { success: false, error: e };
  }
}

export async function sendInquiryNotification(data: InquiryEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email Service] SMTP not configured. Inquiry saved without email alert.');
    return { success: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; color: #1e293b;">
      <div style="background-color: #0B192C; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #D4AF37; margin: 0; font-size: 20px;">HOTEL SHERPA SOUL</h2>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">New Contact / Inquiry Message</p>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p><strong>From:</strong> ${data.name} &lt;<a href="mailto:${data.email}">${data.email}</a>&gt;</p>
        ${data.phone ? `<p><strong>Phone / WhatsApp:</strong> ${data.phone}</p>` : ''}
        <p><strong>Subject:</strong> ${data.subject || 'Direct Website Inquiry'}</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 16px 0;" />
        <p><strong>Message:</strong></p>
        <p style="background-color: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-style: italic; white-space: pre-line;">${data.message}</p>
        <div style="margin-top: 20px; text-align: center;">
          <a href="mailto:${data.email}?subject=Re:%20${encodeURIComponent(data.subject || 'Inquiry')}%20-%20Hotel%20Sherpa%20Soul" style="display: inline-block; background-color: #0B192C; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Reply to Guest</a>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: DEFAULT_FROM,
      to: HOTEL_OFFICIAL,
      cc: HOTEL_ADMIN_CC,
      subject: `📩 New Website Inquiry: ${data.name} - ${data.subject || 'General Inquiry'}`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('[Email Service] Failed to send inquiry alert email:', err);
    return { success: false, error: err };
  }
}
