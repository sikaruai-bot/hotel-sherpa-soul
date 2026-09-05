/**
 * SMS & WhatsApp Automation Adapter for Hotel Sherpa Soul PMS
 * Ready to integrate with Sparrow SMS (Nepal), Aakash SMS, and WhatsApp Cloud API
 */

export interface MessageTemplateOptions {
  guestName: string;
  roomNumber: string;
  totalAmount?: number;
  paidAmount?: number;
  checkOutDate?: string;
  invoiceId?: string;
}

export const automationTemplates = {
  // 1. WhatsApp / SMS on Check-in
  checkInWelcome: (opts: MessageTemplateOptions) =>
    `Namaste ${opts.guestName}! 🙏 Welcome to Hotel Sherpa Soul, Thamel. Your Room ${opts.roomNumber} is ready. Free high-speed WiFi: 'SherpaSoul-Guest' (Password: sherpa2026). Reception: dial 0. Enjoy your stay!`,

  // 2. WhatsApp / SMS on Checkout & Bill Receipt
  checkOutReceipt: (opts: MessageTemplateOptions) =>
    `Thank you for staying at Hotel Sherpa Soul, ${opts.guestName}! Your bill ${opts.invoiceId || ''} of NPR ${opts.paidAmount?.toLocaleString() || 0} is settled. Safe travels and Tashi Delek!`,

  // 3. Automated Housekeeping Notification
  housekeepingAlert: (roomNumber: string, type = 'Turnover Clean') =>
    `[HOUSEKEEPING ALERT] Room ${roomNumber} is vacated and needs ${type}. Please inspect and update status in PMS.`,
};

/**
 * Send SMS using Nepal's Sparrow SMS API or mock
 */
export async function sendSparrowSms(mobile: string, text: string) {
  const token = process.env.SPARROW_SMS_TOKEN;
  const sender = process.env.SPARROW_SMS_IDENTITY || 'SherpaSoul';

  if (!token) {
    console.log(`[SMS Simulation to ${mobile}]: ${text}`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch('http://api.sparrowsms.com/v2/sms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        from: sender,
        to: mobile,
        text,
      }),
    });
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Send WhatsApp Template Message using Meta Cloud API
 */
export async function sendWhatsAppMessage(phone: string, text: string) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.log(`[WhatsApp Simulation to ${phone}]: ${text}`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: text },
      }),
    });
    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
