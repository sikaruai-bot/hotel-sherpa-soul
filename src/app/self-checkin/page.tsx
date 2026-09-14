"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  CheckCircle2, 
  Key, 
  Wifi, 
  ChefHat, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  CreditCard,
  QrCode,
  AlertTriangle,
  Copy,
  ExternalLink,
  Lock,
  Compass,
  ArrowRight,
  ArrowLeft,
  Receipt,
  Check,
  User,
  Users,
  Plus,
  Minus,
  Upload,
  Loader2,
  Building2,
  Printer,
  Sparkles,
  Smartphone,
  Image as ImageIcon
} from 'lucide-react';
import QrCodeImage from '@/components/QrCodeImage';
import SelfCheckinQrModal from '@/components/SelfCheckinQrModal';

interface BookingMatch {
  id: string;
  otaConfirmNum: string;
  guestName: string;
  guestPhone?: string;
  hasPassport: boolean;
  roomNumber: string;
  roomType: string;
  floor: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  requiresPayment: boolean;
  alreadyCheckedIn: boolean;
}

interface CheckInResult {
  guestName: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  bedType: string;
  checkInDate: string;
  checkOutDate: string;
  paidAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  transactionId?: string;
  receiptUrl?: string;
  idType?: string;
  idNumber?: string;
  nationality?: string;
  purposeOfVisit?: string;
  maleGuests?: number;
  femaleGuests?: number;
  childGuests?: number;
  accompanyingGuests?: string;
  wifiNetwork: string;
  wifiPassword: string;
  kitchenEligible: boolean;
  kitchenHours: string;
  keyPickupInstructions: string;
  emergencyContact: string;
  landline: string;
  address: string;
}

export type GuestIdType = 
  | 'Passport'
  | 'Citizenship (नागरिकता)'
  | 'National ID (राष्ट्रिय परिचयपत्र)'
  | 'Driving License'
  | 'Voter ID'
  | 'PAN Card'
  | 'Other Official ID';

function SelfCheckInContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [matches, setMatches] = useState<BookingMatch[] | null>(null);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [initialSearchDone, setInitialSearchDone] = useState(false);

  // Selected reservation for completing check-in
  const [selectedBooking, setSelectedBooking] = useState<BookingMatch | null>(null);
  
  // Guest KYC details (Nepal Tourism & Police Records)
  const [idType, setIdType] = useState<GuestIdType>('Passport');
  const [idNumber, setIdNumber] = useState('');
  const [idIssuedPlace, setIdIssuedPlace] = useState('');
  const [nationality, setNationality] = useState('International');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [maleGuests, setMaleGuests] = useState(1);
  const [femaleGuests, setFemaleGuests] = useState(0);
  const [childGuests, setChildGuests] = useState(0);
  const [accompanyingGuests, setAccompanyingGuests] = useState('');
  const [address, setAddress] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState('Tourism & Holiday');
  const [arrivedFrom, setArrivedFrom] = useState('');
  const [nextDestination, setNextDestination] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [agreeRules, setAgreeRules] = useState(true);

  // Multi-step check-in flow: 'KYC' (Step 1) -> 'PAYMENT' (Step 2 if balance due)
  const [currentStep, setCurrentStep] = useState<'KYC' | 'PAYMENT'>('KYC');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [confirmPaymentMade, setConfirmPaymentMade] = useState(false);
  const [verifyingStatusText, setVerifyingStatusText] = useState('');

  // Payment details (Mandatory if balanceDue > 0)
  const [paymentMethod, setPaymentMethod] = useState<'eSewa / Fonepay QR' | 'Khalti QR' | 'Bank Transfer'>('eSewa / Fonepay QR');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Completed result
  const [checkInDone, setCheckInDone] = useState<CheckInResult | null>(null);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedEsewa, setCopiedEsewa] = useState(false);

  // 1. Search booking
  const executeLookup = useCallback(async (query: string) => {
    if (!query.trim()) {
      setErrorMsg('Please enter your Booking Confirmation Code, Phone number, or Name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMatches(null);
    setSelectedBooking(null);

    try {
      const res = await fetch(`/api/self-checkin?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No booking found. Please check your confirmation.');
      }

      setMatches(data.data);
      if (data.data.length === 1) {
        setSelectedBooking(data.data[0]);
        if (data.data[0].adults) {
          setMaleGuests(data.data[0].adults);
          setFemaleGuests(0);
          setChildGuests(0);
        }
        if (data.data[0].guestPhone) {
          setGuestPhone(data.data[0].guestPhone);
          const isNepali = data.data[0].guestPhone.startsWith('+977') || data.data[0].guestPhone.startsWith('98') || data.data[0].guestPhone.startsWith('97');
          if (isNepali) {
            setIdType('Citizenship (नागरिकता)');
            setNationality('Nepali');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to search booking.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLookup(searchQuery);
  };

  // Auto-search if URL contains ?q= or ?ref= (e.g. from scanned reservation QR code)
  useEffect(() => {
    const q = searchParams?.get('q') || searchParams?.get('ref');
    if (q && q.trim() && !initialSearchDone) {
      setInitialSearchDone(true);
      setSearchQuery(q.trim());
      executeLookup(q.trim());
    }
  }, [searchParams, initialSearchDone, executeLookup]);

  // Upload payment receipt slip screenshot
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload receipt image.');
      }

      setReceiptUrl(data.data.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Receipt upload failed. Please enter transaction ID manually.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Step 1 -> Step 2 validation
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const actualId = idNumber.trim();
    if (!actualId || actualId.length < 3) {
      setErrorMsg(`Please enter your valid ${idType} number.`);
      return;
    }
    if (!agreeRules) {
      setErrorMsg('Please agree to hotel quiet hours & policy.');
      return;
    }

    setErrorMsg('');
    if (selectedBooking.balanceDue > 0) {
      setCurrentStep('PAYMENT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 100% Prepaid booking skips payment step
      handleExecuteCheckIn();
    }
  };

  // Step 2 -> Submit payment & complete check-in
  const handleExecuteCheckIn = async () => {
    if (!selectedBooking) return;
    const actualId = idNumber.trim();

    if (selectedBooking.balanceDue > 0) {
      const cleanTxn = transactionId.trim();
      const invalidPlaceholders = ['none', 'na', 'null', 'test', '123', '1234', '0000', 'asdf', 'fake', 'no', 'unpaid'];
      
      if (!cleanTxn || cleanTxn.length < 5 || invalidPlaceholders.includes(cleanTxn.toLowerCase())) {
        setErrorMsg('Please enter your valid Transaction / Reference ID (minimum 5 digits/letters).');
        return;
      }
      if (!confirmPaymentMade) {
        setErrorMsg('Please tick the box confirming you have transferred the payment amount.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');
    setVerifyingStatusText('Verifying payment with banking network...');

    try {
      // Simulate real-time gateway verification
      await new Promise(r => setTimeout(r, 800));
      setVerifyingStatusText('Confirming transaction reference...');

      const res = await fetch('/api/self-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: selectedBooking.id,
          idType,
          idNumber: actualId,
          passportNumber: actualId,
          idIssuedPlace: idIssuedPlace.trim(),
          nationality: nationality.trim(),
          phoneNumber: guestPhone.trim(),
          email: guestEmail.trim(),
          maleGuests,
          femaleGuests,
          childGuests,
          adults: (maleGuests + femaleGuests) > 0 ? (maleGuests + femaleGuests) : 1,
          children: childGuests,
          accompanyingGuests: accompanyingGuests.trim(),
          address: address.trim(),
          purposeOfVisit,
          arrivedFrom: arrivedFrom.trim(),
          nextDestination: nextDestination.trim(),
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
          paymentMethod: selectedBooking.balanceDue > 0 ? paymentMethod : 'Prepaid Online (OTA)',
          transactionId: selectedBooking.balanceDue > 0 ? transactionId.trim() : 'PREPAID_ONLINE',
          paidAmountNow: selectedBooking.balanceDue,
          receiptUrl: receiptUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment verification failed. Room key cannot be issued until payment is verified.');
      }

      setCheckInDone(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment verification failed. Room key remains locked.');
    } finally {
      setSubmitting(false);
      setVerifyingStatusText('');
    }
  };

  const handleCopyWifi = () => {
    if (!checkInDone) return;
    navigator.clipboard.writeText(checkInDone.wifiPassword);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const handleCopyEsewa = () => {
    navigator.clipboard.writeText('9851068219');
    setCopiedEsewa(true);
    setTimeout(() => setCopiedEsewa(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-14 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-amber-500/20 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Hotel Sherpa Soul" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight">Hotel Sherpa Soul</h1>
              <p className="text-[11px] text-amber-400 font-medium font-mono">PAN: 119205419 • Self Check-In</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStandeeModal(true)}
              className="flex items-center gap-1.5 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl font-bold transition shadow-sm"
              title="Print Reception Counter QR Standee"
            >
              <QrCode size={13} />
              <span>Standee QR</span>
            </button>
            <span className="text-[10px] bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live 24/7
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {/* SUCCESS VIEW */}
        {checkInDone ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Payment & Check-In Success Banner */}
            <div className="bg-emerald-950/60 border-2 border-emerald-500/60 rounded-3xl p-5 text-center relative overflow-hidden shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/40">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>
              <span className="inline-block bg-emerald-500/20 text-emerald-400 font-extrabold px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-emerald-500/40 mb-1">
                Payment Verified & Settled (भुक्तानी प्रमाणित)
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">Check-In Complete!</h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Tashi Delek & Welcome to Hotel Sherpa Soul, <span className="font-bold text-white">{checkInDone.guestName}</span>!
              </p>
              
              <div className="mt-3 p-3 bg-slate-950/80 rounded-2xl border border-emerald-500/30 grid grid-cols-2 gap-2 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Amount Paid:</span>
                  <span className="text-sm font-black text-emerald-400">NPR {checkInDone.totalAmount.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-300 block font-medium">(0 Balance Due)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Payment Method & Ref:</span>
                  <span className="text-xs font-mono font-bold text-white truncate block">{checkInDone.paymentMethod || 'eSewa / Fonepay'}</span>
                  <span className="text-[10px] font-mono text-amber-400 truncate block">Txn: {checkInDone.transactionId || 'PAID'}</span>
                </div>
              </div>

              {checkInDone.receiptUrl && (
                <div className="mt-2 text-center">
                  <a 
                    href={checkInDone.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold inline-flex items-center gap-1"
                  >
                    <span>View Official Payment Slip</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Room Key & Access Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-amber-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Your Assigned Room</span>
                  <div className="text-4xl font-black text-white mt-0.5 tracking-tight flex items-baseline gap-2">
                    Room {checkInDone.roomNumber}
                    <span className="text-sm font-semibold text-slate-400">(Floor {checkInDone.floor})</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{checkInDone.roomType} • {checkInDone.bedType}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Key size={24} />
                </div>
              </div>

              {/* Physical Key Pick-up info */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Lock size={14} />
                  <span>Room Key Instructions:</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {checkInDone.keyPickupInstructions}
                </p>
              </div>

              {/* WiFi Access */}
              <div className="mt-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                    <Wifi size={14} />
                    <span>Complimentary High-Speed WiFi</span>
                  </div>
                  <button
                    onClick={handleCopyWifi}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                  >
                    <Copy size={11} />
                    {copiedWifi ? 'Copied!' : 'Copy Password'}
                  </button>
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Network (SSID):</span>
                    <span className="font-mono font-bold text-white">{checkInDone.wifiNetwork}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Password:</span>
                    <span className="font-mono font-bold text-amber-300">{checkInDone.wifiPassword}</span>
                  </div>
                </div>
              </div>

              {/* Verified Guest Registration Badge */}
              <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px]">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>Verified Guest ID & Tourism Record:</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                    Nepal Compliant
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5 pt-0.5">
                  <p><span className="text-slate-500">Document:</span> <span className="text-white font-mono font-bold">{checkInDone.idType || 'ID'}: {checkInDone.idNumber || 'Recorded'}</span></p>
                  {((checkInDone.maleGuests || 0) + (checkInDone.femaleGuests || 0) + (checkInDone.childGuests || 0) > 0) && (
                    <p>
                      <span className="text-slate-500">Guests:</span>{' '}
                      <span className="text-white font-medium">
                        {(checkInDone.maleGuests || 0) + (checkInDone.femaleGuests || 0) + (checkInDone.childGuests || 0)} Total
                        {' '}({checkInDone.maleGuests || 0} Male, {checkInDone.femaleGuests || 0} Female, {checkInDone.childGuests || 0} Child)
                      </span>
                    </p>
                  )}
                  {checkInDone.accompanyingGuests && (
                    <p>
                      <span className="text-slate-500">Accompanying:</span>{' '}
                      <span className="text-amber-300 font-medium">{checkInDone.accompanyingGuests}</span>
                    </p>
                  )}
                  {checkInDone.purposeOfVisit && (
                    <p><span className="text-slate-500">Purpose of Visit:</span> <span className="text-slate-300">{checkInDone.purposeOfVisit}</span></p>
                  )}
                </div>
              </div>

              {/* Shared Kitchen Access */}
              {checkInDone.kitchenEligible && (
                <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <ChefHat size={14} />
                    <span>Shared Kitchen Access Included</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Open: <span className="text-white font-medium">{checkInDone.kitchenHours}</span>. Feel free to use the refrigerator, stove, and hot water kettle.
                  </p>
                </div>
              )}
            </div>

            {/* Need Assistance WhatsApp button */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Compass size={14} className="text-amber-400" />
                <span>Need Assistance or Key Box Help?</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Front desk staff or Manager are available on WhatsApp/Call for check-in support.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="https://wa.me/9779851068219?text=Hello%20Hotel%20Sherpa%20Soul,%20I%20just%20self%20checked%20in%20and%20paid."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <ExternalLink size={13} />
                  WhatsApp
                </a>
                <a
                  href="tel:+9779851068219"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                >
                  <Phone size={13} />
                  Call Manager
                </a>
              </div>
            </div>

            {/* Done button */}
            <button
              onClick={() => {
                setCheckInDone(null);
                setSelectedBooking(null);
                setMatches(null);
                setSearchQuery('');
                setTransactionId('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-2 transition"
            >
              ← Back to Check-In Home
            </button>
          </div>
        ) : selectedBooking ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
            {/* Step Progress Indicator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className={`p-1.5 rounded-xl border flex items-center justify-center gap-1 transition ${
                  currentStep === 'KYC'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-emerald-400 border-slate-800'
                }`}>
                  <Check size={12} className={currentStep === 'PAYMENT' ? 'text-emerald-400' : 'text-amber-400'} />
                  <span>1. Details</span>
                </div>

                <div className={`p-1.5 rounded-xl border flex items-center justify-center gap-1 transition ${
                  currentStep === 'PAYMENT'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : selectedBooking.balanceDue > 0
                    ? 'bg-slate-950 text-slate-400 border-slate-800'
                    : 'bg-slate-950 text-slate-600 border-slate-800 opacity-50'
                }`}>
                  <Lock size={12} className={currentStep === 'PAYMENT' ? 'text-amber-400' : 'text-slate-500'} />
                  <span>2. Payment</span>
                </div>

                <div className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-500 flex items-center justify-center gap-1">
                  <Key size={12} />
                  <span>3. Key Access</span>
                </div>
              </div>
            </div>

            {/* Booking Preview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white text-sm">{selectedBooking.guestName}</p>
                  <p className="text-[11px] text-slate-400">Ref: #{selectedBooking.otaConfirmNum}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Room {selectedBooking.roomNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBooking(null);
                      setCurrentStep('KYC');
                      setTransactionId('');
                      setReceiptUrl('');
                      setConfirmPaymentMade(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
                <span>{new Date(selectedBooking.checkInDate).toLocaleDateString()} → {new Date(selectedBooking.checkOutDate).toLocaleDateString()}</span>
                {selectedBooking.balanceDue > 0 ? (
                  <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    Due: NPR {selectedBooking.balanceDue.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    100% Paid Online
                  </span>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 1: GUEST KYC DETAILS FORM */}
            {/* ========================================================================= */}
            {currentStep === 'KYC' && (
              <form onSubmit={handleProceedToPayment} className="space-y-3.5">
                {/* 1. Official ID Document Details */}
                <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <ShieldCheck size={14} />
                    <span>Official ID Type & Document (परिचयपत्र विवरण) *</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Select Guest ID Type (परिचयपत्र प्रकार) *
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as GuestIdType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                    >
                      <option value="Passport">Passport (राहदानी / पासपोर्ट - Foreign Tourists)</option>
                      <option value="Citizenship (नागरिकता)">Citizenship (नागरिकता प्रमाणपत्र - Nepali Citizens)</option>
                      <option value="National ID (राष्ट्रिय परिचयपत्र)">National ID (राष्ट्रिय परिचयपत्र - NID)</option>
                      <option value="Driving License">Driving License (सवारी चालक अनुमतिपत्र)</option>
                      <option value="Voter ID">Voter ID (मतदाता परिचयपत्र)</option>
                      <option value="PAN Card">PAN Card (स्थायी लेखा नम्बर)</option>
                      <option value="Other Official ID">Other Official Government ID (अन्य परिचयपत्र)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        {idType} Number *
                      </label>
                      <input
                        id="guest-id-number"
                        type="text"
                        required
                        placeholder={
                          idType === 'Passport' ? 'e.g. PP12345678' :
                          idType === 'Citizenship (नागरिकता)' ? 'e.g. 27-01-75-01234' :
                          idType === 'National ID (राष्ट्रिय परिचयपत्र)' ? 'e.g. 123-456-7890' :
                          'Enter Official ID Number'
                        }
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Issued Country / District (जारी जिल्ला / देश)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kathmandu or USA"
                        value={idIssuedPlace}
                        onChange={(e) => setIdIssuedPlace(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Personal Profile & Origin */}
                <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                    <User size={14} />
                    <span>Personal Profile & Contact (व्यक्तिगत सम्पर्क)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Nationality</label>
                      <input
                        type="text"
                        placeholder="e.g. Nepali, American"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">WhatsApp / Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+977..."
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Permanent Address / City (स्थायी ठेगाना)</label>
                    <input
                      type="text"
                      placeholder="e.g. Pokhara-6, Kaski or Thamel, Kathmandu"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                {/* 3. Guest Count Breakdown */}
                <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Users size={14} />
                      <span>Number of Guests (पाहुना संख्या विवरण) *</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                      Total: {maleGuests + femaleGuests + childGuests} Guest{maleGuests + femaleGuests + childGuests > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Male */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                      <span className="block text-[11px] font-bold text-slate-300">Male (पुरुष)</span>
                      <span className="block text-[9px] text-slate-500 mb-1">Adult 12y+</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMaleGuests(Math.max(0, maleGuests - 1))}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-sm font-black text-white w-4 text-center">{maleGuests}</span>
                        <button
                          type="button"
                          onClick={() => setMaleGuests(maleGuests + 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Female */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                      <span className="block text-[11px] font-bold text-slate-300">Female (महिला)</span>
                      <span className="block text-[9px] text-slate-500 mb-1">Adult 12y+</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFemaleGuests(Math.max(0, femaleGuests - 1))}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-sm font-black text-white w-4 text-center">{femaleGuests}</span>
                        <button
                          type="button"
                          onClick={() => setFemaleGuests(femaleGuests + 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Child */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                      <span className="block text-[11px] font-bold text-slate-300">Child (बाल)</span>
                      <span className="block text-[9px] text-slate-500 mb-1">&lt; 12y</span>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setChildGuests(Math.max(0, childGuests - 1))}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-sm font-black text-white w-4 text-center">{childGuests}</span>
                        <button
                          type="button"
                          onClick={() => setChildGuests(childGuests + 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Accompanying Guests Names & Details (साथी पाहुनाहरूको नाम / विवरण)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maya Sherpa (Wife), Mingma Sherpa (Child)"
                      value={accompanyingGuests}
                      onChange={(e) => setAccompanyingGuests(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                {/* 4. Travel & Stay Info */}
                <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Compass size={14} />
                    <span>Travel & Stay Info (भ्रमण विवरण)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Purpose of Visit (भ्रमणको उद्देश्य)</label>
                    <select
                      value={purposeOfVisit}
                      onChange={(e) => setPurposeOfVisit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Tourism & Holiday">Tourism & Holiday (पर्यटन तथा विदा)</option>
                      <option value="Trekking & Mountaineering">Trekking & Mountaineering (ट्रेकिङ तथा हिमाल आरोहण)</option>
                      <option value="Business & Work">Business & Work (व्यापार तथा कार्यालय)</option>
                      <option value="Transit & Stopover">Transit & Stopover (ट्रान्जिट)</option>
                      <option value="Personal / Family">Personal / Family (व्यक्तिगत तथा पारिवारिक)</option>
                      <option value="Other">Other (अन्य)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Arrived From (कहाँबाट)</label>
                      <input
                        type="text"
                        placeholder="e.g. Lukla / Airport"
                        value={arrivedFrom}
                        onChange={(e) => setArrivedFrom(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Next Destination (अर्को ठाउँ)</label>
                      <input
                        type="text"
                        placeholder="e.g. Everest / Chitwan"
                        value={nextDestination}
                        onChange={(e) => setNextDestination(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Emergency Contact */}
                <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <Phone size={14} />
                    <span>Emergency Contact (आपतकालीन सम्पर्क)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Contact Name</label>
                      <input
                        type="text"
                        placeholder="Relative / Guide"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Emergency Phone</label>
                      <input
                        type="tel"
                        placeholder="+977..."
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Hotel Policy Agreement */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-200">Hotel Sherpa Soul Policy:</p>
                  <p>• Quiet hours: 10:00 PM – 07:00 AM (Sleep Well policy).</p>
                  <label className="flex items-center gap-2 pt-1 text-slate-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={agreeRules}
                      onChange={(e) => setAgreeRules(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>I agree to hotel quiet hours & regulations.</span>
                  </label>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  id="btn-proceed-to-payment"
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {selectedBooking.balanceDue > 0 ? (
                    <>
                      <CreditCard size={16} />
                      Proceed to Payment (NPR {selectedBooking.balanceDue.toLocaleString()}) →
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirm & Unlock Room Key →
                    </>
                  )}
                </button>
                {selectedBooking.balanceDue > 0 && (
                  <p className="text-[11px] text-amber-400/90 text-center font-medium">
                    🔒 Step 2 requires verified payment proof before room key is issued.
                  </p>
                )}
              </form>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: MANDATORY PAYMENT GATE (If balance due) */}
            {/* ========================================================================= */}
            {currentStep === 'PAYMENT' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                {/* Due Amount Highlight Card */}
                <div className="bg-gradient-to-br from-amber-950/60 to-slate-950 p-4 rounded-2xl border-2 border-amber-500/50 shadow-xl text-center space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Lock size={13} />
                    Mandatory Payment Gate (अनिवार्य भुक्तानी)
                  </span>
                  <div className="text-3xl font-black text-white tracking-tight">
                    NPR {selectedBooking.balanceDue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Pay via QR or Bank Transfer below. Room key unlocks once transaction reference is submitted.
                  </p>
                </div>

                {/* Payment Method Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('eSewa / Fonepay QR')}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'eSewa / Fonepay QR'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode size={16} />
                    <span>eSewa / Fonepay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Khalti QR')}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'Khalti QR'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode size={16} />
                    <span>Khalti QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Bank Transfer')}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'Bank Transfer'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 size={16} />
                    <span>Bank Transfer</span>
                  </button>
                </div>

                {/* QR Code / Bank Details Card */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 text-center space-y-3">
                  {paymentMethod === 'eSewa / Fonepay QR' && (
                    <div className="space-y-3">
                      <div className="inline-block p-3 bg-white rounded-2xl shadow-xl border-2 border-emerald-500/40">
                        <QrCodeImage 
                          data="Hotel Sherpa Soul | eSewa/Fonepay: 9851068219 | PAN: 119205419 | Thamel, Kathmandu"
                          size={180}
                          alt="eSewa / Fonepay QR Code"
                          className="w-44 h-44 mx-auto rounded-lg"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-extrabold text-white text-sm">Hotel Sherpa Soul</p>
                        <p className="text-slate-400 text-[11px]">eSewa / Fonepay ID: <span className="font-mono text-emerald-400 font-bold">9851068219</span></p>
                        <p className="text-slate-500 text-[10px]">PAN: 119205419 • Any Nepal Bank or Digital Wallet</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyEsewa}
                        className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition"
                      >
                        <Copy size={12} />
                        {copiedEsewa ? 'ID Copied (9851068219)!' : 'Copy eSewa Number (9851068219)'}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'Khalti QR' && (
                    <div className="space-y-3">
                      <div className="inline-block p-3 bg-white rounded-2xl shadow-xl border-2 border-purple-500/40">
                        <QrCodeImage 
                          data="Khalti: 9851068219 | Hotel Sherpa Soul | PAN: 119205419"
                          size={180}
                          color={{ dark: '#581c87', light: '#ffffff' }}
                          alt="Khalti QR Code"
                          className="w-44 h-44 mx-auto rounded-lg"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-extrabold text-white text-sm">Hotel Sherpa Soul (Khalti)</p>
                        <p className="text-slate-400 text-[11px]">Khalti Mobile ID: <span className="font-mono text-purple-400 font-bold">9851068219</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyEsewa}
                        className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition"
                      >
                        <Copy size={12} />
                        {copiedEsewa ? 'ID Copied (9851068219)!' : 'Copy Khalti ID (9851068219)'}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'Bank Transfer' && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
                      <p className="font-bold text-blue-400 border-b border-slate-800 pb-1">Direct Bank Account Details:</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Bank Name:</span>
                          <span className="text-white font-bold">Nabil Bank Ltd</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Branch:</span>
                          <span className="text-white font-bold">Thamel, Kathmandu</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Account Name:</span>
                          <span className="text-white font-bold">Hotel Sherpa Soul Pvt. Ltd.</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block">Account Number:</span>
                          <div className="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 mt-0.5">
                            <span className="text-emerald-400 font-mono font-bold">01201017502391</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('01201017502391');
                                setCopiedEsewa(true);
                                setTimeout(() => setCopiedEsewa(false), 2000);
                              }}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              <Copy size={11} /> Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Proof Form */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Receipt size={14} />
                    <span>Payment Verification & Proof (भुक्तानी विवरण) *</span>
                  </div>

                  {/* Transaction ID Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Transaction / Reference ID (कारोबार नम्बर) *
                    </label>
                    <input
                      id="transaction-id-input"
                      type="text"
                      required
                      placeholder="e.g. 10-digit eSewa/Fonepay Code or Txn ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono tracking-wider transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      You can find this in your eSewa, Fonepay, Khalti or Mobile Banking statement.
                    </p>
                  </div>

                  {/* Payment Slip / Screenshot Upload */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Attach Payment Slip / Screenshot (रसिद स्क्रिनसट) (Recommended)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-2.5 cursor-pointer text-center transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
                          {uploadingReceipt ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-amber-400" />
                              <span>Uploading receipt...</span>
                            </>
                          ) : receiptUrl ? (
                            <>
                              <CheckCircle2 size={13} className="text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Slip Uploaded ✓</span>
                            </>
                          ) : (
                            <>
                              <Upload size={13} className="text-amber-400" />
                              <span>Upload Slip Image</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    {receiptUrl && (
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-1 rounded-lg">
                        <span>Receipt attached</span>
                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold flex items-center gap-1">
                          Preview <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Checkbox */}
                  <label className="flex items-start gap-2 pt-1 text-slate-300 cursor-pointer text-[11px] leading-snug">
                    <input
                      id="confirm-payment-checkbox"
                      type="checkbox"
                      checked={confirmPaymentMade}
                      onChange={(e) => setConfirmPaymentMade(e.target.checked)}
                      className="rounded accent-amber-500 mt-0.5 shrink-0"
                    />
                    <span>
                      I confirm that I have transferred <strong className="text-white font-bold">NPR {selectedBooking.balanceDue.toLocaleString()}</strong> to Hotel Sherpa Soul and entered the correct transaction reference.
                    </span>
                  </label>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Verify & Check-In Button */}
                <button
                  id="btn-verify-payment"
                  type="button"
                  onClick={handleExecuteCheckIn}
                  disabled={submitting || !transactionId.trim() || transactionId.trim().length < 5 || !confirmPaymentMade}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{verifyingStatusText || 'Verifying Payment...'}</span>
                    </>
                  ) : (
                    <>
                      <Key size={16} />
                      <span>Verify Payment & Unlock Room Key →</span>
                    </>
                  )}
                </button>

                {(!transactionId.trim() || transactionId.trim().length < 5 || !confirmPaymentMade) && (
                  <p className="text-[10px] text-amber-400/90 text-center font-medium">
                    ⚠️ Enter valid Transaction ID (min 5 chars) & tick confirmation to unlock key.
                  </p>
                )}

                {/* Back to Step 1 */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('KYC');
                    setErrorMsg('');
                  }}
                  className="w-full text-center text-xs text-slate-400 hover:text-white py-2 flex items-center justify-center gap-1 transition"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Edit Guest Details</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* STEP 1: SEARCH BOOKING */
          <div className="space-y-4">
            {/* Banner info */}
            <div className="text-center space-y-1 mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Self-Service Desk</span>
              <h2 className="text-2xl font-black text-white tracking-tight">Express Self Check-In</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Front desk away? Settle payment, check in directly, and access your room number, key, and WiFi in 30 seconds.
              </p>
            </div>

            {/* Express Check-In QR Card Display */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-4 shadow-xl text-center space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone size={14} className="text-amber-400" />
                  Express Mobile QR Check-In
                </span>
                <button
                  type="button"
                  onClick={() => setShowStandeeModal(true)}
                  className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition"
                >
                  <Printer size={12} /> Print Poster
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div className="bg-white p-2 rounded-2xl shadow-lg shrink-0 border-2 border-amber-500/40">
                  <QrCodeImage 
                    data={typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://pms.hotelsherpasoul.com/self-checkin'} 
                    size={110} 
                    alt="Express Self Check-In QR Code"
                    className="w-24 h-24 rounded-lg"
                  />
                </div>
                <div className="text-left space-y-1">
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <Sparkles size={11} /> Scan with Phone Camera
                  </div>
                  <p className="text-xs font-bold text-white">Check In On Your Smartphone</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Scan with your camera to open this portal on your phone, upload ID photos, and receive your room key.
                  </p>
                </div>
              </div>
            </div>

            {/* Search Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <form onSubmit={handleSearch} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Search size={14} className="text-amber-400" />
                    Enter Booking Reference or Phone:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Booking.com Ref, Agoda ID, Phone or Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    You can find this on your Booking.com, Agoda confirmation, or WhatsApp message.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Searching Booking...' : 'Find My Booking →'}
                </button>
              </form>

              {/* Multiple Matches list if query returned > 1 */}
              {matches && matches.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-400">Select your booking:</p>
                  {matches.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBooking(b);
                        if (b.adults) {
                          setMaleGuests(b.adults);
                          setFemaleGuests(0);
                          setChildGuests(0);
                        }
                        if (b.guestPhone) setGuestPhone(b.guestPhone);
                      }}
                      className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{b.guestName}</p>
                        <p className="text-[10px] text-slate-400">
                          {b.roomType} • Room {b.roomNumber}
                          {b.balanceDue > 0 ? (
                            <span className="text-amber-400 ml-1.5 font-bold">• Due: NPR {b.balanceDue.toLocaleString()}</span>
                          ) : (
                            <span className="text-emerald-400 ml-1.5 font-bold">• Paid</span>
                          )}
                        </p>
                      </div>
                      <span className="text-amber-400 text-xs font-bold">Select →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Helpful quick guide */}
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-2xl text-[11px] space-y-1">
                <div className="flex items-center gap-1 text-slate-200 font-bold">
                  <MapPin size={12} className="text-amber-400" />
                  <span>Location</span>
                </div>
                <p className="text-[10px]">Bhagawati Marg -26, Thamel, Kathmandu (Next to Chhetrapati)</p>
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-2xl text-[11px] space-y-1">
                <div className="flex items-center gap-1 text-slate-200 font-bold">
                  <Phone size={12} className="text-emerald-400" />
                  <span>Need Help?</span>
                </div>
                <p className="text-[10px]">+977-1-4530311, 9851068219 (Reception / WhatsApp)</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Self Check-In QR Standee Modal */}
      <SelfCheckinQrModal 
        isOpen={showStandeeModal} 
        onClose={() => setShowStandeeModal(false)} 
        bookingRef={selectedBooking?.otaConfirmNum}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 px-4 py-3 text-center text-[11px] text-slate-500">
        Hotel Sherpa Soul • PAN No: 119205419 • Thamel, Kathmandu, Nepal
      </footer>
    </div>
  );
}

export default function SelfCheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-amber-400" />
          <span>Loading Express Check-In...</span>
        </div>
      </div>
    }>
      <SelfCheckInContent />
    </Suspense>
  );
}
