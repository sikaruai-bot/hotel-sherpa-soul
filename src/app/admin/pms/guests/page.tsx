import { Search, Star, History, Mail, Phone, Download } from 'lucide-react';

export default function GuestsPage() {
  const guests = [
    { id: 'G-1001', name: 'John Doe', nationality: 'American', visits: 3, status: 'VIP', lastStay: '2023-09-15', email: 'john@example.com' },
    { id: 'G-1002', name: 'Elena Rossi', nationality: 'Italian', visits: 1, status: 'Active', lastStay: 'Currently In-House', email: 'elena@example.com' },
    { id: 'G-1003', name: 'Jane Smith', nationality: 'British', visits: 1, status: 'Long Stay', lastStay: 'Currently In-House', email: 'jane.smith@example.com' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Guest Database (CRM)</h1>
        <button className="border px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Download size={18} /> Export Database
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 flex items-center bg-white border rounded-md px-3 py-2 shadow-sm">
          <Search size={18} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search by guest name, passport, or email..." 
            className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-500"
          />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm bg-white shadow-sm outline-none">
          <option>All Guests</option>
          <option>VIP / Repeat</option>
          <option>Long Stay</option>
          <option>Currently In-House</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guests.map((guest) => (
          <div key={guest.id} className="bg-white rounded-xl border shadow-sm p-6 relative overflow-hidden">
            {guest.status === 'VIP' && (
              <div className="absolute top-0 right-0 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                <Star size={12} fill="currentColor" /> VIP
              </div>
            )}
            {guest.status === 'Long Stay' && (
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                Long Stay
              </div>
            )}
            
            <h3 className="text-xl font-bold">{guest.name}</h3>
            <p className="text-sm text-slate-500 font-medium">{guest.nationality}</p>
            
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={16} /> {guest.email}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={16} /> +*** *** ****
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <History size={16} /> Last Stay: {guest.lastStay}
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition">View Profile</button>
              <button className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition">Book Again</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
