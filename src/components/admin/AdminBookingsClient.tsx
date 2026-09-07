"use client";

import React, { useState } from 'react';
import { Search, Plus, Calendar, DollarSign, Check, X, Printer, User, Filter, AlertCircle, FileText, Eye, Download } from 'lucide-react';

interface BookingItem {
  id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestWhatsApp: string;
  guestCountry: string;
  guestIdType?: string;
  guestIdNumber?: string;
  guestIdDocumentUrl?: string;
  specialRequests: string;
  categoryId: string;
  categoryName: string;
  physicalRoomId: string;
  physicalRoomNumber: string;
  totalAmountUSD: number;
  amountPaidUSD: number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  source: string;
  createdAt: string;
}

interface PhysicalRoom {
  id: string;
  roomNumber: string;
  floor: number;
  categoryId: string;
}

interface RoomCategory {
  id: string;
  name: string;
  rateUSD: number;
}

interface Props {
  initialBookings: BookingItem[];
  physicalRooms: PhysicalRoom[];
  categories: RoomCategory[];
}

export default function AdminBookingsClient({ initialBookings, physicalRooms, categories }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [viewingIdDoc, setViewingIdDoc] = useState<{
    name: string;
    url: string;
    idType?: string;
    idNumber?: string;
  } | null>(null);

  // New Booking form state
  const [newBooking, setNewBooking] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    adults: 2,
    children: 0,
    categoryId: categories[0]?.id || '',
    physicalRoomId: physicalRooms[0]?.id || '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    totalAmountUSD: categories[0]?.rateUSD || 20,
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    source: 'WALK_IN',
  });

  const filtered = bookings.filter(b => {
    const matchesSearch = b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guestPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle status/payment update
  const handleUpdateBooking = async (bookingId: string, updates: Partial<BookingItem>) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, ...updates }),
      });

      if (!res.ok) throw new Error('Update failed');

      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, ...updates } : b)));
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => (prev ? { ...prev, ...updates } : null));
      }
    } catch {
      alert('Error updating booking.');
    }
  };

  // Handle create new booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      alert('Walk-in booking created successfully!');
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating booking');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by guest name, ref #, or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED IN</option>
            <option value="CHECKED_OUT">CHECKED OUT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Walk-In / Manual Booking</span>
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-900 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Room & Floor</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Financials</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.bookingNumber}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{b.guestName}</span>
                    <span className="text-[11px] text-slate-400 block">{b.guestPhone}</span>
                    {b.guestCountry && (
                      <span className="text-[10px] text-slate-500 font-medium block">{b.guestCountry}</span>
                    )}
                    {b.guestIdDocumentUrl ? (
                      <button
                        onClick={() => setViewingIdDoc({
                          name: b.guestName,
                          url: b.guestIdDocumentUrl!,
                          idType: b.guestIdType,
                          idNumber: b.guestIdNumber
                        })}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 mt-1 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-amber-700" />
                        <span>View ID Document</span>
                      </button>
                    ) : b.guestIdType || b.guestIdNumber ? (
                      <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1">
                        {b.guestIdType ? `${b.guestIdType}: ` : 'ID: '}{b.guestIdNumber}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">Room #{b.physicalRoomNumber}</span>
                    <span className="text-[10px] text-slate-500 block">{b.categoryName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{b.checkIn} → {b.checkOut}</span>
                    <span className="text-[10px] text-slate-400 block">{b.adults} Adults {b.children > 0 ? `+ ${b.children} Child` : ''}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold text-slate-900 block">USD ${b.totalAmountUSD}</span>
                    <span className={`text-[10px] font-bold ${b.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {b.paymentStatus} ({b.paymentMethod})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {b.source.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={b.status}
                      onChange={e => handleUpdateBooking(b.id, { status: e.target.value })}
                      className="px-2 py-1 rounded-lg border text-[11px] font-bold bg-white text-slate-800"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="CHECKED_IN">CHECKED IN</option>
                      <option value="CHECKED_OUT">CHECKED OUT</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="NO_SHOW">NO SHOW</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600">Booking Details</span>
                <h3 className="text-xl font-bold text-slate-900">{selectedBooking.bookingNumber}</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <strong className="text-slate-900 block text-sm">{selectedBooking.guestName}</strong>
                <span>{selectedBooking.guestEmail} • {selectedBooking.guestPhone}</span>
                {selectedBooking.guestCountry && (
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    Nationality: <strong className="text-slate-700">{selectedBooking.guestCountry}</strong>
                  </span>
                )}
              </div>

              {/* Guest ID Verification Card */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" /> Guest ID & Verification
                  </span>
                  {selectedBooking.guestIdDocumentUrl ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Document Attached
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                      No Document Uploaded
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">ID Document Type</span>
                    <strong className="text-slate-800">{selectedBooking.guestIdType || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">ID / Passport Number</span>
                    <strong className="text-slate-800 font-mono">{selectedBooking.guestIdNumber || 'Not specified'}</strong>
                  </div>
                </div>
                {selectedBooking.guestIdDocumentUrl && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingIdDoc({
                        name: selectedBooking.guestName,
                        url: selectedBooking.guestIdDocumentUrl!,
                        idType: selectedBooking.guestIdType,
                        idNumber: selectedBooking.guestIdNumber
                      })}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Uploaded ID</span>
                    </button>
                    <a
                      href={selectedBooking.guestIdDocumentUrl}
                      download={`Guest_ID_${selectedBooking.guestName.replace(/\s+/g, '_')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Room:</span>
                  <strong>Room #{selectedBooking.physicalRoomNumber} ({selectedBooking.categoryName})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dates:</span>
                  <strong>{selectedBooking.checkIn} to {selectedBooking.checkOut}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Due:</span>
                  <strong className="text-amber-600 text-sm">USD ${selectedBooking.totalAmountUSD}</strong>
                </div>
              </div>
            </div>

            {/* Change Assigned Room */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Assign Physical Room (201-203, 301-303)</label>
              <select
                value={selectedBooking.physicalRoomId}
                onChange={e => handleUpdateBooking(selectedBooking.id, { physicalRoomId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              >
                <option value="">Unassigned</option>
                {physicalRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room #{r.roomNumber} (Floor {r.floor})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Recording */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Payment Status & Method</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedBooking.paymentStatus}
                  onChange={e => handleUpdateBooking(selectedBooking.id, { paymentStatus: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="PAID">PAID (FULL)</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>

                <select
                  value={selectedBooking.paymentMethod}
                  onChange={e => handleUpdateBooking(selectedBooking.id, { paymentMethod: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="CASH">Cash (USD / NPR)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ONLINE_PAYMENT">Online / QR (eSewa)</option>
                  <option value="OTA_PAYMENT">OTA Virtual Card</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Walk-in Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateBooking} className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">New Walk-In / Phone Reservation</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Check-in</label>
                <input
                  type="date"
                  required
                  value={newBooking.checkIn}
                  onChange={e => setNewBooking({ ...newBooking, checkIn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Check-out</label>
                <input
                  type="date"
                  required
                  value={newBooking.checkOut}
                  onChange={e => setNewBooking({ ...newBooking, checkOut: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Room Category</label>
                <select
                  value={newBooking.categoryId}
                  onChange={e => {
                    const cat = categories.find(c => c.id === e.target.value);
                    setNewBooking({
                      ...newBooking,
                      categoryId: e.target.value,
                      totalAmountUSD: cat ? cat.rateUSD : 20,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (${c.rateUSD})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Assign Physical Room</label>
                <select
                  value={newBooking.physicalRoomId}
                  onChange={e => setNewBooking({ ...newBooking, physicalRoomId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="">Auto / Unassigned</option>
                  {physicalRooms.map(r => (
                    <option key={r.id} value={r.id}>Room #{r.roomNumber} (Fl {r.floor})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Smith"
                  value={newBooking.guestName}
                  onChange={e => setNewBooking({ ...newBooking, guestName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Phone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="+977 98..."
                  value={newBooking.guestPhone}
                  onChange={e => setNewBooking({ ...newBooking, guestPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Total Rate (USD)</label>
                <input
                  type="number"
                  required
                  value={newBooking.totalAmountUSD}
                  onChange={e => setNewBooking({ ...newBooking, totalAmountUSD: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-amber-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Booking Source</label>
                <select
                  value={newBooking.source}
                  onChange={e => setNewBooking({ ...newBooking, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="WALK_IN">Walk-In</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="BOOKING_COM">Booking.com</option>
                  <option value="AGODA">Agoda</option>
                  <option value="AIRBNB">Airbnb</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all"
            >
              Save Reservation
            </button>
          </form>
        </div>
      )}

      {/* Guest ID Document Preview Modal */}
      {viewingIdDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600">Guest Identity Document</span>
                <h3 className="text-lg font-bold text-slate-900">{viewingIdDoc.name}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {viewingIdDoc.idType || 'ID Document'} {viewingIdDoc.idNumber ? `• ${viewingIdDoc.idNumber}` : ''}
                </p>
              </div>
              <button
                onClick={() => setViewingIdDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-4 flex items-center justify-center bg-slate-900/5 rounded-2xl my-3 p-2 min-h-[300px]">
              {viewingIdDoc.url.startsWith('data:application/pdf') || viewingIdDoc.url.endsWith('.pdf') ? (
                <iframe
                  src={viewingIdDoc.url}
                  className="w-full h-[60vh] rounded-xl border border-slate-200 bg-white"
                  title={`ID Document for ${viewingIdDoc.name}`}
                />
              ) : (
                <img
                  src={viewingIdDoc.url}
                  alt={`ID Document for ${viewingIdDoc.name}`}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200"
                />
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                🔒 Official Guest Record • Hotel Sherpa Soul
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={viewingIdDoc.url}
                  download={`Guest_ID_${viewingIdDoc.name.replace(/\s+/g, '_')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 text-slate-700 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setViewingIdDoc(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
