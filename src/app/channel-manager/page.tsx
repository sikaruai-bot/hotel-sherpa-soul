"use client";

import React, { useState } from 'react';
import { 
  Globe, 
  RefreshCw, 
  CheckCircle, 
  AlertOctagon, 
  ArrowUpDown, 
  Sliders, 
  ShieldCheck, 
  Zap, 
  Bell,
  CheckCircle2
} from 'lucide-react';
import { usePms } from '@/context/PmsContext';

export default function ChannelManagerPage() {
  const { rooms, stopSellActive, toggleStopSell, updateRoomStatus } = usePms();

  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [ratePushed, setRatePushed] = useState(false);
  const [selectedBlackoutRoom, setSelectedBlackoutRoom] = useState('ALL');

  const [rateStd, setRateStd] = useState(3500);
  const [rateDlx, setRateDlx] = useState(4200);

  const channels = [
    { name: 'Booking.com', status: 'Connected', latency: '0.8s', lastSync: 'Real-time', activeListings: 6, logo: 'B.' },
    { name: 'Agoda', status: 'Connected', latency: '1.1s', lastSync: 'Real-time', activeListings: 6, logo: 'agoda' },
    { name: 'Airbnb', status: 'Connected', latency: '1.9s', lastSync: 'Real-time', activeListings: 6, logo: 'airbnb' },
    { name: 'Trip.com', status: 'Connected', latency: '1.4s', lastSync: 'Real-time', activeListings: 6, logo: 'trip' },
    { name: 'Direct Website Engine', status: 'Connected', latency: '0.1s', lastSync: 'Instant', activeListings: 6, logo: 'Direct' },
  ];

  const handleForceSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  const handlePushRates = () => {
    setRatePushed(true);
    setTimeout(() => setRatePushed(false), 3000);
  };

  const handleApplyBlackout = () => {
    if (selectedBlackoutRoom === 'ALL') {
      toggleStopSell();
    } else {
      updateRoomStatus(selectedBlackoutRoom, 'UNDER_MAINTENANCE', 'Emergency Stop Sell applied');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Globe className="text-blue-600" /> Multi-Channel OTA Sync Manager
          </h1>
          <p className="text-xs text-slate-500">Real-time inventory pooling, instant rate propagation & zero-double-booking shield</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={handleForceSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Broadcasting to OTAs...' : 'Force Sync All OTAs'}
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={24} className="text-emerald-600" />
          <div>
            <p className="font-bold text-sm">All OTAs Synced Successfully!</p>
            <p className="text-xs text-emerald-700">Booking.com, Agoda, Airbnb, and Trip.com received latest inventory & rates.</p>
          </div>
        </div>
      )}

      {ratePushed && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={24} className="text-purple-600" />
          <div>
            <p className="font-bold text-sm">Rates Propagated!</p>
            <p className="text-xs text-purple-700">Standard Double (NPR {rateStd.toLocaleString()}) & Deluxe Twin (NPR {rateDlx.toLocaleString()}) live across all channels.</p>
          </div>
        </div>
      )}

      {/* Double Booking Shield Status */}
      <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm ${
        stopSellActive ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl text-white ${stopSellActive ? 'bg-rose-600' : 'bg-emerald-600'}`}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm">
              {stopSellActive ? '⚠️ STOP-SELL ACTIVATED: All OTAs Blacked Out' : 'Anti-Double-Booking Atomic Lock: ACTIVE'}
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              {stopSellActive 
                ? 'Availability is set to 0 across all OTAs. No new online bookings can enter.'
                : 'Atomic inventory pooling enabled across all 6 rooms. Any booking updates global inventory in <1.2s.'}
            </p>
          </div>
        </div>

        <button 
          onClick={toggleStopSell}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            stopSellActive ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
        >
          {stopSellActive ? 'Deactivate Stop-Sell' : 'Activate Emergency Stop-Sell'}
        </button>
      </div>

      {/* Connected Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {channels.map((ch) => (
          <div key={ch.name} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-900 text-sm">{ch.name}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle size={10} /> Live
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-mono text-slate-700 font-bold">{ch.latency}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Synced:</span>
                <span className="text-slate-700 font-medium">{ch.lastSync}</span>
              </div>
              <div className="flex justify-between">
                <span>Inventory:</span>
                <span className="text-purple-700 font-bold">{stopSellActive ? '0 (Locked)' : '6 Rooms'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Realtime Sync Logs & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sync Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Real-Time OTA Activity Stream
            </h2>
            <span className="text-[11px] text-slate-400">Webhook sync</span>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-xs">
            {[
              { time: '18:42:10', ch: 'Booking.com', event: 'Reservation #BK-9182 (Room 201)', impact: '-1 Room Pool', status: 'Success' },
              { time: '18:42:11', ch: 'Agoda', event: 'Inventory Decrement Broadcast Sent', impact: 'Pushed to 0', status: 'Success' },
              { time: '18:42:12', ch: 'Airbnb', event: 'iCal & API Block Synchronized', impact: 'Blocked Dates', status: 'Success' },
              { time: '17:15:00', ch: 'Trip.com', event: 'Dynamic Autumn Trekking Rates Synced', impact: 'Rates Updated', status: 'Success' },
            ].map((log, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">{log.time}</span>
                  <div>
                    <span className="font-bold text-slate-800 mr-2">{log.ch}:</span>
                    <span className="font-sans text-slate-600">{log.event}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {log.impact}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate & Restriction Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ArrowUpDown size={16} className="text-purple-600" /> Multi-OTA Bulk Rate Sync
            </h3>
            <p className="text-xs text-slate-500">
              Set and broadcast base room rates across Booking.com, Agoda, and Airbnb simultaneously:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Standard Double (Floors 2 & 3)</label>
                <input 
                  type="number" 
                  value={rateStd}
                  onChange={e => setRateStd(Number(e.target.value))}
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Deluxe Twin / Family Suite</label>
                <input 
                  type="number" 
                  value={rateDlx}
                  onChange={e => setRateDlx(Number(e.target.value))}
                  className="w-full p-2 border rounded-xl font-bold"
                />
              </div>

              <button 
                onClick={handlePushRates}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                Push Rates to All OTAs
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertOctagon size={16} className="text-rose-600" /> Single Room Stop-Sell
            </h3>
            <p className="text-xs text-slate-500">Blackout specific room on OTAs for maintenance or walk-in holds:</p>
            <select 
              value={selectedBlackoutRoom}
              onChange={e => setSelectedBlackoutRoom(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs bg-white"
            >
              <option value="ALL">ALL 6 ROOMS (Full Blackout)</option>
              {rooms.map(r => (
                <option key={r.number} value={r.number}>Room {r.number} ({r.type})</option>
              ))}
            </select>
            <button 
              onClick={handleApplyBlackout}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Apply Stop Sell
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
