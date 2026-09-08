import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyLogin, createSessionToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(request: Request) {
  // Brute-force protection: Max 5 login attempts per 15 minutes per IP
  const rateLimit = checkRateLimit(request, 'auth_login', {
    windowMs: 15 * 60 * 1000,
    max: 5,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many failed login attempts. For security reasons, your IP is temporarily blocked for 15 minutes.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await verifyLogin(email.trim().toLowerCase(), password);
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
    console.error('[Auth API] Login error:', err);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
