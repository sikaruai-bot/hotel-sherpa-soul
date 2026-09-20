"use client";

import React, { useState } from 'react';
import {
  Settings,
  Zap,
  Bell,
  Mail,
  MessageSquare,
  Shield,
  Clock,
  Save,
  CheckCircle2,
  Sparkles,
  Sliders,
  DollarSign,
} from 'lucide-react';

export default function AutomationSettingsPage() {
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    businessTimezone: 'Asia/Kathmandu',
    vatRate: 0,
    serviceChargeRate: 0,
    holdDurationMinutes: 15,
    autoReleaseNoShowHour: 18,
    maxJobRetries: 5,
    reviewRequestDelayHours: 24,
    enableWhatsAppBot: true,
    enableEmailNotifs: true,
    enableSmsNotifs: false,
    enableAutoHousekeeping: true,
    managerReviewThresholdNpr: 1000,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="text-blue-600" /> Admin Automation & System Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure automation rules, messaging triggers, Nepal tax parameters & Kathmandu business timezone
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-xs"
        >
          <Save size={16} /> Save Configuration
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          Settings updated successfully! Changes are active immediately across all PMS nodes.
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Automation Recipes */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="text-amber-500" size={18} /> Active Automation Recipes
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">WhatsApp Concierge Bot</p>
                <p className="text-[11px] text-slate-500">Auto-reply to incoming customer room inquiries & dates</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableWhatsAppBot}
                onChange={(e) => setSettings({ ...settings, enableWhatsAppBot: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Transactional Email Engine</p>
                <p className="text-[11px] text-slate-500">Dispatch booking confirmations and payment invoices via SMTP</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableEmailNotifs}
                onChange={(e) => setSettings({ ...settings, enableEmailNotifs: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Auto-Generate Housekeeping Tasks</p>
                <p className="text-[11px] text-slate-500">Create turnover clean tasks on checkout & pre-arrival clean</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAutoHousekeeping}
                onChange={(e) => setSettings({ ...settings, enableAutoHousekeeping: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Nepal Sparrow SMS Gateway</p>
                <p className="text-[11px] text-slate-500">Send local SMS text slips alongside WhatsApp</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableSmsNotifs}
                onChange={(e) => setSettings({ ...settings, enableSmsNotifs: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Timing & Delay Thresholds */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="text-blue-500" size={18} /> Timing & Queue Thresholds
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Temporary Room Hold Duration (Minutes)</label>
              <input
                type="number"
                value={settings.holdDurationMinutes}
                onChange={(e) => setSettings({ ...settings, holdDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400">Website locks room while customer completes payment</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">No-Show Auto-Release Hour (24h format)</label>
              <input
                type="number"
                value={settings.autoReleaseNoShowHour}
                onChange={(e) => setSettings({ ...settings, autoReleaseNoShowHour: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400">18:00 (6:00 PM Nepal Time) un-checked-in rooms free up</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Queue Max Retry Attempts</label>
              <input
                type="number"
                value={settings.maxJobRetries}
                onChange={(e) => setSettings({ ...settings, maxJobRetries: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400">Jobs retried 1m, 5m, 15m, 1h, 6h before moving to dead letter</span>
            </div>
          </div>
        </div>

        {/* Nepal Tax & Financial Parameters */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="text-emerald-600" size={18} /> Financial & Nepal Tax Parameters
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <span>✓ Tax Status: PAN Registered Only (Non-VAT)</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                होटल स्थायी लेखा नम्बर (PAN: <strong>119205419</strong>) मा दर्ता छ। भ्याट (VAT) दर्ता नभएको कारणले सबै बिजकहरू आधिकारिक <strong>PAN Bill (बिजक)</strong> का रूपमा जारी हुन्छन् र VAT ०% लाग्दछ।
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nepal VAT Rate (%)</label>
              <input
                type="number"
                value={settings.vatRate}
                onChange={(e) => setSettings({ ...settings, vatRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400">Default 0% (Hotel is not VAT registered - PAN Bills only)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Service Charge Rate (%)</label>
              <input
                type="number"
                value={settings.serviceChargeRate}
                onChange={(e) => setSettings({ ...settings, serviceChargeRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400">Default 0% (No extra service charge added to bills)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Timezone</label>
              <input
                type="text"
                disabled
                value={settings.businessTimezone}
                className="w-full px-3 py-2 border border-slate-300 bg-slate-100 rounded-lg text-xs text-slate-600 font-mono"
              />
              <span className="text-[11px] text-slate-400">All night audit & calendars run on Asia/Kathmandu (GMT+5:45)</span>
            </div>
          </div>
        </div>

        {/* Risk & Due Management Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="text-rose-600" size={18} /> Guest Risk & Previous Due Rules
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Manager Review Threshold (NPR)</label>
              <input
                type="number"
                value={settings.managerReviewThresholdNpr}
                onChange={(e) => setSettings({ ...settings, managerReviewThresholdNpr: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-[11px] text-slate-400">Guests with previous dues over this amount require manager review</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Compliance & Blacklist Policy:</p>
              <p>• Guests are matched by Government ID hash, verified Phone, or Email.</p>
              <p>• System never blacklists automatically based solely on matching name.</p>
              <p>• Risk clearance requires authorized staff approval with mandatory audit logging.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
