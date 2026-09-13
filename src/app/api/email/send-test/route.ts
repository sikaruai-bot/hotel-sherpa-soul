import { NextResponse } from 'next/server';
import { sendBookingNotificationToOfficialMail, getHotelSettings } from '@/lib/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const settings = await getHotelSettings();
    const targetEmail = body.email || settings.officialEmail || 'info@hotelsherpasoul.com';

    // Mock a sample booking to send
    const sampleBooking = {
      id: `TEST-RES-${Date.now().toString().slice(-4)}`,
      guestName: body.guestName || 'Bikram Sherpa (Website Test Booker)',
      email: 'guest.test@example.com',
      phone: '+977 9841234567',
      nationality: 'Nepal',
      roomNumber: '201',
      roomType: 'Deluxe Room',
      checkInDate: new Date().toISOString(),
      checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      adults: 2,
      children: 0,
      totalAmount: 9000,
      paidAmount: 9000,
      source: 'Direct Website Link Test',
      specialRequests: 'High floor, quiet room, late check-in at 8 PM.',
    };

    const result = await sendBookingNotificationToOfficialMail(sampleBooking);

    return NextResponse.json({
      success: true,
      message: `Test booking alert email successfully dispatched to official email (${targetEmail})!`,
      data: {
        officialEmail: targetEmail,
        deliveryStatus: result.deliveryStatus,
        subject: result.subject,
        sampleBooking,
      },
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
