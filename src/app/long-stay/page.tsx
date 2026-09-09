"use client";

import React, { useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  Plus, 
  Download, 
  User, 
  X,
  FileText,
  Printer
} from 'lucide-react';
import { usePms, LongStayContract } from '@/context/PmsContext';

export default function LongStayPage() {
  const { rooms, contracts, addLongStayContract } = usePms();

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<LongStayContract | null>(null);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passport, setPassport] = useState('');
  const [roomNumber, setRoomNumber] = useState('302');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0]);
  const [monthlyRent, setMonthlyRent] = useState(40000);
  const [securityDeposit, setSecurityDeposit] = useState(40000);
  const [kitchenAccess, setKitchenAccess] = useState(true);
  const [notes, setNotes] = useState('Digital nomad remote worker. 3-month contract.');

  const totalMonthlyIncome = contracts.reduce((sum, c) => sum + c.monthlyRent, 0);
  const totalDeposits = contracts.reduce((sum, c) => sum + c.securityDeposit, 0);

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    addLongStayContract({
      guestName,
      email,
      phone,
      passport,
      roomNumber,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      kitchenAccess,
      depositStatus: 'HELD',
      rentPaidUntil: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      status: 'ACTIVE',
      notes,
    });

    setShowNewModal(false);
    setGuestName('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <User className="text-purple-600" /> Long Stay & Extended Rental Management
          </h1>
          <p className="text-xs text-slate-500">Monthly lease contracts, security deposit escrow, kitchen privileges & lease renewals</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus size={16} /> New Long-Stay Agreement
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Long-Stay Tenants</p>
          <p className="text-2xl font-extrabold mt-2 text-slate-900">{contracts.length} Tenants</p>
          <p className="text-xs text-purple-700 font-semibold mt-1">Steady guaranteed occupancy</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposits in Escrow</p>
          <p className="text-2xl font-extrabold mt-2 text-emerald-600">NPR {totalDeposits.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">100% Secured deposit held</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Recurring Rent</p>
          <p className="text-2xl font-extrabold mt-2 text-slate-900">NPR {totalMonthlyIncome.toLocaleString()} / mo</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Predictable cash flow</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Renewals Due</p>
          <p className="text-2xl font-extrabold mt-2 text-amber-600">
            {contracts.filter(c => c.status === 'EXPIRING').length} Expiring
          </p>
          <p className="text-[11px] text-slate-400 mt-1">5-day extension notice active</p>
        </div>
      </div>

      {/* Contract List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-sm">Long Stay Agreements & Tenants</h2>
          <span className="text-xs text-slate-500">{contracts.length} Agreements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Contract & Tenant</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Lease Term</th>
                <th className="p-3.5">Monthly Rent</th>
                <th className="p-3.5">Deposit</th>
                <th className="p-3.5">Kitchen Access</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5">
                    <strong className="text-slate-900 text-sm">{c.guestName}</strong>
                    <div className="text-[10px] text-slate-400 font-mono">{c.id} • {c.phone}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-purple-100 text-purple-900 font-extrabold px-2.5 py-0.5 rounded text-xs">
                      Room {c.roomNumber}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700">
                    <div>{c.startDate} &rarr; {c.endDate}</div>
                    <div className="text-[10px] text-slate-400">Paid until: {c.rentPaidUntil}</div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 text-sm">
                    NPR {c.monthlyRent.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-slate-700">
                    NPR {c.securityDeposit.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    {c.kitchenAccess ? (
                      <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                        <FileCheck size={12} /> Included
                      </span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      c.status === 'EXPIRING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button 
                      onClick={() => setSelectedContract(c)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition inline-flex items-center gap-1"
                    >
                      <FileText size={13} /> View Agreement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Agreement Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateContract} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Create Long Stay Agreement</h3>
              <button type="button" onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Guest Name *</label>
                  <input 
                    type="text" 
                    required
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Passport / Citizen ID</label>
                  <input 
                    type="text" 
                    value={passport}
                    onChange={e => setPassport(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Select Room</label>
                  <select 
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-white"
                  >
                    {rooms.map(r => (
                      <option key={r.number} value={r.number}>Room {r.number} ({r.type} - Floor {r.floor})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Lease Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Lease End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Monthly Rent (NPR)</label>
                  <input 
                    type="number" 
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Security Deposit (NPR)</label>
                  <input 
                    type="number" 
                    value={securityDeposit}
                    onChange={e => setSecurityDeposit(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="kitchenAccessCheck"
                  checked={kitchenAccess}
                  onChange={e => setKitchenAccess(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="kitchenAccessCheck" className="font-bold text-slate-800">
                  Include Shared Self-Service Kitchen Access Pass
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Terms / Notes</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md">
                Create & Activate Lease
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Agreement Printable Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in text-slate-900">
            <div className="flex justify-between items-center border-b pb-3 no-print">
              <span className="font-bold text-sm text-purple-700 uppercase tracking-wider">Hotel Sherpa Soul Lease Agreement</span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                  <Printer size={14} /> Print
                </button>
                <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border rounded-2xl space-y-3 text-xs">
              <div className="text-center border-b pb-2 flex flex-col items-center">
                <div className="h-12 w-32 mb-1 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Hotel Sherpa Soul" className="max-h-12 w-auto object-contain" />
                </div>
                <h3 className="font-bold text-base">MONTHLY RESIDENCY AGREEMENT</h3>
                <p className="text-slate-500 font-medium">Hotel Sherpa Soul • PAN No: 119205419 • Thamel, Kathmandu</p>
              </div>
              <p><strong>Tenant:</strong> {selectedContract.guestName} (Passport: {selectedContract.passport || 'Verified'})</p>
              <p><strong>Assigned Unit:</strong> Room {selectedContract.roomNumber}</p>
              <p><strong>Term:</strong> {selectedContract.startDate} to {selectedContract.endDate}</p>
              <p><strong>Monthly Rent:</strong> NPR {selectedContract.monthlyRent.toLocaleString()} (Due 1st of every month)</p>
              <p><strong>Security Deposit:</strong> NPR {selectedContract.securityDeposit.toLocaleString()} (Held in Escrow)</p>
              <p><strong>Kitchen Access:</strong> {selectedContract.kitchenAccess ? 'Granted with shared hygiene guidelines' : 'Not Included'}</p>
              <p><strong>Notes:</strong> {selectedContract.notes}</p>
              <div className="pt-4 border-t flex justify-between text-[11px] text-slate-500">
                <div>Tenant Signature: ____________</div>
                <div>Management: Hotel Sherpa Soul (PAN: 119205419)</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
