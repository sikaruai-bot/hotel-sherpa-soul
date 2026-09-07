import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyLogin, createSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await verifyLogin(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = createSessionToken(user);
    const cookieStore = await cookies();
    cookieStore.set('hss_admin_session', token, {
      httpOnly: true,
      secure: request.url.startsWith('https://'),
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
