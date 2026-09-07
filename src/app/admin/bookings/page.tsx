import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import AdminBookingsClient from '@/components/admin/AdminBookingsClient';

export const revalidate = 0;

export default async function AdminBookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      physicalRoom: true,
    }
  });

  const physicalRooms = await prisma.physicalRoom.findMany({
    where: { isSellable: true },
    orderBy: { roomNumber: 'asc' }
  });

  const categories = await prisma.roomCategory.findMany({
    orderBy: { sortOrder: 'asc' }
  });

  const plainBookings = bookings.map(b => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    checkIn: b.checkIn.toISOString().split('T')[0],
    checkOut: b.checkOut.toISOString().split('T')[0],
    adults: b.adults,
    children: b.children,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    guestWhatsApp: b.guestWhatsApp || '',
    guestCountry: b.guestCountry || '',
    specialRequests: b.specialRequests || '',
    categoryId: b.categoryId,
    categoryName: b.category.name,
    physicalRoomId: b.physicalRoomId || '',
    physicalRoomNumber: b.physicalRoom?.roomNumber || 'Unassigned',
    totalAmountUSD: b.totalAmountUSD,
    amountPaidUSD: b.amountPaidUSD,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod || 'Unspecified',
    status: b.status,
    source: b.source,
    createdAt: b.createdAt.toISOString().split('T')[0],
  }));

  const plainRooms = physicalRooms.map(r => ({
    id: r.id,
    roomNumber: r.roomNumber,
    floor: r.floor,
    categoryId: r.categoryId,
  }));

  const plainCats = categories.map(c => ({
    id: c.id,
    name: c.name,
    rateUSD: c.rateUSD,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Direct Reservations Management</h1>
        <p className="text-xs text-slate-500">
          Manage bookings, allocate physical rooms (201-203, 301-303), record payments, and print vouchers.
        </p>
      </div>

      <AdminBookingsClient
        initialBookings={plainBookings}
        physicalRooms={plainRooms}
        categories={plainCats}
      />
    </div>
  );
}
