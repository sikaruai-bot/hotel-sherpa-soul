"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  QrCode,
  ShieldAlert,
  MessageSquare,
  Sliders
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { logout, setShowStaffModal } = useAuth();
  const pathname = usePathname();

  const getLinkClass = (path: string, specialColor?: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return 'flex items-center justify-between px-3 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/30 transition-all';
    }
    return `flex items-center justify-between px-3 py-2 rounded-lg ${
      specialColor || 'text-slate-400'
    } hover:bg-slate-800 hover:text-white transition-colors`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside className={`w-64 bg-slate-900 text-white flex flex-col h-screen fixed top-0 left-0 z-40 lg:z-20 transition-transform duration-200 ease-in-out ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}>
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
        <Link href="/" className={getLinkClass('/')}>
          <div className="flex items-center gap-3">
            <LayoutDashboard size={18} />
            <span className="text-sm">Dashboard</span>
          </div>
        </Link>

        <Link href="/front-desk" className={getLinkClass('/front-desk')}>
          <div className="flex items-center gap-3">
            <CalendarDays size={18} />
            <span className="text-sm">Front Desk & Check-in</span>
          </div>
        </Link>

        <Link href="/self-checkin" target="_blank" className={getLinkClass('/self-checkin', 'text-amber-300')}>
          <div className="flex items-center gap-3">
            <QrCode size={18} />
            <span className="text-sm">Guest QR Self Check-In</span>
          </div>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">QR</span>
        </Link>

        <Link href="/reservations" className={getLinkClass('/reservations')}>
          <div className="flex items-center gap-3">
            <CalendarDays size={18} className={pathname === '/reservations' ? 'text-white' : 'text-blue-400'} />
            <span className="text-sm font-semibold">Calendar & Bookings</span>
          </div>
          {pathname !== '/reservations' && (
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">Live</span>
          )}
        </Link>

        <Link href="/rooms" className={getLinkClass('/rooms')}>
          <div className="flex items-center gap-3">
            <BedDouble size={18} />
            <span className="text-sm">Rooms & Inventory</span>
          </div>
        </Link>

        <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          OTA & Channels
        </div>

        <Link href="/admin/exceptions" className={getLinkClass('/admin/exceptions', 'text-rose-400')}>
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="text-rose-400" />
            <span className="text-sm font-semibold">Exceptions & Conflicts</span>
          </div>
          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">Alert</span>
        </Link>

        <Link href="/admin/inbox" className={getLinkClass('/admin/inbox', 'text-emerald-300')}>
          <div className="flex items-center gap-3">
            <MessageSquare size={18} className="text-emerald-400" />
            <span className="text-sm font-medium">Unified Inbox</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">Live</span>
        </Link>

        <Link href="/admin/automation-settings" className={getLinkClass('/admin/automation-settings', 'text-slate-300')}>
          <div className="flex items-center gap-3">
            <Sliders size={18} />
            <span className="text-sm font-medium">Automation Rules</span>
          </div>
        </Link>

        <Link href="/channel-manager" className={getLinkClass('/channel-manager', 'text-blue-300')}>
          <div className="flex items-center gap-3">
            <Globe size={18} />
            <span className="text-sm font-medium">Channel Manager Sync</span>
          </div>
        </Link>

        <Link href="/notifications" className={getLinkClass('/notifications')}>
          <div className="flex items-center gap-3">
            <Bell size={18} />
            <span className="text-sm font-medium">Alerts & Logs</span>
          </div>
        </Link>

        <Link href="/automation" className={getLinkClass('/automation', 'text-amber-300')}>
          <div className="flex items-center gap-3">
            <Zap size={18} />
            <span className="text-sm font-medium">Webhooks Hub</span>
          </div>
        </Link>

        <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Specialty Operations
        </div>

        <Link href="/long-stay" className={getLinkClass('/long-stay', 'text-purple-300')}>
          <div className="flex items-center gap-3">
            <Home size={18} />
            <span className="text-sm font-medium">Long Stay Management</span>
          </div>
        </Link>

        <Link href="/kitchen" className={getLinkClass('/kitchen', 'text-amber-300')}>
          <div className="flex items-center gap-3">
            <ChefHat size={18} />
            <span className="text-sm font-medium">Shared Kitchen</span>
          </div>
        </Link>

        <Link href="/housekeeping" className={getLinkClass('/housekeeping')}>
          <div className="flex items-center gap-3">
            <Sparkles size={18} />
            <span className="text-sm font-medium">Housekeeping</span>
          </div>
        </Link>

        <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Intelligence & Finance
        </div>

        <Link href="/reports" className={getLinkClass('/reports', 'text-emerald-300')}>
          <div className="flex items-center gap-3">
            <BrainCircuit size={18} />
            <span className="text-sm font-medium">Reports & AI Forecast</span>
          </div>
        </Link>

        <Link href="/guests" className={getLinkClass('/guests')}>
          <div className="flex items-center gap-3">
            <Users size={18} />
            <span className="text-sm font-medium">Guests & CRM</span>
          </div>
        </Link>

        <Link href="/billing" className={getLinkClass('/billing')}>
          <div className="flex items-center gap-3">
            <FileText size={18} />
            <span className="text-sm font-medium">Billing & Invoices</span>
          </div>
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
  </>
  );
}

