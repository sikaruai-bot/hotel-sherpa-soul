"use client";

import React, { useState } from 'react';
import { QrCode, Printer, Copy, Check, X, ExternalLink, ShieldCheck, Wifi, Sparkles } from 'lucide-react';

interface SelfCheckinQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelfCheckinQrModal({ isOpen, onClose }: SelfCheckinQrModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const checkinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/self-checkin` 
    : 'https://hotelsherpasoulpms-sigma.vercel.app/self-checkin';

  // Crisp high-res QR code image generated via standard Google Charts / QRServer API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(checkinUrl)}&color=0f172a&bgcolor=ffffff&margin=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Guest Self Check-In QR Standee</h2>
              <p className="text-[11px] text-slate-500">Print or display at reception counter & entrance door</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Printable Preview Card */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          <div 
            id="printable-standee" 
            className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 border-2 border-amber-500/40 shadow-xl text-center space-y-4 relative"
          >
            {/* Mountain badge & PAN */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
              <Sparkles size={12} />
              <span>Thamel, Kathmandu • PAN: 119205419</span>
            </div>

            {/* Hotel Logo & Title */}
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-2xl p-2.5 max-w-[200px] mb-2 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Hotel Sherpa Soul" className="w-full h-auto object-contain" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">Hotel Sherpa Soul</h3>
              <p className="text-xs text-amber-400/90 font-medium tracking-wide mt-0.5">
                No Restaurant. No Noise. Sleep Well.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl shadow-md inline-block border-4 border-amber-500/30">
              <img 
                src={qrImageUrl} 
                alt="Self Check-in QR Code" 
                className="w-48 h-48 object-contain rounded-lg"
              />
            </div>

            {/* Call to action */}
            <div className="space-y-1">
              <div className="text-base font-black text-amber-300 tracking-tight">
                Front Desk Away? Scan to Check In
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs mx-auto">
                Late arrival or staff stepped away? Scan with your phone camera to instantly receive your Room Number, Key Instructions & High-Speed WiFi password.
              </p>
            </div>

            {/* Quick emergency contact footer on standee */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
              <p>PAN: <span className="text-amber-400 font-bold font-mono">119205419</span> • Reception: <span className="text-white font-bold">+977-1-4530311, 9851068219</span></p>
              <p>Complimentary WiFi • Hot Shower • Shared Kitchen</p>
            </div>
          </div>

          {/* Direct URL info */}
          <div className="w-full max-w-sm mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="truncate mr-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Direct URL</p>
              <p className="text-slate-700 font-mono text-[11px] truncate">{checkinUrl}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <a
            href="/self-checkin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
          >
            <ExternalLink size={13} />
            Test Guest View
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer size={14} />
              Print Counter Poster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
