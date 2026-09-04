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
        return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', label: 'Available', dot: 'bg-emerald-500' };
      case 'OCCUPIED':
        return { bg: 'bg-blue-50 border-blue-200 text-blue-800', label: 'Occupied', dot: 'bg-blue-500' };
      case 'LONG_STAY':
        return { bg: 'bg-purple-50 border-purple-200 text-purple-800', label: 'Long Stay', dot: 'bg-purple-500' };
      case 'CLEANING_REQUIRED':
        return { bg: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Cleaning Needed', dot: 'bg-amber-500' };
      case 'UNDER_MAINTENANCE':
        return { bg: 'bg-rose-50 border-rose-200 text-rose-800', label: 'Under Maintenance', dot: 'bg-rose-500' };
      default:
        return { bg: 'bg-slate-50 border-slate-200 text-slate-800', label: status, dot: 'bg-slate-500' };
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
                    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 shadow-2xs">
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>Bed: <strong className="text-slate-800">{r.bedType}</strong> (Max {r.capacity} Guests)</p>
                    <p>Daily Rate: <strong className="text-slate-800">NPR {r.dailyRate.toLocaleString()}</strong></p>
                    <p>Guest: <strong className="text-slate-800">{r.currentGuest || 'None'}</strong></p>
                    {r.maintenanceNote && (
                      <p className="text-rose-700 font-bold bg-rose-100/80 p-1.5 rounded-lg mt-1 text-[11px]">
                        Note: {r.maintenanceNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Status Control Buttons */}
                <div className="pt-3 border-t border-black/5 grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'AVAILABLE')}
                    className="p-1.5 bg-white/80 hover:bg-white text-emerald-800 rounded-lg text-center transition border border-emerald-200"
                    title="Mark Available"
                  >
                    Available
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'CLEANING_REQUIRED')}
                    className="p-1.5 bg-white/80 hover:bg-white text-amber-800 rounded-lg text-center transition border border-amber-200"
                    title="Request Clean"
                  >
                    Clean Req
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'UNDER_MAINTENANCE', 'Manual inspection request')}
                    className="p-1.5 bg-white/80 hover:bg-white text-rose-800 rounded-lg text-center transition border border-rose-200"
                    title="Under Maintenance"
                  >
                    Mnt Block
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
                    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 shadow-2xs">
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>Bed: <strong className="text-slate-800">{r.bedType}</strong> (Max {r.capacity} Guests)</p>
                    <p>Daily Rate: <strong className="text-slate-800">NPR {r.dailyRate.toLocaleString()}</strong></p>
                    <p>Guest: <strong className="text-slate-800">{r.currentGuest || 'None'}</strong></p>
                    {r.maintenanceNote && (
                      <p className="text-rose-700 font-bold bg-rose-100/80 p-1.5 rounded-lg mt-1 text-[11px]">
                        Note: {r.maintenanceNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Status Control Buttons */}
                <div className="pt-3 border-t border-black/5 grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'AVAILABLE')}
                    className="p-1.5 bg-white/80 hover:bg-white text-emerald-800 rounded-lg text-center transition border border-emerald-200"
                  >
                    Available
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'CLEANING_REQUIRED')}
                    className="p-1.5 bg-white/80 hover:bg-white text-amber-800 rounded-lg text-center transition border border-amber-200"
                  >
                    Clean Req
                  </button>
                  <button 
                    onClick={() => updateRoomStatus(r.number, 'UNDER_MAINTENANCE', 'Manual inspection request')}
                    className="p-1.5 bg-white/80 hover:bg-white text-rose-800 rounded-lg text-center transition border border-rose-200"
                  >
                    Mnt Block
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
