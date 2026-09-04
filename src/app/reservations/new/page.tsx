import { User, Calendar, CreditCard, Save } from 'lucide-react';

export default function NewReservationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Create Manual Reservation</h1>
      </div>

      <form className="space-y-6">
        {/* Guest Details Section */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-800 font-semibold">
            <User size={20} />
            <h2>Guest Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input type="text" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <input type="email" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone Number (WhatsApp)</label>
              <input type="tel" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" placeholder="+977 ..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nationality</label>
              <input type="text" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" placeholder="e.g. American" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Passport Number</label>
              <input type="text" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" placeholder="Required for foreign nationals" />
            </div>
          </div>
        </div>

        {/* Stay Details Section */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-800 font-semibold">
            <Calendar size={20} />
            <h2>Stay Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Check-in Date</label>
              <input type="date" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Check-out Date</label>
              <input type="date" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Room Type</label>
              <select className="w-full p-2 border rounded-md outline-none focus:border-blue-500 bg-white">
                <option>Standard Double</option>
                <option>Standard Twin</option>
                <option>Deluxe Double</option>
                <option>Family Suite</option>
              </select>
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium text-slate-700">Adults</label>
                <input type="number" min="1" defaultValue="1" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium text-slate-700">Children</label>
                <input type="number" min="0" defaultValue="0" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Source Section */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-800 font-semibold">
            <CreditCard size={20} />
            <h2>Payment & Source</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Booking Source</label>
              <select className="w-full p-2 border rounded-md outline-none focus:border-blue-500 bg-white">
                <option>Walk-In</option>
                <option>Phone</option>
                <option>WhatsApp</option>
                <option>Direct Website</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Total Amount (NPR)</label>
              <input type="number" className="w-full p-2 border rounded-md outline-none focus:border-blue-500" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Payment Status</label>
              <select className="w-full p-2 border rounded-md outline-none focus:border-blue-500 bg-white">
                <option>Pending</option>
                <option>Partially Paid</option>
                <option>Fully Paid</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Special Requests</label>
              <textarea className="w-full p-2 border rounded-md outline-none focus:border-blue-500" rows={2} placeholder="e.g. Early check-in requested"></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="button" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors">
            <Save size={18} />
            Confirm Booking
          </button>
        </div>
      </form>
    </div>
  );
}
