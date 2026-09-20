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
    toggleStopSell,
    updateRoomStatus
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
            Bhagawati Marg-26, Thamel, Kathmandu • Tel: +977-1-4530311 / 9851068219 • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href="/reservations"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md hover:scale-[1.02]"
          >
            <CalendarDays size={16} /> Open Calendar & Tape-Chart
          </Link>

          <Link 
            href="/reservations/new"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md hover:scale-[1.02]"
          >
            <Plus size={16} /> New Booking
          </Link>

          <Link 
            href="/front-desk"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md hover:scale-[1.02]"
          >
            <LogIn size={16} /> Front Desk
          </Link>

          <button 
            onClick={toggleStopSell}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              stopSellActive 
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <ShieldAlert size={16} className={stopSellActive ? 'text-white' : 'text-rose-400'} />
            {stopSellActive ? 'Stop-Sell ACTIVE' : 'Stop-Sell'}
          </button>
        </div>
      </div>

      {/* Primary KPI Cards - Interactive Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Occupancy Card */}
        <Link 
          href="/rooms"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
              Current Occupancy
            </span>
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BedDouble size={20} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{occupancyRate}%</span>
            <span className="text-xs font-semibold text-slate-500">({occupiedRooms.length}/{rooms.length} Rooms)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400 font-medium">
              {availableRooms.length} Avail • {cleaningRooms.length} Cln • {maintenanceRooms.length} Mnt
            </p>
            <span className="text-[11px] text-blue-600 font-bold group-hover:underline">Rooms &rarr;</span>
          </div>
        </Link>

        {/* Arrivals & Departures -> Direct Link to Calendar & Bookings */}
        <Link 
          href="/reservations"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              Today's Movement
            </span>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CalendarDays size={20} />
            </span>
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
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400 font-medium">Click to view in Calendar</p>
            <span className="text-[11px] text-emerald-600 font-bold group-hover:underline">Calendar &rarr;</span>
          </div>
        </Link>

        {/* Revenue Today -> Direct Link to Billing */}
        <Link 
          href="/billing"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
              Collected Today
            </span>
            <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <DollarSign size={20} />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl font-extrabold text-slate-900">NPR {todayRevenue.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-500">(${Math.round(todayRevenue / 135)} USD)</span>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              <ArrowUpRight size={14} /> NPR {pendingRevenue.toLocaleString()} (${Math.round(pendingRevenue / 135)} USD) pending
            </p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-slate-400 font-medium">eSewa, Khalti, Cash & Card</p>
            <span className="text-[11px] text-purple-600 font-bold group-hover:underline">Billing &rarr;</span>
          </div>
        </Link>

        {/* Specialty Hub -> Link to Long Stay */}
        <Link 
          href="/long-stay"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
              Specialty Hub
            </span>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <ChefHat size={20} />
            </span>
          </div>
          <div className="space-y-2 mt-3 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Long Stay:</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{contracts.length} Active</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Kitchen Passes:</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{kitchenUsers.length} Active</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400 font-medium">Unique Long Stay Services</p>
            <span className="text-[11px] text-amber-600 font-bold group-hover:underline">Details &rarr;</span>
          </div>
        </Link>
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

            {/* Room Status Color Options Legend */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/90 text-xs font-bold">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] mr-1">कोठा स्थिति रङ्ग सङ्केत (Color Options):</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 border border-emerald-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                🟢 Vacant / Available (खाली)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100/90 text-blue-800 border border-blue-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                🔵 Occupied (व्यस्त / पाहुना भएको)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100/90 text-purple-800 border border-purple-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                🟣 Reserved (आरक्षित)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-800 border border-amber-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                🟡 Cleaning Process (सरसफाइ)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100/90 text-rose-800 border border-rose-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                🔴 Maintenance (मर्मत)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {rooms.map((r) => {
                const getStatusBadge = () => {
                  switch (r.status) {
                    case 'AVAILABLE':
                      return { 
                        bg: 'bg-emerald-50/90 border-emerald-300 text-emerald-950', 
                        label: 'Vacant (खाली)', 
                        dot: 'bg-emerald-500 ring-2 ring-emerald-300',
                        badgeBg: 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
                      };
                    case 'OCCUPIED':
                      return { 
                        bg: 'bg-blue-50/90 border-blue-300 text-blue-950', 
                        label: 'Occupied (व्यस्त)', 
                        dot: 'bg-blue-600 ring-2 ring-blue-300',
                        badgeBg: 'bg-blue-100/90 text-blue-900 border border-blue-300'
                      };
                    case 'RESERVED':
                      return { 
                        bg: 'bg-purple-50/90 border-purple-300 text-purple-950', 
                        label: 'Reserved (आरक्षित)', 
                        dot: 'bg-purple-600 ring-2 ring-purple-300',
                        badgeBg: 'bg-purple-100/90 text-purple-900 border border-purple-300'
                      };
                    case 'CLEANING_REQUIRED':
                      return { 
                        bg: 'bg-amber-50/90 border-amber-300 text-amber-950', 
                        label: 'Cleaning (सरसफाइ)', 
                        dot: 'bg-amber-500 ring-2 ring-amber-300',
                        badgeBg: 'bg-amber-100/90 text-amber-900 border border-amber-300'
                      };
                    case 'LONG_STAY':
                      return { 
                        bg: 'bg-indigo-50/90 border-indigo-300 text-indigo-950', 
                        label: 'Long Stay (दीर्घकालीन)', 
                        dot: 'bg-indigo-600 ring-2 ring-indigo-300',
                        badgeBg: 'bg-indigo-100/90 text-indigo-900 border border-indigo-300'
                      };
                    case 'UNDER_MAINTENANCE':
                      return { 
                        bg: 'bg-rose-50/90 border-rose-300 text-rose-950', 
                        label: 'Maintenance (मर्मत)', 
                        dot: 'bg-rose-600 ring-2 ring-rose-300',
                        badgeBg: 'bg-rose-100/90 text-rose-900 border border-rose-300'
                      };
                    default:
                      return { 
                        bg: 'bg-slate-50 border-slate-300 text-slate-800', 
                        label: r.status, 
                        dot: 'bg-slate-500',
                        badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300'
                      };
                  }
                };

                const badge = getStatusBadge();

                return (
                  <div 
                    key={r.id} 
                    className={`p-4 rounded-xl border ${badge.bg} transition-all hover:shadow-md block group`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-black text-slate-900">
                        Room {r.number}
                      </span>
                      <span className={`flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${badge.badgeBg} shadow-2xs`}>
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{r.type} • Floor {r.floor}</p>
                    <div className="mt-3 pt-2.5 border-t border-black/5 flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-bold truncate max-w-[120px]">
                        {r.currentGuest || 'खाली (No Guest)'}
                      </span>
                      <span className="font-extrabold text-slate-900 text-[11px]">
                        ${r.dailyRateUsd || (r.dailyRate === 4050 ? 30 : 20)} USD <span className="text-slate-400">/</span> रु. {r.dailyRate.toLocaleString()}
                      </span>
                    </div>

                    {/* Quick Status Control Buttons */}
                    <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between gap-1 text-[10px] font-bold">
                      <button
                        onClick={() => updateRoomStatus(r.number, 'AVAILABLE')}
                        className={`px-1.5 py-1 rounded-md transition border text-center flex-1 ${
                          r.status === 'AVAILABLE'
                            ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-xs'
                            : 'bg-white/80 hover:bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                        title="Mark Vacant / Available (खाली)"
                      >
                        🟢 Vacant
                      </button>
                      <button
                        onClick={() => updateRoomStatus(r.number, 'OCCUPIED')}
                        className={`px-1.5 py-1 rounded-md transition border text-center flex-1 ${
                          r.status === 'OCCUPIED'
                            ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-xs'
                            : 'bg-white/80 hover:bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title="Mark Occupied (व्यस्त)"
                      >
                        🔵 Occupied
                      </button>
                      <button
                        onClick={() => updateRoomStatus(r.number, 'CLEANING_REQUIRED')}
                        className={`px-1.5 py-1 rounded-md transition border text-center flex-1 ${
                          r.status === 'CLEANING_REQUIRED'
                            ? 'bg-amber-500 text-white border-amber-500 font-extrabold shadow-xs'
                            : 'bg-white/80 hover:bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                        title="Mark Cleaning Process (सरसफाइ)"
                      >
                        🟡 Clean
                      </button>
                      <button
                        onClick={() => updateRoomStatus(r.number, 'UNDER_MAINTENANCE', 'Manual Inspection')}
                        className={`px-1.5 py-1 rounded-md transition border text-center flex-1 ${
                          r.status === 'UNDER_MAINTENANCE'
                            ? 'bg-rose-600 text-white border-rose-600 font-extrabold shadow-xs'
                            : 'bg-white/80 hover:bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title="Under Maintenance (मर्मत)"
                      >
                        🔴 Mnt
                      </button>
                    </div>

                    <div className="mt-2 pt-1 border-t border-black/5 flex justify-end">
                      <Link 
                        href="/reservations" 
                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>View in Calendar</span> &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar & Tape-Chart Direct Access Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-800/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                <CalendarDays size={26} className="text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Interactive Reservation Calendar & Tape-Chart</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    6 Rooms Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  View room occupancy timeline, month calendar view, and OTA booking synchronizations
                </p>
              </div>
            </div>
            <Link
              href="/reservations"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shrink-0 hover:scale-105"
            >
              <CalendarDays size={16} /> Open Calendar Now &rarr;
            </Link>
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
