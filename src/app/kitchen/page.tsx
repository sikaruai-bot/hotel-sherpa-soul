import { ChefHat, ShieldAlert, CheckCircle2, Flame, Wrench, Plus, AlertCircle, RefreshCw } from 'lucide-react';

export default function KitchenPage() {
  const users = [
    {
      id: 'KU-101',
      guest: 'Jane Smith',
      room: '302',
      stayType: 'Long Stay',
      accessFrom: '2023-09-01',
      accessTo: '2023-11-30',
      depositPaid: '5,000',
      status: 'Active',
    },
    {
      id: 'KU-102',
      guest: 'Carlos Gomez',
      room: '203',
      stayType: 'Long Stay',
      accessFrom: '2023-08-15',
      accessTo: '2023-10-15',
      depositPaid: '5,000',
      status: 'Active',
    },
    {
      id: 'KU-103',
      guest: 'David Miller',
      room: '201',
      stayType: 'Short Stay Add-on',
      accessFrom: '2023-10-20',
      accessTo: '2023-10-27',
      depositPaid: '2,000',
      status: 'Active',
    },
  ];

  const inventory = [
    { item: 'Gas Stove (4-Burner)', condition: 'Operational', status: 'Good', lastInspection: 'Oct 24' },
    { item: 'Refrigerator (350L)', condition: 'Operational', status: 'Good', lastInspection: 'Oct 24' },
    { item: 'Microwave Oven', condition: 'Operational', status: 'Good', lastInspection: 'Oct 23' },
    { item: 'Electric Kettle (1.8L)', condition: 'Operational', status: 'Good', lastInspection: 'Oct 24' },
    { item: 'Cookware Sets & Pans', condition: 'Minor scratches', status: 'Fair', lastInspection: 'Oct 20' },
    { item: 'LPG Gas Cylinder 1', condition: 'Active (70% full)', status: 'Good', lastInspection: 'Oct 22' },
    { item: 'LPG Gas Cylinder 2 (Reserve)', condition: 'Sealed full', status: 'Standby', lastInspection: 'Oct 15' },
  ];

  const incidents = [
    { id: 'INC-01', type: 'Broken Mug', guest: 'David Miller (Room 201)', cost: 'NPR 250', status: 'Deducted from Deposit', date: 'Oct 22' },
    { id: 'INC-02', type: 'Cleaning Notice', guest: 'Shared Area', cost: 'None', status: 'Resolved by Staff', date: 'Oct 21' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ChefHat className="text-amber-600" /> Shared Kitchen Management
          </h1>
          <p className="text-sm text-slate-500">Access authorization, kitchen security deposits, inventory tracking & gas refills</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ShieldAlert size={16} /> Report Damage / Missing
          </button>
          <button className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition shadow-sm">
            <Plus size={16} /> Grant Kitchen Pass
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Authorized Kitchen Users</p>
          <p className="text-2xl font-bold mt-2 text-slate-900">3 Guests</p>
          <p className="text-xs text-amber-600 mt-1">2 Long Stay + 1 Short Stay</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Kitchen Deposits Held</p>
          <p className="text-2xl font-bold mt-2 text-emerald-600">NPR 12,000</p>
          <p className="text-xs text-slate-400 mt-1">Refundable upon checkout inspection</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Gas Level (LPG)</p>
            <Flame className="text-orange-500" size={18} />
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900">70% Full</p>
          <p className="text-xs text-slate-400 mt-1">1 reserve cylinder available</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Hygiene & Cleaning</p>
          <p className="text-2xl font-bold mt-2 text-emerald-600">Passed Inspection</p>
          <p className="text-xs text-slate-400 mt-1">Daily sanitization at 10:00 AM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Authorized Users Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800">Authorized Kitchen Users</h2>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">3 Active Passes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Guest & Room</th>
                  <th className="p-3.5">Stay Type</th>
                  <th className="p-3.5">Pass Valid Until</th>
                  <th className="p-3.5">Deposit</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-medium text-slate-900">
                      {u.guest}
                      <div className="text-xs text-slate-400">Room {u.room}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                        {u.stayType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{u.accessTo}</td>
                    <td className="p-3.5 text-slate-900 font-semibold">NPR {u.depositPaid}</td>
                    <td className="p-3.5 text-right">
                      <button className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded transition">
                        Revoke Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Equipment & Incidents Column */}
        <div className="space-y-6">
          {/* Kitchen Equipment Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-slate-800 text-sm">Equipment Status</h2>
              <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {inventory.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">{item.item}</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Damage & Incident Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="font-bold text-slate-800 text-sm mb-3">Recent Incident & Damage Log</h2>
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{inc.type}</span>
                    <span className="text-amber-700">{inc.cost}</span>
                  </div>
                  <div className="text-slate-500 mt-1">{inc.guest} • {inc.date}</div>
                  <div className="text-slate-600 mt-1 font-medium">{inc.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
