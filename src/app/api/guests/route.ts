import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, returning, due, blacklisted
    const searchQuery = searchParams.get('q')?.trim().toLowerCase() || '';

    const guests = await prisma.guest.findMany({
      include: {
        reservations: {
          include: {
            room: { include: { roomType: true } },
          },
          orderBy: { checkInDate: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let totalReturningCount = 0;
    let totalDueCount = 0;
    let totalBlacklistedCount = 0;
    let totalUnpaidAmount = 0;

    const formatted = guests.map(guest => {
      const activeRes = guest.reservations.filter(r => r.status !== ReservationStatus.CANCELLED);
      const visitCount = activeRes.length;
      const isReturning = visitCount > 1;

      let lifetimeSpend = 0;
      let pendingDue = 0;
      const staysSummary = guest.reservations.map(r => {
        const due = Math.max(0, r.totalAmount - r.paidAmount);
        lifetimeSpend += r.totalAmount;
        if (due > 0 && r.status !== ReservationStatus.CANCELLED) {
          pendingDue += due;
        }
        return {
          id: r.id,
          roomNumber: r.room?.roomNumber || 'N/A',
          roomType: r.room?.roomType?.name || 'Standard',
          dates: `${r.checkInDate.toISOString().split('T')[0]} ~ ${r.checkOutDate.toISOString().split('T')[0]}`,
          totalAmount: r.totalAmount,
          paidAmount: r.paidAmount,
          dueAmount: due,
          status: r.status,
        };
      });

      if (isReturning) totalReturningCount++;
      if (pendingDue > 0) {
        totalDueCount++;
        totalUnpaidAmount += pendingDue;
      }
      if (guest.isBlacklisted) totalBlacklistedCount++;

      const lastStay = guest.reservations[0]?.checkInDate
        ? guest.reservations[0].checkInDate.toISOString().split('T')[0]
        : 'Never';

      return {
        id: guest.id,
        name: guest.name,
        nationality: guest.nationality || 'Nepal',
        idNumber: guest.idNumber || guest.passportNumber || '',
        passportNumber: guest.passportNumber || '',
        email: guest.email || '',
        phone: guest.phoneNumber || '',
        photoUrl: guest.photoUrl || null,
        signatureUrl: guest.signatureUrl || null,
        isBlacklisted: Boolean(guest.isBlacklisted),
        blacklistReason: guest.blacklistReason || null,
        blacklistedAt: guest.blacklistedAt ? guest.blacklistedAt.toISOString() : null,
        blacklistedBy: guest.blacklistedBy || null,
        visitCount,
        isReturning,
        lifetimeSpend,
        pendingDue,
        hasPendingDue: pendingDue > 0,
        lastStay,
        stays: staysSummary,
      };
    });

    // Apply Filter & Search
    let filtered = formatted;

    if (filter === 'returning') {
      filtered = filtered.filter(g => g.visitCount > 1);
    } else if (filter === 'due') {
      filtered = filtered.filter(g => g.pendingDue > 0);
    } else if (filter === 'blacklisted') {
      filtered = filtered.filter(g => g.isBlacklisted);
    }

    if (searchQuery) {
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(searchQuery) ||
        g.phone.toLowerCase().includes(searchQuery) ||
        g.email.toLowerCase().includes(searchQuery) ||
        g.idNumber.toLowerCase().includes(searchQuery) ||
        g.passportNumber.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      summary: {
        totalGuests: formatted.length,
        returningCount: totalReturningCount,
        dueCount: totalDueCount,
        blacklistedCount: totalBlacklistedCount,
        totalUnpaidAmount,
      },
    });
  } catch (error: any) {
    console.error('Guests fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update guest details, photo, or toggle Blacklist
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      guestId,
      name,
      nationality,
      idNumber,
      passportNumber,
      phone,
      email,
      photoUrl,
      isBlacklisted,
      blacklistReason,
      blacklistedBy = 'Front Desk Staff',
    } = body;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: 'Guest ID is required.' },
        { status: 400 }
      );
    }

    const existingGuest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!existingGuest) {
      return NextResponse.json(
        { success: false, error: 'Guest not found.' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (nationality !== undefined) updateData.nationality = nationality.trim();
    if (idNumber !== undefined) updateData.idNumber = idNumber.trim();
    if (passportNumber !== undefined) updateData.passportNumber = passportNumber.trim();
    if (phone !== undefined) updateData.phoneNumber = phone.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    // Handle Blacklist toggle
    if (isBlacklisted !== undefined) {
      updateData.isBlacklisted = Boolean(isBlacklisted);
      if (isBlacklisted) {
        updateData.blacklistReason = blacklistReason?.trim() || 'Unpaid balance / Room damage / Absconded';
        updateData.blacklistedAt = new Date();
        updateData.blacklistedBy = blacklistedBy;

        // Create alert notification
        await prisma.notification.create({
          data: {
            title: `🚫 Blacklisted: ${existingGuest.name}`,
            detail: `Guest added to Blacklist by ${blacklistedBy}. Reason: ${updateData.blacklistReason}. ID: ${existingGuest.idNumber || existingGuest.passportNumber || 'N/A'}.`,
            type: 'Billing',
            channel: 'In-App',
            status: 'Action Required',
          },
        });
      } else {
        updateData.blacklistReason = null;
        updateData.blacklistedAt = null;
        updateData.blacklistedBy = null;

        await prisma.notification.create({
          data: {
            title: `✅ Blacklist Cleared: ${existingGuest.name}`,
            detail: `Guest was removed from Blacklist by ${blacklistedBy}. Normal booking restored.`,
            type: 'Billing',
            channel: 'In-App',
            status: 'Delivered',
          },
        });
      }
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: isBlacklisted !== undefined
        ? (isBlacklisted ? 'Guest added to Blacklist' : 'Guest removed from Blacklist')
        : 'Guest profile updated',
      data: updatedGuest,
    });
  } catch (error: any) {
    console.error('Guest update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
