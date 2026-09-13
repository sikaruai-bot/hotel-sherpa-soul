"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarDays, 
  FileText, 
  MessageSquare, 
  Users, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Hotel
} from 'lucide-react';
import { SessionUser } from '@/lib/auth';

interface Props {
  user: SessionUser;
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Overview Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Rooms & Inventory (6)', href: '/admin/rooms', icon: BedDouble },
    { label: 'Direct Bookings', href: '/admin/bookings', icon: CalendarDays },
    { label: 'CMS & Website Content', href: '/admin/cms', icon: FileText },
    { label: 'Guest Inquiries', href: '/admin/inquiries', icon: MessageSquare },
    { label: 'PMS Operations', href: '/admin/pms/front-desk', icon: Hotel },
  ];

  if (user.role === 'OWNER') {
    navItems.push({ label: 'User Permissions', href: '/admin/users', icon: Users });
  }

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-24 bg-white rounded-lg p-1 shadow-sm">
            <Image src="/images/logo.png" alt="Hotel Sherpa Soul" fill className="object-contain" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white leading-tight">Admin Portal</h2>
            <span className="text-[10px] text-amber-400 font-medium">6 Rooms + PMS</span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="truncate">
          <span className="text-xs font-bold text-white block truncate">{user.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{user.role}</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>View Public Site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed top-0 bottom-0 left-0 w-64 z-30">
        {content}
      </aside>

      {/* Mobile Bar & Drawer */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 rounded-lg hover:bg-slate-800"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-sm">Hotel Sherpa Soul CMS</span>
        </div>
        <Link href="/" target="_blank" className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
          <span>Website</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-slate-900" onClick={e => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
