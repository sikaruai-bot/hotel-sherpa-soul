import { FileText, Download, DollarSign, Plus, CheckCircle2, Clock, Smartphone } from 'lucide-react';

export default function BillingPage() {
  const invoices = [
    { id: 'INV-2023-001', guest: 'Michael Chang', room: '302', date: '2023-10-25', amount: '4,500', currency: 'NPR', status: 'Unpaid', dueDate: 'Today' },
    { id: 'INV-2023-002', guest: 'Sarah Connor', room: '201', date: '2023-10-24', amount: '12,000', currency: 'NPR', status: 'Paid', method: 'eSewa' },
    { id: 'INV-2023-003', guest: 'Jane Doe', room: '302', date: '2023-10-22', amount: '150', currency: 'USD', status: 'Paid', method: 'Visa' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Billing & Invoicing</h1>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm font-medium text-slate-500">Outstanding Revenue</p>
          <p className="text-2xl font-bold mt-2 text-red-600">NPR 4,500</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-sm font-medium text-slate-500">Collected Today</p>
          <p className="text-2xl font-bold mt-2 text-green-600">NPR 24,000</p>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Quick Payment</p>
            <div className="flex gap-2 mt-3">
              <button className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-green-200">eSewa</button>
              <button className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-purple-200">Khalti</button>
              <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-200">Card</button>
            </div>
          </div>
          <Smartphone size={32} className="text-slate-300" />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-medium text-slate-500">Invoice</th>
              <th className="p-4 font-medium text-slate-500">Guest & Room</th>
              <th className="p-4 font-medium text-slate-500">Amount</th>
              <th className="p-4 font-medium text-slate-500">Status</th>
              <th className="p-4 font-medium text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{inv.id}<br/><span className="text-xs text-slate-500">{inv.date}</span></td>
                <td className="p-4">{inv.guest}<br/><span className="text-xs text-slate-500">Room {inv.room}</span></td>
                <td className="p-4 font-bold">{inv.currency} {inv.amount}</td>
                <td className="p-4">
                  {inv.status === 'Paid' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                      <CheckCircle2 size={14} /> Paid ({inv.method})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      <Clock size={14} /> Unpaid
                    </span>
                  )}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  {inv.status === 'Unpaid' && (
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700">Record Payment</button>
                  )}
                  <button className="p-1.5 border rounded-md hover:bg-slate-100 text-slate-600" title="Download PDF">
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
