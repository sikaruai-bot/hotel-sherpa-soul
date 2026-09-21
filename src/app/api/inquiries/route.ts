import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendInquiryNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || 'Direct Website Inquiry',
        message,
        status: 'NEW',
      }
    });

    try {
      await sendInquiryNotification({
        name,
        email,
        phone: phone || undefined,
        subject: subject || undefined,
        message,
      });
    } catch (emailErr) {
      console.error('[Inquiries API] Non-fatal email error:', emailErr);
    }

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error.' },
      { status: 500 }
    );
  }
}
