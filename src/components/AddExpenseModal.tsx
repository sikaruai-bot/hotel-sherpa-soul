"use client";

import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Coffee, 
  Beer, 
  Shirt, 
  ShoppingBag, 
  Plus, 
  X, 
  Check, 
  FileText,
  DollarSign,
  Tag,
  AlertCircle
} from 'lucide-react';
import { RESTAURANT_BAR_CATALOG, MenuItem } from '@/lib/restaurantBarMenu';

export interface ExtraExpenseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  note?: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: ExtraExpenseItem) => void;
  targetGuestName?: string;
  targetRoomNumber?: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onAddItem,
  targetGuestName,
  targetRoomNumber,
}: AddExpenseModalProps) {
  // Category tabs: 'FOOD' | 'BEVERAGE' | 'BAR' | 'LAUNDRY' | 'TAKEAWAY' | 'CUSTOM'
  const [activeCategory, setActiveCategory] = useState<'FOOD' | 'BEVERAGE' | 'BAR' | 'LAUNDRY' | 'TAKEAWAY' | 'CUSTOM'>('FOOD');

  // Selected preset item from catalog
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('food_chicken_momo');

  // Form states
  const [customDescription, setCustomDescription] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number>(300);
  const [quantity, setQuantity] = useState<number>(1);
  const [serviceNote, setServiceNote] = useState<string>('');

  if (!isOpen) return null;

  // Catalog items filtered by category
  const filteredCatalog = RESTAURANT_BAR_CATALOG.filter(item => {
    if (activeCategory === 'FOOD') return item.category === 'FOOD';
    if (activeCategory === 'BEVERAGE') return item.category === 'BEVERAGE';
    if (activeCategory === 'BAR') return item.category === 'BAR';
    return false;
  });

  const handleSelectCategory = (cat: 'FOOD' | 'BEVERAGE' | 'BAR' | 'LAUNDRY' | 'TAKEAWAY' | 'CUSTOM') => {
    setActiveCategory(cat);
    if (cat === 'FOOD') {
      setSelectedCatalogId('food_chicken_momo');
      setUnitPrice(300);
      setCustomDescription('');
      setServiceNote('');
    } else if (cat === 'BEVERAGE') {
      setSelectedCatalogId('bev_masala_tea');
      setUnitPrice(80);
      setCustomDescription('');
      setServiceNote('');
    } else if (cat === 'BAR') {
      setSelectedCatalogId('bar_beer_gorkha');
      setUnitPrice(550);
      setCustomDescription('');
      setServiceNote('');
    } else if (cat === 'LAUNDRY') {
      setSelectedCatalogId('');
      setCustomDescription('Laundry Service (लन्ड्री सेवा)');
      setUnitPrice(350);
      setServiceNote('Wash & Fold (लुगा धुने / इस्त्री)');
    } else if (cat === 'TAKEAWAY') {
      setSelectedCatalogId('');
      setCustomDescription('Takeaway / Outside Order (टेक-अवे अर्डर)');
      setUnitPrice(500);
      setServiceNote('Outside Food / Market purchase bill');
    } else if (cat === 'CUSTOM') {
      setSelectedCatalogId('');
      setCustomDescription('');
      setUnitPrice(100);
      setServiceNote('');
    }
  };

  const handleCatalogChange = (itemId: string) => {
    setSelectedCatalogId(itemId);
    const item = RESTAURANT_BAR_CATALOG.find(i => i.id === itemId);
    if (item) {
      setUnitPrice(item.defaultPrice);
      setCustomDescription('');
    }
  };

  const getFinalDescription = (): string => {
    if (activeCategory === 'LAUNDRY') {
      const base = customDescription.trim() || 'Laundry Service (लन्ड्री सेवा)';
      return serviceNote.trim() ? `${base} - ${serviceNote.trim()}` : base;
    }
    if (activeCategory === 'TAKEAWAY') {
      const base = customDescription.trim() || 'Takeaway / Outside Order (टेक-अवे)';
      return serviceNote.trim() ? `${base} [${serviceNote.trim()}]` : base;
    }
    if (activeCategory === 'CUSTOM') {
      return customDescription.trim() || 'Extra Service / Expense';
    }

    const item = RESTAURANT_BAR_CATALOG.find(i => i.id === selectedCatalogId);
    if (!item) return customDescription || 'Restaurant Order';
    const notePart = serviceNote.trim() ? ` (${serviceNote.trim()})` : '';
    return `${item.name}${notePart}`;
  };

  const calculatedTotal = Math.max(0, unitPrice * quantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDesc = getFinalDescription();
    if (!finalDesc || unitPrice <= 0 || quantity <= 0) return;

    onAddItem({
      description: finalDesc,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      total: calculatedTotal,
      category: activeCategory,
      note: serviceNote,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-start shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Tag size={12} /> Hotel Restaurant, Bar & Extra Expenses
            </span>
            <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
              थप खर्च थप्नुहोस् (Add Extra Bill / Expense)
            </h3>
            {(targetGuestName || targetRoomNumber) && (
              <p className="text-xs text-slate-300 mt-0.5">
                {targetGuestName ? `Guest: ${targetGuestName}` : ''} {targetRoomNumber ? `• Room ${targetRoomNumber}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Category Tabs */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              खर्चको प्रकार छान्नुहोस् (Select Expense Category)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectCategory('FOOD')}
                className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  activeCategory === 'FOOD'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UtensilsCrossed size={13} /> खाना / नास्ता
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('BEVERAGE')}
                className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  activeCategory === 'BEVERAGE'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Coffee size={13} /> कफी / चिया
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('BAR')}
                className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  activeCategory === 'BAR'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Beer size={13} /> कोल्ड ड्रिंक्स / बार
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('LAUNDRY')}
                className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  activeCategory === 'LAUNDRY'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Shirt size={13} /> लन्ड्री सेवा
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('TAKEAWAY')}
                className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  activeCategory === 'TAKEAWAY'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag size={13} /> टेक-अवे अर्डर
              </button>

              <button
                type="button"
                onClick={() => handleSelectCategory('CUSTOM')}
                className={`p-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  activeCategory === 'CUSTOM'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText size={13} /> म्यानुअल खर्च
              </button>
            </div>
          </div>

          {/* Section A: Restaurant & Bar Dropdown Selector */}
          {(activeCategory === 'FOOD' || activeCategory === 'BEVERAGE' || activeCategory === 'BAR') && (
            <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/70">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  मेनु आइटम छान्नुहोस् (Select Item from Menu)
                </label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => handleCatalogChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {filteredCatalog.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.nameNepali ? `(${item.nameNepali})` : ''} — रू. {item.defaultPrice} / {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  थप विवरण वा विशेष अनुरोध (Optional Item Note / Special Prep)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Less spicy, Extra ketchup, Room service"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          {/* Section B: Laundry Service Manual Form */}
          {activeCategory === 'LAUNDRY' && (
            <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200/70">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Shirt size={15} />
                <span>लन्ड्री सेवा (Laundry Service - म्यानुअल बिल प्रविष्टि)</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                पाहुनाको लुगा धुने, ड्राई क्लिनिङ वा इस्त्री सेवाको बिल रकम सिधै तल प्रविष्ट गर्नुहोस्।
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">सेवा विवरण (Service Description)</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Laundry Service (लन्ड्री सेवा)"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">लुगा संख्या वा कैफियत (Item Details / Note)</label>
                <input
                  type="text"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="उदा: ८ थान लुगा धुने तथा इस्त्री (8 pcs Wash & Iron)"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
          )}

          {/* Section C: Takeaway / Outside Purchases Manual Form */}
          {activeCategory === 'TAKEAWAY' && (
            <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200/70">
              <div className="flex items-center gap-2 text-purple-900 font-bold">
                <ShoppingBag size={15} />
                <span>टेक-अवे अर्डर तथा बाहिरको सामान (Takeaway / Outside Purchase)</span>
              </div>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                होटल बाहिरको रेस्टुरेन्टबाट मगाइएको खाना, फार्मेसी, बेकरी वा बजारबाट किनिएको सामानको बिल पाहुनाको खातामा जोड्नुहोस्।
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">अर्डर विवरण (Takeaway Description)</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Takeaway / Outside Order (टेक-अवे अर्डर)"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">पसल / रेस्टुरेन्टको नाम वा बिल नं. (Vendor / Shop Note)</label>
                <input
                  type="text"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="उदा: Thamel Bakery Cake (बिल नं. ४०२), Local Pharmacy Medicine"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
            </div>
          )}

          {/* Section D: Custom Manual Expense */}
          {activeCategory === 'CUSTOM' && (
            <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/70">
              <div>
                <label className="block font-bold text-slate-700 mb-1">खर्चको नाम (Expense Item Name)</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="उदा: एयरपोर्ट ट्याक्सी सेवा, थप तन्ना/तौलिया, अन्य सेवा"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">कैफियत / टिप्पणी (Remarks / Note)</label>
                <input
                  type="text"
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="वैकल्पिक टिप्पणी"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          )}

          {/* Quantity & Unit Price Row */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">दर (Unit Price - NPR)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-bold text-slate-400">रू.</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">परिमाण (Quantity)</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="flex-1 text-center py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Total Amount Preview Bar */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-700">कुल थप रकम (Total Amount)</span>
              <p className="font-bold text-slate-900 truncate max-w-[220px]">
                {getFinalDescription()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-indigo-700">
                रू. {calculatedTotal.toLocaleString()}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">NPR</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
            >
              रद्द गर्नुहोस् (Cancel)
            </button>
            <button
              type="submit"
              disabled={calculatedTotal <= 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md hover:scale-[1.01] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={15} /> बिलमा थप्नुहोस् (Add to Bill)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
