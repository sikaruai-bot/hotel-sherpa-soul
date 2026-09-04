"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, CreditCard, Save, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePms } from '@/context/PmsContext';

export default function NewReservationPage() {
  const router = useRouter();
  const { rooms, addReservation } = usePms();

  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    nationality: 'Nepalese',
    passportNumber: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    roomNumber: '201',
    adults: 1,
    children: 0,
    totalAmount: 7000,
    paidAmount: 0,
    source: 'Walk-In' as const,
    specialRequests: '',
  });

  const [success, setSuccess] = useState(false);

  // Auto-update price when room or dates change
  const selectedRoom = rooms.find(r => r.number === formData.roomNumber);

  const calculateDays = () => {
    const start = new Date(formData.checkInDate);
    const end = new Date(formData.checkOutDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diff > 0 ? diff : 1;
  };

  const handleRoomChange = (roomNum: string) => {
    const r = rooms.find(rm => rm.number === roomNum);
    const days = calculateDays();
    const rate = r ? r.dailyRate : 3500;
    setFormData(prev => ({
      ...prev,
      roomNumber: roomNum,
      totalAmount: rate * days,
    }));
  };

  const handleDateChange = (type: 'checkInDate' | 'checkOutDate', val: string) => {
    setFormData(prev => {
      const updated = { ...prev, [type]: val };
      const start = new Date(updated.checkInDate);
      const end = new Date(updated.checkOutDate);
      const days = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      const rate = selectedRoom ? selectedRoom.dailyRate : 3500;
      return {
        ...updated,
        totalAmount: rate * days,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName.trim()) {
      alert('Please enter guest name');
      return;
    }

    addReservation({
      guestName: formData.guestName,
      email: formData.email,
      phone: formData.phone,
      nationality: formData.nationality,
      passportNumber: formData.passportNumber,
      roomNumber: formData.roomNumber,
      roomType: selectedRoom ? selectedRoom.type : 'Standard Double',
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      adults: Number(formData.adults),
      children: Number(formData.children),
      totalAmount: Number(formData.totalAmount),
      paidAmount: Number(formData.paidAmount),
      status: Number(formData.paidAmount) > 0 ? 'CONFIRMED' : 'CONFIRMED',
      source: formData.source,
      specialRequests: formData.specialRequests,
    });

    setSuccess(true);
    setTimeout(() => {
      router.push('/reservations');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reservations" className="p-2 bg-white rounded-xl border hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Direct Reservation</h1>
            <p className="text-xs text-slate-500">Log walk-ins, phone reservations, or WhatsApp bookings</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={24} className="text-emerald-600" />
          <div>
            <p className="font-bold text-sm">Reservation Created Successfully!</p>
            <p className="text-xs text-emerald-700">Room {formData.roomNumber} has been reserved. Redirecting to calendar...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Details Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800 font-bold text-base">
            <User size={18} className="text-purple-600" />
            <h2>Guest Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name *</label>
              <input 
                type="text" 
                required
                value={formData.guestName}
                onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-sm" 
                placeholder="e.g. Pasang Norbu / John Smith" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-sm" 
                placeholder="guest@example.com" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phone / WhatsApp *</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-sm" 
                placeholder="+977 98XXXXXXXX" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nationality</label>
              <input 
                type="text" 
                value={formData.nationality}
                onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-sm" 
                placeholder="e.g. Nepalese, French, American" 
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Passport / Citizen ID Number</label>
              <input 
                type="text" 
                value={formData.passportNumber}
                onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-purple-600 text-sm" 
                placeholder="Mandatory for foreign guests (Tourist Visa / Police Registry)" 
              />
            </div>
          </div>
        </div>

        {/* Stay Details Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800 font-bold text-base">
            <Calendar size={18} className="text-blue-600" />
            <h2>Stay Details & Room Assignment</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Check-in Date</label>
              <input 
                type="date" 
                required
                value={formData.checkInDate}
                onChange={e => handleDateChange('checkInDate', e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Check-out Date</label>
              <input 
                type="date" 
                required
                value={formData.checkOutDate}
                onChange={e => handleDateChange('checkOutDate', e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Available Room</label>
              <select 
                value={formData.roomNumber}
                onChange={e => handleRoomChange(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm bg-white"
              >
                {rooms.map(r => (
                  <option key={r.number} value={r.number}>
                    Room {r.number} ({r.type} - Floor {r.floor}) • NPR {r.dailyRate}/night {r.status !== 'AVAILABLE' ? `[${r.status}]` : '[Available]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Adults</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5"
                  value={formData.adults}
                  onChange={e => setFormData({ ...formData, adults: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Children</label>
                <input 
                  type="number" 
                  min="0" 
                  max="4"
                  value={formData.children}
                  onChange={e => setFormData({ ...formData, children: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Source Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800 font-bold text-base">
            <CreditCard size={18} className="text-emerald-600" />
            <h2>Payment & Channel Source</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Booking Channel Source</label>
              <select 
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value as any })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm bg-white"
              >
                <option value="Walk-In">Walk-In (Reception)</option>
                <option value="WhatsApp">WhatsApp Inquiry</option>
                <option value="Phone">Phone Booking</option>
                <option value="Direct Website">Direct Website Engine</option>
                <option value="Booking.com">Booking.com (Manual Sync)</option>
                <option value="Agoda">Agoda (Manual Sync)</option>
                <option value="Airbnb">Airbnb (Manual Sync)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Total Room Price (NPR)</label>
              <input 
                type="number" 
                value={formData.totalAmount}
                onChange={e => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm font-bold text-slate-900" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Advance Deposit Paid (NPR)</label>
              <input 
                type="number" 
                value={formData.paidAmount}
                onChange={e => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm" 
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Special Notes & Requests</label>
              <input 
                type="text"
                value={formData.specialRequests}
                onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm" 
                placeholder="e.g. Trekking luggage hold, upper floor preference"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/reservations" className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition">
            Cancel
          </Link>
          <button 
            type="submit" 
            className="flex items-center gap-2 bg-purple-600 text-white px-7 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition shadow-md"
          >
            <Save size={18} />
            Confirm & Save Booking
          </button>
        </div>
      </form>
    </div>
  );
}
