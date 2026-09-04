import { Sparkles, CheckCircle2, Clock, AlertTriangle, UserCheck, Wrench, RefreshCw, Plus } from 'lucide-react';

export default function HousekeepingPage() {
  const rooms = [
    { room: '201', floor: 2, type: 'Standard Double', status: 'Cleaned', assignedTo: 'Dawa Sherpa', priority: 'Normal', inspectStatus: 'Ready for Guest' },
    { room: '202', floor: 2, type: 'Standard Double', status: 'Cleaning In Progress', assignedTo: 'Pasang Lhamu', priority: 'High (Arrival Today)', inspectStatus: 'In Progress' },
    { room: '203', floor: 2, type: 'Deluxe Twin', status: 'Cleaning Required', assignedTo: 'Unassigned', priority: 'High (Turnover)', inspectStatus: 'Pending Clean' },
    { room: '301', floor: 3, type: 'Deluxe Double', status: 'Under Maintenance', assignedTo: 'Pemba Technician', priority: 'Urgent', inspectStatus: 'Plumbing Issue' },
    { room: '302', floor: 3, type: 'Standard Twin', status: 'Occupied (Long Stay)', assignedTo: 'Dawa Sherpa', priority: 'Weekly Refresh', inspectStatus: 'Scheduled' },
    { room: '303', floor: 3, type: 'Family Suite', status: 'Cleaned', assignedTo: 'Pasang Lhamu', priority: 'Normal', inspectStatus: 'Inspected & Ready' },
  ];

  const maintenanceTasks = [
    { id: 'MNT-101', room: '301', issue: 'Bathroom shower tap pressure low', reportedBy: 'Front Desk', priority: 'Urgent', status: 'In Progress' },
    { id: 'MNT-102', room: 'Shared Kitchen', issue: 'Exhaust fan making humming noise', reportedBy: 'Kitchen Staff', priority: 'Medium', status: 'Scheduled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="text-blue-600" /> Housekeeping & Maintenance
          </h1>
          <p className="text-sm text-slate-500">Live room cleaning readiness, staff task assignment & facility repair tracking</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Wrench size={16} /> Log Repair Ticket
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            <Plus size={16} /> Assign Tasks
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Rooms Clean & Ready</p>
          <p className="text-2xl font-bold mt-2 text-emerald-600">2 / 6 Rooms</p>
          <p className="text-xs text-slate-400 mt-1">Rooms 201 & 303</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Cleaning In Progress</p>
          <p className="text-2xl font-bold mt-2 text-amber-600">2 Rooms</p>
          <p className="text-xs text-slate-400 mt-1">1 high priority arrival</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Cleaning Required</p>
          <p className="text-2xl font-bold mt-2 text-rose-600">1 Room</p>
          <p className="text-xs text-slate-400 mt-1">Turnover needed for Room 203</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Open Maintenance</p>
          <p className="text-2xl font-bold mt-2 text-red-600">2 Tickets</p>
          <p className="text-xs text-slate-400 mt-1">1 urgent in Room 301</p>
        </div>
      </div>

      {/* Housekeeping Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800">Daily Housekeeping Sheet (Floors 2 & 3)</h2>
            <button className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
              <RefreshCw size={12} /> Sync Room Status
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Housekeeper</th>
                  <th className="p-3.5">Cleaning Status</th>
                  <th className="p-3.5">Inspection Status</th>
                  <th className="p-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((r) => (
                  <tr key={r.room} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">
                      Room {r.room}
                      <div className="text-xs font-normal text-slate-500">Floor {r.floor} • {r.type}</div>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-medium">
                        <UserCheck size={13} /> {r.assignedTo}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {r.status === 'Cleaned' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={13} /> Cleaned
                        </span>
                      )}
                      {r.status === 'Cleaning In Progress' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Clock size={13} /> In Progress
                        </span>
                      )}
                      {r.status === 'Cleaning Required' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          <AlertTriangle size={13} /> Needs Cleaning
                        </span>
                      )}
                      {r.status === 'Under Maintenance' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          <Wrench size={13} /> In Repair
                        </span>
                      )}
                      {r.status.includes('Long Stay') && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Long Stay
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 text-xs font-medium">
                      {r.inspectStatus}
                    </td>
                    <td className="p-3.5 text-right">
                      <button className="text-xs bg-slate-900 text-white hover:bg-slate-800 px-2.5 py-1 rounded transition font-medium">
                        Mark Clean
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Wrench size={16} className="text-slate-600" /> Active Maintenance Requests
          </h2>
          <div className="space-y-3">
            {maintenanceTasks.map((t) => (
              <div key={t.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-900">{t.room}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                    t.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {t.priority}
                  </span>
                </div>
                <p className="text-slate-700 font-medium">{t.issue}</p>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Reported: {t.reportedBy}</span>
                  <span className="text-blue-600 font-semibold">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
