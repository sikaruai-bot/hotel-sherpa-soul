import { Calendar, DollarSign, ShieldCheck, FileCheck, AlertTriangle, Plus, Download, User } from 'lucide-react';

export default function LongStayPage() {
  const contracts = [
    {
      id: 'LSC-2023-01',
      guest: 'Jane Smith',
      room: '302',
      startDate: '2023-09-01',
      endDate: '2023-11-30',
      monthlyRent: '35,000',
      deposit: '35,000',
      kitchenAccess: true,
      rentStatus: 'Paid for Oct',
      status: 'Active',
      daysRemaining: 56,
    },
    {
      id: 'LSC-2023-02',
      guest: 'Carlos Gomez',
      room: '203',
      startDate: '2023-08-15',
      endDate: '2023-10-15',
      monthlyRent: '40,000',
      deposit: '40,000',
      kitchenAccess: true,
      rentStatus: 'Expiring Soon',
      status: 'Expiring',
      daysRemaining: 5,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Long Stay Management</h1>
          <p className="text-sm text-slate-500">Manage monthly contracts, tenant deposits, and extended stays</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Download size={16} /> Agreement Template
          </button>
          <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm">
            <Plus size={16} /> New Contract
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Active Contracts</p>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><User size={18} /></span>
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900">2 Tenants</p>
          <p className="text-xs text-slate-400 mt-1">Rooms 203 & 302</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Deposits Held</p>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ShieldCheck size={18} /></span>
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900">NPR 75,000</p>
          <p className="text-xs text-emerald-600 mt-1">100% Secured</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Monthly Contract Revenue</p>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={18} /></span>
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900">NPR 75,000 / mo</p>
          <p className="text-xs text-blue-600 mt-1">Recurring cash flow</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Renewals Due</p>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={18} /></span>
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-600">1 Contract</p>
          <p className="text-xs text-slate-400 mt-1">Expiring in 5 days</p>
        </div>
      </div>

      {/* Contract List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Active & Pending Long Stay Agreements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-4">Contract ID & Tenant</th>
                <th className="p-4">Room</th>
                <th className="p-4">Period</th>
                <th className="p-4">Monthly Rent</th>
                <th className="p-4">Security Deposit</th>
                <th className="p-4">Kitchen Access</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{c.guest}</div>
                    <div className="text-xs text-slate-400 font-mono">{c.id}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-md text-xs">
                      Room {c.room}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-700">{c.startDate} to {c.endDate}</div>
                    <div className="text-xs text-slate-400">{c.daysRemaining} days remaining</div>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    NPR {c.monthlyRent}
                  </td>
                  <td className="p-4 text-slate-700">
                    NPR {c.deposit}
                  </td>
                  <td className="p-4">
                    {c.kitchenAccess ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <FileCheck size={14} /> Included
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-4">
                    {c.status === 'Expiring' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                        <AlertTriangle size={13} /> {c.rentStatus}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                        <FileCheck size={13} /> Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition">
                      Invoice
                    </button>
                    <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition">
                      Renew / Extend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
