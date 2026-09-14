"use client";

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Calendar,
  BedDouble,
  FileText,
  Bot,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

interface UnifiedMessageItem {
  id: string;
  messageId: string;
  reservationId?: string;
  guestId?: string;
  channel: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sender: string;
  recipient: string;
  content: string;
  status: string;
  requiresStaffAction: boolean;
  assignedStaff?: string;
  createdAt: string;
  guest?: {
    name: string;
    phoneNumber?: string;
    email?: string;
    riskStatus?: string;
    previousDueAmount?: number;
  };
  reservation?: {
    reservationNumber: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    dueAmount: number;
    room?: { roomNumber: string };
  };
}

export default function UnifiedInboxPage() {
  const [messages, setMessages] = useState<UnifiedMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'handover'>('all');
  const [selectedThreadRecipient, setSelectedThreadRecipient] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/inbox?filter=${filter}&q=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data || []);
        if (!selectedThreadRecipient && json.data?.length > 0) {
          const firstInbound = json.data[0];
          setSelectedThreadRecipient(firstInbound.direction === 'INBOUND' ? firstInbound.sender : firstInbound.recipient);
        }
      }
    } catch (e) {
      console.error('Failed fetching inbox:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  // Group messages by customer phone/contact
  const threadMap = new Map<string, UnifiedMessageItem[]>();
  for (const m of messages) {
    const contactKey = m.direction === 'INBOUND' ? m.sender : m.recipient;
    const current = threadMap.get(contactKey) || [];
    threadMap.set(contactKey, [...current, m]);
  }

  const threadList = Array.from(threadMap.entries()).map(([contactKey, msgs]) => {
    const latest = msgs[0];
    const hasHandover = msgs.some((m) => m.requiresStaffAction);
    return {
      contactKey,
      latestMessage: latest.content,
      latestTime: latest.createdAt,
      guestName: latest.guest?.name || contactKey,
      reservationNumber: latest.reservation?.reservationNumber,
      hasHandover,
      messages: msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    };
  });

  const activeThread = threadList.find((t) => t.contactKey === selectedThreadRecipient);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadRecipient || !replyText.trim()) return;

    try {
      setSending(true);
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: selectedThreadRecipient,
          messageText: replyText.trim(),
          resolveHandover: true,
          staffName: 'Pasang Sherpa (Reception Desk)',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReplyText('');
        await fetchMessages();
      } else {
        alert(`Failed sending reply: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Unified Guest Concierge & Inbox
          </h1>
          <p className="text-sm text-slate-500">
            Multi-channel guest communication stream (WhatsApp, Website, Email, Phone) with human handover
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} /> Refresh Stream
        </button>
      </div>

      {/* Main Inbox Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs h-[720px] flex overflow-hidden">
        {/* Left: Threads Sidebar */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMessages()}
                placeholder="Search guest, phone, booking..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                All Threads ({threadList.length})
              </button>
              <button
                onClick={() => setFilter('handover')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  filter === 'handover' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                Staff Handover Required
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {threadList.map((t) => (
              <div
                key={t.contactKey}
                onClick={() => setSelectedThreadRecipient(t.contactKey)}
                className={`p-3 cursor-pointer transition ${
                  selectedThreadRecipient === t.contactKey ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{t.guestName}</h4>
                  <span className="text-[10px] text-slate-400">{new Date(t.latestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{t.contactKey}</p>
                <p className="text-xs text-slate-600 line-clamp-1 mt-1">{t.latestMessage}</p>

                {t.hasHandover && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                    <UserCheck size={11} /> Human Handover
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Conversation View */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {activeThread.guestName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeThread.guestName}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{activeThread.contactKey}</span>
                      {activeThread.reservationNumber && (
                        <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                          #{activeThread.reservationNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {activeThread.hasHandover && (
                  <span className="text-xs bg-amber-100 border border-amber-300 text-amber-900 font-bold px-3 py-1 rounded-lg">
                    Bot replies paused for staff resolution
                  </span>
                )}
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-2xs ${
                        m.direction === 'OUTBOUND'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] mb-1 opacity-75">
                        <span className="font-bold">{m.direction === 'OUTBOUND' ? m.sender : activeThread.guestName}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official WhatsApp reply to guest..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={14} /> {sending ? 'Sending...' : 'Send WhatsApp'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
              <MessageSquare size={48} className="text-slate-300 mb-2" />
              Select a conversation to inspect thread and send replies
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
