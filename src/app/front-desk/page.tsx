import { LogIn, LogOut, Luggage, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function FrontDeskPage() {
  const arrivals = [
    { id: 'RES-001', guest: 'Sarah Connor', room: '201', type: 'Standard Double', source: 'Booking.com', time: '14:00', status: 'Pending', passport: false },
    { id: 'RES-002', guest: 'Michael Chang', room: '302', type: 'Standard Twin', source: 'Agoda', time: '15:30', status: 'Checked-In', passport: true },
  ];

  const departures = [
    { id: 'RES-098', guest: 'Elena Rossi', room: '203', time: '11:00', balance: '0.00', status: 'Pending' },
    { id: 'RES-099', guest: 'David Smith', room: '301', time: '12:00', balance: '4,500.00', status: 'Payment Due' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Front Desk Operations</h1>
        <p className="text-sm font-medium text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Arrivals */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-blue-50 p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-blue-900 flex items-center gap-2">
              <LogIn size={20} className="text-blue-600" />
              Today's Arrivals
            </h2>
            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">2 Guests</span>
          </div>
          
          <div className="divide-y">
            {arrivals.map((arrival) => (
              <div key={arrival.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{arrival.guest}</h3>
                    <p className="text-xs text-slate-500 font-medium">Room {arrival.room} • {arrival.type} • {arrival.source}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${arrival.status === 'Checked-In' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {arrival.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  {arrival.status !== 'Checked-In' && (
                    <button className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> Fast Check-In
                    </button>
                  )}
                  <button className={`flex-1 border py-1.5 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${arrival.passport ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white hover:bg-slate-50'}`}>
                    <FileText size={16} /> {arrival.passport ? 'Passport Saved' : 'Scan Passport'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Departures */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-orange-50 p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-orange-900 flex items-center gap-2">
              <LogOut size={20} className="text-orange-600" />
              Today's Departures
            </h2>
            <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">2 Guests</span>
          </div>
          
          <div className="divide-y">
            {departures.map((departure) => (
              <div key={departure.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{departure.guest}</h3>
                    <p className="text-xs text-slate-500 font-medium">Room {departure.room} • ETA: {departure.time}</p>
                  </div>
                  <div className="text-right">
                    {departure.balance !== '0.00' ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle size={12} /> Balance: NPR {departure.balance}
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-100 text-green-700">
                        Fully Paid
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-orange-500 text-white py-1.5 rounded-md text-sm font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2">
                    <LogOut size={16} /> Check-Out
                  </button>
                  <button className="border py-1.5 px-3 rounded-md text-sm font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2" title="Store Luggage">
                    <Luggage size={16} />
                  </button>
                  <button className="border py-1.5 px-3 rounded-md text-sm font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2" title="Late Check-out">
                    <Clock size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
