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
  Printer,
  ChefHat,
  Utensils,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Building
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden border border-slate-200 text-slate-900 flex flex-col max-h-[92vh]">
            
            {/* Modal Top Action Bar (hidden in print) */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-900 text-white no-print shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white">Monthly Residency & Lease Agreement</h3>
                  <p className="text-[11px] text-slate-400">Official contract, hotel rules & shared kitchen inventory</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition cursor-pointer"
                >
                  <Printer size={15} /> Print Agreement (प्रिन्ट)
                </button>
                <button 
                  onClick={() => setSelectedContract(null)} 
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Document Container */}
            <div className="p-6 md:p-10 overflow-y-auto space-y-6 text-slate-800 text-xs bg-white" id="printable-lease-agreement">
              
              {/* Header Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5 text-center relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-28 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="Hotel Sherpa Soul" className="max-h-14 w-auto object-contain" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Hotel Sherpa Soul</h2>
                      <p className="text-[11px] font-semibold text-purple-900 font-mono">PAN No: 119205419 • Regd. Tourism Provider</p>
                      <p className="text-[10px] text-slate-500">Bhagawati Marg -26, Thamel, Kathmandu, Nepal</p>
                      <p className="text-[10px] text-slate-500">Tel: +977-9851068219 / +977-1-4530311 | Email: hotelsherpasoul@gmail.com</p>
                    </div>
                  </div>
                  <div className="text-right border-l pl-4 border-slate-200">
                    <span className="inline-block bg-purple-100 text-purple-900 font-black px-2.5 py-0.5 rounded text-[10px] tracking-wider uppercase">
                      Official Lease Agreement
                    </span>
                    <p className="text-[11px] font-mono text-slate-600 mt-1">Ref: HSS-LS-{selectedContract.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[11px] text-slate-500">Date: {selectedContract.startDate}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
                  <h1 className="text-base md:text-lg font-black text-slate-950 uppercase tracking-wide">
                    Residential Extended Lease Agreement
                  </h1>
                  <p className="text-[11px] font-bold text-slate-600">
                    (दीर्घकालीन मासिक बसाई, होटल नियम तथा साझा भान्सा सम्झौता पत्र)
                  </p>
                </div>
              </div>

              {/* 1. Parties */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Building size={14} className="text-purple-600" />
                  <span>1. Parties to the Agreement (सम्झौताका पक्षहरू)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block">First Party (Management / Landlord)</span>
                    <p className="font-bold text-slate-900">Hotel Sherpa Soul</p>
                    <p className="text-slate-600">PAN Registration: <strong>119205419</strong></p>
                    <p className="text-slate-600">Address: Bhagawati Marg -26, Thamel, Kathmandu</p>
                    <p className="text-slate-600">Authorized Rep: <strong>Pasang Sherpa / Mingma Sherpa</strong></p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block">Second Party (Tenant / Resident)</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedContract.guestName}</p>
                    <p className="text-slate-600">Passport / Citizen ID: <strong className="font-mono">{selectedContract.passport || 'Verified Official ID'}</strong></p>
                    <p className="text-slate-600">Phone / WhatsApp: <strong>{selectedContract.phone || 'N/A'}</strong></p>
                    <p className="text-slate-600">Email: <strong>{selectedContract.email || 'N/A'}</strong></p>
                  </div>
                </div>
              </div>

              {/* 2. Key Lease Terms & Financials */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-purple-600" />
                  <span>2. Premise, Term & Financial Terms (कोठा तथा भाडा विवरण)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl">
                    <span className="text-[10px] text-purple-700 font-bold block uppercase">Assigned Unit</span>
                    <span className="text-base font-black text-purple-950 mt-0.5 block">Room {selectedContract.roomNumber}</span>
                    <span className="text-[9px] text-slate-500">Fully Furnished</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Lease Term</span>
                    <span className="text-xs font-black text-slate-900 mt-0.5 block">{selectedContract.startDate}</span>
                    <span className="text-[10px] text-slate-500 font-bold">to {selectedContract.endDate}</span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase">Monthly Rent</span>
                    <span className="text-sm font-black text-emerald-950 mt-0.5 block">NPR {selectedContract.monthlyRent.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-500">Due 1st of month</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl">
                    <span className="text-[10px] text-amber-700 font-bold block uppercase">Security Deposit</span>
                    <span className="text-sm font-black text-amber-950 mt-0.5 block">NPR {selectedContract.securityDeposit.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-500 font-medium">Refundable Escrow</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-bold text-slate-900">Rent Includes:</span>
                  <span>✓ 24/7 Solar Hot Water</span>
                  <span>✓ High-speed 5G Fiber WiFi</span>
                  <span>✓ Electricity & Water Utilities</span>
                  <span>✓ Weekly Housekeeping & Fresh Linen</span>
                  <span>✓ Garbage Collection</span>
                </div>
              </div>

              {/* 3. Detailed Hotel Rules & Regulations */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-600" />
                  <span>3. General Hotel Rules & Regulations (होटलका नियम तथा सर्तहरू)</span>
                </h3>
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] leading-relaxed">
                  <div>
                    <strong>3.1 Rent Payment & Notice of Renewal:</strong> Monthly rent is payable in advance by the 1st of each English calendar month via Cash, eSewa, Khalti, or Bank Transfer. If the Tenant intends to vacate or extend upon expiry of this lease, a minimum of <strong>15 days written notice</strong> must be given to Hotel Management.
                  </div>
                  <div>
                    <strong>3.2 Security Deposit Refund:</strong> The security deposit of NPR {selectedContract.securityDeposit.toLocaleString()} is held in escrow throughout the tenancy. It shall be refunded in full upon checkout inspection, return of room keys, and deduction of any unpaid bills or physical damage.
                  </div>
                  <div>
                    <strong>3.3 Quiet Hours & Sleep Well Policy (शान्त वातावरण):</strong> Quiet hours are strictly maintained from <strong>10:00 PM to 07:00 AM</strong>. Loud music, shouting, musical instruments, or rowdy behavior in bedrooms, corridors, and balconies is strictly prohibited.
                  </div>
                  <div>
                    <strong>3.4 Visitor & Guest Policy (पाहुना नियम):</strong> Outside visitors are permitted in common areas (reception, rooftop cafe, lobby) between 08:00 AM and 09:00 PM and must register at reception. Overnight guests require prior management consent, ID registration, and may incur standard extra-guest charges.
                  </div>
                  <div>
                    <strong>3.5 100% Non-Smoking & Safety Policy (धुम्रपान निषेध):</strong> Smoking is strictly forbidden inside all bedrooms, attached bathrooms, and enclosed corridors. Smoking is permitted only on the designated open rooftop terrace. No personal gas heaters, open flame candles, or hazardous appliances are permitted in bedrooms.
                  </div>
                  <div>
                    <strong>3.6 Room Maintenance & Subletting:</strong> The Tenant agrees to keep the room in clean, orderly condition. Subletting, transferring the room, or running unauthorized commercial trade from the room is strictly prohibited and shall result in immediate termination of the agreement without refund.
                  </div>
                  <div>
                    <strong>3.7 Housekeeping & Right of Inspection:</strong> Complimentary linen changes and deep vacuuming/cleaning are provided once per week. Hotel management reserves the right to enter the unit for maintenance emergencies or routine safety inspections upon giving reasonable advance notice.
                  </div>
                </div>
              </div>

              {/* 4. Shared Kitchen Privileges, Rules & Utensils Details */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <ChefHat size={14} className="text-amber-600" />
                    <span>4. Shared Kitchen Privileges, Rules & Utensils Details (साझा भान्सा सुविधा तथा भाँडाकुँडा विवरण)</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    selectedContract.kitchenAccess ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {selectedContract.kitchenAccess ? '✓ Kitchen Access Granted (स्वीकृत)' : '✗ Not Included'}
                  </span>
                </div>

                {selectedContract.kitchenAccess ? (
                  <div className="space-y-3">
                    {/* Operating hours & Overview */}
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-amber-700" />
                        <span className="text-slate-800">
                          <strong>Operating Hours:</strong> 06:00 AM – 10:00 PM Daily (Ground Floor Self-Cooking Facility)
                        </span>
                      </div>
                      <span className="text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                        Resident Shared Access
                      </span>
                    </div>

                    {/* Inventory of Utensils and Equipment Provided */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 border-b pb-1.5">
                        <Utensils size={14} className="text-amber-600" />
                        <span>Inventory of Utensils & Equipment Provided (उपलब्ध भान्सा सामग्री तथा भाँडाकुँडाको सूची)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px]">
                        {/* 1. Cookware */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                            <Flame size={12} className="text-orange-600" /> Cookware (पकाउने भाँडा)
                          </p>
                          <ul className="text-slate-600 space-y-0.5 text-[10px] list-disc list-inside">
                            <li>Pressure Cooker (5L Steel)</li>
                            <li>Non-stick Frying Pan</li>
                            <li>Deep Kadai / Wok (कराई)</li>
                            <li>Saucepan with Glass Lid</li>
                            <li>Boiling Pots (डेक्ची सेट)</li>
                          </ul>
                        </div>

                        {/* 2. Tableware & Cutlery */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                            <Utensils size={12} className="text-blue-600" /> Dining Set (खाना खाने)
                          </p>
                          <ul className="text-slate-600 space-y-0.5 text-[10px] list-disc list-inside">
                            <li>Dinner & Quarter Plates</li>
                            <li>Curry / Soup Bowls (कचौरा)</li>
                            <li>Dinner Spoons & Forks</li>
                            <li>Drinking Water Tumblers</li>
                            <li>Tea & Coffee Mugs (कप)</li>
                          </ul>
                        </div>

                        {/* 3. Prep Tools */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                            <Sparkles size={12} className="text-amber-600" /> Prep Tools (काट्ने/चलाउने)
                          </p>
                          <ul className="text-slate-600 space-y-0.5 text-[10px] list-disc list-inside">
                            <li>Wooden & Steel Spatulas (पन्यु)</li>
                            <li>Ladle & Skimmer (डाडु/झाँझर)</li>
                            <li>Chef & Paring Knives</li>
                            <li>Chopping Board (चपिङ बोर्ड)</li>
                            <li>Peeler & Tea Strainer</li>
                          </ul>
                        </div>

                        {/* 4. Electrical & Storage */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                            <Building size={12} className="text-emerald-600" /> Appliances (विद्युतीय)
                          </p>
                          <ul className="text-slate-600 space-y-0.5 text-[10px] list-disc list-inside">
                            <li>Auto-ignition Gas Cooktop</li>
                            <li>Smart Induction Cooker</li>
                            <li>Microwave Oven</li>
                            <li>Electric Water Kettle</li>
                            <li>Refrigerator & RO Water</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Kitchen Code of Conduct & Hygiene */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] leading-relaxed">
                      <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b pb-1">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        <span>Kitchen Hygiene & Conduct Guidelines (भान्सा सफाइ तथा आचरण नियमहरू)</span>
                      </p>
                      <ul className="space-y-1.5 text-slate-700">
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>"Clean-As-You-Go" Principle (प्रयोग गरेपछि तुरुन्त सफा गर्ने):</strong> All residents MUST wash, dry, and return used pots, pans, cutlery, and plates to their designated racks immediately after cooking. Leaving unwashed utensils in the sink is strictly prohibited.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Wipe Counters & Stove Surfaces:</strong> Wipe clean any oil splatters, spilled curries, or counter stains using the provided sponges and kitchen wipes before leaving.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Gas & Fire Safety (ग्यास बन्द गर्ने):</strong> Ensure gas burner knobs and induction electrical switches are safely turned OFF after every cooking session. Report any smell of gas immediately to reception.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Refrigerator Labeling:</strong> Personal groceries, milk, and food containers stored in the shared refrigerator MUST be labeled with the resident's <strong>Name & Room Number</strong>. Unlabeled or spoiled food is removed weekly.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Utensils Must Remain in Kitchen:</strong> Shared kitchen cookware, pots, pans, and appliances must NOT be taken or kept permanently in private bedrooms.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Breakage & Loss:</strong> Accidental breakage of cookware or glassware will be replaced or deducted from the tenant's deposit as logged in the PMS Kitchen Incident ledger.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px]">
                    Kitchen cooking privileges are not included in this agreement. The resident can order meals or request add-on kitchen privileges at the reception desk.
                  </div>
                )}
              </div>

              {/* 5. Special Notes */}
              {selectedContract.notes && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-[11px] text-slate-700">
                  <strong>Special Tenancy Conditions / Notes:</strong> {selectedContract.notes}
                </div>
              )}

              {/* 6. Signatures & Legal Endorsement */}
              <div className="pt-6 border-t-2 border-slate-800 space-y-4">
                <p className="text-[10px] text-slate-500 text-center italic">
                  By signing below, both parties acknowledge and agree to abide by all the terms, conditions, hotel rules, and kitchen guidelines stated in this agreement.
                </p>

                <div className="grid grid-cols-2 gap-8 pt-4 text-xs">
                  {/* Tenant */}
                  <div className="space-y-4 border-t border-slate-400 pt-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Second Party (Tenant / Resident)</span>
                      <p className="font-bold text-slate-900 mt-1">{selectedContract.guestName}</p>
                      <p className="text-[10px] text-slate-500">Passport/ID: {selectedContract.passport || 'Verified'}</p>
                    </div>
                    <div className="h-10 flex items-end">
                      <span className="text-slate-400 font-mono text-[11px]">Signature: ___________________________</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Date: {selectedContract.startDate}</p>
                  </div>

                  {/* Management */}
                  <div className="space-y-4 border-t border-slate-400 pt-3 text-right">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">First Party (Hotel Sherpa Soul)</span>
                      <p className="font-bold text-slate-900 mt-1">Management & Front Desk</p>
                      <p className="text-[10px] text-slate-500">PAN: 119205419 • Thamel, Kathmandu</p>
                    </div>
                    <div className="h-10 flex items-end justify-end">
                      <span className="text-slate-400 font-mono text-[11px]">Authorized Seal: ______________________</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Date: {selectedContract.startDate}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
