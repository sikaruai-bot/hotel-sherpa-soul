"use client";

import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

// Dynamically import FullCalendar to prevent SSR pre-render issues in Next.js App Router
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[75vh] flex items-center justify-center text-slate-400">
      Loading Reservation Calendar...
    </div>
  ),
});

export default function ReservationsPage() {
  // Mock data based on Hotel Sherpa Soul's color requirements:
  const today = new Date();
  const getOffsetDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const events = [
    { title: 'Room 201 - John Doe', start: getOffsetDate(0), end: getOffsetDate(3), backgroundColor: '#3b82f6', borderColor: '#3b82f6' }, // Blue: Occupied
    { title: 'Room 202 - Alice (Arr)', start: getOffsetDate(0), allDay: true, backgroundColor: '#eab308', borderColor: '#eab308' }, // Yellow: Arriving Today
    { title: 'Room 203 - Bob (Dep)', start: getOffsetDate(0), allDay: true, backgroundColor: '#f97316', borderColor: '#f97316' }, // Orange: Departing Today
    { title: 'Room 301 - Maintenance', start: getOffsetDate(0), end: getOffsetDate(2), backgroundColor: '#ef4444', borderColor: '#ef4444' }, // Red: Maintenance
    { title: 'Room 302 - Jane (Long Stay)', start: getOffsetDate(-10), end: getOffsetDate(20), backgroundColor: '#a855f7', borderColor: '#a855f7' }, // Purple: Long Stay
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Reservation Calendar</h1>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
          + New Reservation
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm bg-white p-4 rounded-xl border shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-3 h-3 rounded-full bg-green-500"></span> Available</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Occupied</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Arriving Today</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Departing Today</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-3 h-3 rounded-full bg-red-500"></span> Maintenance</div>
        <div className="flex items-center gap-2 whitespace-nowrap"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Long Stay</div>
      </div>

      {/* Calendar Wrapper */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin] as any[]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
          }}
          events={events}
          editable={true}
          droppable={true}
          selectable={true}
          height="75vh"
        />
      </div>
    </div>
  );
}
