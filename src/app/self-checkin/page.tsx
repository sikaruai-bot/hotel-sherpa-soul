"use client";

import React, { useState } from 'react';
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
  Receipt,
  Check
} from 'lucide-react';

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
  wifiNetwork: string;
  wifiPassword: string;
  kitchenEligible: boolean;
  kitchenHours: string;
  keyPickupInstructions: string;
  emergencyContact: string;
  landline: string;
  address: string;
}

export default function SelfCheckInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [matches, setMatches] = useState<BookingMatch[] | null>(null);

  // Selected reservation for completing check-in
  const [selectedBooking, setSelectedBooking] = useState<BookingMatch | null>(null);
  
  // Guest KYC details
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('International');
  const [guestPhone, setGuestPhone] = useState('');
  const [agreeRules, setAgreeRules] = useState(true);

  // Payment details (Mandatory if balanceDue > 0)
  const [paymentMethod, setPaymentMethod] = useState<'eSewa / Fonepay QR' | 'Khalti QR' | 'Bank Transfer' | 'Cash NPR (Keybox Drop)' | 'Prepaid Online (OTA)'>('eSewa / Fonepay QR');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Completed result
  const [checkInDone, setCheckInDone] = useState<CheckInResult | null>(null);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedEsewa, setCopiedEsewa] = useState(false);

  // 1. Search booking
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setErrorMsg('Please enter your Booking Confirmation Code, Phone number, or Name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMatches(null);
    setSelectedBooking(null);

    try {
      const res = await fetch(`/api/self-checkin?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No booking found. Please check your confirmation.');
      }

      setMatches(data.data);
      if (data.data.length === 1) {
        setSelectedBooking(data.data[0]);
        if (data.data[0].guestPhone) setGuestPhone(data.data[0].guestPhone);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to search booking.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit check-in with payment verification
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (!passportNumber.trim() || passportNumber.trim().length < 3) {
      setErrorMsg('Please enter your Passport or National ID number.');
      return;
    }

    // Strict payment check
    if (selectedBooking.balanceDue > 0 && (!transactionId.trim() || transactionId.trim().length < 3)) {
      setErrorMsg(`Payment required! Please scan the QR code to pay NPR ${selectedBooking.balanceDue.toLocaleString()} and enter your Transaction / Reference ID.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/self-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: selectedBooking.id,
          passportNumber: passportNumber.trim(),
          nationality: nationality.trim(),
          phoneNumber: guestPhone.trim(),
          paymentMethod: selectedBooking.balanceDue > 0 ? paymentMethod : 'Prepaid Online (OTA)',
          transactionId: selectedBooking.balanceDue > 0 ? transactionId.trim() : 'PREPAID_ONLINE',
          paidAmountNow: selectedBooking.balanceDue,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete check-in.');
      }

      setCheckInDone(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong during payment verification & check-in.');
    } finally {
      setSubmitting(false);
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

  // Fonepay / eSewa Payment QR image for Hotel Sherpa Soul
  const paymentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('Hotel Sherpa Soul | eSewa/Fonepay: 9851068219 | Thamel, Kathmandu')}&color=0f172a&bgcolor=ffffff&margin=1`;

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
          <span className="text-[10px] bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live 24/7
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {/* SUCCESS VIEW */}
        {checkInDone ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Success Banner */}
            <div className="bg-emerald-900/40 border border-emerald-500/40 rounded-3xl p-5 text-center relative overflow-hidden">
              <div className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Payment & Check-In Complete!</h2>
              <p className="text-xs text-emerald-200 mt-1">
                Tashi Delek & Welcome, <span className="font-bold text-white">{checkInDone.guestName}</span>!
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                <Receipt size={12} />
                <span>NPR {checkInDone.totalAmount.toLocaleString()} Settled & Paid</span>
              </div>
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
          /* STEP 2: PAYMENT & VERIFICATION */
          <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
                    {selectedBooking.balanceDue > 0 ? 'Step 2: Payment & Verification' : 'Step 2: ID Verification'}
                  </span>
                  <h2 className="text-base font-bold text-white">Complete Check-In</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Change
                </button>
              </div>

              {/* Booking preview card */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white text-sm">{selectedBooking.guestName}</p>
                    <p className="text-[11px] text-slate-400">Ref: #{selectedBooking.otaConfirmNum}</p>
                  </div>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Room {selectedBooking.roomNumber}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-500" />
                    {new Date(selectedBooking.checkInDate).toLocaleDateString()}
                  </span>
                  <span>→</span>
                  <span>{new Date(selectedBooking.checkOutDate).toLocaleDateString()}</span>
                  <span className="ml-auto font-medium text-slate-300">{selectedBooking.roomType}</span>
                </div>
              </div>

              {/* 🔒 PAYMENT SECTION (If balance due) */}
              {selectedBooking.balanceDue > 0 ? (
                <div className="bg-amber-950/30 border-2 border-amber-500/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                      <CreditCard size={15} />
                      <span>Payment Required to Unlock Room Key</span>
                    </div>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      Unpaid
                    </span>
                  </div>

                  <div className="bg-slate-950/90 p-3 rounded-xl border border-amber-500/20 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Outstanding Balance</p>
                      <p className="text-xl font-black text-amber-400">
                        NPR {selectedBooking.balanceDue.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Total: NPR {selectedBooking.totalAmount.toLocaleString()})
                    </span>
                  </div>

                  {/* QR Scan to Pay box */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-2.5">
                    <p className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1">
                      <QrCode size={14} className="text-amber-400" />
                      Scan to Pay via Fonepay / eSewa / Mobile Banking:
                    </p>

                    <div className="bg-white p-2.5 rounded-xl inline-block shadow-md">
                      <img 
                        src={paymentQrUrl} 
                        alt="Payment QR Code" 
                        className="w-36 h-36 object-contain rounded-lg mx-auto"
                      />
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p className="font-bold text-white">Hotel Sherpa Soul <span className="text-amber-400 font-mono font-normal ml-1">(PAN: 119205419)</span></p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-slate-400">eSewa / Fonepay ID:</span>
                        <span className="font-mono font-bold text-amber-300">9851068219</span>
                        <button
                          type="button"
                          onClick={handleCopyEsewa}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold transition"
                        >
                          {copiedEsewa ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method & Transaction Reference */}
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Select Payment Method Used:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="eSewa / Fonepay QR">eSewa / Fonepay Mobile Banking QR</option>
                        <option value="Khalti QR">Khalti Digital Wallet</option>
                        <option value="Bank Transfer">Direct Bank Transfer</option>
                        <option value="Cash NPR (Keybox Drop)">Cash NPR (Dropped in Keybox Envelope)</option>
                        <option value="Prepaid Online (OTA)">Prepaid Online to Booking.com / Agoda</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                        <Receipt size={13} />
                        Transaction ID / Payment Reference Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12894102 or eSewa Ref ID / Note"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono font-bold"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Enter the transaction code from your banking/wallet receipt. Room key unlocks once entered.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* PREPAID BADGE */
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-300">100% Paid & Confirmed</p>
                    <p className="text-[11px] text-slate-300">No payment due. Please enter your Passport ID below to receive your room key.</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmitCheckIn} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-amber-400" />
                    Passport / Citizenship Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PP12345678 or Citizen ID"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Required by Nepal Ministry of Culture, Tourism & Civil Aviation.</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nationality</label>
                    <input
                      type="text"
                      placeholder="e.g. Nepali, American"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp / Phone</label>
                    <input
                      type="tel"
                      placeholder="+977..."
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                {/* Hotel Quiet Policy */}
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
                  type="submit"
                  disabled={submitting || !agreeRules || (selectedBooking.balanceDue > 0 && !transactionId.trim())}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    'Verifying Payment & Checking In...'
                  ) : selectedBooking.balanceDue > 0 ? (
                    <>
                      <Lock size={15} />
                      Verify Payment & Unlock Room Key →
                    </>
                  ) : (
                    'Confirm & Open Room Key →'
                  )}
                </button>
                {selectedBooking.balanceDue > 0 && !transactionId.trim() && (
                  <p className="text-[11px] text-amber-400/90 text-center font-medium">
                    ⚠️ Enter Transaction ID above to activate check-in button.
                  </p>
                )}
              </form>
            </div>
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

      {/* Footer */}
      <footer className="border-t border-slate-900 px-4 py-3 text-center text-[11px] text-slate-500">
        Hotel Sherpa Soul • PAN No: 119205419 • Thamel, Kathmandu, Nepal
      </footer>
    </div>
  );
}
