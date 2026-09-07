import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  BedDouble, 
  CalendarDays, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0; // Always fresh in admin

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/admin/login');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Fetch exactly the 6 sellable physical rooms
  const physicalRooms = await prisma.physicalRoom.findMany({
    where: { isSellable: true },
    include: { category: true },
    orderBy: { roomNumber: 'asc' }
  });

  // 2. Fetch Active Bookings
  const allBookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, physicalRoom: true },
    take: 10
  });

  // 3. Today's Arrivals and Departures
  const todayArrivals = await prisma.booking.findMany({
    where: {
      checkIn: { gte: today, lt: tomorrow },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] }
    },
    include: { category: true, physicalRoom: true }
  });

  const todayDepartures = await prisma.booking.findMany({
    where: {
      checkOut: { gte: today, lt: tomorrow },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] }
    },
    include: { category: true, physicalRoom: true }
  });

  // 4. Critical 6-Room Operational Formulas
  // Occupancy % = Occupied Physical Rooms / 6 * 100
  const occupiedRooms = physicalRooms.filter(r => r.status === 'OCCUPIED');
  const availableRooms = physicalRooms.filter(r => r.status === 'AVAILABLE');
  const occupancyPct = Math.round((occupiedRooms.length / 6) * 100);

  // Financial calculations
  const totalRevenue = await prisma.booking.aggregate({
    _sum: { totalAmountUSD: true },
    where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } }
  });
  const sumRevenueUSD = totalRevenue._sum.totalAmountUSD || 0;

  // RevPAR = Total Room Revenue / 6
  const revParUSD = (sumRevenueUSD / 6).toFixed(1);

  // ADR = Total Room Revenue / Sold Room Nights
  // Simplified calculation across active bookings
  const adrUSD = (sumRevenueUSD / Math.max(1, allBookings.length * 2)).toFixed(1);

  // Sources breakdown
  const sourcesGroup = await prisma.booking.groupBy({
    by: ['source'],
    _count: { id: true }
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-slate-400">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-500">
            Hotel Sherpa Soul Property Management • Thamel, Kathmandu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/bookings"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-sm transition-all"
          >
            + Add Walk-In Booking
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Occupancy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">6-Room Occupancy</span>
            <BedDouble className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{occupancyPct}%</span>
            <span className="text-xs text-slate-500">({occupiedRooms.length}/6 occupied)</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            {availableRooms.length} rooms ready to sell
          </span>
        </div>

        {/* RevPAR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">RevPAR (6 Rooms)</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">${revParUSD}</span>
            <span className="text-xs text-slate-500">USD</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Formula: Revenue ÷ 6</span>
        </div>

        {/* Arrivals Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Today&apos;s Arrivals</span>
            <CalendarDays className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{todayArrivals.length}</span>
            <span className="text-xs text-slate-500">guests checking in</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Departures today: {todayDepartures.length}</span>
        </div>

        {/* Total Direct Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Total Bookings</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">${sumRevenueUSD.toFixed(0)}</span>
            <span className="text-xs text-slate-500">USD total</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Avg Daily Rate: ~${adrUSD}</span>
        </div>
      </div>

      {/* Critical Section: Exactly 6 Sellable Physical Rooms Status Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Physical Rooms Status (Exactly 6 Sellable Rooms)</h2>
            <p className="text-xs text-slate-500">Live operational state of rooms on Floor 2 and Floor 3.</p>
          </div>
          <Link
            href="/admin/rooms"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Manage Categories & Rates</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {physicalRooms.map(r => {
            const isAvail = r.status === 'AVAILABLE';
            const isOccupied = r.status === 'OCCUPIED';

            return (
              <div
                key={r.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                  isAvail
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : isOccupied
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-slate-900">#{r.roomNumber}</span>
                  <span className="text-[10px] font-bold text-slate-400">FL {r.floor}</span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-800 block truncate">{r.category.name}</span>
                  <span className="text-[11px] text-slate-500 block">USD ${r.category.rateUSD}/nt</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    isAvail
                      ? 'bg-emerald-100 text-emerald-800'
                      : isOccupied
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notice regarding Shared Kitchen Room 102 */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>
            🍳 <strong>Shared Kitchen (Area 102):</strong> Floor 1 facility strictly excluded from inventory, occupancy, ADR, and RevPAR calculations.
          </span>
          <span className="font-semibold text-emerald-700 text-[11px]">Non-Sellable Facility</span>
        </div>
      </div>

      {/* Two Column Layout: Recent Direct Bookings & Marketing Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Direct Reservations</h3>
            <Link href="/admin/bookings" className="text-xs font-semibold text-amber-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-900 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ref</th>
                  <th className="py-2.5 px-3">Guest</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {allBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{b.bookingNumber}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800 block">{b.guestName}</span>
                      <span className="text-[10px] text-slate-400">{b.guestEmail}</span>
                    </td>
                    <td className="py-2.5 px-3">{b.category.name}</td>
                    <td className="py-2.5 px-3">
                      {b.checkIn.toISOString().split('T')[0]} → {b.checkOut.toISOString().split('T')[0]}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">USD ${b.totalAmountUSD}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Marketing Attribution & Booking Sources (1 Col) */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Booking Sources</h3>
            <p className="text-xs text-slate-500">Marketing channels generating reservations</p>
          </div>

          <div className="space-y-3">
            {sourcesGroup.map(s => (
              <div key={s.source} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="font-bold text-slate-800">{s.source.replace('_', ' ')}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 font-bold text-slate-900">
                  {s._count.id} bookings
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs space-y-1 text-amber-900">
            <strong className="block">Direct Website Advantage</strong>
            <p>Every direct website booking saves 15-25% OTA commissions, increasing owner profit margins in Kathmandu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
