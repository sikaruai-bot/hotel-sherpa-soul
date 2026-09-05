import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pinCode: true,
        shift: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    // Return fallback demo users
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'demo-1',
          name: 'Pasang Sherpa (Reception Desk)',
          email: 'frontdesk@hotelsherpasoul.com',
          role: 'RECEPTIONIST',
          pinCode: '1234',
          shift: 'Morning',
          isActive: true,
        },
        {
          id: 'demo-2',
          name: 'Mingma Sherpa (General Manager)',
          email: 'manager@hotelsherpasoul.com',
          role: 'MANAGER',
          pinCode: '9999',
          shift: 'Day',
          isActive: true,
        },
      ],
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password = 'frontdesk123',
      pinCode = '1234',
      role = 'RECEPTIONIST',
      shift = 'Morning',
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Staff name and email are required.' },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password,
        pinCode,
        role: role as Role,
        shift,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pinCode: true,
        shift: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
