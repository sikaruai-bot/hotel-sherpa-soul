"use client";

import React, { useState } from 'react';
import { Save, Check, Plus, Tag, FileText, Globe } from 'lucide-react';

interface SettingItem {
  key: string;
  value: string;
  description: string;
}

interface OfferItem {
  id: string;
  title: string;
  code: string;
  discountPct: number;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  isPublished: boolean;
  publishedAt: string;
}

interface Props {
  settings: SettingItem[];
  offers: OfferItem[];
  blogs: BlogItem[];
}

export default function AdminCmsClient({ settings, offers, blogs }: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'offers' | 'blogs'>('settings');
  const [settingValues, setSettingValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');

    try {
      const payload = Object.entries(settingValues).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'setting', settings: payload }),
      });

      if (!res.ok) throw new Error('Save failed');

      setSaveMsg('Settings updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      alert('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'settings' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          General Settings & Trackers
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'offers' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Direct Offers & Promos
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'blogs' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          SEO Travel Articles
        </button>
      </div>

      {saveMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Tab 1: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Hotel Information & Analytics Trackers</h2>
            <p className="text-xs text-slate-500">Owner-managed business information and tracking tags.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Hotel Phone</label>
              <input
                type="text"
                value={settingValues['phone'] || ''}
                onChange={e => setSettingValues({ ...settingValues, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={settingValues['whatsapp'] || ''}
                onChange={e => setSettingValues({ ...settingValues, whatsapp: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Business Email</label>
              <input
                type="email"
                value={settingValues['email'] || ''}
                onChange={e => setSettingValues({ ...settingValues, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Hotel Location</label>
              <input
                type="text"
                value={settingValues['address'] || ''}
                onChange={e => setSettingValues({ ...settingValues, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Meta Pixel ID</label>
              <input
                type="text"
                value={settingValues['meta_pixel_id'] || ''}
                onChange={e => setSettingValues({ ...settingValues, meta_pixel_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">GA4 Measurement ID</label>
              <input
                type="text"
                value={settingValues['ga4_id'] || ''}
                onChange={e => setSettingValues({ ...settingValues, ga4_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-extrabold text-slate-950 text-xs shadow-sm transition-all"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Tab 2: Offers */}
      {activeTab === 'offers' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Active Direct Offers</h2>
          <div className="space-y-3">
            {offers.map(off => (
              <div key={off.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900 block text-sm">{off.title} ({off.discountPct}% OFF)</strong>
                  <span className="font-mono text-amber-700 font-bold">CODE: {off.code}</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">{off.description}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {off.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Blogs */}
      {activeTab === 'blogs' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">SEO Blog Articles</h2>
          <div className="space-y-3">
            {blogs.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900 block text-sm">{b.title}</strong>
                  <span className="text-slate-400 text-[11px]">/blog/{b.slug} • By {b.author}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Published
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
