import { Users, BedDouble, CalendarDays, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Arrivals</p>
            <p className="text-2xl font-bold mt-2">12</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Departures</p>
            <p className="text-2xl font-bold mt-2">5</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <CalendarDays size={24} />
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Available Rooms</p>
            <p className="text-2xl font-bold mt-2">3</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <BedDouble size={24} />
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Revenue</p>
            <p className="text-2xl font-bold mt-2">$1,240</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Placeholders for Charts & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6 min-h-[400px]">
          <h2 className="text-lg font-bold mb-4">Occupancy Trends</h2>
          <div className="flex h-full items-center justify-center text-slate-400">
            [ Chart Component Placeholder ]
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-start border-b pb-4 last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">New booking via Booking.com</p>
                  <p className="text-xs text-slate-500 mt-1">Room 201 • 3 Nights</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
