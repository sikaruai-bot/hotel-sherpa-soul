"use client";

import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2, CreditCard, Receipt, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { usePms, Reservation } from '@/context/PmsContext';

interface AddAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedReservationId?: string;
  onSuccess?: (msg: string) => void;
}

export default function AddAdvanceModal({
  isOpen,
  onClose,
  preselectedReservationId,
  onSuccess,
}: AddAdvanceModalProps) {
  const { reservations, recordAdvancePayment } = usePms();

  // Active in-house or upcoming reservations
  const activeReservations = reservations.filter(
    r => r.status === 'CHECKED_IN' || r.status === 'CONFIRMED'
  );

  const [selectedResId, setSelectedResId] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState<number>(5000);
  const [paymentMethod, setPaymentMethod] = useState<string>('eSewa');
  const [depositNote, setDepositNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (preselectedReservationId) {
      setSelectedResId(preselectedReservationId);
    } else if (activeReservations.length > 0 && !selectedResId) {
      setSelectedResId(activeReservations[0].id);
    }
  }, [preselectedReservationId, activeReservations, selectedResId]);

  if (!isOpen) return null;

  const selectedRes = reservations.find(r => r.id === selectedResId);
  const currentPaid = selectedRes?.paidAmount || 0;
  const newTotalAdvance = currentPaid + (Number(advanceAmount) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId || advanceAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await recordAdvancePayment(
        selectedResId,
        advanceAmount,
        paymentMethod,
        depositNote.trim() || undefined
      );

      const guestName = selectedRes?.guestName || 'Guest';
      const roomNum = selectedRes?.roomNumber || '';
      const msg = `सफलतापूर्वक अग्रिम पेश्की दाखिला गरियो: रू. ${advanceAmount.toLocaleString()} (${paymentMethod}) — ${guestName} (Room ${roomNum})`;

      if (onSuccess) onSuccess(msg);
      onClose();
    } catch (err) {
      console.error('Error recording advance payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles size={12} /> Hotel Sherpa Soul PMS
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-400" />
              अग्रिम पेश्की दाखिला (Advance Deposit)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Reservation / Guest Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              पाहुना र कोठा छान्नुहोस् (Select In-House Guest / Room) *
            </label>
            {activeReservations.length === 0 ? (
              <p className="p-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-medium">
                हाल कुनै पनि सक्रिय पाहुना फेला परेन।
              </p>
            ) : (
              <select
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {activeReservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} — {r.guestName} ({r.status}) [यसअघि अग्रिम: रू. {(r.paidAmount || 0).toLocaleString()}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Input & Quick Chips */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              अग्रिम पेश्की रकम (Advance Deposit Amount - NPR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">रू.</span>
              <input
                type="number"
                min="100"
                step="50"
                required
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick preset buttons */}
            <div className="flex gap-1.5 mt-2">
              {[1000, 2000, 5000, 10000, 15000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAdvanceAmount(amt)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border transition cursor-pointer ${
                    advanceAmount === amt
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  +रू.{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              भुक्तानी माध्यम (Payment Gateway / Method) *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Cash NPR', 'Cash USD', 'eSewa', 'Khalti', 'Visa', 'Bank Transfer'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                    paymentMethod === m
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note / Receipt Reference */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              रसिद वा कैफियत (Receipt / Note - Optional)
            </label>
            <input
              type="text"
              placeholder="उदा: Counter advance receipt #104, Booking token"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Live Advance Accumulation Summary Box */}
          <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-3.5 space-y-1.5 font-medium text-emerald-950">
            <div className="flex justify-between text-slate-600">
              <span>यस अघिको दाखिला अग्रिम (Previous Advance):</span>
              <span className="font-mono font-bold text-slate-800">रू. {currentPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>अहिले थपिने अग्रिम पेश्की (+ New Advance):</span>
              <span className="font-mono font-bold">+ रू. {advanceAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-emerald-900 pt-1.5 border-t border-emerald-200">
              <span>जम्मा कुल अग्रिम रकम (Total Advance Balance):</span>
              <span className="font-mono">रू. {newTotalAdvance.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-emerald-700 pt-1 flex items-center gap-1">
              <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
              यो कुल अग्रिम रकम पछि चेक-आउट बिलिङ गर्दा स्वतः कट्टी (Auto Deduct) हुनेछ।
            </p>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              रद्द गर्नुहोस्
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedResId || advanceAmount <= 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              {isSubmitting ? 'सुरक्षित गर्दै...' : 'अग्रिम पेश्की सुरक्षित गर्नुहोस् (Save Deposit)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
