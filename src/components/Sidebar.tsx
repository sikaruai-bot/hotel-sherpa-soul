"use client";

import Link from 'next/link';
import { 
  CalendarDays, 
  LayoutDashboard, 
  BedDouble, 
  Users, 
  ChefHat, 
  FileText, 
  Settings,
  LogOut,
  Sparkles,
  Home,
  Globe,
  Bell,
  BrainCircuit,
  Zap,
  QrCode
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const { logout, setShowStaffModal } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed top-0 left-0 z-20">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
          <div className="bg-white rounded-lg p-1 flex items-center justify-center h-12 w-14 shrink-0 shadow-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Hotel Sherpa Soul Logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold tracking-tight text-white truncate">
              Hotel Sherpa Soul
            </h1>
            <p className="text-[11px] text-amber-400 font-semibold font-mono">PAN: 119205419</p>
            <p className="text-[10px] text-slate-400 truncate">Thamel, Kathmandu</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg text-slate-100 hover:text-white transition-colors">
          <LayoutDashboard size={18} />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>

        <Link href="/front-desk" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <CalendarDays size={18} />
          <span className="text-sm font-medium">Front Desk & Check-in</span>
        </Link>

        <Link href="/self-checkin" target="_blank" className="flex items-center gap-3 px-3 py-2 rounded-lg text-amber-300 hover:bg-slate-800 hover:text-white transition-colors">
          <QrCode size={18} />
          <span className="text-sm font-medium">Guest QR Self Check-In</span>
        </Link>

        <Link href="/reservations" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <CalendarDays size={18} />
          <span className="text-sm font-medium">Calendar & Bookings</span>
        </Link>

        <Link href="/rooms" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <BedDouble size={18} />
          <span className="text-sm font-medium">Rooms & Inventory</span>
        </Link>

        <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          OTA & Channels
        </div>

        <Link href="/channel-manager" className="flex items-center gap-3 px-3 py-2 rounded-lg text-blue-300 hover:bg-slate-800 hover:text-white transition-colors">
          <Globe size={18} />
          <span className="text-sm font-medium">Channel Manager Sync</span>
        </Link>

        <Link href="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="text-sm font-medium">Alerts & WhatsApp</span>
        </Link>

        <Link href="/automation" className="flex items-center gap-3 px-3 py-2 rounded-lg text-amber-300 hover:bg-slate-800 hover:text-white transition-colors">
          <Zap size={18} />
          <span className="text-sm font-medium">Automations & Webhooks</span>
        </Link>

        <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Specialty Operations
        </div>

        <Link href="/long-stay" className="flex items-center gap-3 px-3 py-2 rounded-lg text-purple-300 hover:bg-slate-800 hover:text-white transition-colors">
          <Home size={18} />
          <span className="text-sm font-medium">Long Stay Management</span>
        </Link>

        <Link href="/kitchen" className="flex items-center gap-3 px-3 py-2 rounded-lg text-amber-300 hover:bg-slate-800 hover:text-white transition-colors">
          <ChefHat size={18} />
          <span className="text-sm font-medium">Shared Kitchen</span>
        </Link>

        <Link href="/housekeeping" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <Sparkles size={18} />
          <span className="text-sm font-medium">Housekeeping</span>
        </Link>

        <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Intelligence & Finance
        </div>

        <Link href="/reports" className="flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-300 hover:bg-slate-800 hover:text-white transition-colors">
          <BrainCircuit size={18} />
          <span className="text-sm font-medium">Reports & AI Forecast</span>
        </Link>

        <Link href="/guests" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <Users size={18} />
          <span className="text-sm font-medium">Guests & CRM</span>
        </Link>

        <Link href="/billing" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <FileText size={18} />
          <span className="text-sm font-medium">Billing & Invoices</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <button 
          onClick={() => setShowStaffModal(true)}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Staff PINs & Shift</span>
        </button>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

