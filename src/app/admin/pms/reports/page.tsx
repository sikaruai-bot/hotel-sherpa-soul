import { TrendingUp, Sparkles, DollarSign, Users, Calendar, ArrowUpRight, BrainCircuit, BarChart3, Download } from 'lucide-react';

export default function ReportsAndAiPage() {
  const otaShare = [
    { channel: 'Booking.com', share: '42%', revenue: 'NPR 182,000', bookings: 14, color: 'bg-blue-600' },
    { channel: 'Direct / Walk-In / WhatsApp', share: '30%', revenue: 'NPR 130,000', bookings: 10, color: 'bg-emerald-600' },
    { channel: 'Agoda', share: '18%', revenue: 'NPR 78,000', bookings: 6, color: 'bg-purple-600' },
    { channel: 'Airbnb', share: '10%', revenue: 'NPR 43,000', bookings: 3, color: 'bg-rose-500' },
  ];

  const aiSuggestions = [
    {
      title: 'Trek Season Surge Detected: Increase Deluxe Double by 15%',
      reason: 'Incoming October trekking demand in Thamel showing +28% search volume on Booking.com. Projected RevPAR gain: +NPR 8,400/night.',
      impact: 'High Potential',
      action: 'Apply Surge Pricing',
    },
    {
      title: 'Fill Mid-Week Floor 2 Gap (Wed-Thu)',
      reason: 'Rooms 201 and 202 unreserved for upcoming Wednesday. Recommended flash promotion on Agoda at NPR 2,900.',
      impact: 'Occupancy Optimization',
      action: 'Schedule Flash Deal',
    },
    {
      title: 'Long-Stay Conversion Lead: Alice M.',
      reason: 'Guest currently staying 6 nights in Room 202; behavior matches digital nomad profile. Suggest pitching monthly rate of NPR 38,000.',
      impact: 'Guaranteed Revenue',
      action: 'Send Long-Stay Offer',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BrainCircuit className="text-purple-600" /> Business Intelligence & AI Forecasts
          </h1>
          <p className="text-sm text-slate-500">RevPAR, ADR, multi-channel commission analytics and predictive pricing suggestions</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <Download size={16} /> Export Financial PDF
          </button>
          <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm">
            <Sparkles size={16} /> Run AI Forecast
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">ADR (Average Daily Rate)</p>
          <p className="text-2xl font-bold mt-2 text-slate-900">NPR 3,650</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight size={13} /> +8.4% vs last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">RevPAR (Per Available Room)</p>
          <p className="text-2xl font-bold mt-2 text-slate-900">NPR 3,040</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight size={13} /> +12.1% across 6 rooms
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Occupancy Rate</p>
          <p className="text-2xl font-bold mt-2 text-slate-900">83.3%</p>
          <p className="text-xs text-slate-400 mt-1">5 of 6 rooms active today</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Direct vs OTA Ratio</p>
          <p className="text-2xl font-bold mt-2 text-blue-600">30% Direct</p>
          <p className="text-xs text-slate-400 mt-1">Saving ~NPR 26,000 in OTA commission</p>
        </div>
      </div>

      {/* AI Pricing & Occupancy Recommendations */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between mb-4 border-b border-purple-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600/60 rounded-lg">
              <Sparkles size={20} className="text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Dynamic Pricing & Occupancy Suggestions</h2>
              <p className="text-xs text-purple-200">Based on Thamel tourist seasons, search trends & direct hotel history</p>
            </div>
          </div>
          <span className="text-xs bg-purple-700/80 border border-purple-500 px-3 py-1 rounded-full font-medium">
            Updated 15 mins ago
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiSuggestions.map((s, idx) => (
            <div key={idx} className="bg-purple-900/50 border border-purple-700/60 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-800/80 text-purple-200 border border-purple-600/60 inline-block mb-2">
                  {s.impact}
                </span>
                <h3 className="font-bold text-sm text-white">{s.title}</h3>
                <p className="text-xs text-purple-200 mt-2 leading-relaxed">{s.reason}</p>
              </div>
              <button className="mt-4 w-full bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold py-2 rounded-lg text-xs transition shadow">
                {s.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Share Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-slate-600" /> Booking Channel Performance (This Month)
          </h2>
          <div className="space-y-4">
            {otaShare.map((ch) => (
              <div key={ch.channel} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-800">{ch.channel}</span>
                  <span className="font-bold text-slate-900">{ch.revenue} ({ch.share})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${ch.color}`} style={{ width: ch.share }}></div>
                </div>
                <div className="text-xs text-slate-400 text-right">{ch.bookings} Reservations</div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-600" /> Profit & Loss Summary (Monthly)
          </h2>
          
          <div className="divide-y divide-slate-100 text-sm space-y-2.5 pt-1">
            <div className="flex justify-between pb-2 text-slate-700">
              <span>Gross Room Revenue (Direct + OTA)</span>
              <span className="font-bold text-slate-900">NPR 433,000</span>
            </div>
            <div className="flex justify-between py-2 text-slate-700">
              <span>Long Stay Recurring Income</span>
              <span className="font-bold text-purple-700">+ NPR 75,000</span>
            </div>
            <div className="flex justify-between py-2 text-slate-700">
              <span>OTA Commissions Paid (~16% avg)</span>
              <span className="font-bold text-rose-600">- NPR 48,480</span>
            </div>
            <div className="flex justify-between py-2 text-slate-700">
              <span>Operations, Utilities & Kitchen LPG</span>
              <span className="font-bold text-rose-600">- NPR 54,000</span>
            </div>
            <div className="flex justify-between pt-3 text-base font-extrabold text-slate-900">
              <span>Estimated Net Operating Profit</span>
              <span className="text-emerald-600">NPR 405,520</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
