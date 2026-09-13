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
  Check
} from 'lucide-react';
import { usePms, Invoice } from '@/context/PmsContext';
import PanInvoicePrint from '@/components/PanInvoicePrint';
import AddExpenseModal, { ExtraExpenseItem } from '@/components/AddExpenseModal';

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

  // Create New Invoice Modal
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState<boolean>(false);
  const [newInvGuestName, setNewInvGuestName] = useState<string>('');
  const [newInvRoomNumber, setNewInvRoomNumber] = useState<string>('201');
  const [newInvItems, setNewInvItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; total: number }>>([
    { description: 'Room Accommodation Charge (कोठा भाडा)', quantity: 1, unitPrice: 2700, total: 2700 }
  ]);
  const [newInvDiscount, setNewInvDiscount] = useState<number>(0);
  const [newInvIsPaid, setNewInvIsPaid] = useState<boolean>(false);
  const [newInvPayMethod, setNewInvPayMethod] = useState<Invoice['paymentMethod']>('Cash NPR');
  const [isAddingItemToNewInv, setIsAddingItemToNewInv] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Math.max(0, inv.grandTotal - (inv.paidAmount || 0)), 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'PAID' && inv.status !== 'PAID') return false;
    if (statusFilter === 'UNPAID' && inv.status === 'PAID') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = inv.guestName?.toLowerCase().includes(q);
      const matchRoom = inv.roomNumber?.toLowerCase().includes(q);
      const matchId = inv.id?.toLowerCase().includes(q);
      return matchName || matchRoom || matchId;
    }
    return true;
  });

  const handleOpenPay = (inv: Invoice) => {
    setPayModalInvoice(inv);
    setPayAmount(Math.max(0, inv.grandTotal - (inv.paidAmount || 0)));
  };

  const handleConfirmPay = () => {
    if (!payModalInvoice) return;
    recordPayment(payModalInvoice.id, payAmount, payMethod);
    setPayModalInvoice(null);
    showToast(`सफलतापूर्वक भुक्तानी रेकर्ड गरियो: रू. ${payAmount.toLocaleString()} (${payMethod})`);
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

  // Calculate new invoice subtotal and grand total
  const newInvSubtotal = newInvItems.reduce((sum, it) => sum + it.total, 0);
  const newInvGrandTotal = Math.max(0, newInvSubtotal - newInvDiscount);

  const handleCreateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvGuestName.trim() || newInvItems.length === 0) return;

    const created = createInvoice({
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
      paidAmount: newInvIsPaid ? newInvGrandTotal : 0,
      paymentMethod: newInvIsPaid ? newInvPayMethod : undefined,
      status: newInvIsPaid ? 'PAID' : 'UNPAID',
    });

    setShowNewInvoiceModal(false);
    showToast(`सफलतापूर्वक नयाँ PAN बिल #${created.id} जारी गरियो!`);
    setSelectedInvoice(created);
  };

  // Quick select an in-house room for new invoice
  const handleSelectInHouseRoom = (roomNum: string) => {
    setNewInvRoomNumber(roomNum);
    const room = rooms.find(r => r.number === roomNum);
    if (room?.currentGuest) {
      setNewInvGuestName(room.currentGuest);
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
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white font-mono">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="text-purple-600" /> Billing & Invoices (PAN बिजक)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official IRD PAN bills, Restaurant & Bar orders, Laundry & Takeaway folio management
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewInvGuestName('');
            setNewInvItems([
              { description: 'Room Accommodation Charge (कोठा भाडा)', quantity: 1, unitPrice: 2700, total: 2700 }
            ]);
            setNewInvDiscount(0);
            setNewInvIsPaid(false);
            setShowNewInvoiceModal(true);
          }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md hover:scale-[1.02] cursor-pointer"
        >
          <Plus size={16} /> + नयाँ बिल बनाउनुहोस् (Create New Bill)
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">कुल बक्यौता बाँकी (Outstanding Due)</p>
          <p className="text-2xl font-black mt-2 text-rose-600">रू. {totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pending checkout settlements</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">कुल असुल भएको रकम (Total Collected)</p>
          <p className="text-2xl font-black mt-2 text-emerald-600">रू. {totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">100% Accounted & Audited</p>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-400">Available Extra Services</span>
            <UtensilsCrossed size={18} className="text-amber-300" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200">🍳 Food & Momo</span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200">☕ Coffee & Tea</span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200">🍺 Cold Beers & Bar</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/40">🧺 Laundry</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/40">🛍️ Takeaway Orders</span>
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

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
              statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            सबै ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('UNPAID')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
              statusFilter === 'UNPAID' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            बाँकी / Unpaid
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
              statusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            चुक्ता / Paid
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Receipt size={16} className="text-purple-600" />
            जारी गरिएका PAN बिजकहरू (Hotel Bills & Folios)
          </h2>
          <span className="text-xs text-slate-500 font-medium">{filteredInvoices.length} Bills</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Bill # / मिति</th>
                <th className="p-3.5">पाहुना र कोठा</th>
                <th className="p-3.5">आइटम / खर्च विवरण</th>
                <th className="p-3.5">जम्मा (Subtotal)</th>
                <th className="p-3.5">छुट (Discount)</th>
                <th className="p-3.5">कुल रकम (Total)</th>
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

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {inv.id}
                        <div className="text-[10px] text-slate-400 font-sans">{inv.invoiceDate}</div>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-slate-900 text-sm block">{inv.guestName}</strong>
                        <span className="text-[11px] text-slate-500">Room {inv.roomNumber}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[240px]">
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
                          <div className="text-[10px] text-slate-400 truncate max-w-[220px] mt-0.5">
                            {inv.items.map(it => it.description.split('(')[0].trim()).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700">रू. {inv.subtotal.toLocaleString()}</td>
                      <td className="p-3.5 text-rose-600 font-semibold">
                        {inv.discount > 0 ? `- रू. ${inv.discount.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 text-sm">
                        रू. {inv.grandTotal.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle2 size={12} /> चुक्ता ({inv.paymentMethod || 'Paid'})
                          </span>
                        ) : inv.status === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                            <Clock size={12} /> आंशिक (रू. {inv.paidAmount} चुक्ता)
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
                          <Plus size={12} /> + खर्च थप्नुहोस्
                        </button>

                        {inv.status !== 'PAID' && (
                          <button 
                            onClick={() => handleOpenPay(inv)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
                          >
                            भुक्तानी लिनुहोस्
                          </button>
                        )}

                        <button 
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

      {/* MODAL 1: ADD EXPENSE TO EXISTING INVOICE */}
      {targetInvoiceForExpense && (
        <AddExpenseModal
          isOpen={true}
          onClose={() => setTargetInvoiceForExpense(null)}
          onAddItem={handleAddExpenseToExisting}
          targetGuestName={targetInvoiceForExpense.guestName}
          targetRoomNumber={targetInvoiceForExpense.roomNumber}
        />
      )}

      {/* MODAL 2: ADD ITEM TO NEW INVOICE BUILDER */}
      {isAddingItemToNewInv && (
        <AddExpenseModal
          isOpen={true}
          onClose={() => setIsAddingItemToNewInv(false)}
          onAddItem={handleAddItemToNewInvoice}
          targetGuestName={newInvGuestName}
          targetRoomNumber={newInvRoomNumber}
        />
      )}

      {/* MODAL 3: CREATE NEW INVOICE (FULL FOLIO BUILDER) */}
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
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
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
                                className="text-slate-400 hover:text-rose-600 transition p-1"
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

              {/* Discount & Totals Row */}
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
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>अन्तिम रकम (Grand Total):</span>
                    <span className="text-purple-700">रू. {newInvGrandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Immediate Payment Option */}
              <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/70 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950">
                  <input
                    type="checkbox"
                    checked={newInvIsPaid}
                    onChange={(e) => setNewInvIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>अहिले नै भुक्तानी असुल भयो (Record Immediate Payment)</span>
                </label>

                {newInvIsPaid && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      भुक्तानी माध्यम (Payment Method)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Cash NPR', 'Cash USD', 'eSewa', 'Khalti', 'Visa', 'Bank Transfer'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setNewInvPayMethod(m)}
                          className={`p-1.5 rounded-xl text-[11px] font-bold border transition ${
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
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
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

      {/* MODAL 4: RECORD PAYMENT MODAL */}
      {payModalInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">भुक्तानी असुल रेकर्ड (Record Payment)</h3>
                <p className="text-xs text-slate-500">{payModalInvoice.id} • {payModalInvoice.guestName}</p>
              </div>
              <button onClick={() => setPayModalInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">असुल गर्नुपर्ने रकम (Amount to Settle - NPR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">रू.</span>
                  <input 
                    type="number" 
                    value={payAmount}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-extrabold text-base outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">भुक्तानी माध्यम (Payment Gateway / Method)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash NPR', 'Cash USD', 'eSewa', 'Khalti', 'Visa', 'Bank Transfer'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        payMethod === m ? 'bg-purple-600 text-white border-purple-600 shadow-2xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button 
                onClick={() => setPayModalInvoice(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                रद्द
              </button>
              <button 
                onClick={handleConfirmPay}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition"
              >
                भुक्तानी सुरक्षित गर्नुहोस् (Confirm Payment)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: OFFICIAL PRINTABLE PAN / TAX BILL */}
      {selectedInvoice && (
        <PanInvoicePrint
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
