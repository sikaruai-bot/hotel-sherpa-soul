'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
    >
      <Printer className="w-4 h-4 text-slate-500" />
      <span>Print / Save Voucher</span>
    </button>
  );
}
