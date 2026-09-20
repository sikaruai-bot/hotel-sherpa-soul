"use client";

import React, { useState } from 'react';
import { 
  Settings2, 
  BedDouble, 
  Wrench, 
  Sparkles, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Plus, 
  X,
  ShieldCheck
} from 'lucide-react';
import { usePms, Room } from '@/context/PmsContext';

export default function RoomsPage() {
  const { rooms, updateRoomStatus } = usePms();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const floor2 = rooms.filter(r => r.floor === 2);
  const floor3 = rooms.filter(r => r.floor === 3);

  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
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
          label: 'Cleaning (सरसफाइ प्रक्रिया)', 
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
          label: 'Under Maintenance (मर्मत)', 
          dot: 'bg-rose-600 ring-2 ring-rose-300',
          badgeBg: 'bg-rose-100/90 text-rose-900 border border-rose-300'
        };
      default:
        return { 
          bg: 'bg-slate-50 border-slate-300 text-slate-800', 
          label: status, 
          dot: 'bg-slate-500',
          badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BedDouble className="text-blue-600" /> Room Inventory & Floor Plan
          </h1>
          <p className="text-xs text-slate-500">Live operational status of 6 boutique rooms across Floor 2 & Floor 3 in Thamel</p>
        </div>
      </div>

      {/* 3 Category Rate Showcase: USD ($) & NPR (रू.) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 rounded-2xl text-white border border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-sm">
            $
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">आधिकारिक रुम दरहरू (Official Rates: Dual Currency)</h3>
            <p className="text-[11px] text-slate-300">NRB विनिमय दर: $1 USD = रू. 135 (NPR)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-400/30 text-blue-200 flex items-center gap-1.5">
            <span className="font-bold text-white">Deluxe (201, 301):</span>
            <span className="font-black text-amber-300">$20 USD</span>
            <span className="text-slate-400">/</span>
            <span className="font-bold">रू. 2,700 NPR</span>
          </span>

          <span className="px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-400/30 text-purple-200 flex items-center gap-1.5">
            <span className="font-bold text-white">Family (202, 302):</span>
            <span className="font-black text-amber-300">$30 USD</span>
            <span className="text-slate-400">/</span>
            <span className="font-bold">रू. 4,050 NPR</span>
          </span>

          <span className="px-3 py-1.5 rounded-xl bg-amber-900/60 border border-amber-400/30 text-amber-200 flex items-center gap-1.5">
            <span className="font-bold text-white">Budget Family (203, 303):</span>
            <span className="font-black text-amber-300">$20 USD</span>
            <span className="text-slate-400">/</span>
            <span className="font-bold">रू. 2,700 NPR</span>
          </span>
        </div>
      </div>

      {/* Room Status Color Options Legend */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={16} />
          <span className="font-extrabold text-slate-800 text-xs">कोठा स्थिति रङ्ग सङ्केत (Room Color Options):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300"></span>
            🟢 Vacant / Available (खाली)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300"></span>
            🔵 Occupied (व्यस्त / पाहुना भएको)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-purple-300"></span>
            🟣 Reserved (आरक्षित)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300"></span>
            🟡 Cleaning Process (सरसफाइ प्रक्रिया)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-300"></span>
            🔴 Maintenance (मर्मत)
          </span>
        </div>
      </div>

      {/* Floor 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Floor 2 (Standard & Deluxe Units)</h2>
            <p className="text-xs text-slate-400">Rooms 201, 202, 203</p>
          </div>
          <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-xs">
            3 Rooms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {floor2.map((r) => {
            const badge = getStatusBadge(r.status);

            return (
              <div key={r.id} className={`p-5 rounded-2xl border ${badge.bg} flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition`}>
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Room {r.number}</h3>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">{r.type}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full ${badge.badgeBg} shadow-2xs`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p>Bed: <strong className="text-slate-800">{r.bedType}</strong> (Max {r.capacity} Guests)</p>
                    <p className="flex items-center gap-1 flex-wrap">
                      <span>Daily Rate:</span>
                      <strong className="text-slate-900 font-extrabold bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
                        ${r.dailyRateUsd || (r.dailyRate === 4050 ? 30 : 20)} USD
                      </strong>
                      <span className="text-slate-400">/</span>
                      <strong className="text-slate-800 font-bold">रू. {r.dailyRate.toLocaleString()} NPR</strong>
                    </p>
                    <p>Guest: <strong className="text-slate-900 font-bold">{r.currentGuest || 'खाली (No Guest)'}</strong></p>
                    {r.maintenanceNote && (
                      <p className="text-rose-700 font-bold bg-rose-100/80 p-1.5 rounded-lg mt-1 text-[11px]">
                        Note: {r.maintenanceNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Status Control Buttons */}
                <div className="pt-3 border-t border-black/5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-bold">
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'AVAILABLE')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                    title="Mark Vacant / Available (खाली)"
                  >
                    🟢 Vacant
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'OCCUPIED')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'OCCUPIED'
                        ? 'bg-blue-600 text-white border-blue-600 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                    title="Mark Occupied (व्यस्त)"
                  >
                    🔵 Occupied
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'CLEANING_REQUIRED')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'CLEANING_REQUIRED'
                        ? 'bg-amber-500 text-white border-amber-500 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                    title="Cleaning Process (सरसफाइ प्रक्रिया)"
                  >
                    🟡 Clean Req
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'UNDER_MAINTENANCE', 'Manual inspection request')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'UNDER_MAINTENANCE'
                        ? 'bg-rose-600 text-white border-rose-600 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                    title="Under Maintenance (मर्मत)"
                  >
                    🔴 Mnt Block
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floor 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Floor 3 (Deluxe, Suites & Long Stay)</h2>
            <p className="text-xs text-slate-400">Rooms 301, 302, 303</p>
          </div>
          <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-xs">
            3 Rooms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {floor3.map((r) => {
            const badge = getStatusBadge(r.status);

            return (
              <div key={r.id} className={`p-5 rounded-2xl border ${badge.bg} flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md transition`}>
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Room {r.number}</h3>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">{r.type}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full ${badge.badgeBg} shadow-2xs`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p>Bed: <strong className="text-slate-800">{r.bedType}</strong> (Max {r.capacity} Guests)</p>
                    <p className="flex items-center gap-1 flex-wrap">
                      <span>Daily Rate:</span>
                      <strong className="text-slate-900 font-extrabold bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
                        ${r.dailyRateUsd || (r.dailyRate === 4050 ? 30 : 20)} USD
                      </strong>
                      <span className="text-slate-400">/</span>
                      <strong className="text-slate-800 font-bold">रू. {r.dailyRate.toLocaleString()} NPR</strong>
                    </p>
                    <p>Guest: <strong className="text-slate-900 font-bold">{r.currentGuest || 'खाली (No Guest)'}</strong></p>
                    {r.maintenanceNote && (
                      <p className="text-rose-700 font-bold bg-rose-100/80 p-1.5 rounded-lg mt-1 text-[11px]">
                        Note: {r.maintenanceNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Status Control Buttons */}
                <div className="pt-3 border-t border-black/5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-bold">
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'AVAILABLE')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                    title="Mark Vacant / Available (खाली)"
                  >
                    🟢 Vacant
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'OCCUPIED')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'OCCUPIED'
                        ? 'bg-blue-600 text-white border-blue-600 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                    title="Mark Occupied (व्यस्त)"
                  >
                    🔵 Occupied
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'CLEANING_REQUIRED')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'CLEANING_REQUIRED'
                        ? 'bg-amber-500 text-white border-amber-500 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                    title="Cleaning Process (सरसफाइ प्रक्रिया)"
                  >
                    🟡 Clean Req
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'UNDER_MAINTENANCE', 'Manual inspection request')}
                    className={`py-1.5 px-2 rounded-lg text-center transition border ${
                      r.status === 'UNDER_MAINTENANCE'
                        ? 'bg-rose-600 text-white border-rose-600 font-black shadow-xs'
                        : 'bg-white/90 hover:bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                    title="Under Maintenance (मर्मत)"
                  >
                    🔴 Mnt Block
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
