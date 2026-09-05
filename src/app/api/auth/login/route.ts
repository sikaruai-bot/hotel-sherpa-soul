import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fallback staff credentials in case database is offline / local testing
const DEMO_STAFF = [
  {
    id: 'user-frontdesk-1',
    name: 'Pasang Sherpa',
    email: 'frontdesk@hotelsherpasoul.com',
    role: 'RECEPTIONIST',
    pinCode: '1234',
    password: 'frontdesk123',
    isActive: true,
  },
  {
    id: 'user-manager-1',
    name: 'Mingma Sherpa',
    email: 'manager@hotelsherpasoul.com',
    role: 'MANAGER',
    pinCode: '9999',
    password: 'manager123',
    isActive: true,
  },
  {
    id: 'user-admin-1',
    name: 'System Admin',
    email: 'admin@hotelsherpasoul.com',
    role: 'ADMIN',
    pinCode: '0000',
    password: 'admin123',
    isActive: true,
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, pin, shift = 'Morning' } = body;

    let user: any = null;

    // 1. Try querying Database
    try {
      if (pin) {
        user = await prisma.user.findFirst({
          where: {
            pinCode: String(pin),
            isActive: true,
          },
        });
      } else if (email && password) {
        user = await prisma.user.findFirst({
          where: {
            email: String(email).toLowerCase(),
            password: String(password),
            isActive: true,
          },
        });
      }
    } catch (dbError) {
      console.warn('Database query failed for login, trying demo fallback:', dbError);
    }

    // 2. Fallback to demo users if DB user not found
    if (!user) {
      if (pin) {
        user = DEMO_STAFF.find((s) => s.pinCode === String(pin));
      } else if (email && password) {
        user = DEMO_STAFF.find(
          (s) => s.email.toLowerCase() === String(email).toLowerCase() && s.password === String(password)
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: pin
            ? 'Invalid PIN Code. Please check or contact manager.'
            : 'Invalid Email or Password. Please try again.',
        },
        { status: 401 }
      );
    }

    // Update user shift in DB if possible
    try {
      if (user.id && !user.id.startsWith('user-')) {
        await prisma.user.update({
          where: { id: user.id },
          data: { shift },
        });
      }
    } catch {
      // Ignore shift update failure
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shift,
    };

    const response = NextResponse.json({
      success: true,
      data: userData,
    });

    // Set HTTP session cookie
    response.cookies.set({
      name: 'hss_pms_session',
      value: JSON.stringify(userData),
      httpOnly: false, // Accessible to client-side auth context
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal login error' },
      { status: 500 }
    );
  }
}
