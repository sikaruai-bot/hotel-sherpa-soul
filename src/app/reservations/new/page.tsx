"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Calendar, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles,
  BedDouble,
  ArrowRight,
  Clock,
  Check,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePms } from '@/context/PmsContext';

export default function NewReservationPage() {
  const router = useRouter();
  const { rooms, addReservation, checkRoomAvailability } = usePms();

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
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-update price when room or dates change
  const selectedRoom = rooms.find(r => r.number === formData.roomNumber);

  const calculateDays = (inDate = formData.checkInDate, outDate = formData.checkOutDate) => {
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diff > 0 ? diff : 1;
  };

  // Real-Time Availability & Double-Booking Shield for the selected room & dates
  const currentAvailability = useMemo(() => {
    return checkRoomAvailability(formData.roomNumber, formData.checkInDate, formData.checkOutDate);
  }, [formData.roomNumber, formData.checkInDate, formData.checkOutDate, checkRoomAvailability]);

  // Real-Time Availability for ALL rooms on these dates
  const roomStatusList = useMemo(() => {
    return rooms.map(r => {
      const res = checkRoomAvailability(r.number, formData.checkInDate, formData.checkOutDate);
      return {
        ...r,
        isAvailable: res.isAvailable,
        conflicts: res.conflicts,
      };
    });
  }, [rooms, formData.checkInDate, formData.checkOutDate, checkRoomAvailability]);

  const availableAlternativeRooms = useMemo(() => {
    return roomStatusList.filter(r => r.isAvailable && r.number !== formData.roomNumber);
  }, [roomStatusList, formData.roomNumber]);

  const handleRoomChange = (roomNum: string) => {
    setErrorMessage('');
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
    setErrorMessage('');
    setFormData(prev => {
      const updated = { ...prev, [type]: val };
      const days = calculateDays(updated.checkInDate, updated.checkOutDate);
      const rate = selectedRoom ? selectedRoom.dailyRate : 3500;
      return {
        ...updated,
        totalAmount: rate * days,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.guestName.trim()) {
      setErrorMessage('Please enter guest name');
      return;
    }

    if (!currentAvailability.isAvailable) {
      setErrorMessage(`डबल बुकिङ रोकियो: Room ${formData.roomNumber} is already booked on these dates. Please switch to an available room.`);
      return;
    }

    const result = addReservation({
      guestName: formData.guestName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      nationality: formData.nationality.trim(),
      passportNumber: formData.passportNumber.trim(),
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
      specialRequests: formData.specialRequests.trim(),
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to create reservation.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/reservations');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Shield Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reservations" className="p-2 bg-white rounded-xl border hover:bg-slate-50 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Direct Reservation</h1>
            <p className="text-xs text-slate-500">Log walk-ins, phone reservations, or WhatsApp bookings with Zero-Double-Booking Shield</p>
          </div>
        </div>

        {/* Shield Status Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-emerald-800 text-xs font-bold shadow-xs">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Double-Booking Shield: Active</span>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 size={26} className="text-emerald-600" />
          <div>
            <p className="font-bold text-sm">Reservation Created & Locked Successfully!</p>
            <p className="text-xs text-emerald-700">Room {formData.roomNumber} has been verified and reserved. Redirecting to calendar...</p>
          </div>
        </div>
      )}

      {/* Error / Conflict Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl flex items-start gap-3 animate-shake shadow-sm">
          <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-black text-sm text-rose-950">Booking Blocked / Conflict Detected</p>
            <p className="font-semibold text-rose-800 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* CRITICAL: REAL-TIME DOUBLE-BOOKING CONFLICT WARNING BOX */}
      {!currentAvailability.isAvailable && (
        <div className="bg-gradient-to-br from-rose-900 via-rose-950 to-slate-950 text-white p-5 rounded-2xl border-2 border-rose-500 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-black uppercase tracking-wider mb-1">
                <XCircle size={12} /> Double Booking Shield Triggered
              </div>
              <h3 className="text-base font-black tracking-tight text-white">
                Room {formData.roomNumber} is NOT AVAILABLE for selected dates!
              </h3>
            </div>
          </div>

          <div className="p-3.5 bg-white/10 rounded-xl border border-white/15 text-xs space-y-2">
            <p className="font-bold text-rose-200">Current Overlapping Booking(s):</p>
            {currentAvailability.conflicts.map((conf, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 text-white bg-black/30 p-2 rounded-lg font-mono text-[11px]">
                <span className="font-bold text-amber-300">{conf.title}</span>
                <span>•</span>
                <span>Guest: <strong className="text-white">{conf.guestName}</strong></span>
                <span>•</span>
                <span>Dates: <strong className="text-rose-300">{conf.checkInDate}</strong> to <strong className="text-rose-300">{conf.checkOutDate}</strong></span>
                {conf.source && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{conf.source}</span>}
              </div>
            ))}
          </div>

          {/* Quick-Switch Available Rooms Suggestions */}
          {availableAlternativeRooms.length > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles size={14} /> Available Alternative Rooms for {formData.checkInDate} to {formData.checkOutDate}:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableAlternativeRooms.map(alt => (
                  <button
                    key={alt.number}
                    type="button"
                    onClick={() => handleRoomChange(alt.number)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <span>Switch to Room {alt.number} ({alt.type})</span>
                    <ArrowRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-300 font-semibold">
              Notice: All rooms are fully occupied on these dates. Please choose different dates.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stay Details & Live Room Selection Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <Calendar size={18} className="text-blue-600" />
              <h2>Dates & Real-Time Room Selection</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Duration: <strong className="text-slate-900">{calculateDays()} Night(s)</strong>
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Check-in Date *</label>
              <input 
                type="date" 
                required
                value={formData.checkInDate}
                onChange={e => handleDateChange('checkInDate', e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm font-semibold" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Check-out Date *</label>
              <input 
                type="date" 
                required
                value={formData.checkOutDate}
                onChange={e => handleDateChange('checkOutDate', e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm font-semibold" 
              />
            </div>
          </div>

          {/* Real-time Room Grid Selector with Availability Badges */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Select Room (प्रत्येक कोठाको उपलब्धता):</span>
              <span className="text-[11px] font-normal text-slate-500">Click any room card to assign</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {roomStatusList.map(r => {
                const isSelected = r.number === formData.roomNumber;
                return (
                  <div
                    key={r.number}
                    onClick={() => handleRoomChange(r.number)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected
                        ? r.isAvailable
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-rose-600 bg-rose-50/70 shadow-md ring-2 ring-rose-500/20'
                        : r.isAvailable
                        ? 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                        : 'border-rose-200 bg-rose-50/30 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-sm text-slate-900">Room {r.number}</p>
                        <p className="text-[11px] text-slate-500">{r.type} • Fl {r.floor}</p>
                      </div>
                      {r.isAvailable ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Check size={10} /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <XCircle size={10} /> Booked
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">NPR {r.dailyRate.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/nt</span></span>
                      {isSelected && (
                        <span className="text-[10px] font-black uppercase text-blue-700">Selected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

        {/* Guest Details Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800 font-bold text-base">
            <User size={18} className="text-purple-600" />
            <h2>Guest Information (अतिथि विवरण)</h2>
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
                required
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
              <label className="text-xs font-bold text-slate-700">Passport / National ID Number</label>
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
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm bg-white font-medium"
              >
                <option value="Walk-In">Walk-In (Reception Desk)</option>
                <option value="WhatsApp">WhatsApp Direct (+977-9851068219)</option>
                <option value="Phone">Phone Call Reservation</option>
                <option value="Direct Website">Direct Website Engine</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Agoda">Agoda</option>
                <option value="Airbnb">Airbnb</option>
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
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-sm font-semibold" 
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
                placeholder="e.g. Trekking luggage hold, upper floor quiet room" 
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
          <Link href="/reservations" className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition text-center">
            Cancel
          </Link>
          
          <button 
            type="submit" 
            disabled={!currentAvailability.isAvailable}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition shadow-md ${
              currentAvailability.isAvailable
                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
            }`}
          >
            {currentAvailability.isAvailable ? (
              <>
                <Save size={18} />
                Confirm & Lock Reservation
              </>
            ) : (
              <>
                <XCircle size={18} />
                Double Booking Blocked
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
