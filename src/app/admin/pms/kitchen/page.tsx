"use client";

import React, { useState } from 'react';
import { 
  ChefHat, 
  ShieldAlert, 
  CheckCircle2, 
  Flame, 
  Wrench, 
  Plus, 
  AlertCircle, 
  RefreshCw,
  X,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { usePms, KitchenUser, KitchenIncident } from '@/context/PmsContext';

export default function KitchenPage() {
  const { 
    rooms,
    kitchenUsers, 
    kitchenIncidents, 
    gasLevel, 
    addKitchenPass, 
    addKitchenIncident, 
    updateGasLevel 
  } = usePms();

  const [showPassModal, setShowPassModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Form states
  const [passGuest, setPassGuest] = useState('');
  const [passRoom, setPassRoom] = useState('201');
  const [passType, setPassType] = useState<'Long Stay' | 'Short Stay Add-on'>('Short Stay Add-on');
  const [passDeposit, setPassDeposit] = useState(5000);
  const [passValidTo, setPassValidTo] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);

  const [incType, setIncType] = useState('Broken Glassware / Cup');
  const [incGuest, setIncGuest] = useState('Sarah Connor');
  const [incRoom, setIncRoom] = useState('202');
  const [incCost, setIncCost] = useState(350);
  const [incNote, setIncNote] = useState('Broken while cooking dinner. Deducted from deposit.');

  const totalDeposits = kitchenUsers
    .filter(u => u.depositStatus === 'HELD')
    .reduce((sum, u) => sum + u.depositAmount, 0);

  const handleGrantPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passGuest.trim()) return;

    addKitchenPass({
      guestName: passGuest,
      roomNumber: passRoom,
      passType,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: passValidTo,
      depositAmount: passDeposit,
      depositStatus: 'HELD',
      status: 'ACTIVE',
    });

    setShowPassModal(false);
    setPassGuest('');
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    addKitchenIncident({
      type: incType,
      guestName: incGuest,
      roomNumber: incRoom,
      costNpr: incCost,
      status: 'Deducted from Deposit',
      note: incNote,
    });
    setShowIncidentModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ChefHat className="text-amber-600" /> Shared Kitchen Management
          </h1>
          <p className="text-xs text-slate-500">Access authorization passes, refundable deposits, LPG gas level monitoring & damage log</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowIncidentModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ShieldAlert size={16} className="text-rose-600" /> Report Broken Item
          </button>
          <button 
            onClick={() => setShowPassModal(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus size={16} /> Issue Kitchen Pass
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authorized Passes</p>
          <p className="text-2xl font-extrabold mt-2 text-slate-900">{kitchenUsers.length} Guests</p>
          <p className="text-xs text-amber-700 font-semibold mt-1">Exclusive Thamel self-cooking facility</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kitchen Deposits Held</p>
          <p className="text-2xl font-extrabold mt-2 text-emerald-600">NPR {totalDeposits.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">100% Refundable upon inspection</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">LPG Gas Cylinder Level</p>
            <Flame className="text-orange-500" size={18} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-extrabold text-slate-900">{gasLevel}% Full</p>
            <button 
              onClick={() => updateGasLevel(100)}
              className="text-[11px] text-blue-600 font-bold hover:underline"
            >
              [Refill Full]
            </button>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${gasLevel < 30 ? 'bg-rose-500' : 'bg-orange-500'}`} style={{ width: `${gasLevel}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Sanitization</p>
          <p className="text-2xl font-extrabold mt-2 text-emerald-600">Passed (10:00 AM)</p>
          <p className="text-[11px] text-slate-400 mt-1">Stove tops & fridge sanitized</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Passes Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-sm">Active Authorized Kitchen Access Users</h2>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
              {kitchenUsers.length} Active Passes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Guest & Room</th>
                  <th className="p-3.5">Pass Type</th>
                  <th className="p-3.5">Valid Period</th>
                  <th className="p-3.5">Deposit</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {kitchenUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <strong className="text-slate-900 text-sm">{u.guestName}</strong>
                      <div className="text-slate-500">Room {u.roomNumber}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded text-[11px]">
                        {u.passType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {u.validFrom} &rarr; {u.validTo}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      NPR {u.depositAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incident Log & Equipment Checklist */}
        <div className="space-y-6">
          {/* Incident Log */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Damage & Incident Log</h3>
              <span className="text-[11px] text-slate-400">{kitchenIncidents.length} Records</span>
            </div>

            <div className="space-y-3">
              {kitchenIncidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-amber-950">
                    <span>{inc.type}</span>
                    <span>NPR {inc.costNpr}</span>
                  </div>
                  <p className="text-slate-600">{inc.guestName} (Room {inc.roomNumber}) • {inc.date}</p>
                  <p className="text-amber-800 font-semibold text-[11px]">{inc.status}: {inc.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen Equipment Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Kitchen Equipment Status</h3>
            <div className="space-y-2 text-xs">
              {[
                { name: '4-Burner Gas Stove', status: 'Operational & Clean' },
                { name: 'Double Door Refrigerator (350L)', status: 'Optimal Temp (3°C)' },
                { name: 'Microwave Oven (25L)', status: 'Operational' },
                { name: 'Electric Kettle (1.8L)', status: 'Operational' },
                { name: 'Cookware & Frying Pans (Set of 6)', status: 'Complete' },
              ].map((eq, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-800">{eq.name}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    {eq.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Issue Pass Modal */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleGrantPass} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Issue Shared Kitchen Pass</h3>
              <button type="button" onClick={() => setShowPassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Guest Name *</label>
                <input 
                  type="text" 
                  required
                  value={passGuest}
                  onChange={e => setPassGuest(e.target.value)}
                  placeholder="Enter guest name"
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Room</label>
                <select 
                  value={passRoom}
                  onChange={e => setPassRoom(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-white"
                >
                  {rooms.map(r => (
                    <option key={r.number} value={r.number}>Room {r.number} ({r.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Refundable Deposit (NPR)</label>
                  <input 
                    type="number" 
                    value={passDeposit}
                    onChange={e => setPassDeposit(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Valid Until</label>
                  <input 
                    type="date" 
                    value={passValidTo}
                    onChange={e => setPassValidTo(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPassModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md">
                Grant Pass
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Damage Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReportIncident} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Report Kitchen Damage / Missing Item</h3>
              <button type="button" onClick={() => setShowIncidentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Item / Incident Type</label>
                <input 
                  type="text" 
                  value={incType}
                  onChange={e => setIncType(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Guest Name</label>
                  <input 
                    type="text" 
                    value={incGuest}
                    onChange={e => setIncGuest(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Room</label>
                  <input 
                    type="text" 
                    value={incRoom}
                    onChange={e => setIncRoom(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Replacement Cost (NPR)</label>
                <input 
                  type="number" 
                  value={incCost}
                  onChange={e => setIncCost(Number(e.target.value))}
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Staff Note</label>
                <input 
                  type="text" 
                  value={incNote}
                  onChange={e => setIncNote(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">
                Log Incident & Deduct
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
