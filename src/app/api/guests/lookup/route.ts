import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idQuery = searchParams.get('idNumber')?.trim() || searchParams.get('passportNumber')?.trim();
    const phoneQuery = searchParams.get('phone')?.trim() || searchParams.get('phoneNumber')?.trim();
    const generalQuery = searchParams.get('q')?.trim() || searchParams.get('query')?.trim();

    if (!idQuery && !phoneQuery && !generalQuery) {
      return NextResponse.json(
        { success: false, error: 'Please provide an ID number, passport, phone, or search query.' },
        { status: 400 }
      );
    }

    // ID-First lookup: If idQuery is provided, search ID fields strictly first
    let guest = null;

    if (idQuery && idQuery.length >= 3) {
      guest = await prisma.guest.findFirst({
        where: {
          OR: [
            { idNumber: { equals: idQuery, mode: 'insensitive' as const } },
            { passportNumber: { equals: idQuery, mode: 'insensitive' as const } },
            { idNumber: { contains: idQuery, mode: 'insensitive' as const } },
            { passportNumber: { contains: idQuery, mode: 'insensitive' as const } },
          ],
        },
        include: {
          reservations: {
            include: {
              room: { include: { roomType: true } },
            },
            orderBy: { checkInDate: 'desc' },
          },
        },
      });
    }

    // Secondary fallback: Lookup by Phone Number
    if (!guest && phoneQuery && phoneQuery.length >= 6) {
      guest = await prisma.guest.findFirst({
        where: {
          phoneNumber: { contains: phoneQuery, mode: 'insensitive' as const },
        },
        include: {
          reservations: {
            include: {
              room: { include: { roomType: true } },
            },
            orderBy: { checkInDate: 'desc' },
          },
        },
      });
    }

    // General fallback: Name, Email, or any field
    if (!guest && generalQuery && generalQuery.length >= 3) {
      guest = await prisma.guest.findFirst({
        where: {
          OR: [
            { idNumber: { contains: generalQuery, mode: 'insensitive' as const } },
            { passportNumber: { contains: generalQuery, mode: 'insensitive' as const } },
            { phoneNumber: { contains: generalQuery, mode: 'insensitive' as const } },
            { name: { contains: generalQuery, mode: 'insensitive' as const } },
            { email: { contains: generalQuery, mode: 'insensitive' as const } },
          ],
        },
        include: {
          reservations: {
            include: {
              room: { include: { roomType: true } },
            },
            orderBy: { checkInDate: 'desc' },
          },
        },
      });
    }

    if (!guest) {
      return NextResponse.json({
        success: true,
        matched: false,
        message: 'No previous record found. This is a new guest.',
      });
    }

    // Calculate visits, past stays, and unpaid balances
    const activeReservations = guest.reservations.filter(
      r => r.status !== ReservationStatus.CANCELLED
    );

    const visitCount = activeReservations.length;
    const isReturningGuest = visitCount > 0;

    let totalSpend = 0;
    let pendingDueAmount = 0;
    const unpaidStays: Array<{
      reservationId: string;
      roomNumber: string;
      roomType: string;
      dates: string;
      totalAmount: number;
      paidAmount: number;
      dueAmount: number;
      status: string;
    }> = [];

    const pastStays = guest.reservations.map(r => {
      const due = Math.max(0, r.totalAmount - r.paidAmount);
      totalSpend += r.totalAmount;

      if (due > 0 && r.status !== ReservationStatus.CANCELLED) {
        pendingDueAmount += due;
        unpaidStays.push({
          reservationId: r.id,
          roomNumber: r.room.roomNumber,
          roomType: r.room.roomType.name,
          dates: `${r.checkInDate.toISOString().split('T')[0]} ~ ${r.checkOutDate.toISOString().split('T')[0]}`,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          dueAmount: due,
          status: r.status,
        });
      }

      return {
        id: r.id,
        roomNumber: r.room.roomNumber,
        roomType: r.room.roomType.name,
        checkInDate: r.checkInDate.toISOString().split('T')[0],
        checkOutDate: r.checkOutDate.toISOString().split('T')[0],
        adults: r.adults,
        children: r.children,
        totalAmount: r.totalAmount,
        paidAmount: r.paidAmount,
        balanceDue: due,
        status: r.status,
        source: r.source,
      };
    });

    // Determine security alert level
    let alertLevel: 'NONE' | 'RETURNING' | 'DUE_BALANCE' | 'BLACKLIST' = 'NONE';
    let alertTitle = '';
    let alertMessageNepali = '';
    let alertMessageEnglish = '';

    if (guest.isBlacklisted) {
      alertLevel = 'BLACKLIST';
      alertTitle = '🚫 कालोसूचीमा परेको पाहुना (BLACKLISTED GUEST DETECTED)';
      alertMessageNepali = `सचेत रहनुहोस्! यो व्यक्ति होटलको कालोसूचीमा हुनुहुन्छ। कारण: "${guest.blacklistReason || 'बिल नतिरी फरार भएको वा नियम उल्लंघन'}।" व्यवस्थापकसँग समन्वय नगरी कोठा नदिनुहोस्।`;
      alertMessageEnglish = `Security Warning: This guest is on the Hotel Blacklist. Reason: "${guest.blacklistReason || 'Unpaid absconded / policy violation'}". Do not check-in without Manager approval.`;
    } else if (pendingDueAmount > 0) {
      alertLevel = 'DUE_BALANCE';
      alertTitle = '⚠️ अघिल्लो बक्यौता बाँकी (Pending Balance Due Alert)';
      alertMessageNepali = `यो पाहुनाको अघिल्लो बसाइको रू. ${pendingDueAmount.toLocaleString()} ($ ${(pendingDueAmount / 135).toFixed(1)} USD) बक्यौता बाँकी छ। नयाँ चेक-इन गर्नुअघि पुरानो बक्यौता असुल गर्नुहोस्।`;
      alertMessageEnglish = `Payment Notice: This guest has an unpaid balance of NPR ${pendingDueAmount.toLocaleString()} (approx. $${(pendingDueAmount / 135).toFixed(1)} USD) from past visits. Settle outstanding due first.`;
    } else if (isReturningGuest) {
      alertLevel = 'RETURNING';
      alertTitle = '🌟 दोहोरिएर आउनुभएको अतिथि (Returning Guest Detected)';
      alertMessageNepali = `यो पाहुना पहिल्यै Hotel Sherpa Soul मा ${visitCount} पटक बसिसक्नुभएको छ। उहाँलाई हार्दिक स्वागत गर्नुहोस्!`;
      alertMessageEnglish = `Welcome back! This guest has stayed with us ${visitCount} time(s). Previous stay history is available.`;
    }

    return NextResponse.json({
      success: true,
      matched: true,
      guest: {
        id: guest.id,
        name: guest.name,
        nationality: guest.nationality || 'Nepal',
        idNumber: guest.idNumber || guest.passportNumber || '',
        passportNumber: guest.passportNumber || guest.idNumber || '',
        phoneNumber: guest.phoneNumber || '',
        email: guest.email || '',
        photoUrl: guest.photoUrl || null,
        signatureUrl: guest.signatureUrl || null,
        isBlacklisted: guest.isBlacklisted,
        blacklistReason: guest.blacklistReason || null,
        blacklistedAt: guest.blacklistedAt || null,
        blacklistedBy: guest.blacklistedBy || null,
      },
      visitCount,
      isReturningGuest,
      totalSpend,
      pendingDueAmount,
      hasPendingDue: pendingDueAmount > 0,
      unpaidStays,
      pastStays,
      alert: {
        level: alertLevel,
        title: alertTitle,
        messageNepali: alertMessageNepali,
        messageEnglish: alertMessageEnglish,
      },
    });
  } catch (error: any) {
    console.error('Guest lookup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
