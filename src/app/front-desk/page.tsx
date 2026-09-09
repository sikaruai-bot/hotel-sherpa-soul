"use client";

import React, { useState } from 'react';
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
  QrCode
} from 'lucide-react';
import { usePms, Reservation } from '@/context/PmsContext';
import SelfCheckinQrModal from '@/components/SelfCheckinQrModal';

export default function FrontDeskPage() {
  const { reservations, checkInGuest, checkOutGuest, createInvoice } = usePms();

  // Modals state
  const [selectedResForCheckIn, setSelectedResForCheckIn] = useState<Reservation | null>(null);
  const [passportInput, setPassportInput] = useState('');
  
  const [selectedResForCheckOut, setSelectedResForCheckOut] = useState<Reservation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'eSewa' | 'Khalti' | 'Cash NPR' | 'Cash USD' | 'Visa'>('eSewa');
  const [extraCharges, setExtraCharges] = useState(0);

  const [luggageNotes, setLuggageNotes] = useState<string[]>(['Sarah Connor (Room 202) - 2 Backpacks stored in reception closet.']);
  const [newLuggageText, setNewLuggageText] = useState('');
  const [showLuggageModal, setShowLuggageModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Filter Arrivals & Departures
  const arrivals = reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN');
  const checkedInList = reservations.filter(r => r.status === 'CHECKED_IN');

  const handleConfirmCheckIn = () => {
    if (!selectedResForCheckIn) return;
    checkInGuest(selectedResForCheckIn.id, passportInput || selectedResForCheckIn.passportNumber);
    setSelectedResForCheckIn(null);
    setPassportInput('');
  };

  const handleConfirmCheckOut = () => {
    if (!selectedResForCheckOut) return;
    const remainingBalance = Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges;
    
    // Auto-create invoice
    createInvoice({
      reservationId: selectedResForCheckOut.id,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      guestName: selectedResForCheckOut.guestName,
      roomNumber: selectedResForCheckOut.roomNumber,
      items: [
        { description: `Room Stay: ${selectedResForCheckOut.roomType}`, quantity: 1, unitPrice: selectedResForCheckOut.totalAmount, total: selectedResForCheckOut.totalAmount },
        ...(extraCharges > 0 ? [{ description: 'Incidental / Kitchen / Laundry charges', quantity: 1, unitPrice: extraCharges, total: extraCharges }] : [])
      ],
      subtotal: selectedResForCheckOut.totalAmount + extraCharges,
      taxAmount: 0,
      serviceCharge: 0,
      discount: 0,
      grandTotal: selectedResForCheckOut.totalAmount + extraCharges,
      paidAmount: selectedResForCheckOut.totalAmount + extraCharges,
      paymentMethod: paymentMethod as any,
      status: 'PAID',
    });

    checkOutGuest(selectedResForCheckOut.id, {
      method: paymentMethod as any,
      amount: remainingBalance,
    });

    setSelectedResForCheckOut(null);
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
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition shadow-sm"
          >
            <QrCode size={16} /> Print Self Check-In QR
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
                        <span className="font-semibold text-slate-700">{res.source}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      res.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {res.status === 'CHECKED_IN' ? 'In-House (Checked-In)' : 'Arrival (Confirmed)'}
                    </span>
                  </div>

                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">
                      Stay: <strong className="text-slate-800">{res.checkInDate} to {res.checkOutDate}</strong>
                    </span>
                    <span className="text-slate-600">
                      Passport: <strong className={res.passportNumber ? 'text-emerald-700 font-mono' : 'text-rose-600'}>{res.passportNumber || 'Not Registered'}</strong>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {res.status !== 'CHECKED_IN' ? (
                      <button 
                        onClick={() => {
                          setSelectedResForCheckIn(res);
                          setPassportInput(res.passportNumber || '');
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle size={15} /> Check-In Guest
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedResForCheckIn(res);
                          setPassportInput(res.passportNumber || '');
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <FileText size={15} /> Edit Passport / Details
                      </button>
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

      {/* Check-In Modal */}
      {selectedResForCheckIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Check-In: {selectedResForCheckIn.guestName}</h3>
              <button onClick={() => setSelectedResForCheckIn(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-900">
                <p><strong>Room Assigned:</strong> Room {selectedResForCheckIn.roomNumber} ({selectedResForCheckIn.roomType})</p>
                <p><strong>Dates:</strong> {selectedResForCheckIn.checkInDate} to {selectedResForCheckIn.checkOutDate}</p>
                <p><strong>Source:</strong> {selectedResForCheckIn.source}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Passport Number / Citizen ID *</label>
                <input 
                  type="text" 
                  value={passportInput}
                  onChange={e => setPassportInput(e.target.value)}
                  placeholder="Enter passport number for Nepal Tourist Registry"
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-600 text-sm font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                <ShieldCheck size={18} />
                <span>Room key handed over. Keycard verified.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setSelectedResForCheckIn(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCheckIn}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle size={15} /> Complete Check-In
              </button>
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
                  <span>Total Due to Settle:</span>
                  <span className="text-rose-600">
                    NPR {(Math.max(0, selectedResForCheckOut.totalAmount - selectedResForCheckOut.paidAmount) + extraCharges).toLocaleString()}
                  </span>
                </div>
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
      <SelfCheckinQrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />

    </div>
  );
}
