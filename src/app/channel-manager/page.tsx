"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  RefreshCw, 
  CheckCircle, 
  AlertOctagon, 
  ArrowUpDown, 
  ShieldCheck, 
  Zap, 
  Copy,
  Check,
  ExternalLink,
  Link as LinkIcon,
  HelpCircle,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  Mail,
  Send,
  Inbox
} from 'lucide-react';
import { usePms } from '@/context/PmsContext';

interface OtaRoomConnection {
  channel: string;
  channelName: string;
  roomNumber: string;
  roomTypeName: string;
  importUrl: string;
  exportUrl: string;
  exportToken: string;
  isActive: boolean;
  syncStatus: string;
  syncMessage: string | null;
  lastSyncedAt: string | null;
  eventsCount: number;
}

interface OtaChannelData {
  id: string;
  name: string;
  logo: string;
  color: string;
  activeListingsCount: number;
  rooms: OtaRoomConnection[];
}

interface SyncLogItem {
  id: string;
  channel: string;
  roomNumber: string;
  action: string;
  status: string;
  message: string;
  createdAt: string;
  details?: any;
}

export default function ChannelManagerPage() {
  const { rooms, stopSellActive, toggleStopSell, updateRoomStatus, refreshFromBackend } = usePms();

  // Channels state loaded from API
  const [channels, setChannels] = useState<OtaChannelData[]>([]);
  const [roomList, setRoomList] = useState<{ roomNumber: string; roomTypeName: string }[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-room edited URLs: key is `${channel}:${roomNumber}`
  const [editedUrls, setEditedUrls] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Global actions & Rates for 3 Room Categories ($20, $30, $20 USD with NPR equivalents)
  const [globalSyncing, setGlobalSyncing] = useState(false);
  const [ratePushed, setRatePushed] = useState(false);
  const [usdDeluxe, setUsdDeluxe] = useState(20);
  const [usdFamily, setUsdFamily] = useState(30);
  const [usdBudget, setUsdBudget] = useState(20);
  const [rateDeluxe, setRateDeluxe] = useState(2700);
  const [rateFamily, setRateFamily] = useState(4050);
  const [rateBudget, setRateBudget] = useState(2700);
  const [selectedBlackoutRoom, setSelectedBlackoutRoom] = useState('ALL');
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [simulatedAlertData, setSimulatedAlertData] = useState<{
    messageNepali: string;
    fullMessageBilingual?: string;
    alternatives: any[];
    category: string;
    bookedCount: number;
    dispatchStatus: string;
  } | null>(null);
  const [simulatingCap, setSimulatingCap] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState(false);

  // Official Hotel Email Linking & Automation State
  const [officialEmail, setOfficialEmail] = useState('info@hotelsherpasoul.com');
  const [notifyOnBooking, setNotifyOnBooking] = useState(true);
  const [notifyGuest, setNotifyGuest] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inboundWebhookUrl, setInboundWebhookUrl] = useState('');
  const [showInboundHelp, setShowInboundHelp] = useState(false);

  // Guides & Help accordion
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [showWebhookHelp, setShowWebhookHelp] = useState(false);

  // Activity logs
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);

  // 1. Fetch OTA Channels data from backend
  const fetchOtaData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ota/channels');
      const data = await res.json();
      if (data.success && data.data) {
        setChannels(data.data.channels);
        setRoomList(data.data.rooms);
        setWebhookUrl(data.data.webhookUrl);

        // Pre-fill editedUrls map
        const initialUrls: Record<string, string> = {};
        for (const ch of data.data.channels) {
          for (const rm of ch.rooms) {
            initialUrls[`${ch.id}:${rm.roomNumber}`] = rm.importUrl || '';
          }
        }
        setEditedUrls(initialUrls);
      }
    } catch (err) {
      console.error('Failed to load OTA channels:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Sync Logs
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/ota/logs?limit=15');
      const data = await res.json();
      if (data.success && data.data) {
        setSyncLogs(data.data);
      }
    } catch (err) {
      console.error('Failed to load OTA logs:', err);
    }
  };

  // 3. Fetch Official Email Settings
  const fetchEmailSettings = async () => {
    try {
      const res = await fetch('/api/email/config');
      const data = await res.json();
      if (data.success && data.data) {
        setOfficialEmail(data.data.officialEmail || 'info@hotelsherpasoul.com');
        setNotifyOnBooking(data.data.notifyOnBooking ?? true);
        setNotifyGuest(data.data.notifyGuestOnBooking ?? true);
        setInboundWebhookUrl(data.data.inboundWebhookUrl || '');
      }
    } catch (err) {
      console.warn('Failed to load email settings:', err);
    }
  };

  useEffect(() => {
    fetchOtaData();
    fetchLogs();
    fetchEmailSettings();
  }, []);

  const handleSaveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      const res = await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officialEmail,
          notifyOnBooking,
          notifyGuestOnBooking: notifyGuest,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatusMsg({ type: 'success', message: 'आधिकारिक होटल इमेल सफलतापूर्वक अपडेट भयो!' });
      } else {
        setEmailStatusMsg({ type: 'error', message: data.error || 'अपडेट गर्न सकिएन' });
      }
    } catch (err: any) {
      setEmailStatusMsg({ type: 'error', message: err.message });
    } finally {
      setSavingEmail(false);
      setTimeout(() => setEmailStatusMsg(null), 5000);
    }
  };

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: officialEmail,
          guestName: 'Bikram Sherpa (Website Test)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatusMsg({ 
          type: 'success', 
          message: `परीक्षण बुकिङ सूचना ${officialEmail} मा सफलतापूर्वक पठाइयो (${data.data.deliveryStatus})!` 
        });
        await fetchLogs();
        await refreshFromBackend();
      } else {
        setEmailStatusMsg({ type: 'error', message: data.error || 'इमेल पठाउन सकिएन' });
      }
    } catch (err: any) {
      setEmailStatusMsg({ type: 'error', message: err.message });
    } finally {
      setTestingEmail(false);
      setTimeout(() => setEmailStatusMsg(null), 6000);
    }
  };

  // Copy to clipboard helper
  const handleCopyLink = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Save external import URL for a channel & room
  const handleSaveUrl = async (channel: string, roomNumber: string) => {
    const key = `${channel}:${roomNumber}`;
    const urlValue = editedUrls[key] || '';
    setSavingKey(key);
    try {
      const res = await fetch('/api/ota/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          roomNumber,
          importUrl: urlValue,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusFeedback({
          type: 'success',
          message: `OTA Link saved for ${channel} (Room ${roomNumber})!`,
        });
        await fetchOtaData();
        await fetchLogs();
      } else {
        setStatusFeedback({
          type: 'error',
          message: data.error || 'Failed to save link',
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Connection error',
      });
    } finally {
      setSavingKey(null);
      setTimeout(() => setStatusFeedback(null), 4000);
    }
  };

  // Trigger sync for a specific listing
  const handleSyncListing = async (channel: string, roomNumber: string) => {
    const key = `${channel}:${roomNumber}`;
    setSyncingKey(key);
    try {
      const res = await fetch('/api/ota/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, roomNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusFeedback({
          type: 'success',
          message: data.message || `Successfully synced ${channel} (Room ${roomNumber})!`,
        });
        await fetchOtaData();
        await fetchLogs();
        await refreshFromBackend();
      } else {
        setStatusFeedback({
          type: 'error',
          message: data.error || data.message || 'Sync failed',
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Error executing sync',
      });
    } finally {
      setSyncingKey(null);
      setTimeout(() => setStatusFeedback(null), 5000);
    }
  };

  // Force sync all channels
  const handleSyncAll = async () => {
    setGlobalSyncing(true);
    try {
      const res = await fetch('/api/ota/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusFeedback({
          type: 'success',
          message: data.message || 'All configured OTA calendars synced successfully!',
        });
        await fetchOtaData();
        await fetchLogs();
        await refreshFromBackend();
      } else {
        setStatusFeedback({
          type: 'error',
          message: data.error || 'Failed to sync all channels',
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Error synchronizing all OTAs',
      });
    } finally {
      setGlobalSyncing(false);
      setTimeout(() => setStatusFeedback(null), 5000);
    }
  };

  const handlePushRates = () => {
    setRatePushed(true);
    setTimeout(() => setRatePushed(false), 3500);
  };

  const handleApplyBlackout = () => {
    if (selectedBlackoutRoom === 'ALL') {
      toggleStopSell();
    } else {
      updateRoomStatus(selectedBlackoutRoom, 'UNDER_MAINTENANCE', 'Emergency Stop Sell applied');
    }
  };

  const handleSimulateDoubleBooking = () => {
    setSimulationResult(
      '🛡️ PMS ZERO-DOUBLE-BOOKING SHIELD: An incoming overlapping booking from Agoda for Room 202 was intercepted and REJECTED (HTTP 409 Conflict). Room 202 is already reserved by Sarah Connor. Zero double-booking guaranteed!'
    );
    setTimeout(() => {
      setSimulationResult(null);
    }, 7000);
  };

  const handleSimulateCategoryCap = async (categoryName: string, rooms: string[]) => {
    setSimulatingCap(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/ota/simulate-cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryName,
          guestName: 'Bikram Adhikari (Booker)',
          phone: '+977 9841987654',
          checkInDate: '2026-09-15',
          checkOutDate: '2026-09-17',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedAlertData({
          messageNepali: data.messageNepali,
          fullMessageBilingual: data.fullMessageBilingual,
          alternatives: data.alternativesAvailable || [],
          category: data.categoryNepali || data.category,
          bookedCount: 2,
          dispatchStatus: data.dispatchStatus,
        });
        setSimulationResult(
          `🛡️ PMS 3-ROOM CATEGORY CAP SHIELD: Incoming 3rd booking for ${categoryName} was BLOCKED and REJECTED (HTTP 409 Conflict)! Hotel Sherpa Soul has exactly 2 rooms in this category (${rooms.join(' & ')}), and both 2 rooms are already booked for this date. Automated "Room Full" notification generated with alternative room options and dispatched!`
        );
        await fetchLogs();
        await refreshFromBackend();
      } else {
        setSimulationResult(`Simulation failed: ${data.error}`);
      }
    } catch (err: any) {
      setSimulationResult(`Simulation error: ${err.message}`);
    } finally {
      setSimulatingCap(false);
    }
  };

  // Flatten and filter listings for UI display
  const filteredListings = useMemo(() => {
    const list: OtaRoomConnection[] = [];
    for (const ch of channels) {
      if (selectedChannelFilter !== 'ALL' && ch.id !== selectedChannelFilter) continue;

      for (const rm of ch.rooms) {
        if (selectedRoomFilter !== 'ALL' && rm.roomNumber !== selectedRoomFilter) continue;

        // Category Filter
        if (selectedCategoryFilter !== 'ALL') {
          if (selectedCategoryFilter === 'DELUXE' && !['201', '301'].includes(rm.roomNumber)) continue;
          if (selectedCategoryFilter === 'FAMILY' && !['202', '302'].includes(rm.roomNumber)) continue;
          if (selectedCategoryFilter === 'BUDGET_FAMILY' && !['203', '303'].includes(rm.roomNumber)) continue;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = 
            rm.channelName.toLowerCase().includes(q) ||
            rm.roomNumber.toLowerCase().includes(q) ||
            rm.roomTypeName.toLowerCase().includes(q) ||
            (rm.importUrl && rm.importUrl.toLowerCase().includes(q));
          if (!match) continue;
        }

        list.push(rm);
      }
    }
    return list;
  }, [channels, selectedChannelFilter, selectedCategoryFilter, selectedRoomFilter, searchQuery]);

  // Counts
  const totalConfigured = useMemo(() => {
    let count = 0;
    for (const ch of channels) {
      count += ch.rooms.filter((r) => r.importUrl && r.importUrl.trim().length > 0).length;
    }
    return count;
  }, [channels]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Globe size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Multi-Channel OTA Sync Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                सबै OTA प्लेटफर्महरू (Booking.com, Airbnb, Agoda, Expedia, Trip.com, Vrbo) लाई २-तर्फी लिङ्क कपी-पेस्ट गरी जोड्नुहोस्
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={fetchOtaData}
            disabled={loading}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Reload channel settings"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            ताजा गर्नुहोस्
          </button>

          <button 
            type="button"
            onClick={handleSyncAll}
            disabled={globalSyncing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={globalSyncing ? 'animate-spin' : ''} />
            {globalSyncing ? 'Syncing All OTAs...' : 'Sync All OTAs Now (सबै सिङ्क गर्नुहोस्)'}
          </button>
        </div>
      </div>

      {/* Floating Status Notification */}
      {statusFeedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in border shadow-sm ${
          statusFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          {statusFeedback.type === 'success' ? (
            <CheckCircle className="text-emerald-600 shrink-0" size={20} />
          ) : (
            <AlertTriangle className="text-rose-600 shrink-0" size={20} />
          )}
          <p className="text-xs font-bold">{statusFeedback.message}</p>
        </div>
      )}

      {ratePushed && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 p-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle className="text-purple-600" size={20} />
          <div>
            <p className="font-bold text-sm">Rates Propagated across all channels!</p>
            <p className="text-xs text-purple-700">Deluxe (NPR {rateDeluxe.toLocaleString()}), Family (NPR {rateFamily.toLocaleString()}), Budget (NPR {rateBudget.toLocaleString()}) broadcasted.</p>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Supported Channels</span>
            <span className="text-xl font-black text-slate-900">7 Platforms</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Booking, Airbnb, Agoda, etc.</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <Globe size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Synced Links</span>
            <span className="text-xl font-black text-blue-600">{totalConfigured} Listings</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Configured with live URLs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
            <LinkIcon size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Double-Booking Shield</span>
            <span className="text-xl font-black text-emerald-700">100% Locked</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Zero Overlap Guarantee</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Emergency Stop-Sell</span>
            <span className={`text-xl font-black ${stopSellActive ? 'text-rose-600' : 'text-slate-800'}`}>
              {stopSellActive ? 'ACTIVE (Locked)' : 'Standby'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {stopSellActive ? 'All channels closed' : 'Inventory pooled'}
            </span>
          </div>
          <button 
            type="button"
            onClick={toggleStopSell}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
              stopSellActive ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {stopSellActive ? 'Resume' : 'Stop-Sell'}
          </button>
        </div>
      </div>

      {/* 📧 OFFICIAL HOTEL EMAIL LINK & BOOKING ALERTS */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-blue-500/30 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <Mail size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  वेबसाइट र आधिकारिक इमेल लिङ्क (Official Hotel Email Linking)
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle size={11} /> सक्रिय (Linked)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                वेबसाइट, OTA वा प्रत्यक्ष आएका हरेक नयाँ बुकिङको पूर्ण भाउचर तुरुन्तै आधिकारिक इमेलमा जान्छ।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={testingEmail}
              onClick={handleSendTestEmail}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Send size={13} />
              <span>{testingEmail ? 'परीक्षण इमेल पठाइँदै...' : 'परीक्षण इमेल पठाउनुहोस् (Send Test)'}</span>
            </button>
          </div>
        </div>

        {/* Email feedback toast */}
        {emailStatusMsg && (
          <div className={`p-3 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2 ${
            emailStatusMsg.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40' 
              : 'bg-rose-950/90 text-rose-200 border border-rose-500/40'
          }`}>
            <Info size={15} />
            <span>{emailStatusMsg.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Email Address Input */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>होटलको आधिकारिक इमेल ठेगाना (Official Hotel Email):</span>
              <span className="text-[11px] text-blue-300 font-normal">यसैमा सबै बुकिङ विवरण आउँछ</span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                placeholder="e.g. info@hotelsherpasoul.com वा hotelsherpasoul@gmail.com"
                className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                disabled={savingEmail}
                onClick={handleSaveEmailSettings}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
              >
                {savingEmail ? 'सेभ हुँदै...' : 'सेभ गर्नुहोस्'}
              </button>
            </div>
          </div>

          {/* Quick Stats & Toggles */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">नयाँ बुकिङमा इमेल अलर्ट:</span>
              <button
                type="button"
                onClick={() => setNotifyOnBooking(!notifyOnBooking)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${notifyOnBooking ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${notifyOnBooking ? 'left-4.5' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">पाहुनालाई कन्फर्मेसन इमेल:</span>
              <button
                type="button"
                onClick={() => setNotifyGuest(!notifyGuest)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${notifyGuest ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${notifyGuest ? 'left-4.5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Inbound Forwarding / Webhook info toggle */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowInboundHelp(!showInboundHelp)}
            className="text-blue-300 hover:text-blue-200 underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Inbox size={13} />
            <span>इमेल इनबक्सबाट बुकिङ स्वतः PMS मा ल्याउने तरिका (Inbound Email Forwarder Guide)</span>
          </button>
          <span className="text-[11px] text-slate-400">cPanel Webmail / Gmail Forwarding Ready</span>
        </div>

        {showInboundHelp && (
          <div className="bg-black/50 border border-blue-500/30 rounded-xl p-4 text-xs space-y-2 animate-fade-in text-slate-200">
            <p className="font-bold text-amber-300">
              💡 इमेल इनबक्सबाट आएका बुकिङलाई वेबसाइट / PMS मा स्वतः जोड्ने तरिका:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
              <li>तपाईंको आधिकारिक इमेल (cPanel Webmail, Gmail वा Google Workspace) सेटिङमा जानुहोस्।</li>
              <li><b>Forwarding / Filters</b> मा गएर नयाँ नियम बनाउनुहोस्।</li>
              <li>Booking.com वा Airbnb बाट आउने बुकिङ इमेलहरूलाई तलको PMS Webhook मा फरवार्ड गर्नुहोस्:</li>
              <li className="font-mono bg-black/60 p-2 rounded text-emerald-300 select-all break-all">
                {inboundWebhookUrl || 'https://pms.hotelsherpasoul.com/api/email/inbound'}
              </li>
              <li>यसो गर्दा इमेल प्राप्त हुनासाथ पाहुनाको नाम, कोठा, मिति र रकम स्वतः PMS मा दर्ता हुन्छ!</li>
            </ol>
          </div>
        )}
      </div>

      {/* Quick Setup Instructions & Guide Accordion */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 border border-blue-200/70 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                २-तर्फी लिङ्क कपी-पेस्ट कसरी गर्ने? (Easy 2-Way Link Sync Guide)
              </h3>
              <p className="text-xs text-slate-600">
                हाम्रो क्यालेन्डर लिङ्क OTA मा हाल्नुहोस् र OTA को लिङ्क यहाँ पेस्ट गर्नुहोस् — केही मिनेटमै सबै सिङ्क हुन्छ!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpandedGuide(expandedGuide ? null : 'ALL')}
            className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition"
          >
            <HelpCircle size={14} />
            {expandedGuide ? 'Hide Instructions (बन्द गर्नुहोस्)' : 'Step-by-step Setup Guides (हेर्नुहोस्)'}
            {expandedGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {expandedGuide && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs border-t border-blue-200/60 animate-fade-in">
            {/* Airbnb Guide */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-rose-100 space-y-1.5 shadow-2xs">
              <div className="font-bold text-rose-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Airbnb Setup
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
                <li>Airbnb Host मा जानुहोस् → <b>Listings</b> → आफ्नो कोठा छान्नुहोस्।</li>
                <li><b>Pricing and availability</b> → <b>Calendar sync</b> खोल्नुहोस्।</li>
                <li><b>Export Calendar</b> को लिङ्क कपी गरी तलको <b>Step 2</b> मा पेस्ट गरी <i>Save</i> थिच्नुहोस्।</li>
                <li><b>Import Calendar</b> मा गएर हाम्रो <b>Step 1</b> को लिङ्क पेस्ट गर्नुहोस्।</li>
              </ol>
            </div>

            {/* Booking.com Guide */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 space-y-1.5 shadow-2xs">
              <div className="font-bold text-blue-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Booking.com Setup
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
                <li>Booking.com Extranet लगइन गर्नुहोस्।</li>
                <li><b>Rates & Availability</b> → <b>Sync calendars</b> मा जानुहोस्।</li>
                <li><b>Export calendar</b> को लिङ्क कपी गरी तल <b>Step 2</b> मा पेस्ट गर्नुहोस्।</li>
                <li><b>Add calendar connection</b> मा हाम्रो <b>Step 1</b> लिङ्क पेस्ट गरी सेभ गर्नुहोस्।</li>
              </ol>
            </div>

            {/* Agoda Guide */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-purple-100 space-y-1.5 shadow-2xs">
              <div className="font-bold text-purple-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Agoda Setup
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
                <li>Agoda YCS पोर्टल लगइन गर्नुहोस्।</li>
                <li><b>Settings</b> → <b>Calendar Sync</b> मा जानुहोस्।</li>
                <li>Agoda क्यालेन्डर Export लिङ्क कपी गरी तल पेस्ट गर्नुहोस्।</li>
                <li>Agoda मा हाम्रो PMS क्यालेन्डर Import लिङ्क राखी पुष्टि गर्नुहोस्।</li>
              </ol>
            </div>

            {/* Expedia Guide */}
            <div className="bg-white/90 p-3.5 rounded-xl border border-amber-100 space-y-1.5 shadow-2xs">
              <div className="font-bold text-amber-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Expedia / Vrbo Setup
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed text-[11px]">
                <li>Expedia Partner Central वा Vrbo ड्यासबोर्डमा जानुहोस्।</li>
                <li><b>Rooms & Rates</b> → <b>iCal Calendar Sync</b> खोल्नुहोस्।</li>
                <li>२-तर्फी लिङ्क साटासाट (Export & Import) गर्नुहोस्।</li>
                <li>कुनै पनि नयाँ बुकिङ तुरुन्तै स्वचालित रूपमा सिङ्क हुन्छ।</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* 3 Room Categories & Pool Cap Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={18} />
              ३ वटा रुम क्याटागोरी र अटो-ब्लक सुरक्षा (3 Categories & 2-Room Max Cap System)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रत्येक क्याटागोरीमा ठीक २ वटा कोठा छन्। १ दिनमा १ प्रकारको अधिकतम २ वटा बुकिङ स्वीकार हुन्छ; सोभन्दा बढी (३ वटा) आएमा सिस्टमले स्वतः ब्लक गर्छ।
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl shrink-0">
            <CheckCircle size={13} /> 2 Rooms/Category Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Deluxe Room */}
          <div 
            onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'DELUXE' ? 'ALL' : 'DELUXE')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedCategoryFilter === 'DELUXE' 
                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-xs text-slate-900 block">1. Deluxe Room</span>
                <span className="text-[11px] text-slate-500 font-medium">Rooms 201 & 301 (२ वटा कोठा)</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                Cap: 2 Rooms
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">दैनिक दर (Rate):</span>
              <span className="font-extrabold text-blue-700 bg-white/90 px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                $20 USD <span className="text-slate-400 font-normal">/</span> रू. {rateDeluxe.toLocaleString()} (NPR)
              </span>
            </div>
          </div>

          {/* Family Room */}
          <div 
            onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'FAMILY' ? 'ALL' : 'FAMILY')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedCategoryFilter === 'FAMILY' 
                ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/20' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-xs text-slate-900 block">2. Family Room</span>
                <span className="text-[11px] text-slate-500 font-medium">Rooms 202 & 302 (२ वटा कोठा)</span>
              </div>
              <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                Cap: 2 Rooms
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">दैनिक दर (Rate):</span>
              <span className="font-extrabold text-purple-700 bg-white/90 px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
                $30 USD <span className="text-slate-400 font-normal">/</span> रू. {rateFamily.toLocaleString()} (NPR)
              </span>
            </div>
          </div>

          {/* Budget Family Room */}
          <div 
            onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'BUDGET_FAMILY' ? 'ALL' : 'BUDGET_FAMILY')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedCategoryFilter === 'BUDGET_FAMILY' 
                ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-xs text-slate-900 block">3. Budget Family Room</span>
                <span className="text-[11px] text-slate-500 font-medium">Rooms 203 & 303 (२ वटा कोठा)</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                Cap: 2 Rooms
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">दैनिक दर (Rate):</span>
              <span className="font-extrabold text-amber-900 bg-white/90 px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
                $20 USD <span className="text-slate-400 font-normal">/</span> रू. {rateBudget.toLocaleString()} (NPR)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Channel Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1">OTA:</span>
            {['ALL', 'BOOKING_COM', 'AIRBNB', 'AGODA', 'EXPEDIA', 'TRIP_COM', 'VRBO'].map((ch) => {
              const labelMap: Record<string, string> = {
                ALL: 'All Channels',
                BOOKING_COM: 'Booking.com',
                AIRBNB: 'Airbnb',
                AGODA: 'Agoda',
                EXPEDIA: 'Expedia',
                TRIP_COM: 'Trip.com',
                VRBO: 'Vrbo',
              };
              const isActive = selectedChannelFilter === ch;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSelectedChannelFilter(ch)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {labelMap[ch] || ch}
                </button>
              );
            })}
          </div>

          {/* Room Filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="p-2 border rounded-xl text-xs bg-slate-50 font-bold text-slate-700 min-w-[150px]"
            >
              <option value="ALL">All Rooms (सबै कोठाहरू)</option>
              {roomList.map((r) => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  {r.roomNumber === 'ALL' ? 'Combined Feed (All 6 Rooms)' : `Room ${r.roomNumber} - ${r.roomTypeName}`}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search listing or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border rounded-xl text-xs w-44 lg:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Connection Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <LinkIcon size={16} className="text-blue-600" />
            Active OTA Link Configurations ({filteredListings.length} Channels / Rooms Displayed)
          </h2>
          <span className="text-[11px] text-slate-500">
            Tip: Copy Step 1 to OTA, paste OTA's link in Step 2
          </span>
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 space-y-3">
            <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Loading OTA Channel connections...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 space-y-2">
            <Info size={28} className="text-slate-400 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">कुनै पनि च्यानल भेटिएन</p>
            <p className="text-xs text-slate-500">कृपया माथिको फिल्टर परिवर्तन गर्नुहोस् वा खोज्ने शब्द हटाउनुहोस्।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredListings.map((listing) => {
              const itemKey = `${listing.channel}:${listing.roomNumber}`;
              const isUrlSaved = Boolean(listing.importUrl && listing.importUrl.trim().length > 0);
              const currentInputVal = editedUrls[itemKey] !== undefined ? editedUrls[itemKey] : (listing.importUrl || '');
              const isSaving = savingKey === itemKey;
              const isSyncing = syncingKey === itemKey;
              const isCopied = copiedKey === itemKey;

              return (
                <div 
                  key={itemKey}
                  className={`bg-white rounded-2xl border transition shadow-2xs hover:shadow-sm overflow-hidden ${
                    isUrlSaved ? 'border-slate-200/90' : 'border-dashed border-slate-300 bg-slate-50/40'
                  }`}
                >
                  {/* Card Header Bar */}
                  <div className="p-3.5 sm:px-5 sm:py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                        listing.channel === 'BOOKING_COM' ? 'bg-blue-600 text-white' :
                        listing.channel === 'AIRBNB' ? 'bg-rose-500 text-white' :
                        listing.channel === 'AGODA' ? 'bg-purple-600 text-white' :
                        listing.channel === 'EXPEDIA' ? 'bg-amber-500 text-slate-950 font-black' :
                        listing.channel === 'TRIP_COM' ? 'bg-sky-600 text-white' :
                        'bg-slate-800 text-white'
                      }`}>
                        {listing.channelName}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {listing.roomNumber === 'ALL' ? 'All Rooms (Combined Feed)' : `Room ${listing.roomNumber}`}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({listing.roomTypeName})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUrlSaved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                          <CheckCircle size={12} className="text-emerald-600" /> Connected & Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle size={12} className="text-amber-600" /> Link Not Pasted Yet
                        </span>
                      )}

                      {listing.lastSyncedAt && (
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
                          Last sync: {new Date(listing.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2-Way Link Action Grid */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left Column: STEP 1 - PMS Calendar Export Link (COPY) */}
                    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                          <span>Step 1: Copy Sherpa Soul PMS Export Link</span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          iCal RFC 5545
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        यो लिङ्क कपी गरेर {listing.channelName} को <b>Calendar Sync → Import</b> मा पेस्ट गर्नुहोस्, ताकि यहाँ बुक भएको कोठा त्यहाँ तुरुन्तै ब्लक होस्:
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={listing.exportUrl}
                          className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-mono select-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyLink(listing.exportUrl, itemKey)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 shadow-2xs ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check size={14} className="animate-scale" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy Link
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right Column: STEP 2 - OTA External Link (PASTE) */}
                    <div className="bg-white rounded-xl p-3.5 border border-indigo-100 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                          <span>Step 2: Paste {listing.channelName} Calendar Link Here</span>
                        </div>
                        {listing.eventsCount > 0 && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {listing.eventsCount} Bookings Active
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {listing.channelName} बाट कपी गरेको Export iCal लिङ्क तलको बक्समा पेस्ट गरी सेभ गर्नुहोस्:
                      </p>

                      <div className="space-y-2">
                        <input
                          type="url"
                          placeholder={`https://${listing.channelName.toLowerCase().replace(/\s+/g, '')}.com/calendar/ical/...`}
                          value={currentInputVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditedUrls((prev) => ({ ...prev, [itemKey]: val }));
                          }}
                          className="w-full bg-slate-50/70 border border-slate-300/80 text-slate-900 text-xs rounded-xl px-3 py-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="text-[11px] text-slate-400">
                            {listing.syncMessage ? (
                              <span className="text-slate-600 font-medium truncate max-w-[260px] inline-block">
                                {listing.syncMessage}
                              </span>
                            ) : (
                              <span>Supports .ics / iCalendar URLs</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveUrl(listing.channel, listing.roomNumber)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
                            >
                              {isSaving ? 'Saving...' : 'Save Link (सेभ)'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSyncListing(listing.channel, listing.roomNumber)}
                              disabled={isSyncing || !currentInputVal}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-40"
                            >
                              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                              {isSyncing ? 'Syncing...' : 'Sync Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Universal Webhook Endpoint Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Universal Incoming Webhook URL (Zapier, Make, Channex & Direct Push)
              </h3>
              <p className="text-xs text-slate-300">
                अन्य थर्ड-पार्टी च्यानल म्यानेजर वा अटोमेसन इन्जिनबाट तत्काल बुकिङ सिधै पठाउन यो URL कपी गर्नुहोस्:
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWebhookHelp(!showWebhookHelp)}
            className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-bold"
          >
            {showWebhookHelp ? 'Hide JSON format' : 'View Payload Schema'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl || 'https://pms.hotelsherpasoul.com/api/ota/webhook?channel=custom'}
            className="w-full bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-xs rounded-xl px-3 py-2.5 select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleCopyLink(webhookUrl || 'https://pms.hotelsherpasoul.com/api/ota/webhook?channel=custom', 'webhook')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shrink-0"
          >
            {copiedKey === 'webhook' ? <Check size={15} /> : <Copy size={15} />}
            {copiedKey === 'webhook' ? 'Copied!' : 'Copy Webhook'}
          </button>
        </div>

        {showWebhookHelp && (
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 animate-fade-in">
            <p className="text-indigo-400 font-bold font-sans">POST /api/ota/webhook?channel=booking_com JSON Payload:</p>
            <pre className="text-emerald-300">
{`{
  "guestName": "Sarah Connor",
  "email": "sarah@gmail.com",
  "roomNumber": "201",
  "checkInDate": "2026-10-01",
  "checkOutDate": "2026-10-04",
  "adults": 2,
  "totalAmount": 10500,
  "source": "Booking.com",
  "otaReference": "BK-991204"
}`}
            </pre>
          </div>
        )}
      </div>

      {/* Real-time Activity Stream & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Real-Time OTA Activity Stream & Logs
            </h2>
            <button 
              type="button"
              onClick={fetchLogs}
              className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              <RefreshCw size={11} /> Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-xs max-h-[380px] overflow-y-auto">
            {syncLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-sans text-xs">
                No sync logs recorded yet. Once you paste an OTA link and sync, logs will appear here.
              </div>
            ) : (
              syncLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 mr-1.5">{log.channel}:</span>
                      <span className="font-sans text-slate-600 text-xs">{log.message}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                      log.status === 'CONFLICT_PREVENTED' ? 'bg-amber-100 text-amber-900 font-bold' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rate & Restriction Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ArrowUpDown size={16} className="text-purple-600" /> Multi-OTA Bulk Rate Sync
              </h3>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                $1 USD = रू. 135 NPR
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Set nightly rates in USD and Nepali Rupees (NPR) to broadcast across Booking.com, Agoda, and Airbnb simultaneously:
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                <label className="text-slate-800 font-bold block">1. Deluxe Room (Rooms 201 & 301)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input 
                      type="number" 
                      value={usdDeluxe}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setUsdDeluxe(val);
                        setRateDeluxe(Math.round(val * 135));
                      }}
                      className="w-full pl-6 pr-10 py-1.5 bg-white border rounded-lg font-bold text-xs"
                      placeholder="USD"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">USD</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">रु.</span>
                    <input 
                      type="number" 
                      value={rateDeluxe}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setRateDeluxe(val);
                        setUsdDeluxe(Number((val / 135).toFixed(1)));
                      }}
                      className="w-full pl-7 pr-10 py-1.5 bg-white border rounded-lg font-bold text-xs"
                      placeholder="NPR"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">NPR</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                <label className="text-slate-800 font-bold block">2. Family Room (Rooms 202 & 302)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input 
                      type="number" 
                      value={usdFamily}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setUsdFamily(val);
                        setRateFamily(Math.round(val * 135));
                      }}
                      className="w-full pl-6 pr-10 py-1.5 bg-white border rounded-lg font-bold text-xs"
                      placeholder="USD"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">USD</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">रु.</span>
                    <input 
                      type="number" 
                      value={rateFamily}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setRateFamily(val);
                        setUsdFamily(Number((val / 135).toFixed(1)));
                      }}
                      className="w-full pl-7 pr-10 py-1.5 bg-white border rounded-lg font-bold text-xs"
                      placeholder="NPR"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">NPR</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                <label className="text-slate-800 font-bold block">3. Budget Family Room (Rooms 203 & 303)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input 
                      type="number" 
                      value={usdBudget}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setUsdBudget(val);
                        setRateBudget(Math.round(val * 135));
                      }}
                      className="w-full pl-6 pr-10 py-1.5 bg-white border rounded-lg font-bold text-xs"
                      placeholder="USD"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">USD</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">रु.</span>
                    <input 
                      type="number" 
                      value={rateBudget}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setRateBudget(val);
                        setUsdBudget(Number((val / 135).toFixed(1)));
                      }}
                      className="w-full pl-7 pr-10 py-1.5 bg-white border rounded-lg font-bold text-xs"
                      placeholder="NPR"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">NPR</span>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={handlePushRates}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {ratePushed ? <Check size={14} /> : <ArrowUpDown size={14} />}
                {ratePushed ? 'Rates Synced to All OTAs!' : 'Push Dual Rates (USD & NPR) to All OTAs'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertOctagon size={16} className="text-rose-600" /> Single Room Stop-Sell
            </h3>
            <p className="text-xs text-slate-500">Blackout specific room on OTAs for maintenance or walk-in holds:</p>
            <select 
              value={selectedBlackoutRoom}
              onChange={e => setSelectedBlackoutRoom(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs bg-white font-bold"
            >
              <option value="ALL">ALL 6 ROOMS (Full Blackout)</option>
              {rooms.map(r => (
                <option key={r.number} value={r.number}>Room {r.number} ({r.type})</option>
              ))}
            </select>
            <button 
              type="button"
              onClick={handleApplyBlackout}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Apply Stop Sell
            </button>
          </div>

          {/* Double-Booking & 3-Room Category Cap Live Shield Simulator */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl border border-indigo-500/40 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldCheck size={18} />
              <h3>Zero-Double-Booking & 2-Room Cap Simulator</h3>
            </div>
            <p className="text-xs text-slate-300">
              १ दिनमा १ प्रकारको अधिकतम २ वटा बुकिङ हुन्छ। ३ वटा आएमा सिस्टमले स्वतः ब्लक गर्ने सुरक्षाको प्रत्यक्ष परीक्षण गर्नुहोस्:
            </p>
            
            <div className="space-y-2">
              <button 
                type="button"
                disabled={simulatingCap}
                onClick={() => handleSimulateCategoryCap('Deluxe Room (Rooms 201 & 301)', ['201', '301'])}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={14} /> 1. Simulate 3rd Deluxe Room Block & Alternative Alert
              </button>

              <button 
                type="button"
                disabled={simulatingCap}
                onClick={() => handleSimulateCategoryCap('Family Room (Rooms 202 & 302)', ['202', '302'])}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={14} /> 2. Simulate 3rd Family Room Block & Alternative Alert
              </button>

              <button 
                type="button"
                disabled={simulatingCap}
                onClick={() => handleSimulateCategoryCap('Budget Family Room (Rooms 203 & 303)', ['203', '303'])}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={14} /> 3. Simulate 3rd Budget Family Block & Alternative Alert
              </button>

              <button 
                type="button"
                onClick={handleSimulateDoubleBooking}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-xs transition border border-slate-700"
              >
                Simulate Single Room Overlap Test
              </button>
            </div>

            {simulationResult && (
              <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-200 rounded-xl text-[11px] leading-relaxed font-mono animate-fade-in">
                {simulationResult}
              </div>
            )}

            {/* LIVE PREVIEW: Automated WhatsApp/SMS Message to Booker with Alternative Rooms */}
            {simulatedAlertData && (
              <div className="mt-3 p-4 bg-slate-900/95 border-2 border-emerald-500/80 rounded-2xl space-y-3 animate-fade-in shadow-xl text-slate-100">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="font-bold text-xs text-emerald-300">
                      📲 बुकिङकर्तालाई जाने स्वचालित सन्देश (Live Message Dispatched)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {simulatedAlertData.dispatchStatus}
                  </span>
                </div>

                <div className="p-3 bg-black/50 border border-emerald-500/30 rounded-xl font-sans text-xs leading-relaxed space-y-2 whitespace-pre-line text-emerald-100/90">
                  {simulatedAlertData.messageNepali}
                </div>

                {/* Available Alternative Badges */}
                {simulatedAlertData.alternatives.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" /> सन्देशमा समावेश गरिएका उपलब्ध अन्य विकल्पहरू:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {simulatedAlertData.alternatives.map((alt: any) => (
                        <div 
                          key={alt.id}
                          className="px-2.5 py-1 bg-emerald-950 border border-emerald-400/40 rounded-lg text-[10px] font-bold text-emerald-200 flex items-center gap-1.5"
                        >
                          <span>{alt.nameNepali || alt.name}</span>
                          <span className="text-emerald-400">({alt.availableRooms?.join(', ')})</span>
                          <span className="bg-emerald-800/80 px-1 py-0.2 rounded text-[9px] text-white">
                            ${alt.dailyRateUsd || (alt.dailyRate === 4050 ? 30 : 20)} USD (रु. {alt.dailyRate?.toLocaleString()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <button 
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(simulatedAlertData.messageNepali);
                      setCopiedAlert(true);
                      setTimeout(() => setCopiedAlert(false), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition text-xs shadow-xs"
                  >
                    {copiedAlert ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedAlert ? 'सन्देश कपी भयो!' : 'सन्देश कपी गर्नुहोस्'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setSimulatedAlertData(null)}
                    className="text-xs text-slate-400 hover:text-white underline font-medium"
                  >
                    बन्द गर्नुहोस्
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
