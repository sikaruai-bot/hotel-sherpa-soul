import { Globe, RefreshCw, CheckCircle, AlertOctagon, ArrowUpDown, Sliders, ShieldCheck, Zap, Bell } from 'lucide-react';

export default function ChannelManagerPage() {
  const channels = [
    { name: 'Booking.com', status: 'Connected', latency: '0.8s', lastSync: '1 min ago', activeListings: 6, logo: 'B.' },
    { name: 'Agoda', status: 'Connected', latency: '1.2s', lastSync: '2 mins ago', activeListings: 6, logo: 'agoda' },
    { name: 'Airbnb', status: 'Connected', latency: '2.1s', lastSync: 'Just now', activeListings: 4, logo: 'airbnb' },
    { name: 'Trip.com', status: 'Connected', latency: '1.5s', lastSync: '5 mins ago', activeListings: 6, logo: 'trip' },
    { name: 'Direct Engine', status: 'Connected', latency: '0.1s', lastSync: 'Real-time', activeListings: 6, logo: 'Direct' },
  ];

  const syncLogs = [
    { id: 'LOG-8812', time: '18:42:10', channel: 'Booking.com', event: 'Reservation #BK-9182 Imported (Room 201)', status: 'Success', inventoryDelta: '-1 Room' },
    { id: 'LOG-8811', time: '18:42:11', channel: 'Agoda', event: 'Inventory Decrement Sync Sent', status: 'Success', inventoryDelta: 'Updated to 0' },
    { id: 'LOG-8810', time: '18:42:12', channel: 'Airbnb', event: 'Inventory Decrement Sync Sent', status: 'Success', inventoryDelta: 'Calendar Blocked' },
    { id: 'LOG-8809', time: '17:15:00', channel: 'Trip.com', event: 'Bulk Rate Update: Standard Double -> NPR 3,500', status: 'Success', inventoryDelta: 'Rates Synced' },
    { id: 'LOG-8808', time: '15:20:11', channel: 'All Channels', event: 'Stop-Sell Enabled: Room 301 (Maintenance)', status: 'Success', inventoryDelta: 'Sold Out Pushed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Globe className="text-blue-600" /> Multi-Channel OTA Sync Manager
          </h1>
          <p className="text-sm text-slate-500">Real-time inventory pooling, instant rate propagation & zero-double-booking shield</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Sliders size={16} /> Bulk Rate & Restriction
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            <RefreshCw size={16} /> Force Sync All OTAs
          </button>
        </div>
      </div>

      {/* Double Booking Shield Status */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="font-bold text-emerald-950 text-sm">Anti-Double-Booking Shield: ACTIVE</h3>
            <p className="text-xs text-emerald-800">
              Instant Atomic Locking enabled across all 6 rooms (Floors 2 & 3). Any booking locks inventory in &lt;1.5 seconds worldwide.
            </p>
          </div>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300">
          5 / 5 Channels Live
        </span>
      </div>

      {/* Connected Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {channels.map((ch) => (
          <div key={ch.name} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-900 text-base">{ch.name}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle size={10} /> Live
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-mono text-slate-700 font-semibold">{ch.latency}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Synced:</span>
                <span className="text-slate-700">{ch.lastSync}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Rooms:</span>
                <span className="text-slate-700 font-semibold">{ch.activeListings}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <button className="text-blue-600 hover:underline font-medium">Configure</button>
              <button className="text-rose-600 hover:underline font-medium">Stop Sell</button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realtime Sync Activity Log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Real-Time OTA Transaction Log
            </h2>
            <span className="text-xs text-slate-400">Live webhook stream</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Event Description</th>
                  <th className="p-3.5">Inventory Impact</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500">{log.time}</td>
                    <td className="p-3.5 font-bold text-slate-800">{log.channel}</td>
                    <td className="p-3.5 font-sans text-slate-700">{log.event}</td>
                    <td className="p-3.5 font-sans font-medium text-purple-700">{log.inventoryDelta}</td>
                    <td className="p-3.5 text-right">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stop Sell & Restriction Controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <AlertOctagon size={16} className="text-rose-500" /> Emergency Stop-Sell Control
            </h2>
            <p className="text-xs text-slate-500">
              Instantly broadcast 0 availability to all OTAs for specific dates or rooms to prevent walk-in collisions or emergency maintenance.
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700">Select Room</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs outline-none">
                <option>Room 201 (Floor 2)</option>
                <option>Room 202 (Floor 2)</option>
                <option>Room 203 (Floor 2)</option>
                <option>Room 301 (Floor 3 - Maintenance)</option>
                <option>Room 302 (Floor 3 - Long Stay)</option>
                <option>Room 303 (Floor 3)</option>
                <option>ALL ROOMS (Full Property Blackout)</option>
              </select>
            </div>

            <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-sm">
              Push Immediate Stop Sell
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ArrowUpDown size={16} className="text-blue-500" /> Bulk Rate Sync
            </h2>
            <p className="text-xs text-slate-500">Set base rates across Booking.com, Agoda, and Airbnb simultaneously:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">Standard Double</label>
                <input type="text" defaultValue="NPR 3,500" className="w-full p-2 border rounded font-bold text-slate-800" />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Deluxe Twin</label>
                <input type="text" defaultValue="NPR 4,200" className="w-full p-2 border rounded font-bold text-slate-800" />
              </div>
            </div>
            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-lg text-xs transition">
              Push Rates to All OTAs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
