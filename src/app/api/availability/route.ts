import { NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/bookingEngine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');

  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: 'checkIn and checkOut dates are required.' }, { status: 400 });
  }

  try {
    const data = await checkAvailability(checkIn, checkOut, adults, children);
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to check availability.' },
      { status: 400 }
    );
  }
}
