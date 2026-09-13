"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Star, 
  History, 
  Mail, 
  Phone, 
  Download, 
  ShieldAlert, 
  AlertCircle, 
  UserX, 
  UserCheck, 
  CheckCircle2, 
  Camera, 
  CreditCard, 
  X, 
  Plus, 
  Calendar,
  DollarSign,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

interface GuestStay {
  id: string;
  roomNumber: string;
  roomType: string;
  dates: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
}

interface GuestItem {
  id: string;
  name: string;
  nationality: string;
  idNumber: string;
  passportNumber: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  signatureUrl: string | null;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  blacklistedAt: string | null;
  blacklistedBy: string | null;
  visitCount: number;
  isReturning: boolean;
  lifetimeSpend: number;
  pendingDue: number;
  hasPendingDue: boolean;
  lastStay: string;
  stays: GuestStay[];
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'returning' | 'due' | 'blacklisted'>('all');
  
  // Modal states
  const [selectedGuestForProfile, setSelectedGuestForProfile] = useState<GuestItem | null>(null);
  const [blacklistModalGuest, setBlacklistModalGuest] = useState<GuestItem | null>(null);
  const [blacklistReasonInput, setBlacklistReasonInput] = useState('बिल नतिरी फरार भएको (Absconded without settling bill)');
  const [isProcessingBlacklist, setIsProcessingBlacklist] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guests');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setGuests(json.data);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch guests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Filtered Guests
  const filteredGuests = useMemo(() => {
    let list = guests;

    if (activeTab === 'returning') {
      list = list.filter(g => g.visitCount > 1);
    } else if (activeTab === 'due') {
      list = list.filter(g => g.pendingDue > 0);
    } else if (activeTab === 'blacklisted') {
      list = list.filter(g => g.isBlacklisted);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(g => 
        g.name.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.idNumber.toLowerCase().includes(q) ||
        g.passportNumber.toLowerCase().includes(q) ||
        g.nationality.toLowerCase().includes(q)
      );
    }

    return list;
  }, [guests, activeTab, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = guests.length;
    const returning = guests.filter(g => g.visitCount > 1).length;
    const dueGuests = guests.filter(g => g.pendingDue > 0);
    const blacklisted = guests.filter(g => g.isBlacklisted).length;
    const totalDue = dueGuests.reduce((acc, g) => acc + g.pendingDue, 0);

    return {
      total,
      returning,
      dueCount: dueGuests.length,
      totalDue,
      blacklisted,
    };
  }, [guests]);

  // Handle Toggle Blacklist (Add/Remove)
  const handleToggleBlacklist = async (guest: GuestItem, shouldBlacklist: boolean, reason?: string) => {
    setIsProcessingBlacklist(true);
    try {
      const res = await fetch('/api/guests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: guest.id,
          isBlacklisted: shouldBlacklist,
          blacklistReason: shouldBlacklist ? (reason || blacklistReasonInput) : null,
          blacklistedBy: 'Front Desk / Mingma Sherpa',
        }),
      });

      if (res.ok) {
        setNotificationBanner(
          shouldBlacklist
            ? `🚫 ${guest.name} लाई कालोसूचीमा थपियो। (Guest added to Blacklist)`
            : `✅ ${guest.name} लाई कालोसूचीबाट हटाइयो। (Guest removed from Blacklist)`
        );
        setTimeout(() => setNotificationBanner(null), 4000);
        setBlacklistModalGuest(null);
        await fetchGuests();

        if (selectedGuestForProfile?.id === guest.id) {
          setSelectedGuestForProfile(prev => prev ? { ...prev, isBlacklisted: shouldBlacklist, blacklistReason: shouldBlacklist ? (reason || blacklistReasonInput) : null } : null);
        }
      }
    } catch (e) {
      console.warn('Blacklist update error:', e);
    } finally {
      setIsProcessingBlacklist(false);
    }
  };

  const handleExportCSV = () => {
    const headers = 'Name,Phone,Email,ID Number,Passport,Nationality,Total Visits,Lifetime Spend NPR,Pending Due NPR,Blacklisted,Blacklist Reason\n';
    const rows = guests.map(g => 
      `"${g.name}","${g.phone}","${g.email}","${g.idNumber}","${g.passportNumber}","${g.nationality}",${g.visitCount},${g.lifetimeSpend},${g.pendingDue},"${g.isBlacklisted ? 'YES' : 'NO'}","${g.blacklistReason || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hotel_sherpa_soul_guests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Guest Database & CRM (अतिथि प्रोफाइल र सुरक्षा)
          </h1>
          <p className="text-xs text-slate-500">
            सरकारी परिचयपत्र (ID-First), लाइभ फोटो, भ्रमण इतिहास, बक्यौता रकम र कालोसूची ढाल (Blacklist Shield)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="border border-slate-200 bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
          >
            <Download size={15} /> Export CSV
          </button>
          <Link
            href="/reservations/new"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-purple-600/20"
          >
            <Plus size={15} /> New Guest Reservation
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationBanner && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'all' ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium mb-1">
            <span>कुल दर्ता पाहुना (Total)</span>
            <UserCheck size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
          <p className="text-[11px] text-slate-500 mt-1">सबै पाहुनाहरूको प्रोफाइल</p>
        </div>

        <div 
          onClick={() => setActiveTab('returning')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'returning' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium mb-1">
            <span>दोहोरिएर आउने (Repeat VIP)</span>
            <Sparkles size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{metrics.returning}</p>
          <p className="text-[11px] text-emerald-800 mt-1">१ भन्दा बढी पटक बसेका</p>
        </div>

        <div 
          onClick={() => setActiveTab('due')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'due' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium mb-1">
            <span>बक्यौता बाँकी (Pending Due)</span>
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900">
            {metrics.dueCount} <span className="text-xs font-normal text-amber-700">जना</span>
          </p>
          <p className="text-[11px] text-amber-800 font-bold mt-1">
            रू. {metrics.totalDue.toLocaleString()} ($ {(metrics.totalDue / 135).toFixed(1)})
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('blacklisted')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'blacklisted' ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium mb-1">
            <span>कालोसूची (Blacklist Shield)</span>
            <ShieldAlert size={16} className="text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700">{metrics.blacklisted}</p>
          <p className="text-[11px] text-rose-800 mt-1">फरार वा प्रतिबन्धित पाहुना</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-xs">
          <Search size={18} className="text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="नागरिकता, राहदानी, फोन नम्बर, वा नामबाट खोज्नुहोस् (Search ID, Passport, Phone, or Name)..." 
            className="bg-transparent border-none outline-none w-full text-xs placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            सबै ({guests.length})
          </button>
          <button
            onClick={() => setActiveTab('returning')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'returning' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            दोहोरिएका ({metrics.returning})
          </button>
          <button
            onClick={() => setActiveTab('due')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'due' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            बक्यौता ({metrics.dueCount})
          </button>
          <button
            onClick={() => setActiveTab('blacklisted')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'blacklisted' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            कालोसूची ({metrics.blacklisted})
          </button>
        </div>
      </div>

      {/* Guest Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-semibold">
          लोड हुँदैछ (Loading guest database)...
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
          <p className="text-base font-bold text-slate-700">कुनै पाहुना फेला परेन (No matching guests found)</p>
          <p className="text-xs text-slate-400">कृपया फरक खोज शब्द वा फिल्टर चयन गर्नुहोस्।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGuests.map((guest) => (
            <div 
              key={guest.id} 
              className={`rounded-2xl border shadow-xs p-5 relative overflow-hidden flex flex-col justify-between transition ${
                guest.isBlacklisted
                  ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-400/30'
                  : guest.hasPendingDue
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Badges Top Right */}
              <div className="absolute top-0 right-0 flex items-center">
                {guest.isBlacklisted ? (
                  <div className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                    <ShieldAlert size={12} /> BLACKLISTED
                  </div>
                ) : guest.hasPendingDue ? (
                  <div className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                    <AlertCircle size={12} /> DUE: रू. {guest.pendingDue.toLocaleString()}
                  </div>
                ) : guest.visitCount > 1 ? (
                  <div className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                    <Star size={11} fill="currentColor" /> {guest.visitCount} Stays (VIP)
                  </div>
                ) : null}
              </div>

              <div>
                {/* Header: Photo + Name + Nationality */}
                <div className="flex items-center gap-3 mb-4">
                  {guest.photoUrl ? (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 shrink-0 bg-slate-900 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={guest.photoUrl} alt={guest.name} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 right-0 bg-purple-600 text-white p-0.5 rounded-tl">
                        <Camera size={9} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                      {guest.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pr-14">
                    <h3 className="text-base font-black text-slate-900 truncate">{guest.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{guest.nationality}</p>
                    <span className="inline-block mt-0.5 font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 truncate max-w-full">
                      ID: {guest.idNumber || guest.passportNumber || 'No ID Logged'}
                    </span>
                  </div>
                </div>

                {/* Blacklist Reason Alert Box */}
                {guest.isBlacklisted && (
                  <div className="mb-3 p-2.5 bg-rose-100/90 border border-rose-300 rounded-xl text-xs space-y-1">
                    <p className="text-[11px] font-bold text-rose-950">कालोसूची कारण (Blacklist Reason):</p>
                    <p className="text-[11px] text-rose-800 italic">"{guest.blacklistReason || 'बिल नतिरी फरार भएको वा कोठा तोडफोड'}"</p>
                  </div>
                )}

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2 truncate">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{guest.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{guest.email || 'No email recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History size={13} className="text-slate-400 shrink-0" />
                    <span>Last Visit: <strong className="text-slate-800">{guest.lastStay}</strong> ({guest.visitCount} visits)</span>
                  </div>
                </div>

                {/* Spend and Due Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Lifetime Spend</span>
                    <strong className="text-slate-900">रू. {guest.lifetimeSpend.toLocaleString()}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Due</span>
                    {guest.pendingDue > 0 ? (
                      <strong className="text-rose-600 font-bold">रू. {guest.pendingDue.toLocaleString()}</strong>
                    ) : (
                      <span className="text-emerald-600 font-bold">Cleared (रू. ०)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => setSelectedGuestForProfile(guest)}
                  className="flex-1 bg-slate-100 text-slate-800 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition text-center"
                >
                  View Profile
                </button>
                
                {guest.isBlacklisted ? (
                  <button 
                    onClick={() => handleToggleBlacklist(guest, false)}
                    className="px-3 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    title="कालोसूचीबाट हटाउनुहोस्"
                  >
                    <ShieldCheck size={14} /> हटाउनुहोस्
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setBlacklistModalGuest(guest);
                      setBlacklistReasonInput('बिल नतिरी फरार भएको (Absconded without settling bill)');
                    }}
                    className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    title="कालोसूचीमा राख्नुहोस्"
                  >
                    <UserX size={14} /> कालोसूची
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL GUEST PROFILE MODAL */}
      {selectedGuestForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {selectedGuestForProfile.photoUrl ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500 shrink-0 bg-slate-900 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedGuestForProfile.photoUrl} alt={selectedGuestForProfile.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black text-xl shrink-0">
                    {selectedGuestForProfile.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{selectedGuestForProfile.name}</h2>
                    {selectedGuestForProfile.isBlacklisted && (
                      <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        BLACKLISTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedGuestForProfile.nationality} • कुल {selectedGuestForProfile.visitCount} पटक बसाइ
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedGuestForProfile(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Blacklist Status Banner inside Modal */}
            {selectedGuestForProfile.isBlacklisted ? (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                    <ShieldAlert size={16} className="text-rose-600" />
                    कालोसूचीमा परेको पाहुना (Blacklist Record)
                  </span>
                  <button
                    onClick={() => handleToggleBlacklist(selectedGuestForProfile, false)}
                    className="text-xs font-bold text-rose-700 underline hover:text-rose-950"
                  >
                    कालोसूचीबाट हटाउनुहोस् (Remove Blacklist)
                  </button>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed italic">
                  कारण: "{selectedGuestForProfile.blacklistReason || 'बिल नतिरी फरार भएको वा होटलमा क्षति पुर्याएको'}"
                </p>
                {selectedGuestForProfile.blacklistedBy && (
                  <p className="text-[10px] text-rose-600">थप्ने: {selectedGuestForProfile.blacklistedBy} ({selectedGuestForProfile.blacklistedAt ? new Date(selectedGuestForProfile.blacklistedAt).toLocaleDateString() : ''})</p>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">कालोसूची स्थिति: सामान्य (Normal)</span>
                <button
                  onClick={() => {
                    setBlacklistModalGuest(selectedGuestForProfile);
                    setBlacklistReasonInput('बिल नतिरी फरार भएको (Absconded without settling bill)');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <UserX size={14} /> कालोसूचीमा राख्नुहोस्
                </button>
              </div>
            )}

            {/* Official ID & Contacts Card */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">नागरिकता / Passport No.</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedGuestForProfile.idNumber || selectedGuestForProfile.passportNumber || 'Not Logged'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Phone / WhatsApp</span>
                <span className="font-bold text-slate-900">{selectedGuestForProfile.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Email Address</span>
                <span className="font-medium text-slate-700">{selectedGuestForProfile.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Lifetime Spend</span>
                <span className="font-bold text-emerald-700 text-sm">रू. {selectedGuestForProfile.lifetimeSpend.toLocaleString()}</span>
              </div>
            </div>

            {/* Stays History Timeline */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-purple-600" />
                <span>विगतका बसाइहरू (Stays Timeline — {selectedGuestForProfile.stays.length})</span>
              </h4>

              {selectedGuestForProfile.stays.length === 0 ? (
                <p className="text-xs text-slate-400 italic">कुनै अघिल्लो बसाइ रेकर्ड फेला परेन।</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedGuestForProfile.stays.map((stay, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-2xl text-xs space-y-1 shadow-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-900">Room {stay.roomNumber} ({stay.roomType})</span>
                        <span className="text-slate-500 font-mono text-[11px]">{stay.dates}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                        <span>जम्मा बिल: <strong>रू. {stay.totalAmount.toLocaleString()}</strong></span>
                        <span>भुक्तान: रू. {stay.paidAmount.toLocaleString()}</span>
                        {stay.dueAmount > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            ⚠️ बक्यौता: रू. {stay.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ चुक्ता (Paid)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => setSelectedGuestForProfile(null)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>

              <Link
                href="/reservations/new"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
              >
                <Plus size={14} /> अर्को बुकिङ थप्नुहोस् (Book Again)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ADD TO BLACKLIST PROMPT MODAL */}
      {blacklistModalGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldAlert size={24} />
              <h3 className="text-base font-black text-white">कालोसूचीमा राख्नुहोस् (Add to Blacklist)</h3>
            </div>

            <p className="text-xs text-slate-300">
              पाहुना: <strong className="text-white">{blacklistModalGuest.name}</strong> (ID: {blacklistModalGuest.idNumber || blacklistModalGuest.passportNumber || blacklistModalGuest.phone})
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">कालोसूचीमा राख्नुको कारण (Blacklist Reason) *</label>
              <textarea
                value={blacklistReasonInput}
                onChange={e => setBlacklistReasonInput(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500 font-medium"
                placeholder="उदा: बिल नतिरी फरार भएको, कोठामा तोडफोड गरेको, चोरी गरेको आदि..."
              />
            </div>

            <p className="text-[11px] text-rose-300 leading-relaxed bg-rose-950/60 p-3 rounded-xl border border-rose-800/60">
              ⚠️ यो व्यक्ति भविष्यमा नयाँ फोन वा नाम फेरेर आए पनि उहाँको नागरिकता/राहदानी नम्बर इन्ट्री गर्नासाथ रिसेप्सनमा रातो चेतावनी साइरन बज्नेछ।
            </p>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBlacklistModalGuest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                रद्द (Cancel)
              </button>
              <button
                type="button"
                disabled={isProcessingBlacklist || !blacklistReasonInput.trim()}
                onClick={() => handleToggleBlacklist(blacklistModalGuest, true, blacklistReasonInput)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-rose-950/60 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert size={14} />
                <span>{isProcessingBlacklist ? 'प्रक्रिया हुँदैछ...' : 'कालोसूचीमा सुरक्षित गर्नुहोस्'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
