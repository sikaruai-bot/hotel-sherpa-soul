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
  Building,
  UtensilsCrossed,
  Shirt,
  ShoppingBag,
  Tag,
  Trash2,
  Receipt,
  Search,
  Check,
  Sparkles,
  ArrowDownCircle,
  AlertCircle
} from 'lucide-react';
import { usePms, Invoice } from '@/context/PmsContext';
import PanInvoicePrint from '@/components/PanInvoicePrint';
import AddExpenseModal, { ExtraExpenseItem } from '@/components/AddExpenseModal';
import AddAdvanceModal from '@/components/AddAdvanceModal';

export default function BillingPage() {
  const { invoices, rooms, reservations, createInvoice, addInvoiceItem, recordPayment } = usePms();

  // Print Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Record Payment Modal
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<Invoice['paymentMethod']>('eSewa');

  // Add Expense to Existing Invoice Modal
  const [targetInvoiceForExpense, setTargetInvoiceForExpense] = useState<Invoice | null>(null);

  // Add Advance Deposit Modal
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState<boolean>(false);

  // Create New Invoice Modal
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState<boolean>(false);
  const [newInvGuestName, setNewInvGuestName] = useState<string>('');
  const [newInvRoomNumber, setNewInvRoomNumber] = useState<string>('201');
  const [newInvItems, setNewInvItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; total: number }>>([
    { description: 'Room Accommodation Charge (कोठा भाडा)', quantity: 1, unitPrice: 2700, total: 2700 }
  ]);
  const [newInvDiscount, setNewInvDiscount] = useState<number>(0);
  const [newInvDeductAdvance, setNewInvDeductAdvance] = useState<boolean>(true);
  const [newInvIsPaid, setNewInvIsPaid] = useState<boolean>(false);
  const [newInvImmediatePayAmount, setNewInvImmediatePayAmount] = useState<number>(0);
  const [newInvPayMethod, setNewInvPayMethod] = useState<Invoice['paymentMethod']>('Cash NPR');
  const [isAddingItemToNewInv, setIsAddingItemToNewInv] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Financial aggregates
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.grandTotal - (inv.paidAmount || 0)),
    0
  );
  const totalAdvanceHeld = reservations
    .filter(r => r.status === 'CHECKED_IN' || r.status === 'CONFIRMED')
    .reduce((sum, r) => sum + (r.paidAmount || 0), 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const due = Math.max(0, inv.grandTotal - (inv.paidAmount || 0));
    if (statusFilter === 'PAID' && (inv.status !== 'PAID' || due > 0)) return false;
    if (statusFilter === 'PARTIAL' && inv.status !== 'PARTIAL') return false;
    if (statusFilter === 'UNPAID' && inv.status !== 'UNPAID') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = inv.guestName?.toLowerCase().includes(q);
      const matchRoom = inv.roomNumber?.toLowerCase().includes(q);
      const matchId = inv.id?.toLowerCase().includes(q);
      return matchName || matchRoom || matchId;
    }
    return true;
  });

  // Lookup active reservation for the currently chosen room in the New Invoice draft
  const activeReservationForDraft = reservations.find(
    r => (r.roomNumber === newInvRoomNumber || (newInvGuestName && r.guestName.toLowerCase() === newInvGuestName.toLowerCase())) &&
      (r.status === 'CHECKED_IN' || r.status === 'CONFIRMED')
  );
  const draftAdvanceAvailable = activeReservationForDraft?.paidAmount || 0;

  // New Invoice Totals calculation
  const newInvSubtotal = newInvItems.reduce((sum, it) => sum + it.total, 0);
  const newInvGrandTotal = Math.max(0, newInvSubtotal - newInvDiscount);
  const newInvAdvanceToDeduct = (newInvDeductAdvance && draftAdvanceAvailable > 0)
    ? Math.min(draftAdvanceAvailable, newInvGrandTotal)
    : 0;
  const newInvNetPayable = Math.max(0, newInvGrandTotal - newInvAdvanceToDeduct);

  // Open Payment Modal for an existing invoice
  const handleOpenPay = (inv: Invoice) => {
    setPayModalInvoice(inv);
    const due = Math.max(0, inv.grandTotal - (inv.paidAmount || 0));
    setPayAmount(due);
    setPayMethod(inv.paymentMethod || 'eSewa');
  };

  const handleConfirmPay = () => {
    if (!payModalInvoice) return;
    recordPayment(payModalInvoice.id, payAmount, payMethod);
    const prevPaid = payModalInvoice.paidAmount || 0;
    const newTotal = prevPaid + payAmount;
    const remaining = Math.max(0, payModalInvoice.grandTotal - newTotal);

    setPayModalInvoice(null);
    showToast(
      `सफलतापूर्वक भुक्तानी रेकर्ड गरियो: रू. ${payAmount.toLocaleString()} (${payMethod}). ${
        remaining > 0 ? `बाँकी बक्यौता: रू. ${remaining.toLocaleString()}` : 'बिल १००% चुक्ता भयो!'
      }`
    );
  };

  // Add Expense to an existing invoice
  const handleAddExpenseToExisting = async (item: ExtraExpenseItem) => {
    if (!targetInvoiceForExpense) return;
    await addInvoiceItem(targetInvoiceForExpense.id, {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    });
    showToast(`सफलतापूर्वक खर्च थपियो: ${item.description} (रू. ${item.total.toLocaleString()})`);
    setTargetInvoiceForExpense(null);
  };

  // Add Expense item to the New Invoice draft
  const handleAddItemToNewInvoice = (item: ExtraExpenseItem) => {
    setNewInvItems(prev => [
      ...prev,
      {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }
    ]);
    setIsAddingItemToNewInv(false);
  };

  const handleRemoveNewInvItem = (idx: number) => {
    setNewInvItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Create New Invoice Submit
  const handleCreateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvGuestName.trim() || newInvItems.length === 0) return;

    const immediatePaid = newInvIsPaid ? Number(newInvImmediatePayAmount) : 0;
    const totalPaid = newInvAdvanceToDeduct + immediatePaid;

    let invoiceStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
    if (totalPaid >= newInvGrandTotal && newInvGrandTotal > 0) {
      invoiceStatus = 'PAID';
    } else if (totalPaid > 0) {
      invoiceStatus = 'PARTIAL';
    }

    const created = createInvoice({
      reservationId: activeReservationForDraft?.id,
      guestName: newInvGuestName.trim(),
      roomNumber: newInvRoomNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      items: newInvItems,
      subtotal: newInvSubtotal,
      taxAmount: 0,
      serviceCharge: 0,
      discount: newInvDiscount,
      grandTotal: newInvGrandTotal,
      paidAmount: totalPaid,
      paymentMethod: newInvIsPaid ? newInvPayMethod : (newInvAdvanceToDeduct > 0 ? 'Cash NPR' : undefined),
      status: invoiceStatus,
    });

    setShowNewInvoiceModal(false);
    const dueRemaining = Math.max(0, newInvGrandTotal - totalPaid);

    showToast(
      `सफलतापूर्वक नयाँ PAN बिल #${created.id} जारी गरियो! ${
        dueRemaining > 0
          ? `(दाखिला: रू. ${totalPaid.toLocaleString()} | बाँकी बक्यौता: रू. ${dueRemaining.toLocaleString()})`
          : '(पूर्ण चुक्ता)'
      }`
    );
    setSelectedInvoice(created);
  };

  // Quick select an in-house room for new invoice
  const handleSelectInHouseRoom = (roomNum: string) => {
    setNewInvRoomNumber(roomNum);
    const room = rooms.find(r => r.number === roomNum);
    if (room?.currentGuest) {
      setNewInvGuestName(room.currentGuest);
    }
    const res = reservations.find(
      r => r.roomNumber === roomNum && (r.status === 'CHECKED_IN' || r.status === 'CONFIRMED')
    );
    if (res?.paidAmount && res.paidAmount > 0) {
      setNewInvDeductAdvance(true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-900 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white font-mono cursor-pointer">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="text-purple-600" /> Billing & Invoices (PAN बिजक)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official IRD PAN bills, Advance Deposit deductions, Due Balance tracking & Restaurant folio
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Advance Deposit Button */}
          <button
            type="button"
            onClick={() => setShowAddAdvanceModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <DollarSign size={16} /> + अग्रिम पेश्की थप्नुहोस् (Add Advance)
          </button>

          {/* Create New Bill Button */}
          <button
            type="button"
            onClick={() => {
              setNewInvGuestName('');
              setNewInvItems([
                { description: 'Room Accommodation Charge (कोठा भाडा)', quantity: 1, unitPrice: 2700, total: 2700 }
              ]);
              setNewInvDiscount(0);
              setNewInvDeductAdvance(true);
              setNewInvIsPaid(false);
              setNewInvImmediatePayAmount(0);
              setShowNewInvoiceModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={16} /> + नयाँ बिल बनाउनुहोस् (Create New Bill)
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Due */}
        <div className="bg-white p-4.5 rounded-2xl border border-rose-200 shadow-sm bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">कुल बक्यौता बाँकी (Outstanding Due)</p>
            <AlertCircle size={16} className="text-rose-600" />
          </div>
          <p className="text-2xl font-black mt-2 text-rose-600">रू. {totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pending partial/unpaid settlements</p>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">कुल असुल भएको (Total Collected)</p>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600">रू. {totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">100% Accounted & Audited</p>
        </div>

        {/* Advance Deposits Held */}
        <div className="bg-white p-4.5 rounded-2xl border border-teal-200 shadow-sm bg-gradient-to-br from-white to-teal-50/30">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">जम्मा अग्रिम पेश्की (Advance Deposits)</p>
            <DollarSign size={16} className="text-teal-600" />
          </div>
          <p className="text-2xl font-black mt-2 text-teal-700">रू. {totalAdvanceHeld.toLocaleString()}</p>
          <p className="text-[11px] text-teal-800 font-semibold mt-1">Held across in-house guests</p>
        </div>

        {/* Extra Services Available */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4.5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-400">Available Services</span>
            <UtensilsCrossed size={16} className="text-amber-300" />
          </div>
          <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200">🍳 Food</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200">☕ Coffee</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200">🍺 Bar</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">🧺 Laundry</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">🛍️ Takeaway</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="पाहुनाको नाम, कोठा नं. वा बिल नम्बर खोज्नुहोस्..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            सबै ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PARTIAL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
              statusFilter === 'PARTIAL' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            आंशिक / Partial ({invoices.filter(i => i.status === 'PARTIAL').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('UNPAID')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
              statusFilter === 'UNPAID' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            बाँकी / Unpaid ({invoices.filter(i => i.status === 'UNPAID').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
              statusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            चुक्ता / Paid ({invoices.filter(i => i.status === 'PAID').length})
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Receipt size={16} className="text-purple-600" />
            जारी गरिएका PAN बिजकहरू र बाँकी बक्यौता हिसाब (Hotel Bills & Due Folio)
          </h2>
          <span className="text-xs text-slate-500 font-medium">{filteredInvoices.length} Bills</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Bill # / मिति</th>
                <th className="p-3.5">पाहुना र कोठा</th>
                <th className="p-3.5">आइटम / विवरण</th>
                <th className="p-3.5">कुल बिल (Total)</th>
                <th className="p-3.5">दाखिला रकम (Paid/Advance)</th>
                <th className="p-3.5">बाँकी बक्यौता (Due Balance)</th>
                <th className="p-3.5">स्थिति (Status)</th>
                <th className="p-3.5 text-right">कार्यहरू (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    कुनै पनि बिजक फेला परेन (No matching invoices found).
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const itemsCount = inv.items?.length || 1;
                  const hasExtraServices = inv.items?.some(it => 
                    !it.description.toLowerCase().includes('room accommodation') && 
                    !it.description.toLowerCase().includes('room rent')
                  );
                  const due = Math.max(0, inv.grandTotal - (inv.paidAmount || 0));

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {inv.id}
                        <div className="text-[10px] text-slate-400 font-sans">{inv.invoiceDate}</div>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 text-sm block">{inv.guestName}</strong>
                        <span className="text-[11px] text-slate-500 font-bold">Room {inv.roomNumber}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                          </span>
                          {hasExtraServices && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                              + रेस्टुरेन्ट/सेवा
                            </span>
                          )}
                        </div>
                        {inv.items && inv.items.length > 0 && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[190px] mt-0.5">
                            {inv.items.map(it => it.description.split('(')[0].trim()).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                        रू. {inv.grandTotal.toLocaleString()}
                        {inv.discount > 0 && (
                          <div className="text-[10px] text-rose-500 font-medium font-sans">
                            छुट: -रू. {inv.discount.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-700 font-bold text-xs">
                        रू. {(inv.paidAmount || 0).toLocaleString()}
                        {inv.paymentMethod && (
                          <div className="text-[10px] text-slate-400 font-sans font-medium">
                            {inv.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        {due > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-xs font-mono">
                              बाँकी रू. {due.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                              अझै असुल हुन बाँकी
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 size={11} /> चुक्ता (No Due)
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle2 size={12} /> चुक्ता (Paid)
                          </span>
                        ) : inv.status === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                            <Clock size={12} className="text-amber-600" /> आंशिक बाँकी (Partial)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                            <Clock size={12} /> बाँकी (Unpaid)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Add Expense Button: directly append items to this bill */}
                        <button
                          type="button"
                          onClick={() => setTargetInvoiceForExpense(inv)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-lg transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="खाना, कफी, बियर, लन्ड्री वा टेक-अवे खर्च थप्नुहोस्"
                        >
                          <Plus size={12} /> + खर्च
                        </button>

                        {/* Record Payment Button: Available for any bill with remaining due */}
                        {due > 0 && (
                          <button 
                            type="button"
                            onClick={() => handleOpenPay(inv)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
                          >
                            भुक्तानी लिनुहोस्
                          </button>
                        )}

                        <button 
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer size={12} /> बिजक हेर्नुहोस्
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD ADVANCE DEPOSIT TO RESERVATION */}
      <AddAdvanceModal
        isOpen={showAddAdvanceModal}
        onClose={() => setShowAddAdvanceModal(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* MODAL 2: ADD EXPENSE TO EXISTING INVOICE */}
      {targetInvoiceForExpense && (
        <AddExpenseModal
          isOpen={true}
          onClose={() => setTargetInvoiceForExpense(null)}
          onAddItem={handleAddExpenseToExisting}
          targetGuestName={targetInvoiceForExpense.guestName}
          targetRoomNumber={targetInvoiceForExpense.roomNumber}
        />
      )}

      {/* MODAL 3: ADD ITEM TO NEW INVOICE BUILDER */}
      {isAddingItemToNewInv && (
        <AddExpenseModal
          isOpen={true}
          onClose={() => setIsAddingItemToNewInv(false)}
          onAddItem={handleAddItemToNewInvoice}
          targetGuestName={newInvGuestName}
          targetRoomNumber={newInvRoomNumber}
        />
      )}

      {/* MODAL 4: CREATE NEW INVOICE (FULL FOLIO BUILDER WITH ADVANCE AUTO-DEDUCTION) */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Receipt size={12} /> IRD PAN Standard Compliant
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  नयाँ होटल बिजक / बिल जारी गर्नुहोस् (Create New Bill)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewInvoice} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Guest & Room Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    कोठा नम्बर छान्नुहोस् (Room Number)
                  </label>
                  <select
                    value={newInvRoomNumber}
                    onChange={(e) => handleSelectInHouseRoom(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.number}>
                        Room {r.number} ({r.type}) {r.currentGuest ? `— ${r.currentGuest}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    पाहुनाको नाम (Guest Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvGuestName}
                    onChange={(e) => setNewInvGuestName(e.target.value)}
                    placeholder="उदा: Michael Chang / राम श्रेष्ठ"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* ADVANCE DEPOSIT AUTO-DETECTION BANNER */}
              {draftAdvanceAvailable > 0 && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                      <Sparkles size={15} className="text-emerald-600 shrink-0" />
                      यस पाहुनाको अग्रिम पेश्की (Advance Deposit) फेला पर्यो!
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      अहिलेसम्म दाखिला भएको अग्रिम रकम: <strong className="font-mono font-black text-emerald-950">रू. {draftAdvanceAvailable.toLocaleString()}</strong>
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 cursor-pointer shadow-2xs self-start sm:self-auto">
                    <input
                      type="checkbox"
                      checked={newInvDeductAdvance}
                      onChange={(e) => setNewInvDeductAdvance(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>बिलबाट स्वतः कट्टी गर्नुहोस् (Auto Deduct)</span>
                  </label>
                </div>
              )}

              {/* Line Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Tag size={14} className="text-purple-600" />
                    बिल आइटमहरू (Bill Line Items)
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsAddingItemToNewInv(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Plus size={14} /> + खाना / बार / लन्ड्री / टेक-अवे थप्नुहोस्
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5">विवरण (Description)</th>
                        <th className="p-2.5 text-center w-16">Qty</th>
                        <th className="p-2.5 text-right w-24">दर (Rate)</th>
                        <th className="p-2.5 text-right w-24">रकम (Total)</th>
                        <th className="p-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newInvItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 font-medium">
                            कुनै आइटम छैन। कृपया माथिको बटन थिचेर आइटम थप्नुहोस्।
                          </td>
                        </tr>
                      ) : (
                        newInvItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-medium text-slate-800">{item.description}</td>
                            <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">रू. {item.unitPrice.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">रू. {item.total.toLocaleString()}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveNewInvItem(idx)}
                                className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                title="हटाउनुहोस्"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discount & Totals Breakdown Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    विशेष छुट रकम (Discount - NPR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-bold text-slate-400">रू.</span>
                    <input
                      type="number"
                      min="0"
                      value={newInvDiscount}
                      onChange={(e) => setNewInvDiscount(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-right font-mono self-center">
                  <div className="flex justify-between text-slate-600">
                    <span>जम्मा रकम (Subtotal):</span>
                    <span>रू. {newInvSubtotal.toLocaleString()}</span>
                  </div>
                  {newInvDiscount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>छुट (Discount):</span>
                      <span>- रू. {newInvDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>कुल बिल (Grand Total):</span>
                    <span>रू. {newInvGrandTotal.toLocaleString()}</span>
                  </div>
                  {newInvAdvanceToDeduct > 0 && (
                    <div className="flex justify-between text-xs font-bold text-emerald-700">
                      <span>अग्रिम कट्टी (Advance Deducted):</span>
                      <span>- रू. {newInvAdvanceToDeduct.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-purple-900 pt-1 border-t border-purple-200">
                    <span>खुद तिर्नुपर्ने (Net Due Payable):</span>
                    <span className="text-purple-700">रू. {newInvNetPayable.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Immediate Payment Option */}
              <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950">
                    <input
                      type="checkbox"
                      checked={newInvIsPaid}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewInvIsPaid(checked);
                        if (checked) {
                          setNewInvImmediatePayAmount(newInvNetPayable);
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>अहिले नै थप रकम भुक्तानी लियो (Collect Immediate Payment Now)</span>
                  </label>
                  {newInvAdvanceToDeduct > 0 && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      अग्रिम रू. {newInvAdvanceToDeduct.toLocaleString()} स्वतः दाखिला हुनेछ
                    </span>
                  )}
                </div>

                {newInvIsPaid && (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        अहिले बुझाएको रकम (Amount Paying Now - NPR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 font-bold text-slate-400">रू.</span>
                        <input
                          type="number"
                          min="0"
                          max={newInvNetPayable}
                          value={newInvImmediatePayAmount}
                          onChange={(e) => setNewInvImmediatePayAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-purple-300 rounded-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setNewInvImmediatePayAmount(newInvNetPayable)}
                          className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-bold text-[10px] transition cursor-pointer"
                        >
                          पूरा खुद रकम (रू. {newInvNetPayable.toLocaleString()})
                        </button>
                        {newInvNetPayable > 0 && (
                          <button
                            type="button"
                            onClick={() => setNewInvImmediatePayAmount(Math.round(newInvNetPayable / 2))}
                            className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-bold text-[10px] transition cursor-pointer"
                          >
                            आधा रकम (५०%)
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        भुक्तानी माध्यम (Payment Method)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['Cash NPR', 'Cash USD', 'eSewa', 'Khalti', 'Visa', 'Bank Transfer'] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setNewInvPayMethod(m)}
                            className={`p-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                              newInvPayMethod === m 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs' 
                                : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Due Preview */}
                    {Math.max(0, newInvNetPayable - newInvImmediatePayAmount) > 0 ? (
                      <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950 font-bold text-[11px]">
                        ⚠️ आंशिक भुक्तानी: बाँकी बक्यौता रकम <strong>रू. {Math.max(0, newInvNetPayable - newInvImmediatePayAmount).toLocaleString()}</strong> पाहुनाको खातामा PARTIAL बक्यौताको रूपमा रहनेछ।
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-[11px]">
                        ✅ पूर्ण चुक्ता: यो बिजक १००% चुक्ता (PAID) हुनेछ।
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={!newInvGuestName.trim() || newInvItems.length === 0}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:scale-[1.01] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt size={16} /> बिजक जारी गर्नुहोस् (Issue PAN Bill)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD PAYMENT MODAL (WITH LIVE PARTIAL DUE BALANCE PREVIEW) */}
      {payModalInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">भुक्तानी असुल रेकर्ड (Record Payment)</h3>
                <p className="text-xs text-slate-500 font-bold">{payModalInvoice.id} • {payModalInvoice.guestName} (Room {payModalInvoice.roomNumber})</p>
              </div>
              <button onClick={() => setPayModalInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Existing Balance Status Card */}
            {(() => {
              const currentDue = Math.max(0, payModalInvoice.grandTotal - (payModalInvoice.paidAmount || 0));
              const projectedPaid = (payModalInvoice.paidAmount || 0) + (Number(payAmount) || 0);
              const remainingDue = Math.max(0, payModalInvoice.grandTotal - projectedPaid);

              return (
                <div className="space-y-3.5 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-600 font-sans">
                      <span>कुल बिल रकम (Grand Total):</span>
                      <span className="font-bold text-slate-900">रू. {payModalInvoice.grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-sans">
                      <span>अहिलेसम्म दाखिला भएको (Already Paid):</span>
                      <span className="font-bold">रू. {(payModalInvoice.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-sans pt-1 border-t border-slate-200 font-bold">
                      <span>हाल बाँकी बक्यौता (Current Due):</span>
                      <span className="font-black text-sm">रू. {currentDue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700">अहिले लिने भुक्तानी रकम (Amount Paying Now - NPR) *</label>
                      <button
                        type="button"
                        onClick={() => setPayAmount(currentDue)}
                        className="text-[10px] text-purple-700 hover:underline font-bold cursor-pointer"
                      >
                        सबै चुक्ता (रू. {currentDue.toLocaleString()})
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">रू.</span>
                      <input 
                        type="number" 
                        min="1"
                        max={currentDue}
                        value={payAmount}
                        onChange={e => setPayAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-extrabold text-base outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPayAmount(currentDue)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition cursor-pointer"
                      >
                        पूरा चुक्ता (१००%)
                      </button>
                      {currentDue > 100 && (
                        <button
                          type="button"
                          onClick={() => setPayAmount(Math.round(currentDue / 2))}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition cursor-pointer"
                        >
                          आधा रकम (५०%: रू. {Math.round(currentDue / 2).toLocaleString()})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Live Due After Payment Notice */}
                  {remainingDue > 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 font-bold text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-600" />
                        <span>आंशिक भुक्तानी (Partial Payment)</span>
                      </div>
                      <p className="text-[10px] font-medium text-amber-800">
                        यो भुक्तानीपछि पाहुनाको खातामा बाँकी बक्यौता <strong>रू. {remainingDue.toLocaleString()}</strong> सुरक्षित रहनेछ (Status: PARTIAL)।
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-bold text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>पूर्ण चुक्ता (Full Settlement)</span>
                      </div>
                      <p className="text-[10px] font-medium text-emerald-800">
                        यो भुक्तानीपछि यो बिल १००% चुक्ता (Status: PAID) हुनेछ।
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">भुक्तानी माध्यम (Payment Method)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Cash NPR', 'Cash USD', 'eSewa', 'Khalti', 'Visa', 'Bank Transfer'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayMethod(m)}
                          className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            payMethod === m ? 'bg-purple-600 text-white border-purple-600 shadow-2xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button 
                type="button"
                onClick={() => setPayModalInvoice(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                रद्द
              </button>
              <button 
                type="button"
                onClick={handleConfirmPay}
                disabled={payAmount <= 0}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                भुक्तानी सुरक्षित गर्नुहोस् (Confirm Payment)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: OFFICIAL PRINTABLE PAN / TAX BILL */}
      {selectedInvoice && (
        <PanInvoicePrint
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
