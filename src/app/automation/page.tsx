"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Zap, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  MessageSquare, 
  ShieldCheck, 
  RefreshCw, 
  Activity, 
  Flame, 
  KeyRound, 
  ExternalLink,
  Code
} from 'lucide-react';

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  recentLogs?: {
    id: string;
    event: string;
    status: number;
    response?: string;
    createdAt: string;
  }[];
}

export default function AutomationPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New webhook form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'booking.created',
    'guest.checked_in',
    'guest.checked_out',
    'payment.received',
  ]);

  // Testing webhook state
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Automation Recipes toggle state
  const [recipes, setRecipes] = useState({
    whatsappCheckIn: true,
    housekeepingCheckout: true,
    nightAuditCron: true,
    gasSensorAlert: true,
    sparrowSmsInvoice: false,
  });

  const availableEvents = [
    { id: 'booking.created', label: 'New Reservation Created (OTA / Direct)' },
    { id: 'guest.checked_in', label: 'Guest Check-In (Front Desk)' },
    { id: 'guest.checked_out', label: 'Guest Check-Out & Bill Settlement' },
    { id: 'payment.received', label: 'Payment Received (eSewa, Khalti, Card)' },
    { id: 'maintenance.created', label: 'New Maintenance / Repair Ticket' },
    { id: 'kitchen.alert', label: 'Kitchen Incident or LPG Gas Low Alert' },
  ];

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/webhooks');
      const json = await res.json();
      if (json.success && json.data) {
        setWebhooks(json.data);
      }
    } catch (err) {
      console.warn('Error fetching webhooks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          url,
          secret,
          events: selectedEvents,
          isActive: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setName('');
        setUrl('');
        setSecret('');
        setShowAddModal(false);
        fetchWebhooks();
      }
    } catch (err) {
      console.error('Failed to create webhook:', err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to remove this automation webhook?')) return;
    try {
      await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      fetchWebhooks();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleTestWebhook = async (targetUrl: string, secretKey?: string) => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, secret: secretKey }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const triggerNightAuditNow = async () => {
    try {
      const res = await fetch('/api/cron/night-audit', { method: 'POST' });
      const data = await res.json();
      alert(`Automated Night Audit Executed!\nOccupancy: ${data.data?.occupancyRate || '100%'}\nExpired Passes Reconciled: ${data.data?.expiredPassesUpdated || 0}`);
    } catch {
      alert('Error triggering audit.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="text-amber-500" /> Automations & Webhooks
          </h1>
          <p className="text-xs text-slate-500">
            Connect Hotel Sherpa Soul PMS to Zapier, Make.com, n8n, WhatsApp Cloud API & IoT Sensors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerNightAuditNow}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Clock size={14} /> Run Night Audit Now
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus size={15} /> Add Webhook URL
          </button>
        </div>
      </div>

      {/* Pre-Configured Automation Recipes */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="text-indigo-600" /> Automated Hotel Recipes
            </h2>
            <p className="text-xs text-slate-500">
              One-click automation routines for front desk, housekeeping, and guest messaging
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Ready & Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {/* Recipe 1 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MessageSquare size={15} className="text-emerald-600" />
                <span>WhatsApp Welcome on Check-in</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Auto-sends WiFi password and Thamel area guide to guest on arrival.
              </p>
            </div>
            <input
              type="checkbox"
              checked={recipes.whatsappCheckIn}
              onChange={(e) => setRecipes({ ...recipes, whatsappCheckIn: e.target.checked })}
              className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Recipe 2 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Activity size={15} className="text-amber-600" />
                <span>Auto-alert Housekeeping on Checkout</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Auto-creates a Turnover Cleaning task when a guest settles bill.
              </p>
            </div>
            <input
              type="checkbox"
              checked={recipes.housekeepingCheckout}
              onChange={(e) => setRecipes({ ...recipes, housekeepingCheckout: e.target.checked })}
              className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Recipe 3 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Flame size={15} className="text-rose-600" />
                <span>Kitchen Gas Sensor Low Alert</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Creates urgent maintenance ticket if shared kitchen LPG &lt; 20%.
              </p>
            </div>
            <input
              type="checkbox"
              checked={recipes.gasSensorAlert}
              onChange={(e) => setRecipes({ ...recipes, gasSensorAlert: e.target.checked })}
              className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Outbound Webhooks (Zapier / Make / n8n) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Globe size={16} className="text-indigo-600" /> Connected Webhook Endpoints
            </h2>
            <p className="text-xs text-slate-500">
              Live HTTP POST triggers dispatched whenever bookings, check-ins, or payments happen
            </p>
          </div>
          <button
            onClick={fetchWebhooks}
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Zap size={22} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">No Webhooks Configured Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add a webhook URL from Zapier, Make.com, or your custom server to receive live notifications on new bookings and check-ins.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Add First Webhook
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {webhooks.map((ep) => (
              <div key={ep.id} className="p-5 hover:bg-slate-50/70 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h4 className="font-bold text-slate-900 text-sm">{ep.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-xs font-mono text-indigo-700 mt-1 truncate max-w-xl">
                      {ep.url}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestWebhook(ep.url, ep.secret)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                    >
                      <Send size={12} /> Test Ping
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWebhook(ep.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete webhook"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Subscribed Events Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ep.events.map((ev) => (
                    <span
                      key={ev}
                      className="bg-indigo-50 text-indigo-800 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[10px] font-medium"
                    >
                      {ev}
                    </span>
                  ))}
                </div>

                {/* Recent Delivery History Snippet */}
                {ep.recentLogs && ep.recentLogs.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Recent Deliveries:
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {ep.recentLogs.map((log) => (
                        <span
                          key={log.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] ${
                            log.status === 200
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status === 200 ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          <span>{log.event} ({log.status})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Test Response Inspector */}
      {testResult && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-3 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Activity size={14} /> Live Webhook Delivery Result
            </span>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white text-xs">
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Status: </span>
              <strong className={testResult.statusCode === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                {testResult.statusCode ? `${testResult.statusCode} OK` : 'Error'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Duration: </span>
              <strong className="text-slate-200">{testResult.durationMs || 0}ms</strong>
            </div>
            <div>
              <span className="text-slate-400">Event: </span>
              <strong className="text-indigo-400">test.ping</strong>
            </div>
            <div>
              <span className="text-slate-400">Payload: </span>
              <strong className="text-slate-200">JSON</strong>
            </div>
          </div>
          <pre className="bg-black/50 p-3 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto">
            {JSON.stringify(testResult.sentPayload || testResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Inbound Automation API Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Code size={16} className="text-indigo-600" /> Inbound Automation Trigger API (For Smart Locks & IoT)
        </h3>
        <p className="text-slate-600">
          External systems (smart door locks, kitchen IoT sensors, or Zapier actions) can call this endpoint to trigger hotel actions:
        </p>
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1">
          <p className="text-amber-400">POST /api/automation/trigger</p>
          <p className="text-slate-400">Headers: Authorization: Bearer sherpa-soul-auto-key-2026</p>
          <p className="text-emerald-400">&#123; &quot;action&quot;: &quot;gas_alert&quot;, &quot;payload&quot;: &#123; &quot;gasLevel&quot;: 15 &#125; &#125;</p>
        </div>
      </div>

      {/* Modal: Add Webhook */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-scale-in text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" /> Register Automation Webhook
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Integration Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zapier New Booking Catch Hook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/12345/abcde/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Secret Key (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional secret for X-SherpaSoul-Secret header"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Events to Dispatch</label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                  {availableEvents.map((ev) => (
                    <label key={ev.id} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, ev.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter((item) => item !== ev.id));
                          }
                        }}
                        className="rounded accent-indigo-600"
                      />
                      <span className="font-mono text-[11px] text-indigo-900 font-semibold">{ev.id}</span>
                      <span className="text-[11px] text-slate-500">({ev.label})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
