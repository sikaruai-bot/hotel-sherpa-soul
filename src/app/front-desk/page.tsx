"use client";

import React, { useState, useRef } from 'react';
import { 
  LogIn, 
  LogOut, 
  Luggage, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  CreditCard, 
  Printer, 
  X, 
  UserCheck, 
  QrCode, 
  MapPin, 
  Compass, 
  Phone, 
  Mail, 
  User, 
  Check, 
  Key, 
  Users, 
  UserX, 
  Camera, 
  Upload, 
  AlertOctagon, 
  Sparkles, 
  RotateCcw 
} from 'lucide-react';
import { usePms, Reservation, GuestIdType, PurposeOfVisitType, Invoice } from '@/context/PmsContext';
import SelfCheckinQrModal from '@/components/SelfCheckinQrModal';
import LiveCameraCaptureModal from '@/components/LiveCameraCaptureModal';
import PanInvoicePrint from '@/components/PanInvoicePrint';

export default function FrontDeskPage() {
  const { reservations, checkInGuest, checkOutGuest, createInvoice, releaseNoShow, invoices } = usePms();

  // Printable PAN Bill State
  const [invoiceForPanPrint, setInvoiceForPanPrint] = useState<Invoice | null>(null);

  // Full Check-In Modal State
  const [selectedResForCheckIn, setSelectedResForCheckIn] = useState<Reservation | null>(null);
  const [guestPhotoUrl, setGuestPhotoUrl] = useState('');
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [checkInLookupAlert, setCheckInLookupAlert] = useState<any | null>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState(false);

  const handleIdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setGuestPhotoUrl(json.data.url);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setGuestPhotoUrl(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setGuestPhotoUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingId(false);
    }
  };

  // Full Details / GRC Modal State
  const [selectedResForDetails, setSelectedResForDetails] = useState<Reservation | null>(null);
  
  const [selectedResForCheckOut, setSelectedResForCheckOut] = useState<Reservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'eSewa' | 'Khalti' | 'Cash NPR' | 'Cash USD' | 'Visa'>('eSewa');
  const [extraCharges, setExtraCharges] = useState(0);
  const [checkOutPayAmount, setCheckOutPayAmount] = useState<number | null>(null);

  const [luggageNotes, setLuggageNotes] = useState<string[]>(['Sarah Connor (Room 202) - 2 Backpacks stored in reception closet.']);
  const [newLuggageText, setNewLuggageText] = useState('');
  const [showLuggageModal, setShowLuggageModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string | undefined>(undefined);

  // Filter Arrivals & Departures
  const arrivals = reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN');
  const checkedInList = reservations.filter(r => r.status === 'CHECKED_IN');

  const openCheckInModal = (res: Reservation) => {
    setSelectedResForCheckIn(res);
    setGuestFullName(res.guestName || '');
    setGuestPhotoUrl(res.photoUrl || '');
    setCheckInLookupAlert(null);
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

  // Real-time lookup for check-in modal to warn of blacklist / unpaid dues
  React.useEffect(() => {
    if (!selectedResForCheckIn) return;
    const idVal = idNumber.trim();
    const phoneVal = guestPhone.trim();

    if (idVal.length < 3 && phoneVal.length < 6) {
      setCheckInLookupAlert(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams();
        if (idVal.length >= 3) queryParams.set('idNumber', idVal);
        if (phoneVal.length >= 6) queryParams.set('phone', phoneVal);

        const res = await fetch(`/api/guests/lookup?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.matched) {
            setCheckInLookupAlert(data);
            if (!guestPhotoUrl && data.guest?.photoUrl) {
              setGuestPhotoUrl(data.guest.photoUrl);
            }
          }
        }
      } catch (err) {
        console.warn('Check-in ID lookup error:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [idNumber, guestPhone, selectedResForCheckIn, guestPhotoUrl]);

  const handleConfirmCheckIn = () => {
    if (!selectedResForCheckIn) return;
    checkInGuest(selectedResForCheckIn.id, {
      guestName: guestFullName || selectedResForCheckIn.guestName,
      idType,
      idNumber: idNumber || selectedResForCheckIn.passportNumber,
      passportNumber: idNumber || selectedResForCheckIn.passportNumber,
      photoUrl: guestPhotoUrl || selectedResForCheckIn.photoUrl,
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
    setSelectedResForCheckIn(null);
  };

  const handleConfirmCheckOut = () => {
    if (!selectedResForCheckOut) return;
    const remainingBalance = Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges;
    const amountPaidNow = checkOutPayAmount !== null ? checkOutPayAmount : remainingBalance;
    const totalPaid = selectedResForCheckOut.paidAmount + amountPaidNow;
    const grandTotal = selectedResForCheckOut.totalAmount + extraCharges;
    const isFullyPaid = totalPaid >= grandTotal && grandTotal > 0;
    
    // Auto-create invoice with accurate paid amount and due status
    const created = createInvoice({
      reservationId: selectedResForCheckOut.id,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      guestName: selectedResForCheckOut.guestName,
      roomNumber: selectedResForCheckOut.roomNumber,
      items: [
        { description: `Room Stay: ${selectedResForCheckOut.roomType}`, quantity: 1, unitPrice: selectedResForCheckOut.totalAmount, total: selectedResForCheckOut.totalAmount },
        ...(extraCharges > 0 ? [{ description: 'Incidental / Kitchen / Laundry charges', quantity: 1, unitPrice: extraCharges, total: extraCharges }] : [])
      ],
      subtotal: grandTotal,
      taxAmount: 0,
      serviceCharge: 0,
      discount: 0,
      grandTotal: grandTotal,
      paidAmount: totalPaid,
      paymentMethod: amountPaidNow > 0 ? (paymentMethod as any) : (selectedResForCheckOut.paidAmount > 0 ? 'Cash NPR' : undefined),
      status: isFullyPaid ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
    });

    checkOutGuest(selectedResForCheckOut.id, {
      method: paymentMethod as any,
      amount: amountPaidNow,
    });

    setSelectedResForCheckOut(null);
    setCheckOutPayAmount(null);
    setInvoiceForPanPrint(created);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="text-blue-600" /> Front Desk Daily Operations
          </h1>
          <p className="text-xs text-slate-500">Fast check-in, passport police compliance, checkout balance settlement & luggage</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => {
              setSelectedBookingRef(undefined);
              setShowQrModal(true);
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition shadow-sm"
          >
            <QrCode size={16} /> Express Self Check-In QR
          </button>
          <button 
            onClick={() => setShowLuggageModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Luggage size={16} className="text-amber-600" /> Luggage Tag Log ({luggageNotes.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Arrivals Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LogIn size={18} className="text-blue-300" />
              <h2 className="font-bold text-sm">Arrivals & Pending Check-Ins</h2>
            </div>
            <span className="bg-blue-600/80 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
              {arrivals.length} Bookings
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[600px]">
            {arrivals.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No pending arrivals today.</p>
            ) : (
              arrivals.map((res) => (
                <div key={res.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{res.guestName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Room {res.roomNumber} ({res.roomType})
                        </span>
                        <span>•</span>
                        <span>{res.nationality || 'Foreign Guest'}</span>
                        <span>•</span>
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <Users size={11} className="text-blue-600" />
                          {res.maleGuests !== undefined 
                            ? `${(res.maleGuests || 0) + (res.femaleGuests || 0) + (res.childGuests || 0)} Guests (${res.maleGuests}👨 ${res.femaleGuests}👩 ${res.childGuests}🧒)`
                            : `${res.adults} Adults${res.children ? `, ${res.children} Ch` : ''}`
                          }
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{res.source}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      res.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {res.status === 'CHECKED_IN' ? 'In-House (Checked-In)' : 'Arrival (Confirmed)'}
                    </span>
                  </div>

                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-wrap justify-between items-center gap-2">
                    <span className="text-slate-600">
                      Stay: <strong className="text-slate-800">{res.checkInDate} to {res.checkOutDate}</strong>
                    </span>
                    <span className="text-slate-600">
                      ID ({res.idType || 'Document'}): <strong className={res.idNumber || res.passportNumber ? 'text-emerald-700 font-mono font-bold' : 'text-rose-600'}>{res.idNumber || res.passportNumber || 'Not Registered'}</strong>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {res.status === 'CONFIRMED' ? (
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => openCheckInModal(res)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01]"
                        >
                          <CheckCircle size={15} /> Arrival Check-In (Full Info)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBookingRef(res.otaReference || res.id);
                            setShowQrModal(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                          title="Generate Self Check-In QR for this guest"
                        >
                          <QrCode size={14} /> QR
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to mark ${res.guestName} as No-Show and release Room ${res.roomNumber} as AVAILABLE?`)) {
                              releaseNoShow(res.id);
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          title="Guest did not arrive. Immediately release room so other guests can book it."
                        >
                          <UserX size={14} /> Release Room (No-Show)
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => openCheckInModal(res)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <FileText size={15} /> Edit Guest Info
                        </button>
                        <button 
                          onClick={() => setSelectedResForDetails(res)}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Printer size={15} /> View / Print GRC
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Departures Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-orange-900 to-amber-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LogOut size={18} className="text-orange-300" />
              <h2 className="font-bold text-sm">Departures & Settle Bill</h2>
            </div>
            <span className="bg-orange-600/80 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
              {checkedInList.length} In-House
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[600px]">
            {checkedInList.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No in-house guests currently.</p>
            ) : (
              checkedInList.map((res) => {
                const balanceDue = Math.max(0, res.totalAmount - res.paidAmount);

                return (
                  <div key={res.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{res.guestName}</h3>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Room <strong className="text-slate-800">{res.roomNumber}</strong> • Checkout: <strong className="text-slate-800">{res.checkOutDate}</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        {balanceDue > 0 ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                            <AlertCircle size={12} /> Due: NPR {balanceDue.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            Fully Settled
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedResForCheckOut(res)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <LogOut size={15} /> Settle Bill & Check-Out
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Comprehensive Arrival Check-In & Police Registration Modal */}
      {selectedResForCheckIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scale-in my-auto max-h-[92vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">Guest Arrival Registration (GRC)</h3>
                  <p className="text-xs text-slate-500">Official Nepal Police & Hotel Sherpa Soul Check-in Folio</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedResForCheckIn(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Room Stay Summary Banner */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-3.5 rounded-2xl text-white flex flex-wrap items-center justify-between gap-2 shadow-sm">
                <div>
                  <span className="text-[10px] text-blue-300 uppercase tracking-wider font-bold block">Assigned Room</span>
                  <p className="text-sm font-black">Room {selectedResForCheckIn.roomNumber} ({selectedResForCheckIn.roomType})</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-blue-300 uppercase tracking-wider font-bold block">Stay Duration</span>
                  <p className="font-medium text-xs text-white">{selectedResForCheckIn.checkInDate} &rarr; {selectedResForCheckIn.checkOutDate}</p>
                </div>
                <div className="text-right border-l border-white/20 pl-3">
                  <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold block">Source / Channel</span>
                  <p className="font-bold text-xs text-emerald-400">{selectedResForCheckIn.source}</p>
                </div>
              </div>

              {/* Live Camera Photo & ID Document Snapshot Bar */}
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {guestPhotoUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500 shrink-0 bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={guestPhotoUrl} alt="Guest face" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center shrink-0">
                      <Upload size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <span>{guestPhotoUrl ? '✓ परिचयपत्र / फोटो संलग्न (ID Attached)' : 'पाहुनाको परिचयपत्र वा फोटो (Guest ID / Photo)'}</span>
                    </p>
                    <p className="text-[10px] text-purple-700 truncate">
                      {guestPhotoUrl ? 'GRC कार्ड र प्रहरी अभिलेखमा सुरक्षित हुनेछ।' : 'नागरिकता/पासपोर्ट फाइल अपलोड वा क्यामेराबाट १-क्लिकमा फोटो खिच्नुहोस्'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    onChange={handleIdFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingId}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    title="नागरिकता, राहदानी वा परिचयपत्र फाइल अपलोड गर्नुहोस्"
                  >
                    <Upload size={13} />
                    <span>{uploadingId ? 'अपलोड हुँदै...' : 'कागजात अपलोड (File)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLiveCameraOpen(true)}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Camera size={13} />
                    <span>{guestPhotoUrl ? 'फेरि खिच्नुहोस्' : 'Live Photo'}</span>
                  </button>

                  {guestPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setGuestPhotoUrl('')}
                      className="p-1.5 bg-white border border-rose-200 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                      title="फोटो हटाउनुहोस्"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* 🚨 BLACKLISTED GUEST ALERT IN CHECK-IN */}
              {checkInLookupAlert?.guest?.isBlacklisted && (
                <div className="bg-gradient-to-r from-rose-950 to-rose-900 text-white p-4 rounded-2xl border-2 border-rose-500 shadow-md space-y-2 animate-shake">
                  <div className="flex items-start gap-2.5">
                    <AlertOctagon size={20} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/40 text-rose-100 px-2 py-0.5 rounded-full">
                        🚫 Blacklist Warning
                      </span>
                      <h4 className="text-xs font-black text-white mt-0.5">
                        सचेत रहनुहोस्! यो व्यक्ति होटलको कालोसूचीमा हुनुहुन्छ।
                      </h4>
                      <p className="text-[11px] text-rose-200 mt-1 italic">
                        कारण: "{checkInLookupAlert.guest.blacklistReason || 'बिल नतिरी फरार भएको वा नियम उल्लंघन'}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ⚠️ PENDING DUE BALANCE IN CHECK-IN */}
              {checkInLookupAlert?.hasPendingDue && !checkInLookupAlert.guest.isBlacklisted && (
                <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl flex items-center gap-2.5 text-amber-950">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-black text-amber-900">
                      बक्यौता बाँकी: रू. {checkInLookupAlert.pendingDueAmount.toLocaleString()} ($ {(checkInLookupAlert.pendingDueAmount / 135).toFixed(1)} USD)
                    </span>
                    <p className="text-[11px] text-amber-800">
                      यो पाहुनाको विगतको बसाइको बिल तिर्न बाँकी छ। चेक-इन सम्पन्न गर्नुअघि बक्यौता असुल गर्नुहोस्।
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Official Identification Document (ID Type Dropdown) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-amber-600" />
                    <span>Official Identification (ID Document) *</span>
                  </h4>
                  <span className="text-[10px] bg-amber-200/70 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    Nepal Law Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* ID Type Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ID Type (प्रमाणपत्र प्रकार) *
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as GuestIdType)}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl outline-none font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="Passport">Passport (पासपोर्ट)</option>
                      <option value="Citizenship (नागरिकता)">Citizenship (नागरिकता)</option>
                      <option value="National ID (राष्ट्रिय परिचयपत्र)">National ID (राष्ट्रिय परिचयपत्र)</option>
                      <option value="Driving License (सवारी चालक अनुमतिपत्र)">Driving License (सवारी चालक अनुमतिपत्र)</option>
                      <option value="Voter ID (मतदाता परिचयपत्र)">Voter ID (मतदाता परिचयपत्र)</option>
                      <option value="PAN Card (प्यान कार्ड)">PAN Card (प्यान कार्ड)</option>
                      <option value="Other Official ID">Other Official ID (अन्य)</option>
                    </select>
                  </div>

                  {/* ID / Document Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ID / Document Number *
                    </label>
                    <input 
                      type="text" 
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      placeholder={
                        idType === 'Passport' ? 'e.g. PP9821049' :
                        idType.includes('Citizenship') ? 'e.g. 27-01-78-01234' :
                        idType.includes('National ID') ? 'e.g. 10-digit NID' :
                        'Enter document number'
                      }
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl outline-none font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* Issued Place / Country / District */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Issued Place / Country
                    </label>
                    <input 
                      type="text" 
                      value={idIssuedPlace}
                      onChange={e => setIdIssuedPlace(e.target.value)}
                      placeholder="e.g. Kathmandu / Solukhumbu / USA"
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl outline-none text-slate-800 text-xs focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Guest Personal & Contact Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <User size={15} className="text-blue-600" />
                  <span>Guest Personal Profile & Contacts</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Guest Full Name *</label>
                    <input 
                      type="text" 
                      value={guestFullName}
                      onChange={e => setGuestFullName(e.target.value)}
                      placeholder="Full Name as per ID"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nationality *</label>
                    <input 
                      type="text" 
                      value={nationality}
                      onChange={e => setNationality(e.target.value)}
                      placeholder="e.g. Nepali, American, German"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone / WhatsApp Number *</label>
                    <input 
                      type="tel" 
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      placeholder="+977... or WhatsApp"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
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

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Permanent Address (स्थायी ठेगाना) *</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. Pokhara-6, Kaski or Namche Bazaar, Solukhumbu"
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

              {/* 4. Journey Details & Purpose of Visit (नेपाल पर्यटन तथा अध्यागमन विवरण) */}
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
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Arrived From (कहाँबाट आएको)</label>
                    <input 
                      type="text" 
                      value={arrivedFrom}
                      onChange={e => setArrivedFrom(e.target.value)}
                      placeholder="e.g. Lukla / TIA Airport / Pokhara"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Next Destination (अर्को गन्तव्य)</label>
                    <input 
                      type="text" 
                      value={nextDestination}
                      onChange={e => setNextDestination(e.target.value)}
                      placeholder="e.g. Everest Base Camp / Chitwan"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Emergency Contact & Key Handover */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Phone size={15} className="text-rose-600" />
                  <span>Emergency Contact & Hotel Key Handover</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Contact Person</label>
                    <input 
                      type="text" 
                      value={emergencyContactName}
                      onChange={e => setEmergencyContactName(e.target.value)}
                      placeholder="Name of relative / guide / friend"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 text-xs focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Phone Number</label>
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

                {/* Handover Checkbox */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={keyHandedOver}
                      onChange={(e) => setKeyHandedOver(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <Key size={14} className="text-amber-500" />
                    <span>Physical Key or Keycard successfully handed over to guest</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
              <button 
                onClick={() => setSelectedResForCheckIn(null)}
                className="px-4 py-2.5 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCheckIn}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 hover:scale-[1.01] transition"
              >
                <CheckCircle size={16} /> Complete Arrival Check-In & Issue Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Guest Registration Card (GRC) View / Print Modal */}
      {selectedResForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-in my-auto max-h-[92vh] overflow-y-auto border border-slate-200 text-slate-900">
            {/* GRC Printable Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">HOTEL SHERPA SOUL</h2>
                    <p className="text-[11px] text-amber-700 font-bold font-mono">PAN: 119205419</p>
                    <p className="text-[10px] text-slate-500">Bhagawati Marg-26, Thamel, Kathmandu, Nepal • Tel: +977-1-4530311 / 9851068219</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedResForDetails.photoUrl && (
                  <div className="w-14 h-16 rounded-xl overflow-hidden border-2 border-slate-300 shrink-0 bg-slate-100 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedResForDetails.photoUrl} alt="Guest Face" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="text-right">
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Guest Registration Card (GRC)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">Ref: {selectedResForDetails.otaReference || selectedResForDetails.id}</p>
                </div>
              </div>
            </div>

            {/* Room & Stay Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Room Assigned</span>
                <span className="text-base font-black text-blue-700">Room {selectedResForDetails.roomNumber}</span>
                <p className="text-[11px] text-slate-600">{selectedResForDetails.roomType}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Arrival Date</span>
                <span className="font-bold text-slate-900">{selectedResForDetails.checkInDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Departure Date</span>
                <span className="font-bold text-slate-900">{selectedResForDetails.checkOutDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Total Guests</span>
                <span className="font-bold text-slate-900">
                  {selectedResForDetails.maleGuests !== undefined
                    ? `${(selectedResForDetails.maleGuests || 0) + (selectedResForDetails.femaleGuests || 0) + (selectedResForDetails.childGuests || 0)} Guests`
                    : `${selectedResForDetails.adults} Adults${selectedResForDetails.children ? `, ${selectedResForDetails.children} Ch` : ''}`}
                </span>
                <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                  {selectedResForDetails.maleGuests !== undefined
                    ? `${selectedResForDetails.maleGuests} Male, ${selectedResForDetails.femaleGuests} Female, ${selectedResForDetails.childGuests} Child`
                    : `${selectedResForDetails.adults} Adults`}
                </p>
              </div>
            </div>

            {/* Guest Identity & Contact Details */}
            <div className="space-y-3 text-xs">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">
                Guest Identification & Police Record
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 bg-white border border-slate-100 p-3 rounded-xl">
                <div><span className="text-slate-500">Full Name:</span> <strong className="text-slate-900">{selectedResForDetails.guestName}</strong></div>
                <div><span className="text-slate-500">Nationality:</span> <strong className="text-slate-900">{selectedResForDetails.nationality || 'International'}</strong></div>
                <div><span className="text-slate-500">ID Document Type:</span> <strong className="text-blue-700">{selectedResForDetails.idType || 'Passport'}</strong></div>
                <div><span className="text-slate-500">ID / Passport Number:</span> <strong className="font-mono text-emerald-700 font-bold">{selectedResForDetails.idNumber || selectedResForDetails.passportNumber || 'Not Specified'}</strong></div>
                <div><span className="text-slate-500">Issued Place / District:</span> <span>{selectedResForDetails.idIssuedPlace || '—'}</span></div>
                <div><span className="text-slate-500">Gender:</span> <span>{selectedResForDetails.gender || '—'}</span></div>
                <div>
                  <span className="text-slate-500">Occupancy Breakdown:</span>{' '}
                  <strong className="text-slate-900">
                    {selectedResForDetails.maleGuests !== undefined 
                      ? `${selectedResForDetails.maleGuests} Male, ${selectedResForDetails.femaleGuests} Female, ${selectedResForDetails.childGuests} Child`
                      : `${selectedResForDetails.adults} Adults`}
                  </strong>
                </div>
                <div><span className="text-slate-500">Phone / WhatsApp:</span> <strong>{selectedResForDetails.phone || '—'}</strong></div>
                <div><span className="text-slate-500">Email:</span> <span>{selectedResForDetails.email || '—'}</span></div>
                <div className="sm:col-span-2"><span className="text-slate-500">Permanent Address:</span> <span>{selectedResForDetails.address || '—'}</span></div>
                {selectedResForDetails.accompanyingGuests && (
                  <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Accompanying Room Guests:</span>{' '}
                    <strong className="text-blue-800">{selectedResForDetails.accompanyingGuests}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Journey & Travel Record */}
            <div className="space-y-3 text-xs">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">
                Nepal Tourism & Travel Itinerary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">Purpose of Visit</span>
                  <strong className="text-slate-900">{selectedResForDetails.purposeOfVisit || 'Tourism & Holiday'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Arrived From</span>
                  <span className="text-slate-800 font-medium">{selectedResForDetails.arrivedFrom || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Next Destination</span>
                  <span className="text-slate-800 font-medium">{selectedResForDetails.nextDestination || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Emergency Contact</span>
                  <span className="text-slate-800 font-medium">{selectedResForDetails.emergencyContactName || '—'} ({selectedResForDetails.emergencyContactPhone || '—'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Vehicle / Bike No.</span>
                  <span className="text-slate-800 font-mono">{selectedResForDetails.vehicleNumber || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Key Handover Status</span>
                  <span className="text-emerald-700 font-bold">✓ Keycard Issued</span>
                </div>
              </div>
            </div>

            {/* Billing Overview */}
            <div className="flex justify-between items-center bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-xs">
              <div>
                <span className="text-slate-500 block">Total Stay Folio</span>
                <span className="text-base font-black text-slate-900">
                  NPR {selectedResForDetails.totalAmount.toLocaleString()} <span className="text-xs font-semibold text-slate-500">(${(selectedResForDetails.totalAmount / 135).toFixed(1)} USD)</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Settled Amount</span>
                <span className="text-base font-black text-emerald-600">
                  NPR {selectedResForDetails.paidAmount.toLocaleString()} <span className="text-xs font-semibold text-emerald-700/70">(${(selectedResForDetails.paidAmount / 135).toFixed(1)} USD)</span>
                </span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-300 text-xs text-center">
              <div>
                <div className="border-b border-slate-400 h-10 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold text-slate-700">Guest Signature</p>
                <p className="text-[10px] text-slate-400">I agree to hotel regulations & quiet hours</p>
              </div>
              <div>
                <div className="border-b border-slate-400 h-10 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold text-slate-700">Receptionist / Front Desk Officer</p>
                <p className="text-[10px] text-slate-400">Hotel Sherpa Soul Staff Seal</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedResForDetails(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const existing = invoices.find(inv => inv.reservationId === selectedResForDetails.id);
                    if (existing) {
                      setInvoiceForPanPrint(existing);
                    } else {
                      const inv = createInvoice({
                        reservationId: selectedResForDetails.id,
                        invoiceDate: new Date().toISOString().split('T')[0],
                        dueDate: new Date().toISOString().split('T')[0],
                        guestName: selectedResForDetails.guestName,
                        roomNumber: selectedResForDetails.roomNumber,
                        items: [{ description: `Room Accommodation (${selectedResForDetails.roomType})`, quantity: 1, unitPrice: selectedResForDetails.totalAmount, total: selectedResForDetails.totalAmount }],
                        subtotal: selectedResForDetails.totalAmount,
                        taxAmount: 0,
                        serviceCharge: 0,
                        discount: 0,
                        grandTotal: selectedResForDetails.totalAmount,
                        paidAmount: selectedResForDetails.paidAmount,
                        paymentMethod: 'Cash NPR',
                        status: selectedResForDetails.paidAmount >= selectedResForDetails.totalAmount ? 'PAID' : (selectedResForDetails.paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
                      });
                      setInvoiceForPanPrint(inv);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                >
                  <FileText size={15} /> Print PAN Bill (प्यान बिजक)
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                >
                  <Printer size={15} /> Print Registration Card (GRC)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out & Bill Settlement Modal */}
      {selectedResForCheckOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Checkout & Bill Settlement</h3>
                <p className="text-xs text-slate-500">{selectedResForCheckOut.guestName} • Room {selectedResForCheckOut.roomNumber}</p>
              </div>
              <button onClick={() => setSelectedResForCheckOut(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span>Room Stay ({selectedResForCheckOut.roomType}):</span>
                  <span className="font-bold">NPR {selectedResForCheckOut.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Paid:</span>
                  <span className="text-emerald-700 font-bold">- NPR {selectedResForCheckOut.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span>Add Incidental Charges (Kitchen / Laundry):</span>
                  <input 
                    type="number" 
                    value={extraCharges}
                    onChange={e => setExtraCharges(Number(e.target.value))}
                    className="w-24 p-1 border rounded text-right font-bold"
                  />
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Net Payable:</span>
                  <span className="text-rose-600">
                    NPR {(Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges).toLocaleString()} <span className="text-xs font-bold text-slate-500">(${((Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges) / 135).toFixed(1)} USD)</span>
                  </span>
                </div>

                {/* Amount collected today (Partial payment support) */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Amount Paying Now (अहिले बुझाएको रकम):</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1 font-bold text-slate-400 text-xs">रू.</span>
                    <input 
                      type="number" 
                      min="0"
                      max={Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges}
                      value={checkOutPayAmount !== null ? checkOutPayAmount : (Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges)}
                      onChange={e => setCheckOutPayAmount(Math.max(0, Number(e.target.value)))}
                      className="w-32 pl-8 pr-2 py-1 border border-slate-300 rounded-lg text-right font-black text-sm outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* Live remaining due notice */}
                {(Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges) - (checkOutPayAmount !== null ? checkOutPayAmount : (Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges)) > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 font-bold text-[11px]">
                    ⚠️ आंशिक भुक्तानी: बाँकी बक्यौता रकम <strong>रू. {((Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges) - (checkOutPayAmount !== null ? checkOutPayAmount : (Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges))).toLocaleString()}</strong> पाहुनाको खातामा PARTIAL बक्यौताको रूपमा सुरक्षित रहनेछ।
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Payment Gateway Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['eSewa', 'Khalti', 'Cash NPR', 'Cash USD', 'Visa'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                        paymentMethod === m 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setSelectedResForCheckOut(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCheckOut}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle size={15} /> Confirm Settlement & Free Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luggage Modal */}
      {showLuggageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Luggage size={20} className="text-amber-600" /> Luggage Storage Log
              </h3>
              <button onClick={() => setShowLuggageModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {luggageNotes.map((note, idx) => (
                <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-950 font-medium">
                  {note}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newLuggageText}
                onChange={e => setNewLuggageText(e.target.value)}
                placeholder="Guest name, room, number of bags..."
                className="flex-1 p-2 border rounded-xl text-xs outline-none focus:border-amber-600"
              />
              <button 
                onClick={() => {
                  if (newLuggageText.trim()) {
                    setLuggageNotes([...luggageNotes, newLuggageText.trim()]);
                    setNewLuggageText('');
                  }
                }}
                className="bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self Check-In QR Modal */}
      <SelfCheckinQrModal 
        isOpen={showQrModal} 
        onClose={() => setShowQrModal(false)} 
        bookingRef={selectedBookingRef}
      />

      {/* Live Camera Photo Capture Modal */}
      <LiveCameraCaptureModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={(photoUrl) => setGuestPhotoUrl(photoUrl)}
        guestName={guestFullName || selectedResForCheckIn?.guestName || 'Guest'}
      />

      {/* Official Printable PAN Bill Modal */}
      {invoiceForPanPrint && (
        <PanInvoicePrint
          invoice={invoiceForPanPrint}
          onClose={() => setInvoiceForPanPrint(null)}
        />
      )}

    </div>
  );
}
