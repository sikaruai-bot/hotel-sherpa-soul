import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hss_pms_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
