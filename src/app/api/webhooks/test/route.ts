import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, secret } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Target URL is required for testing.' },
        { status: 400 }
      );
    }

    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      hotel: 'Hotel Sherpa Soul',
      message: 'Hello from Hotel Sherpa Soul PMS Webhook Engine! Connection successful. 🙏',
      sampleData: {
        guestName: 'Sarah Connor',
        roomNumber: '202',
        roomType: 'Standard Double',
        checkInDate: '2026-09-05',
        checkOutDate: '2026-09-08',
        totalAmountNpr: 10500,
      },
    };

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HotelSherpaSoul-PMS-Webhook-Tester/1.0',
        'X-SherpaSoul-Event': 'test.ping',
        ...(secret && { 'X-SherpaSoul-Secret': secret }),
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const responseText = await res.text().catch(() => '');

    return NextResponse.json({
      success: true,
      delivered: true,
      statusCode: res.status,
      durationMs,
      responsePreview: responseText.slice(0, 300),
      sentPayload: testPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        delivered: false,
        error: error.message || 'Webhook ping connection failed',
      },
      { status: 500 }
    );
  }
}
