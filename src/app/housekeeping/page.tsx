"use client";

import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Wrench, 
  RefreshCw, 
  Plus,
  X,
  ShieldCheck
} from 'lucide-react';
import { usePms, HousekeepingTask, MaintenanceTicket } from '@/context/PmsContext';

export default function HousekeepingPage() {
  const { 
    rooms, 
    housekeepingTasks, 
    maintenanceTickets, 
    updateHousekeepingStatus, 
    addMaintenanceTicket, 
    resolveMaintenanceTicket 
  } = usePms();

  const [showMntModal, setShowMntModal] = useState(false);
  const [mntLoc, setMntLoc] = useState('Room 301');
  const [mntIssue, setMntIssue] = useState('');
  const [mntPriority, setMntPriority] = useState<'Low' | 'Medium' | 'Urgent'>('Urgent');
  const [mntTech, setMntTech] = useState('Pemba Technician');

  const readyRooms = rooms.filter(r => r.status === 'AVAILABLE');
  const cleaningRooms = rooms.filter(r => r.status === 'CLEANING_REQUIRED');
  const mntRooms = rooms.filter(r => r.status === 'UNDER_MAINTENANCE');

  const handleAddMnt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mntIssue.trim()) return;

    addMaintenanceTicket({
      location: mntLoc,
      issue: mntIssue,
      reportedBy: 'Reception Staff',
      priority: mntPriority,
      status: 'In Progress',
      assignedTechnician: mntTech,
    });

    setShowMntModal(false);
    setMntIssue('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="text-blue-600" /> Housekeeping & Maintenance Operations
          </h1>
          <p className="text-xs text-slate-500">Live room cleaning readiness, staff task assignment & facility repair tracking</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowMntModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Wrench size={16} /> Log Repair Ticket
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rooms Clean & Ready</p>
          <p className="text-2xl font-extrabold mt-2 text-emerald-600">{readyRooms.length} / {rooms.length} Rooms</p>
          <p className="text-xs text-slate-400 mt-1">Available for check-in</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cleaning Required</p>
          <p className="text-2xl font-extrabold mt-2 text-amber-600">{cleaningRooms.length} Rooms</p>
          <p className="text-xs text-slate-400 mt-1">Checkout turnover pending</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Maintenance</p>
          <p className="text-2xl font-extrabold mt-2 text-rose-600">{mntRooms.length} Rooms</p>
          <p className="text-xs text-slate-400 mt-1">Temporary block on OTAs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Repair Tickets</p>
          <p className="text-2xl font-extrabold mt-2 text-slate-900">
            {maintenanceTickets.filter(t => t.status !== 'Resolved').length} Open
          </p>
          <p className="text-xs text-slate-400 mt-1">Plumbing / electrical assigned</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Housekeeping Tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-sm">Room Cleaning & Turnover Roster</h2>
            <span className="text-xs text-slate-500 font-medium">{housekeepingTasks.length} Tasks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Housekeeper</th>
                  <th className="p-3.5">Cleaning Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {housekeepingTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <strong className="text-slate-900 text-sm">Room {t.roomNumber}</strong>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                        <UserCheck size={12} /> {t.assignedTo}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {t.type}
                    </td>
                    <td className="p-3.5">
                      {t.status === 'COMPLETED' || t.status === 'INSPECTED' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> {t.status}
                        </span>
                      ) : t.status === 'IN_PROGRESS' ? (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                          <Clock size={12} /> In Progress
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                          Pending Clean
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {t.status !== 'COMPLETED' && (
                        <button 
                          onClick={() => updateHousekeepingStatus(t.id, 'COMPLETED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-[11px]"
                        >
                          Mark Clean
                        </button>
                      )}
                      {t.status === 'COMPLETED' && (
                        <button 
                          onClick={() => updateHousekeepingStatus(t.id, 'INSPECTED')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[11px]"
                        >
                          Verify & Ready
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Tickets */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm">Active Facility Tickets</h3>
            <span className="text-[11px] text-slate-400">{maintenanceTickets.length} Tickets</span>
          </div>

          <div className="space-y-3">
            {maintenanceTickets.map((ticket) => (
              <div key={ticket.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-start font-bold text-slate-900">
                  <span>{ticket.location}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ticket.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-slate-600 font-medium">{ticket.issue}</p>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Assigned: <strong className="text-slate-700">{ticket.assignedTechnician}</strong></span>
                  {ticket.status !== 'Resolved' ? (
                    <button 
                      onClick={() => resolveMaintenanceTicket(ticket.id)}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      [Mark Fixed]
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-bold">Resolved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Log Repair Modal */}
      {showMntModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddMnt} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Log Facility Repair Ticket</h3>
              <button type="button" onClick={() => setShowMntModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Location / Room</label>
                <select 
                  value={mntLoc}
                  onChange={e => setMntLoc(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-white"
                >
                  <option value="Room 201">Room 201</option>
                  <option value="Room 202">Room 202</option>
                  <option value="Room 203">Room 203</option>
                  <option value="Room 301">Room 301</option>
                  <option value="Room 302">Room 302</option>
                  <option value="Room 303">Room 303</option>
                  <option value="Shared Kitchen">Shared Kitchen</option>
                  <option value="Reception / Lobby">Reception / Lobby</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Issue Description *</label>
                <input 
                  type="text" 
                  required
                  value={mntIssue}
                  onChange={e => setMntIssue(e.target.value)}
                  placeholder="e.g. Geyser water pressure low, bulb replacement"
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Priority</label>
                  <select 
                    value={mntPriority}
                    onChange={e => setMntPriority(e.target.value as any)}
                    className="w-full p-2 border rounded-xl bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Technician</label>
                  <input 
                    type="text" 
                    value={mntTech}
                    onChange={e => setMntTech(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowMntModal(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">
                Dispatch Ticket
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
