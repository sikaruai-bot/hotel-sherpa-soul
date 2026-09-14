"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Globe,
  Bell,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ExceptionItem {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
  title: string;
  message: string;
  status: string;
  canRetry: boolean;
  retryJobId?: string;
  createdAt: string;
}

export default function ExceptionsDashboardPage() {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'JOBS' | 'OTA' | 'GUEST'>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/exceptions');
      const json = await res.json();
      if (json.success) {
        setExceptions(json.data || []);
      }
    } catch (err) {
      console.error('Failed fetching exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleRetryJob = async (jobId: string) => {
    try {
      setRetryingId(jobId);
      const res = await fetch(`/api/internal/jobs/${jobId}/retry`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`Job successfully retried and executed.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
        await fetchExceptions();
      } else {
        alert(`Retry failed: ${json.error}`);
      }
    } catch (e: any) {
      alert(`Network error retrying job: ${e.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const filtered = exceptions.filter((item) => {
    if (filter === 'CRITICAL') return item.severity === 'CRITICAL';
    if (filter === 'JOBS') return item.type === 'JOB_FAILURE';
    if (filter === 'OTA') return item.type === 'OTA_CONFLICT';
    if (filter === 'GUEST') return item.type === 'GUEST_RISK';
    return true;
  });

  const criticalCount = exceptions.filter((i) => i.severity === 'CRITICAL').length;
  const jobFailCount = exceptions.filter((i) => i.type === 'JOB_FAILURE').length;
  const otaConflictCount = exceptions.filter((i) => i.type === 'OTA_CONFLICT').length;
  const guestRiskCount = exceptions.filter((i) => i.type === 'GUEST_RISK').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-rose-600" /> Exception & Automation Control Hub
          </h1>
          <p className="text-sm text-slate-500">
            Real-time management dashboard for booking conflicts, failed jobs, OTA sync warnings & guest due alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchExceptions}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} /> Refresh
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          {actionSuccessMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Exceptions</span>
            <AlertCircle size={18} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{exceptions.length}</div>
          <p className="text-xs text-slate-500 mt-1">Requires front-desk or manager review</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Critical Priority</span>
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{criticalCount}</div>
          <p className="text-xs text-rose-600 mt-1">Immediate action needed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Failed Queue Jobs</span>
            <RotateCcw size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{jobFailCount}</div>
          <p className="text-xs text-amber-600 mt-1">Available for 1-click retry</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Flagged Due / Risk</span>
            <ShieldAlert size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-2">{guestRiskCount}</div>
          <p className="text-xs text-blue-600 mt-1">Past balance or review required</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'ALL', label: `All (${exceptions.length})` },
          { id: 'CRITICAL', label: `Critical (${criticalCount})` },
          { id: 'JOBS', label: `Job Failures (${jobFailCount})` },
          { id: 'OTA', label: `OTA Shield Blocks (${otaConflictCount})` },
          { id: 'GUEST', label: `Guest Risk & Dues (${guestRiskCount})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === t.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Exceptions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">All Operations Clear!</h3>
            <p className="text-sm text-slate-500 mt-1">
              No pending exceptions or critical automation errors in Hotel Sherpa Soul PMS.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50/70 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                      {item.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} /> {new Date(item.createdAt).toLocaleTimeString()} ({new Date(item.createdAt).toLocaleDateString()})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/70 font-mono">
                  {item.message}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-4 text-slate-600">
                    <span>
                      <strong>Booking #:</strong> {item.reservationNumber}
                    </span>
                    <span>
                      <strong>Guest:</strong> {item.guestName}
                    </span>
                    <span>
                      <strong>Room:</strong> {item.roomNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.canRetry && item.retryJobId && (
                      <button
                        onClick={() => handleRetryJob(item.retryJobId!)}
                        disabled={retryingId === item.retryJobId}
                        className="flex items-center gap-1.5 bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shadow-xs disabled:opacity-50 text-xs"
                      >
                        <RotateCcw size={13} className={retryingId === item.retryJobId ? 'animate-spin' : ''} />
                        {retryingId === item.retryJobId ? 'Retrying...' : '1-Click Retry'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
