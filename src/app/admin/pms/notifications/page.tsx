import { Bell, MessageSquare, Mail, AlertTriangle, CheckCircle2, Clock, Smartphone, Settings2 } from 'lucide-react';

export default function NotificationsPage() {
  const alerts = [
    {
      id: 'NOTIF-01',
      title: 'New Instant OTA Booking',
      detail: 'Booking.com: Sarah Connor booked Room 201 for 3 nights. Inventory auto-decremented.',
      time: '12 mins ago',
      channel: 'WhatsApp + In-App',
      type: 'Booking',
      status: 'Delivered',
    },
    {
      id: 'NOTIF-02',
      title: 'Long Stay Lease Expiry Warning',
      detail: 'Room 203 (Carlos Gomez) lease expires in 5 days. Automatic reminder sent via WhatsApp.',
      time: '1 hour ago',
      channel: 'WhatsApp + Email',
      type: 'LongStay',
      status: 'Delivered',
    },
    {
      id: 'NOTIF-03',
      title: 'Pending Balance Checkout Reminder',
      detail: 'Room 301 (David Smith) departing today with pending NPR 4,500 balance.',
      time: '3 hours ago',
      channel: 'Front Desk In-App',
      type: 'Billing',
      status: 'Action Required',
    },
    {
      id: 'NOTIF-04',
      title: 'Shared Kitchen Deposit Deduction Logged',
      detail: 'NPR 250 deducted for damaged dishware from David Miller deposit.',
      time: 'Yesterday',
      channel: 'Email + In-App',
      type: 'Kitchen',
      status: 'Archived',
    },
    {
      id: 'NOTIF-05',
      title: 'Urgent Maintenance Alert',
      detail: 'Room 301 shower pressure reported low by front desk.',
      time: 'Yesterday',
      channel: 'Housekeeping SMS',
      type: 'Maintenance',
      status: 'In Progress',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="text-blue-600" /> Notifications & Automated Alerts
          </h1>
          <p className="text-sm text-slate-500">Multi-channel delivery logs (WhatsApp, Email & In-App) for bookings, payments & leases</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Settings2 size={16} /> Alert Rules
          </button>
        </div>
      </div>

      {/* Gateway status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">WhatsApp Business Gateway</p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">Connected • 99.8% Delivered</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Mail size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Transactional Email (SMTP)</p>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">Connected • Zero Bounces</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Smartphone size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Staff Mobile Push</p>
              <p className="text-xs text-purple-600 font-semibold mt-0.5">Reception & Housekeeping Active</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
        </div>
      </div>

      {/* Notification Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm">Recent Notification Stream</h2>
          <span className="text-xs text-slate-500 font-medium">Auto-refreshed live</span>
        </div>
        <div className="divide-y divide-slate-100">
          {alerts.map((a) => (
            <div key={a.id} className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-lg text-white ${
                  a.type === 'Booking' ? 'bg-blue-600' :
                  a.type === 'LongStay' ? 'bg-purple-600' :
                  a.type === 'Billing' ? 'bg-amber-600' :
                  a.type === 'Maintenance' ? 'bg-rose-600' : 'bg-slate-600'
                }`}>
                  <Bell size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {a.channel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{a.detail}</p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock size={12} /> {a.time}</span>
                <span className={`font-semibold mt-1 ${
                  a.status === 'Action Required' ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
