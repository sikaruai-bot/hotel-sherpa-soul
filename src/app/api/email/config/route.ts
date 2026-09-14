import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHotelSettings } from '@/lib/emailService';

export async function GET() {
  try {
    const settings = await getHotelSettings();
    return NextResponse.json({
      success: true,
      data: {
        hotelName: settings.hotelName,
        officialEmail: settings.officialEmail,
        managerEmail: settings.managerEmail,
        phone: settings.phone,
        address: settings.address,
        notifyOnBooking: settings.notifyOnBooking,
        notifyGuestOnBooking: settings.notifyGuestOnBooking,
        notifyOnRoomFull: settings.notifyOnRoomFull,
        hasSmtpConfigured: Boolean(settings.smtpHost && settings.smtpUser && settings.smtpPass),
        smtpHost: settings.smtpHost || null,
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || null,
        smtpSecure: settings.smtpSecure || false,
        inboundWebhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pms.hotelsherpasoul.com'}/api/email/inbound`,
      },
    });
  } catch (error: any) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      officialEmail,
      managerEmail,
      phone,
      notifyOnBooking,
      notifyGuestOnBooking,
      notifyOnRoomFull,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
    } = body;

    const updated = await prisma.hotelSetting.upsert({
      where: { id: 'default' },
      update: {
        ...(officialEmail ? { officialEmail: officialEmail.trim() } : {}),
        ...(managerEmail ? { managerEmail: managerEmail.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(typeof notifyOnBooking === 'boolean' ? { notifyOnBooking } : {}),
        ...(typeof notifyGuestOnBooking === 'boolean' ? { notifyGuestOnBooking } : {}),
        ...(typeof notifyOnRoomFull === 'boolean' ? { notifyOnRoomFull } : {}),
        ...(smtpHost !== undefined ? { smtpHost: smtpHost ? smtpHost.trim() : null } : {}),
        ...(smtpPort !== undefined ? { smtpPort: Number(smtpPort) || 587 } : {}),
        ...(smtpUser !== undefined ? { smtpUser: smtpUser ? smtpUser.trim() : null } : {}),
        ...(smtpPass !== undefined && smtpPass !== '••••••••' ? { smtpPass: smtpPass.trim() } : {}),
        ...(typeof smtpSecure === 'boolean' ? { smtpSecure } : {}),
      },
      create: {
        id: 'default',
        hotelName: 'Hotel Sherpa Soul',
        officialEmail: officialEmail || 'info@hotelsherpasoul.com',
        managerEmail: managerEmail || 'manager@hotelsherpasoul.com',
        phone: phone || '+977-1-4530311 / 9851068219',
        notifyOnBooking: notifyOnBooking !== false,
        notifyGuestOnBooking: notifyGuestOnBooking !== false,
        notifyOnRoomFull: notifyOnRoomFull !== false,
        smtpHost: smtpHost || null,
        smtpPort: Number(smtpPort) || 587,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
        smtpSecure: Boolean(smtpSecure),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Official Hotel Email and notification settings updated successfully!',
      data: {
        officialEmail: updated.officialEmail,
        managerEmail: updated.managerEmail,
        notifyOnBooking: updated.notifyOnBooking,
        notifyGuestOnBooking: updated.notifyGuestOnBooking,
        hasSmtpConfigured: Boolean(updated.smtpHost && updated.smtpUser && updated.smtpPass),
      },
    });
  } catch (error: any) {
    console.error('Error updating email settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
