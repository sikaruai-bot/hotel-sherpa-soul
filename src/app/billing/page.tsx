"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Printer, 
  X,
  CreditCard,
  Building
} from 'lucide-react';
import { usePms, Invoice } from '@/context/PmsContext';

export default function BillingPage() {
  const { invoices, recordPayment } = usePms();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<Invoice['paymentMethod']>('eSewa');

  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0);

  const handleOpenPay = (inv: Invoice) => {
    setPayModalInvoice(inv);
    setPayAmount(inv.grandTotal - inv.paidAmount);
  };

  const handleConfirmPay = () => {
    if (!payModalInvoice) return;
    recordPayment(payModalInvoice.id, payAmount, payMethod);
    setPayModalInvoice(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="text-purple-600" /> Billing, Invoices & Tax Receipts
          </h1>
          <p className="text-xs text-slate-500">Official VAT invoices, eSewa/Khalti merchant collections & printable guest receipts</p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outstanding Balance</p>
          <p className="text-2xl font-extrabold mt-2 text-rose-600">NPR {totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pending checkout settlements</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue Collected</p>
          <p className="text-2xl font-extrabold mt-2 text-emerald-600">NPR {totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">100% Accounted & Audited</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Integrations</p>
            <div className="flex gap-2 mt-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold">eSewa</span>
              <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold">Khalti</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold">POS Card</span>
            </div>
          </div>
          <Smartphone size={32} className="text-slate-300" />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-sm">Issued Hotel Tax Invoices</h2>
          <span className="text-xs text-slate-500 font-medium">{invoices.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Guest & Room</th>
                <th className="p-3.5">Subtotal</th>
                <th className="p-3.5">VAT (13%)</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono font-bold text-slate-900">
                    {inv.id}
                    <div className="text-[10px] text-slate-400 font-sans">{inv.invoiceDate}</div>
                  </td>
                  <td className="p-3.5">
                    <strong className="text-slate-900 text-sm">{inv.guestName}</strong>
                    <div className="text-slate-500">Room {inv.roomNumber}</div>
                  </td>
                  <td className="p-3.5 text-slate-700">NPR {inv.subtotal.toLocaleString()}</td>
                  <td className="p-3.5 text-slate-700">NPR {inv.taxAmount.toLocaleString()}</td>
                  <td className="p-3.5 font-bold text-slate-900 text-sm">
                    NPR {inv.grandTotal.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    {inv.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        <CheckCircle2 size={12} /> Paid ({inv.paymentMethod})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                        <Clock size={12} /> Unpaid
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {inv.status !== 'PAID' && (
                      <button 
                        onClick={() => handleOpenPay(inv)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                      >
                        Record Pay
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Printer size={13} /> View / Print Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Bill Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-in text-slate-900">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Guest Folio</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Paper Structure */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/40 space-y-4 text-xs font-sans">
              {/* Hotel Header */}
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="text-xl font-black tracking-tight text-slate-900">HOTEL SHERPA SOUL</h2>
                <p className="text-slate-600 mt-0.5">Bhagawati Marg-26, Thamel, Kathmandu, Nepal</p>
                <p className="text-slate-500 text-[11px]">Tel: +977 1-4700000 | Email: info@hotelsherpasoul.com</p>
                <p className="text-slate-500 text-[11px] font-mono">PAN / VAT No: 601928374</p>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-slate-500 text-[11px]">Guest Name:</p>
                  <p className="font-bold text-sm text-slate-900">{selectedInvoice.guestName}</p>
                  <p className="text-slate-600">Room: {selectedInvoice.roomNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[11px]">Invoice #:</p>
                  <p className="font-bold text-sm font-mono">{selectedInvoice.id}</p>
                  <p className="text-slate-600">Date: {selectedInvoice.invoiceDate}</p>
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full text-left border-t border-b border-slate-200 py-2">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Rate</th>
                    <th className="py-2 text-right">Total (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{it.description}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">{it.unitPrice.toLocaleString()}</td>
                      <td className="py-2 text-right font-bold">{it.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 text-right text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>NPR {selectedInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge (10%):</span>
                  <span>NPR {selectedInvoice.serviceCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (13%):</span>
                  <span>NPR {selectedInvoice.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span>NPR {selectedInvoice.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Paid ({selectedInvoice.paymentMethod || 'Settled'}):</span>
                  <span>NPR {selectedInvoice.paidAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                Thank you for staying at Hotel Sherpa Soul! Tashi Delek!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Pay Modal */}
      {payModalInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Record Payment</h3>
              <button onClick={() => setPayModalInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p>Invoice: <strong>{payModalInvoice.id}</strong> ({payModalInvoice.guestName})</p>
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Amount to Settle (NPR)</label>
                <input 
                  type="number" 
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-xl font-bold text-base outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Gateway / Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['eSewa', 'Khalti', 'Cash NPR', 'Cash USD', 'Visa', 'Bank Transfer'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        payMethod === m ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setPayModalInvoice(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPay}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
