import { Settings2, BedDouble, Wrench, Sparkles, UserCheck } from 'lucide-react';

export default function RoomsPage() {
  const floors = [
    {
      level: 2,
      rooms: [
        { number: '201', type: 'Standard Double', status: 'Available', color: 'bg-green-100 text-green-700 border-green-200' },
        { number: '202', type: 'Standard Double', status: 'Occupied', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        { number: '203', type: 'Deluxe Twin', status: 'Cleaning Required', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      ]
    },
    {
      level: 3,
      rooms: [
        { number: '301', type: 'Deluxe Double', status: 'Maintenance', color: 'bg-red-100 text-red-700 border-red-200' },
        { number: '302', type: 'Standard Twin', status: 'Long Stay', color: 'bg-purple-100 text-purple-700 border-purple-200' },
        { number: '303', type: 'Family Suite', status: 'Available', color: 'bg-green-100 text-green-700 border-green-200' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Room Inventory</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
            <Settings2 size={16} />
            Room Types
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors">
            + Add Room
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {floors.map((floor) => (
          <div key={floor.level} className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-3">
              Floor {floor.level}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {floor.rooms.map((room) => (
                <div key={room.number} className={`p-5 rounded-lg border ${room.color} bg-opacity-50`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">{room.number}</h3>
                      <p className="text-sm opacity-80 mt-1">{room.type}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white bg-opacity-50 text-xs font-semibold">
                      {room.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-black border-opacity-10">
                    <button className="p-2 bg-white rounded-md hover:bg-opacity-80 transition-colors flex-1 flex justify-center" title="Assign Guest">
                      <UserCheck size={18} />
                    </button>
                    <button className="p-2 bg-white rounded-md hover:bg-opacity-80 transition-colors flex-1 flex justify-center" title="Request Cleaning">
                      <Sparkles size={18} />
                    </button>
                    <button className="p-2 bg-white rounded-md hover:bg-opacity-80 transition-colors flex-1 flex justify-center" title="Report Maintenance">
                      <Wrench size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
