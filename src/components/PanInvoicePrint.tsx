"use client";

import React, { useState } from 'react';
import { Printer, Download, X, Upload, Check, Settings2, Edit3 } from 'lucide-react';
import { Invoice } from '@/context/PmsContext';
import { numberToWords } from '@/lib/numberToWords';

interface PanInvoicePrintProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function PanInvoicePrint({ invoice, onClose }: PanInvoicePrintProps) {
  // Configurable Hotel & Bill Profile
  const [hotelLogo, setHotelLogo] = useState<string>('/logo.png');
  const [hotelName, setHotelName] = useState<string>('HOTEL SHERPA SOUL PVT. LTD.');
  const [hotelPan, setHotelPan] = useState<string>('119205419');
  const [hotelAddress, setHotelAddress] = useState<string>('Bhagawati Marg-26, Thamel, Kathmandu, Nepal');
  const [hotelPhone, setHotelPhone] = useState<string>('+977 1-4700000, 9851000000');
  const [hotelEmail, setHotelEmail] = useState<string>('info@hotelsherpasoul.com');
  const [fiscalYear, setFiscalYear] = useState<string>('2081/082');

  // Customer PAN & Custom Notes
  const [guestPan, setGuestPan] = useState<string>('');
  const [billType, setBillType] = useState<'TAX_INVOICE' | 'PAN_BILL'>('TAX_INVOICE');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const formattedAmountInWords = numberToWords(invoice.grandTotal);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container Dialog */}
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Modal Toolbar (Hidden during Print) */}
        <div className="flex flex-wrap justify-between items-center bg-slate-900 text-white px-5 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
              Nepal IRD Standard
            </span>
            <span className="text-sm font-semibold">
              {billType === 'TAX_INVOICE' ? 'Tax Invoice (कर बिजक)' : 'PAN Bill (बिजक)'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {/* Toggle Bill Type */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setBillType('TAX_INVOICE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  billType === 'TAX_INVOICE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                Tax Invoice (VAT)
              </button>
              <button
                type="button"
                onClick={() => setBillType('PAN_BILL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  billType === 'PAN_BILL' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                PAN Bill
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
              title="Edit Hotel PAN & Details"
            >
              <Settings2 size={17} />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md transition"
            >
              <Printer size={15} /> Print Bill (Ctrl+P)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Edit Hotel & Bill Settings Bar (Collapsible, Hidden in Print) */}
        {showSettings && (
          <div className="p-4 bg-amber-50/70 border-b border-amber-200 text-xs space-y-3 print:hidden">
            <div className="flex items-center justify-between font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Edit3 size={14} /> Bill & PAN Profile Settings
              </span>
              <button onClick={() => setShowSettings(false)} className="text-amber-800 hover:text-black">
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Hotel Legal Name</label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Hotel PAN / VAT No.</label>
                <input
                  type="text"
                  value={hotelPan}
                  onChange={(e) => setHotelPan(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fiscal Year (आर्थिक वर्ष)</label>
                <input
                  type="text"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Guest / Buyer PAN No.</label>
                <input
                  type="text"
                  placeholder="Optional customer PAN"
                  value={guestPan}
                  onChange={(e) => setGuestPan(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Hotel Logo URL / Path</label>
                <input
                  type="text"
                  value={hotelLogo}
                  onChange={(e) => setHotelLogo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone / Telephone</label>
                <input
                  type="text"
                  value={hotelPhone}
                  onChange={(e) => setHotelPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OFFICIAL PRINTABLE INVOICE PAPER (Styled for standard A4 and thermal) */}
        {/* ========================================================================= */}
        <div id="printable-pan-bill" className="p-6 sm:p-10 bg-white text-slate-900 font-sans leading-relaxed print:p-6 print:text-black">
          {/* 1. Header with Logo & Hotel Credentials */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-800 pb-5 gap-4">
            {/* Hotel Logo */}
            <div className="w-56 h-20 relative flex items-center justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hotelLogo}
                alt="Hotel Sherpa Soul Logo"
                className="max-h-20 w-auto object-contain"
                onError={(e) => {
                  // Fallback if custom logo fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Hotel Text Details */}
            <div className="text-center sm:text-right">
              <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">{hotelName}</h1>
              <p className="text-xs text-slate-700">{hotelAddress}</p>
              <p className="text-[11px] text-slate-600">
                Tel: {hotelPhone} | Email: {hotelEmail}
              </p>
              <div className="inline-block mt-1 bg-slate-100 border border-slate-300 px-3 py-0.5 rounded font-mono text-xs font-bold text-slate-900">
                PAN No: <span className="tracking-widest">{hotelPan}</span>
              </div>
            </div>
          </div>

          {/* 2. Bill Title */}
          <div className="text-center my-4">
            <h2 className="text-base font-black tracking-wider uppercase inline-block border-b-2 border-slate-900 pb-0.5">
              {billType === 'TAX_INVOICE' ? 'TAX INVOICE / कर बिजक' : 'PAN BILL / बिजक'}
            </h2>
          </div>

          {/* 3. Invoice Meta & Guest / Buyer Information */}
          <div className="grid grid-cols-2 gap-6 border border-slate-300 rounded-lg p-3.5 mb-4 text-xs bg-slate-50/50 print:bg-transparent">
            {/* Left Column: Customer Details */}
            <div className="space-y-1">
              <div className="flex">
                <span className="w-28 text-slate-600">Guest Name:</span>
                <span className="font-bold text-slate-950 text-sm">{invoice.guestName}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600">Room Number:</span>
                <span className="font-semibold text-slate-900">Room {invoice.roomNumber}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600">Buyer PAN / VAT:</span>
                <span className="font-mono font-semibold text-slate-900">{guestPan || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600">Payment Mode:</span>
                <span className="font-semibold text-emerald-800">{invoice.paymentMethod || 'Cash NPR'}</span>
              </div>
            </div>

            {/* Right Column: Bill Meta */}
            <div className="space-y-1 sm:text-right">
              <div className="flex sm:justify-end">
                <span className="w-28 sm:w-auto text-slate-600 sm:mr-2">Invoice No:</span>
                <span className="font-mono font-bold text-slate-950">{invoice.id}</span>
              </div>
              <div className="flex sm:justify-end">
                <span className="w-28 sm:w-auto text-slate-600 sm:mr-2">Fiscal Year:</span>
                <span className="font-mono font-semibold text-slate-900">{fiscalYear}</span>
              </div>
              <div className="flex sm:justify-end">
                <span className="w-28 sm:w-auto text-slate-600 sm:mr-2">Invoice Date:</span>
                <span className="font-medium text-slate-900">{invoice.invoiceDate}</span>
              </div>
              <div className="flex sm:justify-end">
                <span className="w-28 sm:w-auto text-slate-600 sm:mr-2">Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs mb-4">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                  <th className="p-2 border-r border-slate-300 w-10 text-center">S.N.</th>
                  <th className="p-2 border-r border-slate-300">Particulars / Description (विवरण)</th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">Qty (परिमाण)</th>
                  <th className="p-2 border-r border-slate-300 text-right w-24">Rate (NPR)</th>
                  <th className="p-2 text-right w-28">Amount (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                      <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-300 font-medium">{it.description}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-mono">{it.quantity}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono">{it.unitPrice.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-semibold">{it.total.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-2 border-r border-slate-300 text-center font-mono">1</td>
                    <td className="p-2 border-r border-slate-300 font-medium">Room Accommodation Charge</td>
                    <td className="p-2 border-r border-slate-300 text-center font-mono">1</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">{invoice.subtotal.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-semibold">{invoice.subtotal.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Calculations Breakdown & Amount in Words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border border-slate-300 rounded-lg p-3.5 mb-6 text-xs">
            {/* Left: Amount in Words */}
            <div className="flex flex-col justify-between space-y-3">
              <div>
                <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Amount In Words (अक्षरेपी):</p>
                <p className="font-semibold text-slate-900 italic mt-1 bg-slate-50 p-2 rounded border border-slate-200 print:bg-transparent">
                  {formattedAmountInWords}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5">
                <p>• Goods & services once provided are non-refundable.</p>
                <p>• Standard Check-out time is 12:00 PM.</p>
                <p>• This is a computer system generated bill.</p>
              </div>
            </div>

            {/* Right: Numbers Summary */}
            <div className="space-y-1.5 text-right font-mono text-slate-800">
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">Total Amount (Subtotal):</span>
                <span>NPR {invoice.subtotal.toLocaleString()}</span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span className="font-sans">Discount (छुट):</span>
                  <span>- NPR {invoice.discount.toLocaleString()}</span>
                </div>
              )}

              {invoice.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="font-sans text-slate-600">Service Charge (10%):</span>
                  <span>NPR {invoice.serviceCharge.toLocaleString()}</span>
                </div>
              )}

              {billType === 'TAX_INVOICE' && (
                <div className="flex justify-between">
                  <span className="font-sans text-slate-600">VAT (13% मूल्य अभिवृद्धि कर):</span>
                  <span>NPR {invoice.taxAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-800">
                <span className="font-sans">Grand Total (कुल जम्मा):</span>
                <span>NPR {invoice.grandTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-bold text-emerald-700 pt-1">
                <span className="font-sans">Paid Amount (बुझाएको रकम):</span>
                <span>NPR {invoice.paidAmount.toLocaleString()}</span>
              </div>

              {invoice.grandTotal - invoice.paidAmount > 0 && (
                <div className="flex justify-between font-bold text-rose-600">
                  <span className="font-sans">Balance Due (बाँकी रकम):</span>
                  <span>NPR {(invoice.grandTotal - invoice.paidAmount).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* 6. Signatures & Footer */}
          <div className="grid grid-cols-2 gap-12 pt-8 pb-4 text-xs">
            <div className="text-center">
              <div className="border-t border-slate-400 w-40 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-700">Customer&apos;s Signature</p>
              <p className="text-[10px] text-slate-400">ग्राहकको दस्तखत</p>
            </div>

            <div className="text-center">
              <div className="border-t border-slate-400 w-40 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-700">Authorized Signature</p>
              <p className="text-[10px] text-slate-400">होटल प्रतिनिधि / छाप</p>
            </div>
          </div>

          {/* 7. Hospitality Note */}
          <div className="text-center border-t border-slate-200 pt-3 mt-2 text-[11px] text-slate-500 font-medium">
            Thank you for staying with us at Hotel Sherpa Soul! Tashi Delek & Namaste!
          </div>
        </div>
      </div>
    </div>
  );
}
