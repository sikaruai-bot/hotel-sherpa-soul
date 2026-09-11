"use client";

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  BedDouble, 
  User, 
  Phone, 
  CreditCard, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter,
  Layers,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Compass,
  Key,
  Check,
  Mail,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { usePms, Reservation, Room, GuestIdType, PurposeOfVisitType } from '@/context/PmsContext';

export default function ReservationsPage() {
  const { reservations, rooms, checkInGuest, checkOutGuest } = usePms();

  // Current view mode: 'month' (classic calendar) or 'timeline' (room tape-chart)
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter by room or status
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Selected reservation for popup detail modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  // Arrival Check-In Modal State (Full Nepal Police & Tourism KYC)
  const [checkInRes, setCheckInRes] = useState<Reservation | null>(null);
  const [idType, setIdType] = useState<GuestIdType>('Passport');
  const [idNumber, setIdNumber] = useState('');
  const [idIssuedPlace, setIdIssuedPlace] = useState('');
  const [guestFullName, setGuestFullName] = useState('');
  const [nationality, setNationality] = useState('International');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maleGuests, setMaleGuests] = useState(1);
  const [femaleGuests, setFemaleGuests] = useState(0);
  const [childGuests, setChildGuests] = useState(0);
  const [accompanyingGuests, setAccompanyingGuests] = useState('');
  const [address, setAddress] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState<PurposeOfVisitType>('Trekking & Mountaineering');
  const [arrivedFrom, setArrivedFrom] = useState('');
  const [nextDestination, setNextDestination] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [keyHandedOver, setKeyHandedOver] = useState(true);

  const openCheckInModal = (res: Reservation) => {
    setCheckInRes(res);
    setGuestFullName(res.guestName || '');
    const isNepali = res.nationality?.toLowerCase() === 'nepali' || res.nationality?.toLowerCase() === 'nepal';
    setIdType(res.idType || (isNepali ? 'Citizenship (नागरिकता)' : 'Passport'));
    setIdNumber(res.idNumber || res.passportNumber || '');
    setIdIssuedPlace(res.idIssuedPlace || '');
    setNationality(res.nationality || (isNepali ? 'Nepali' : 'International'));
    setGuestPhone(res.phone || '');
    setGuestEmail(res.email || '');
    setGender(res.gender || 'Male');
    const initialAdults = res.adults || 1;
    const initialMale = res.maleGuests !== undefined ? res.maleGuests : (res.gender === 'Female' ? 0 : 1);
    const initialFemale = res.femaleGuests !== undefined ? res.femaleGuests : (res.gender === 'Female' ? 1 : Math.max(0, initialAdults - initialMale));
    const initialChild = res.childGuests !== undefined ? res.childGuests : (res.children || 0);
    setMaleGuests(initialMale);
    setFemaleGuests(initialFemale);
    setChildGuests(initialChild);
    setAccompanyingGuests(res.accompanyingGuests || '');
    setAddress(res.address || '');
    setPurposeOfVisit(res.purposeOfVisit || 'Trekking & Mountaineering');
    setArrivedFrom(res.arrivedFrom || '');
    setNextDestination(res.nextDestination || '');
    setEmergencyContactName(res.emergencyContactName || '');
    setEmergencyContactPhone(res.emergencyContactPhone || '');
    setVehicleNumber(res.vehicleNumber || '');
    setKeyHandedOver(res.keyHandedOver !== undefined ? res.keyHandedOver : true);
  };

  const handleConfirmCheckIn = () => {
    if (!checkInRes) return;
    checkInGuest(checkInRes.id, {
      guestName: guestFullName || checkInRes.guestName,
      idType,
      idNumber: idNumber || checkInRes.passportNumber,
      passportNumber: idNumber || checkInRes.passportNumber,
      idIssuedPlace,
      nationality,
      phone: guestPhone,
      email: guestEmail,
      gender,
      maleGuests,
      femaleGuests,
      childGuests,
      adults: (maleGuests + femaleGuests) > 0 ? (maleGuests + femaleGuests) : 1,
      children: childGuests,
      accompanyingGuests,
      address,
      purposeOfVisit,
      arrivedFrom,
      nextDestination,
      emergencyContactName,
      emergencyContactPhone,
      vehicleNumber,
      keyHandedOver,
    });
    setCheckInRes(null);
    setSelectedRes(null);
  };

  // New reservation modal
  const [showNewResModal, setShowNewResModal] = useState(false);

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      if (selectedRoomFilter !== 'ALL' && res.roomNumber !== selectedRoomFilter) return false;
      if (selectedStatusFilter !== 'ALL' && res.status !== selectedStatusFilter) return false;
      return true;
    });
  }, [reservations, selectedRoomFilter, selectedStatusFilter]);

  // Color helper based on reservation status & source
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return { bg: 'bg-blue-600', text: 'text-white', label: 'Occupied' };
      case 'CONFIRMED':
        return { bg: 'bg-emerald-600', text: 'text-white', label: 'Confirmed' };
      case 'CHECKED_OUT':
        return { bg: 'bg-slate-500', text: 'text-white', label: 'Checked Out' };
      case 'CANCELLED':
        return { bg: 'bg-rose-600', text: 'text-white', label: 'Cancelled' };
      default:
        return { bg: 'bg-amber-500', text: 'text-slate-950', label: status };
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'Booking.com':
        return { bg: 'bg-blue-900', text: 'text-blue-100' };
      case 'Agoda':
        return { bg: 'bg-red-800', text: 'text-red-100' };
      case 'Airbnb':
        return { bg: 'bg-rose-700', text: 'text-rose-100' };
      case 'Direct Website':
        return { bg: 'bg-emerald-800', text: 'text-emerald-100' };
      default:
        return { bg: 'bg-slate-800', text: 'text-slate-200' };
    }
  };

  // Check if a reservation overlaps with a specific date
  const getReservationsForDate = (dateNumber: number) => {
    const targetDate = new Date(year, month, dateNumber);
    targetDate.setHours(0, 0, 0, 0);

    return filteredReservations.filter(res => {
      const checkIn = new Date(res.checkInDate);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(res.checkOutDate);
      checkOut.setHours(23, 59, 59, 999);

      return targetDate >= checkIn && targetDate <= checkOut;
    });
  };

  // Check if today
  const isToday = (dayNum: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === dayNum;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarDays className="text-blue-600" />
            Reservation & Tape-Chart Calendar
          </h1>
          <p className="text-xs text-slate-500">
            Real-time room availability, OTA sync reservations, and guest bookings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon size={14} /> Month View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'timeline' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={14} /> Room Tape-Chart
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm px-1.5 py-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 font-bold text-xs text-slate-800 min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={setToday}
              className="ml-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
            >
              Today
            </button>
          </div>

          {/* New Reservation button */}
          <Link
            href="/reservations/new"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus size={15} /> + New Reservation
          </Link>
        </div>
      </div>

      {/* Filter & Status Legend Bar with Double-Booking Shield */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Filter size={13} /> Filter:
          </span>
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All 6 Rooms</option>
            {rooms.map(r => (
              <option key={r.id} value={r.number}>Room {r.number} ({r.type})</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Occupied / Checked-In</option>
            <option value="CHECKED_OUT">Checked-Out</option>
          </select>
        </div>

        {/* Double Booking Shield Badge & Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Zero-Double-Booking Shield: Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Occupied
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Confirmed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Check-In Today
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Checked Out
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTH CALENDAR VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Days of the Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 bg-slate-50/50 p-2 text-slate-300 select-none"></div>
            ))}

            {/* Actual Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dayReservations = getReservationsForDate(dayNumber);
              const currentDayIsToday = isToday(dayNumber);

              return (
                <div
                  key={`day-${dayNumber}`}
                  className={`min-h-[115px] p-1.5 flex flex-col justify-between transition hover:bg-slate-50/70 ${
                    currentDayIsToday ? 'bg-amber-50/40' : 'bg-white'
                  }`}
                >
                  {/* Day number header */}
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        currentDayIsToday
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    {dayReservations.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayReservations.length} {dayReservations.length === 1 ? 'room' : 'rooms'}
                      </span>
                    )}
                  </div>

                  {/* Reservation pills */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                    {dayReservations.map(res => {
                      const badge = getStatusBadge(res.status);
                      return (
                        <div
                          key={res.id}
                          onClick={() => setSelectedRes(res)}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition shadow-2xs truncate flex items-center justify-between gap-1 hover:brightness-110 ${badge.bg} ${badge.text}`}
                          title={`Room ${res.roomNumber} - ${res.guestName} (${res.source})`}
                        >
                          <span className="truncate">
                            R{res.roomNumber} {res.guestName.split(' ')[0]}
                          </span>
                          <span className="text-[9px] opacity-80 shrink-0 uppercase">
                            {res.source.substring(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ROOM TIMELINE / TAPE-CHART VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
            <h2 className="text-sm font-bold text-slate-800">
              Tape-Chart Overview — {monthNames[month]} {year}
            </h2>
            <span className="text-xs text-slate-500">Scroll horizontally to inspect full month</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b">
                  <th className="p-3 text-left font-bold sticky left-0 bg-slate-100 z-10 w-44 min-w-[170px] shadow-sm">
                    Room & Type
                  </th>
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const currentDayIsToday = isToday(dayNum);
                    return (
                      <th
                        key={`th-${dayNum}`}
                        className={`p-2 font-bold text-center border-l border-slate-200/60 min-w-[42px] ${
                          currentDayIsToday ? 'bg-amber-100/80 text-amber-900' : ''
                        }`}
                      >
                        {dayNum}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map(room => (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition">
                    {/* Room row header */}
                    <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-sm font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">Room {room.number}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold truncate max-w-[90px]">
                          {room.type}
                        </span>
                      </div>
                    </td>

                    {/* Day cells for this room */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const targetDate = new Date(year, month, dayNum);
                      targetDate.setHours(0, 0, 0, 0);

                      const roomBookings = reservations.filter(r => {
                        if (r.roomNumber !== room.number) return false;
                        if (r.status === 'CANCELLED') return false;
                        const checkIn = new Date(r.checkInDate);
                        checkIn.setHours(0, 0, 0, 0);
                        const checkOut = new Date(r.checkOutDate);
                        checkOut.setHours(23, 59, 59, 999);
                        return targetDate >= checkIn && targetDate <= checkOut;
                      });

                      const hasConflict = roomBookings.length > 1;
                      const booking = roomBookings[0];
                      const currentDayIsToday = isToday(dayNum);

                      return (
                        <td
                          key={`cell-${room.id}-${dayNum}`}
                          className={`p-1 border-l border-slate-100 text-center relative ${
                            hasConflict ? 'bg-rose-100/90 ring-1 ring-rose-400' : currentDayIsToday ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          {hasConflict ? (
                            <div
                              onClick={() => setSelectedRes(booking)}
                              className="h-7 rounded-md cursor-pointer text-[9px] font-black flex items-center justify-center transition shadow-xs bg-rose-600 text-white animate-pulse"
                              title={`⚠️ Double Booking Alert: ${roomBookings.length} overlapping reservations!`}
                            >
                              ⚠️ Overlap ({roomBookings.length})
                            </div>
                          ) : booking ? (
                            <div
                              onClick={() => setSelectedRes(booking)}
                              className={`h-7 rounded-md cursor-pointer text-[9px] font-bold flex items-center justify-center transition shadow-2xs hover:scale-105 ${
                                booking.status === 'CHECKED_IN'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                              title={`Room ${booking.roomNumber} - ${booking.guestName}`}
                            >
                              {booking.guestName.split(' ')[0]}
                            </div>
                          ) : (
                            <div className="h-7 rounded flex items-center justify-center text-slate-300 text-[10px]">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP: RESERVATION DETAIL MODAL */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {selectedRes.source} Booking
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white mt-0.5">
                  {selectedRes.guestName}
                </h3>
                <p className="text-xs text-slate-300">
                  Room {selectedRes.roomNumber} • {selectedRes.roomType}
                </p>
              </div>
              <button
                onClick={() => setSelectedRes(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Check-In</span>
                  <p className="font-bold text-slate-800">
                    {new Date(selectedRes.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Check-Out</span>
                  <p className="font-bold text-slate-800">
                    {new Date(selectedRes.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <User size={13} className="text-blue-600" /> Guest Details
                </h4>
                <div className="space-y-1 text-slate-600 pl-4 border-l-2 border-slate-200">
                  <div className="flex justify-between">
                    <span>Passport / ID:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedRes.passportNumber || 'Not recorded yet'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-bold text-slate-800">{selectedRes.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nationality:</span>
                    <span className="font-medium text-slate-800">{selectedRes.nationality || 'International'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Occupancy:</span>
                    <span className="font-bold text-slate-800">
                      {selectedRes.maleGuests !== undefined
                        ? `${(selectedRes.maleGuests || 0) + (selectedRes.femaleGuests || 0) + (selectedRes.childGuests || 0)} Guests (${selectedRes.maleGuests}👨 ${selectedRes.femaleGuests}👩 ${selectedRes.childGuests}🧒)`
                        : `${selectedRes.adults} Adults${selectedRes.children ? `, ${selectedRes.children} Ch` : ''}`}
                    </span>
                  </div>
                  {selectedRes.accompanyingGuests && (
                    <div className="flex justify-between text-[11px] pt-0.5">
                      <span>Accompanying:</span>
                      <span className="font-semibold text-blue-700 truncate max-w-[180px]">{selectedRes.accompanyingGuests}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing & Settlement */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <CreditCard size={13} className="text-emerald-600" /> Billing & Payment
                </h4>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Stay Charges:</span>
                    <span className="font-bold text-slate-800">NPR {selectedRes.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-emerald-600">NPR {selectedRes.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-xs font-black">
                    <span>Balance Due:</span>
                    <span className={selectedRes.totalAmount - selectedRes.paidAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      NPR {Math.max(0, selectedRes.totalAmount - selectedRes.paidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Quick Check In / Check Out */}
              <div className="pt-2 flex gap-2">
                {selectedRes.status === 'CONFIRMED' && (
                  <button
                    onClick={() => {
                      openCheckInModal(selectedRes);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 size={14} /> Arrival Check-In (Full Info)
                  </button>
                )}
                {selectedRes.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => {
                      checkOutGuest(selectedRes.id, { method: 'Cash NPR', amount: Math.max(0, selectedRes.totalAmount - selectedRes.paidAmount) });
                      setSelectedRes(null);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Clock size={14} /> Settle & Check-Out
                  </button>
                )}
                <button
                  onClick={() => setSelectedRes(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARRIVAL CHECK-IN FULL KYC MODAL */}
      {checkInRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Arrival Check-In & Nepal Tourism Record
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Guest Registration Card: Room {checkInRes.roomNumber} ({checkInRes.roomType})
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in guest identification & travel history as required by Nepal Tourism and Police regulations.
                </p>
              </div>
              <button 
                onClick={() => setCheckInRes(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Sections */}
            <div className="space-y-4 text-xs">
              {/* 1. Official ID Document Details */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-amber-700" />
                  <span>Official Guest Identification (परिचयपत्र विवरण)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ID Document Type (प्रकार) *
                    </label>
                    <select
                      value={idType}
                      onChange={e => setIdType(e.target.value as GuestIdType)}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl outline-none font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="Passport">Passport (राहदानी / पासपोर्ट - Foreign Tourists)</option>
                      <option value="Citizenship (नागरिकता)">Citizenship (नागरिकता प्रमाणपत्र - Nepali)</option>
                      <option value="National ID (राष्ट्रिय परिचयपत्र)">National ID (राष्ट्रिय परिचयपत्र - NID)</option>
                      <option value="Driving License">Driving License (सवारी चालक अनुमतिपत्र)</option>
                      <option value="Voter ID">Voter ID (मतदाता परिचयपत्र)</option>
                      <option value="PAN Card">PAN Card (स्थायी लेखा नम्बर)</option>
                      <option value="Other Official ID">Other Official Government ID (अन्य)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {idType} Number *
                    </label>
                    <input 
                      type="text" 
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      placeholder={
                        idType === 'Passport' ? 'e.g. PP12345678' :
                        idType === 'Citizenship (नागरिकता)' ? 'e.g. 27-01-75-01234' :
                        'Enter document ID'
                      }
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl outline-none font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Issued District / Country (जारी जिल्ला / देश)
                    </label>
                    <input 
                      type="text" 
                      value={idIssuedPlace}
                      onChange={e => setIdIssuedPlace(e.target.value)}
                      placeholder="e.g. Kathmandu / Solukhumbu / USA"
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl outline-none font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Guest Bio & Contact Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <User size={15} className="text-blue-600" />
                  <span>Guest Personal & Contact Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name (पूरा नाम)</label>
                    <input 
                      type="text" 
                      value={guestFullName}
                      onChange={e => setGuestFullName(e.target.value)}
                      placeholder="Guest full legal name"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nationality (राष्ट्रियता)</label>
                    <input 
                      type="text" 
                      value={nationality}
                      onChange={e => setNationality(e.target.value)}
                      placeholder="e.g. Nepali, French"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    >
                      <option value="Male">Male (पुरुष)</option>
                      <option value="Female">Female (महिला)</option>
                      <option value="Other">Other (अन्य)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone / WhatsApp *</label>
                    <input 
                      type="tel" 
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      placeholder="+977..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Permanent Address (स्थायी ठेगाना)</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. Pokhara-6 or Paris"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Number of Guests (Male, Female & Children Breakdown) */}
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <Users size={15} className="text-blue-700" />
                    <span>Number of Guests Breakdown (पाहुना संख्या विवरण) *</span>
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                    Total: {maleGuests + femaleGuests + childGuests} Guests ({maleGuests + femaleGuests} Adults, {childGuests} Child)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Male Guests */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <span>👨 Male (पुरुष)</span>
                      </label>
                      <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded">Adult</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMaleGuests(Math.max(0, maleGuests - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-95 text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={maleGuests}
                        onChange={e => setMaleGuests(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-slate-900 text-sm py-1 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setMaleGuests(maleGuests + 1)}
                        className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold flex items-center justify-center transition active:scale-95 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Female Guests */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <span>👩 Female (महिला)</span>
                      </label>
                      <span className="text-[10px] text-pink-600 font-mono font-bold bg-pink-50 px-1.5 py-0.5 rounded">Adult</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFemaleGuests(Math.max(0, femaleGuests - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-95 text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={femaleGuests}
                        onChange={e => setFemaleGuests(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-slate-900 text-sm py-1 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setFemaleGuests(femaleGuests + 1)}
                        className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold flex items-center justify-center transition active:scale-95 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Child Guests */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <span>🧒 Child (बालबालिका)</span>
                      </label>
                      <span className="text-[10px] text-amber-600 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded">&lt; 12 Yrs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildGuests(Math.max(0, childGuests - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition active:scale-95 text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={childGuests}
                        onChange={e => setChildGuests(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center font-bold text-slate-900 text-sm py-1 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setChildGuests(childGuests + 1)}
                        className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold flex items-center justify-center transition active:scale-95 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accompanying Guests' Details / Names */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Accompanying Guests' Names & Details (सँगै बस्ने थप पाहुनाहरूको नाम / उमेर / परिचय)
                  </label>
                  <input
                    type="text"
                    value={accompanyingGuests}
                    onChange={e => setAccompanyingGuests(e.target.value)}
                    placeholder="e.g. Maya Sherpa (Female, Age 28), Dawa Sherpa (Child, Age 6)"
                    className="w-full p-2.5 bg-white border border-blue-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Mention names of spouse, family members, or children sharing the room for hotel police registry and fire safety.
                  </p>
                </div>
              </div>

              {/* 4. Travel Information (Nepal Tourism Record) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Compass size={15} className="text-emerald-600" />
                  <span>Travel Record & Nepal Tourism Registration</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Purpose of Visit (भ्रमणको उद्देश्य)</label>
                    <select
                      value={purposeOfVisit}
                      onChange={e => setPurposeOfVisit(e.target.value as PurposeOfVisitType)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    >
                      <option value="Trekking & Mountaineering">Trekking & Mountaineering (ट्रेकिङ)</option>
                      <option value="Tourism & Holiday">Tourism & Holiday (पर्यटन)</option>
                      <option value="Business & Work">Business & Work (व्यापार)</option>
                      <option value="Transit & Stopover">Transit & Stopover (ट्रान्जिट)</option>
                      <option value="Personal / Family">Personal / Family (व्यक्तिगत)</option>
                      <option value="Other">Other (अन्य)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Arrived From (कहाँबाट)</label>
                    <input 
                      type="text" 
                      value={arrivedFrom}
                      onChange={e => setArrivedFrom(e.target.value)}
                      placeholder="e.g. Lukla / Airport"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Next Destination (अर्को ठाउँ)</label>
                    <input 
                      type="text" 
                      value={nextDestination}
                      onChange={e => setNextDestination(e.target.value)}
                      placeholder="e.g. Everest Base Camp"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Emergency Contact & Key Handover */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Phone size={15} className="text-rose-600" />
                  <span>Emergency Contact & Room Key Handover</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Contact Person</label>
                    <input 
                      type="text" 
                      value={emergencyContactName}
                      onChange={e => setEmergencyContactName(e.target.value)}
                      placeholder="Guide / Friend / Family name"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Phone</label>
                    <input 
                      type="tel" 
                      value={emergencyContactPhone}
                      onChange={e => setEmergencyContactPhone(e.target.value)}
                      placeholder="Contact telephone"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle / Bike No. (Optional)</label>
                    <input 
                      type="text" 
                      value={vehicleNumber}
                      onChange={e => setVehicleNumber(e.target.value)}
                      placeholder="e.g. Ba 2 Pa 4512"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={keyHandedOver}
                      onChange={(e) => setKeyHandedOver(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-600"
                    />
                    <Key size={14} className="text-amber-500" />
                    <span>Physical Room Key or Keycard handed over to guest</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
              <button 
                onClick={() => setCheckInRes(null)}
                className="px-4 py-2.5 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCheckIn}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 hover:scale-[1.01] transition"
              >
                <CheckCircle2 size={16} /> Complete Arrival Check-In & Issue Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW RESERVATION QUICK MODAL */}
      {showNewResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Create Direct Booking</h3>
                <p className="text-xs text-slate-400">Front Desk & Walk-In Reservation</p>
              </div>
              <button onClick={() => setShowNewResModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <BedDouble size={24} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                To create a new reservation with instant room allocation and Nepal VAT Pan receipt, you can use the Front Desk Check-in Engine.
              </p>
              <div className="pt-2 flex gap-2">
                <a
                  href="/front-desk"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition block text-center"
                >
                  Go to Front Desk Desk →
                </a>
                <button
                  onClick={() => setShowNewResModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
