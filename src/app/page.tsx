"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  BedDouble, 
  CalendarDays, 
  DollarSign, 
  ChefHat, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  LogIn, 
  LogOut,
  Sparkles,
  Globe
} from 'lucide-react';
import { usePms } from '@/context/PmsContext';

export default function Dashboard() {
  const { 
    rooms, 
    reservations, 
    contracts, 
    kitchenUsers, 
    invoices, 
    notifications, 
    stopSellActive,
    checkInGuest,
    checkOutGuest,
    toggleStopSell
  } = usePms();

  const todayStr = new Date().toISOString().split('T')[0];

  // Live Metric Calculations
  const todayArrivals = reservations.filter(r => r.checkInDate === todayStr && r.status !== 'CANCELLED');
  const todayDepartures = reservations.filter(r => r.checkOutDate === todayStr && r.status !== 'CANCELLED');
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'LONG_STAY');
  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE');
  const cleaningRooms = rooms.filter(r => r.status === 'CLEANING_REQUIRED');
  const maintenanceRooms = rooms.filter(r => r.status === 'UNDER_MAINTENANCE');

  const todayRevenue = invoices
    .filter(inv => inv.invoiceDate === todayStr)
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0);

  const occupancyRate = Math.round((occupiedRooms.length / rooms.length) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Quick Actions & Stop Sell Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Hotel Sherpa Soul – Front Desk Command</h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Live & Synced
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Bhagawati Marg-26, Thamel, Kathmandu • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={toggleStopSell}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              stopSellActive 
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <ShieldAlert size={16} className={stopSellActive ? 'text-white' : 'text-rose-400'} />
            {stopSellActive ? 'Stop-Sell ACTIVE (OTAs Locked)' : 'Stop-Sell Controls'}
          </button>

          <Link 
            href="/reservations/new"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
          >
            <Plus size={16} /> New Booking
          </Link>

          <Link 
            href="/front-desk"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
          >
            <LogIn size={16} /> Front Desk Desk
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Occupancy Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Occupancy</span>
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BedDouble size={20} /></span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{occupancyRate}%</span>
            <span className="text-xs font-semibold text-slate-500">({occupiedRooms.length}/{rooms.length} Rooms)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {availableRooms.length} Available • {cleaningRooms.length} Cleaning • {maintenanceRooms.length} Mnt
          </p>
        </div>

        {/* Arrivals & Departures */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Movement</span>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CalendarDays size={20} /></span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-800 font-semibold block">Arrivals</span>
              <span className="text-2xl font-bold text-emerald-900">{todayArrivals.length}</span>
            </div>
            <div className="p-2 bg-orange-50/60 rounded-lg border border-orange-100">
              <span className="text-xs text-orange-800 font-semibold block">Departures</span>
              <span className="text-2xl font-bold text-orange-900">{todayDepartures.length}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Fast 1-click check-in ready at Front Desk</p>
        </div>

        {/* Revenue Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected Today</span>
            <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><DollarSign size={20} /></span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">NPR {todayRevenue.toLocaleString()}</span>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              <ArrowUpRight size={14} /> NPR {pendingRevenue.toLocaleString()} pending balance
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">eSewa, Khalti, Cards & Cash NPR/USD</p>
        </div>

        {/* Specialty Hub (Long Stay & Kitchen) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialty Hub</span>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><ChefHat size={20} /></span>
          </div>
          <div className="space-y-2 mt-3 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Long Stay Tenants:</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{contracts.length} Active</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Kitchen Users:</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{kitchenUsers.length} Passes</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Unique Sherpa Soul Long Stay Services</p>
        </div>
      </div>

      {/* Main Grid: Room Status Matrix & Live Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Floor Status & Today's Arrivals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Status Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Live Floor Inventory Matrix</h2>
                <p className="text-xs text-slate-500">Real-time status of Floor 2 and Floor 3 rooms</p>
              </div>
              <Link href="/rooms" className="text-xs font-semibold text-blue-600 hover:underline">
                Manage All Rooms &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rooms.map((r) => {
                const getStatusBadge = () => {
                  switch (r.status) {
                    case 'AVAILABLE':
                      return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', label: 'Available', dot: 'bg-emerald-500' };
                    case 'OCCUPIED':
                      return { bg: 'bg-blue-50 border-blue-200 text-blue-800', label: 'Occupied', dot: 'bg-blue-500' };
                    case 'LONG_STAY':
                      return { bg: 'bg-purple-50 border-purple-200 text-purple-800', label: 'Long Stay', dot: 'bg-purple-500' };
                    case 'CLEANING_REQUIRED':
                      return { bg: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Cleaning', dot: 'bg-amber-500' };
                    case 'UNDER_MAINTENANCE':
                      return { bg: 'bg-rose-50 border-rose-200 text-rose-800', label: 'Maintenance', dot: 'bg-rose-500' };
                    default:
                      return { bg: 'bg-slate-50 border-slate-200 text-slate-800', label: r.status, dot: 'bg-slate-500' };
                  }
                };

                const badge = getStatusBadge();

                return (
                  <div key={r.id} className={`p-4 rounded-xl border ${badge.bg} transition-all hover:scale-[1.01]`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-black text-slate-900">Room {r.number}</span>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-2xs">
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{r.type} • Floor {r.floor}</p>
                    <div className="mt-3 pt-2.5 border-t border-black/5 flex justify-between items-center text-xs">
                      <span className="text-slate-500 truncate max-w-[120px]">
                        {r.currentGuest || 'No Guest'}
                      </span>
                      <span className="font-bold text-slate-800">NPR {r.dailyRate}/d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Arrival Action Center */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <LogIn size={18} className="text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm">Today's In-House & Arrival Guests</h2>
              </div>
              <Link href="/front-desk" className="text-xs text-blue-600 hover:underline font-semibold">
                Open Front Desk
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {reservations.slice(0, 3).map((res) => (
                <div key={res.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{res.guestName}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                        Room {res.roomNumber}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700">
                        {res.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {res.checkInDate} &rarr; {res.checkOutDate} • {res.roomType} • Passport: {res.passportNumber || 'Pending'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {res.status === 'CONFIRMED' ? (
                      <button 
                        onClick={() => checkInGuest(res.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 size={14} /> Fast Check-In
                      </button>
                    ) : res.status === 'CHECKED_IN' ? (
                      <button 
                        onClick={() => checkOutGuest(res.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                      >
                        <LogOut size={14} /> Check-Out
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                        {res.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Notification Feed & Channel Sync */}
        <div className="space-y-6">
          {/* Live Activity Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">Real-Time Operational Feed</h2>
              <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">Live</span>
            </div>

            <div className="space-y-3.5">
              {notifications.slice(0, 4).map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{notif.title}</span>
                    <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{notif.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Channels Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                <h3 className="font-bold text-sm">Multi-Channel OTA Status</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                5 OTAs Synced
              </span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Booking.com, Agoda, Airbnb:</span>
                <span className="text-emerald-400 font-bold">&lt; 1.2s Sync</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Atomic Double-Booking Lock:</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
            </div>

            <Link 
              href="/channel-manager"
              className="block text-center w-full mt-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs transition border border-white/10"
            >
              Open Channel Manager
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
