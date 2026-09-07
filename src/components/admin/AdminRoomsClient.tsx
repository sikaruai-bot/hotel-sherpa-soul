"use client";

import React, { useState } from 'react';
import { BedDouble, Check, AlertCircle, Save, Sparkles, ChefHat } from 'lucide-react';

interface PhysicalRoom {
  id: string;
  roomNumber: string;
  floor: number;
  categoryId: string;
  categoryName: string;
  categoryRate: number;
  status: string;
  notes: string;
}

interface RoomCategory {
  id: string;
  code: string;
  name: string;
  rateUSD: number;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  description: string;
  amenities: string[];
  assignedRoomsCount: number;
}

interface Props {
  initialRooms: PhysicalRoom[];
  categories: RoomCategory[];
}

export default function AdminRoomsClient({ initialRooms, categories }: Props) {
  const [rooms, setRooms] = useState(initialRooms);
  const [cats, setCats] = useState(categories);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [savingCatId, setSavingCatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Handle Physical Room update
  const handleUpdateRoom = async (roomId: string, updates: Partial<PhysicalRoom>) => {
    setSavingRoomId(roomId);
    setMessage('');

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_physical_room',
          roomId,
          status: updates.status,
          categoryId: updates.categoryId,
          notes: updates.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update room.');

      setRooms(prev => prev.map(r => (r.id === roomId ? { ...r, ...updates } : r)));
      setMessage('Room updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      alert('Error updating room.');
    } finally {
      setSavingRoomId(null);
    }
  };

  // Handle Category update
  const handleUpdateCategory = async (catId: string, updates: Partial<RoomCategory>) => {
    setSavingCatId(catId);
    setMessage('');

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_category',
          categoryId: catId,
          ...updates,
        }),
      });

      if (!res.ok) throw new Error('Failed to update category.');

      setCats(prev => prev.map(c => (c.id === catId ? { ...c, ...updates } : c)));
      setMessage('Category rate and details updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      alert('Error updating category.');
    } finally {
      setSavingCatId(null);
    }
  };

  return (
    <div className="space-y-10">
      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Part 1: Physical Rooms (Exactly 6) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Physical Rooms (6 Sellable Rooms)</h2>
            <p className="text-xs text-slate-500">
              Assign room category, floor, and live housekeeping/occupancy status.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
            Total Sellable: 6 Rooms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div
              key={room.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900">#{room.roomNumber}</span>
                  <span className="text-xs font-semibold text-slate-500">Floor {room.floor}</span>
                </div>
                {savingRoomId === room.id && (
                  <span className="text-[10px] text-amber-600 font-bold animate-pulse">Saving...</span>
                )}
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Assigned Category
                </label>
                <select
                  value={room.categoryId}
                  onChange={e => handleUpdateRoom(room.id, { categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  {cats.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (USD ${c.rateUSD})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Current Status
                </label>
                <select
                  value={room.status}
                  onChange={e => handleUpdateRoom(room.id, { status: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                    room.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : room.status === 'OCCUPIED'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-white text-slate-800 border-slate-200'
                  }`}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="DIRTY">DIRTY</option>
                  <option value="CLEANING">CLEANING</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  defaultValue={room.notes}
                  onBlur={e => handleUpdateRoom(room.id, { notes: e.target.value })}
                  placeholder="Notes about room condition..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 2: Room Categories & Rates */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Room Categories & Public Rates (USD)</h2>
          <p className="text-xs text-slate-500">
            Edit published nightly rates, maximum occupancy limits, and descriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cats.map(cat => (
            <div
              key={cat.id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {cat.code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Rate (USD)
                  </label>
                  <input
                    type="number"
                    defaultValue={cat.rateUSD}
                    onBlur={e => handleUpdateCategory(cat.id, { rateUSD: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-base font-black text-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Max Total Guests
                  </label>
                  <input
                    type="number"
                    defaultValue={cat.maxGuests}
                    onBlur={e => handleUpdateCategory(cat.id, { maxGuests: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Max Adults
                  </label>
                  <input
                    type="number"
                    defaultValue={cat.maxAdults}
                    onBlur={e => handleUpdateCategory(cat.id, { maxAdults: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Max Children
                  </label>
                  <input
                    type="number"
                    defaultValue={cat.maxChildren}
                    onBlur={e => handleUpdateCategory(cat.id, { maxChildren: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  defaultValue={cat.description}
                  onBlur={e => handleUpdateCategory(cat.id, { description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed"
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                Mapped Physical Rooms: <strong>{rooms.filter(r => r.categoryId === cat.id).length}</strong> rooms
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 3: Shared Kitchen Facility Information */}
      <div className="bg-amber-50/80 rounded-3xl border border-amber-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <ChefHat className="w-5 h-5 text-amber-600" />
            <span>Shared Kitchen — Facility Area 102 (Floor 1)</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-800/80 max-w-2xl leading-relaxed">
            This facility is strictly dedicated for eligible long-stay guests (minimum recommended stay 14 days). As per strict hotel inventory rules, Area 102 is NOT a guest bedroom and is strictly excluded from sellable room inventory, occupancy, ADR, and RevPAR calculations.
          </p>
        </div>
        <span className="shrink-0 px-4 py-2 rounded-xl bg-amber-200/80 text-amber-900 font-bold text-xs">
          Excluded From 6-Room Inventory
        </span>
      </div>
    </div>
  );
}
