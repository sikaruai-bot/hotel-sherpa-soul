"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Users, ShieldCheck, Check, AlertCircle, Sparkles, Tag, ArrowRight, Loader2, Upload, FileText, X, Lock } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, ID_TYPES } from '@/lib/countries';

interface RoomCat {
  id: string;
  code: string;
  slug: string;
  name: string;
  rateUSD: number;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  description: string;
  amenities: string[];
  images: string[];
  totalAssignedRooms: number;
}

interface Props {
  initialCategories: RoomCat[];
}

export default function BookingEngineClient({ initialCategories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const paramCheckIn = searchParams.get('checkIn') || formatDate(tomorrow);
  const paramCheckOut = searchParams.get('checkOut') || formatDate(dayAfter);
  const paramAdults = searchParams.get('adults') || '2';
  const paramChildren = searchParams.get('children') || '0';
  const paramCat = searchParams.get('category') || '';
  const paramPromo = searchParams.get('promo') || 'DIRECT10';

  const [checkIn, setCheckIn] = useState(paramCheckIn);
  const [checkOut, setCheckOut] = useState(paramCheckOut);
  const [adults, setAdults] = useState(paramAdults);
  const [children, setChildren] = useState(paramChildren);
  const [selectedCatId, setSelectedCatId] = useState(paramCat || initialCategories[0]?.id || '');
  const [promoCode, setPromoCode] = useState(paramPromo);

  // Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestWhatsApp, setGuestWhatsApp] = useState('');
  const [guestCountry, setGuestCountry] = useState('Nepal');
  const [guestIdType, setGuestIdType] = useState('PASSPORT');
  const [guestIdNumber, setGuestIdNumber] = useState('');
  const [guestIdDocument, setGuestIdDocument] = useState<string | null>(null);
  const [guestIdFileName, setGuestIdFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('File exceeds 4MB limit. Please upload an ID photo or PDF under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setGuestIdDocument(result);
      setGuestIdFileName(file.name);
    };
    reader.onerror = () => {
      setUploadError('Failed to read document file. Please try another format.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = () => {
    setGuestIdDocument(null);
    setGuestIdFileName('');
    setUploadError('');
  };

  // Status & Dynamic Availability
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [categoryAvailability, setCategoryAvailability] = useState<Record<string, { available: boolean; remaining: number }>>({});
  const [checkingAvail, setCheckingAvail] = useState(false);

  // Calculate nights
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const nights = !isNaN(dIn.getTime()) && !isNaN(dOut.getTime()) && dOut > dIn
    ? Math.max(1, Math.ceil((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  // Selected category object
  const selectedCat = initialCategories.find(c => c.id === selectedCatId) || initialCategories[0];

  // Live availability verification
  useEffect(() => {
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) return;

    let isMounted = true;
    setCheckingAvail(true);

    fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted || !data.categories) return;
        const map: Record<string, { available: boolean; remaining: number }> = {};
        data.categories.forEach((item: any) => {
          map[item.category.id] = {
            available: item.isAvailable,
            remaining: item.availableRoomsCount,
          };
        });
        setCategoryAvailability(map);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setCheckingAvail(false);
      });

    return () => { isMounted = false; };
  }, [checkIn, checkOut, adults, children]);

  // Pricing calculations
  const baseTotal = (selectedCat?.rateUSD || 20) * nights;
  const isDirectPromo = promoCode.trim().toUpperCase() === 'DIRECT10';
  const isLongStayPromo = promoCode.trim().toUpperCase() === 'LONGSTAY15' && nights >= 14;
  const discountPercent = isLongStayPromo ? 15 : isDirectPromo ? 10 : 0;
  const discountAmount = (baseTotal * discountPercent) / 100;
  const grandTotal = Math.max(0, baseTotal - discountAmount);

  // Handle Booking Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      trackEvent('begin_booking', {
        room_type: selectedCat?.name,
        booking_value: grandTotal,
        nights,
      });

      // Capture UTMs from sessionStorage if present
      const utmSource = typeof window !== 'undefined' ? sessionStorage.getItem('hss_utm_source') || undefined : undefined;
      const utmMedium = typeof window !== 'undefined' ? sessionStorage.getItem('hss_utm_medium') || undefined : undefined;
      const utmCampaign = typeof window !== 'undefined' ? sessionStorage.getItem('hss_utm_campaign') || undefined : undefined;

      const payload = {
        checkIn,
        checkOut,
        adults: parseInt(adults),
        children: parseInt(children),
        categoryId: selectedCatId,
        guestName,
        guestEmail,
        guestPhone,
        guestWhatsApp: guestWhatsApp || guestPhone,
        guestCountry,
        guestIdType,
        guestIdNumber: guestIdNumber.trim() || undefined,
        guestIdDocument: guestIdDocument || undefined,
        specialRequests,
        promoCode,
        utmSource,
        utmMedium,
        utmCampaign,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete booking.');
      }

      trackEvent('booking_submit', {
        room_type: selectedCat?.name,
        booking_value: grandTotal,
        booking_number: data.bookingNumber,
      });

      // Persist client booking voucher for instant retrieval
      const bookingData = {
        bookingNumber: data.bookingNumber,
        guestName,
        guestEmail,
        guestPhone,
        categoryName: selectedCat?.name || 'Room',
        checkIn,
        checkOut,
        nights,
        adults: parseInt(adults),
        children: parseInt(children),
        totalAmountUSD: grandTotal,
        specialRequests: specialRequests || null,
        roomNumber: data.allocatedRoom || '201',
        floor: data.allocatedFloor || 2,
        whatsAppUrl: data.whatsAppUrl,
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`hss_booking_${data.bookingNumber}`, JSON.stringify(bookingData));
        sessionStorage.setItem('hss_last_booking', JSON.stringify(bookingData));
      }

      // Build robust query params so confirmation NEVER fails on serverless container switches
      const q = new URLSearchParams({
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        cat: selectedCat?.name || '',
        in: checkIn,
        out: checkOut,
        nights: nights.toString(),
        adults: adults.toString(),
        children: children.toString(),
        total: grandTotal.toFixed(0),
        room: String(data.allocatedRoom || '201'),
        floor: String(data.allocatedFloor || '2'),
      });

      router.push(`/booking-confirmation/${data.bookingNumber}?${q.toString()}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left 8 Cols: Date / Room / Guest Details */}
      <div className="lg:col-span-8 space-y-8">
        {/* Step 1: Dates & Guests */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900">Dates of Stay & Guests</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                min={formatDate(today)}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || formatDate(tomorrow)}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Adults</label>
              <select
                value={adults}
                onChange={e => setAdults(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="1">1 Adult</option>
                <option value="2">2 Adults</option>
                <option value="3">3 Adults</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Children</label>
              <select
                value={children}
                onChange={e => setChildren(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="0">0 Child</option>
                <option value="1">1 Child</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Room Category Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-lg font-bold text-slate-900">Choose Room Category</h2>
            </div>
            {checkingAvail && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking live inventory...
              </span>
            )}
          </div>

          <div className="space-y-4 pt-2">
            {initialCategories.map(cat => {
              const isSelected = cat.id === selectedCatId;
              const avail = categoryAvailability[cat.id];
              const isSoldOut = avail !== undefined && !avail.available;
              const numAdults = parseInt(adults);
              const numChildren = parseInt(children);
              const exceedsCapacity = numAdults > cat.maxAdults || numChildren > cat.maxChildren || (numAdults + numChildren) > cat.maxGuests;

              return (
                <div
                  key={cat.id}
                  onClick={() => !isSoldOut && !exceedsCapacity && setSelectedCatId(cat.id)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40 shadow-md'
                      : isSoldOut || exceedsCapacity
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <Image
                        src={cat.images[0] || '/images/doubleBedRoom.jpeg'}
                        alt={cat.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Max: {cat.maxAdults} Adults {cat.maxChildren > 0 ? `+ ${cat.maxChildren} Child` : ''} • Quiet sleep
                      </p>
                      {exceedsCapacity ? (
                        <span className="text-[11px] font-bold text-rose-600 block mt-1">
                          ⚠️ Exceeds capacity for {numAdults} Adults & {numChildren} Children
                        </span>
                      ) : isSoldOut ? (
                        <span className="text-[11px] font-bold text-rose-600 block mt-1">
                          Fully booked for selected dates
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-700 block mt-1">
                          ✓ Available for your dates
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-slate-900">USD ${cat.rateUSD}</span>
                      <span className="text-xs text-slate-500"> / night</span>
                    </div>
                    <span className="text-xs text-slate-500 block">
                      Total: USD ${(cat.rateUSD * nights).toFixed(0)} ({nights} nights)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Guest Contact Information */}
        <form onSubmit={handleBookingSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-900">Guest Details & Confirmation</h2>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="david@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={guestPhone}
                onChange={e => setGuestPhone(e.target.value)}
                placeholder="+1 555 0192"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                WhatsApp Number (For fast check-in)
              </label>
              <input
                type="tel"
                value={guestWhatsApp}
                onChange={e => setGuestWhatsApp(e.target.value)}
                placeholder="Same as phone"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Country / Nationality *
              </label>
              <select
                value={guestCountry}
                onChange={e => setGuestCountry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                <optgroup label="Top Destinations">
                  {POPULAR_COUNTRIES.map(c => (
                    <option key={`pop_${c.code}`} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Countries">
                  {ALL_COUNTRIES.map(c => (
                    <option key={`all_${c.code}`} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Identity Document Type *
              </label>
              <select
                value={guestIdType}
                onChange={e => setGuestIdType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                {ID_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ID / Document Number (Optional)
              </label>
              <input
                type="text"
                value={guestIdNumber}
                onChange={e => setGuestIdNumber(e.target.value)}
                placeholder="e.g. PP092837 / 12-01-76-00123"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono uppercase"
              />
            </div>
          </div>

          {/* ID Document Photo / PDF Upload Box */}
          <div className="space-y-2 p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-700" />
                <span>Upload ID Document / Photo (Optional for Fast Check-in)</span>
              </label>
              <span className="text-[11px] text-amber-800 font-medium">Passport / Nagarikta / License</span>
            </div>

            {!guestIdDocument ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-xl p-4 sm:p-5 text-center cursor-pointer hover:bg-amber-100/40 transition-colors bg-white/70">
                <Upload className="w-6 h-6 text-amber-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-800">Click or tap to upload photo or PDF scan</span>
                <span className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WebP or PDF (Max 4MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-xl p-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {guestIdDocument.startsWith('data:image') ? (
                    <img
                      src={guestIdDocument}
                      alt="ID Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">{guestIdFileName}</p>
                    <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>ID attached ready for front desk check-in</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDocument}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-2 shrink-0 cursor-pointer"
                  title="Remove document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-red-600 font-medium">{uploadError}</p>
            )}

            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Confidential &amp; Encrypted: Stored securely for Hotel Sherpa Soul front desk &amp; tourist safety registry.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Promo Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="DIRECT10"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono uppercase"
                />
                <Tag className="w-4 h-4 text-amber-600 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Special Requests (Optional)
            </label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="Arrival flight details, quiet room, late check-in, etc."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-extrabold text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirming Direct Reservation...</span>
              </>
            ) : (
              <>
                <span>Confirm Direct Booking (USD ${grandTotal.toFixed(0)})</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right 4 Cols: Live Price Summary & Guarantee */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 sticky top-28 border border-slate-800">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Booking Breakdown</span>
            <h3 className="text-xl font-bold">{selectedCat?.name}</h3>
            <span className="text-xs text-slate-400 block">
              {checkIn} → {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'})
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Nightly Rate:</span>
              <span>USD ${selectedCat?.rateUSD} × {nights}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>USD ${baseTotal.toFixed(0)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Direct Promo ({discountPercent}% OFF):</span>
                <span>- USD ${discountAmount.toFixed(0)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Grand Total Due:</span>
              <span className="text-2xl font-black text-amber-400">USD ${grandTotal.toFixed(0)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-[11px] text-slate-400 border-t border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>No pre-payment required. Pay on arrival.</span>
            </div>
            <p>
              💳 Payment methods accepted at front desk: Cash (USD or NPR), Bank Transfer, or eSewa/Khalti.
            </p>
            <p>
              ⏰ Check-in: 14:00 • Check-out: 12:00. Quiet hours observed from 22:00 to 07:00.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
