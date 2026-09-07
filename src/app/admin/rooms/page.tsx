import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import AdminRoomsClient from '@/components/admin/AdminRoomsClient';

export const revalidate = 0;

export default async function AdminRoomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const physicalRooms = await prisma.physicalRoom.findMany({
    where: { isSellable: true },
    include: { category: true },
    orderBy: { roomNumber: 'asc' }
  });

  const categories = await prisma.roomCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      rooms: {
        where: { isSellable: true }
      }
    }
  });

  const plainRooms = physicalRooms.map(r => ({
    id: r.id,
    roomNumber: r.roomNumber,
    floor: r.floor,
    categoryId: r.categoryId,
    categoryName: r.category.name,
    categoryRate: r.category.rateUSD,
    status: r.status,
    notes: r.notes || '',
  }));

  const plainCats = categories.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    rateUSD: c.rateUSD,
    maxAdults: c.maxAdults,
    maxChildren: c.maxChildren,
    maxGuests: c.maxGuests,
    description: c.description,
    amenities: JSON.parse(c.amenities || '[]'),
    assignedRoomsCount: c.rooms.length,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rooms & Inventory Management</h1>
        <p className="text-xs text-slate-500">
          Hotel Sherpa Soul inventory: Exactly 6 sellable physical guest rooms on Floor 2 and Floor 3.
        </p>
      </div>

      <AdminRoomsClient initialRooms={plainRooms} categories={plainCats} />
    </div>
  );
}
