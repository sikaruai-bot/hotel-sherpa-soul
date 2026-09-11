"use client";

import React, { useState } from 'react';
import { Bell, Search, UserCircle, LogOut, Clock, Users, ChevronDown, ShieldCheck, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StaffManagementModal from './StaffManagementModal';

export default function Header({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const { currentUser, logout, switchShift, setShowStaffModal } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <header className="h-16 border-b bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {onToggleMobileMenu && (
            <button 
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 w-full">
            <Search size={18} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search guests, rooms, reservations..."
              className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile & Shift Controls */}
          <div className="relative border-l pl-4">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition text-left"
            >
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    {currentUser?.name || 'Pasang Sherpa'}
                  </p>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-indigo-200">
                    {currentUser?.role === 'RECEPTIONIST' ? 'Front Desk' : currentUser?.role || 'Staff'}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] text-amber-700 font-medium mt-1">
                  <Clock size={11} />
                  <span>{currentUser?.shift || 'Day Shift'}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {currentUser?.name ? currentUser.name[0] : 'P'}
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-in text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{currentUser?.name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{currentUser?.email}</p>
                </div>

                {/* Quick Shift Switcher */}
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Switch Reception Shift
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {['Morning', 'Day', 'Night'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          switchShift(`${s} Shift`);
                          setShowDropdown(false);
                        }}
                        className={`py-1 rounded text-[11px] font-bold transition ${
                          currentUser?.shift?.includes(s)
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Staff Management (Manager / Admin / Reception) */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setShowStaffModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                  >
                    <Users size={15} className="text-indigo-600" />
                    <span>Manage Staff & PINs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
                  >
                    <LogOut size={15} />
                    <span>Handover Shift & Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Staff Management Modal */}
      <StaffManagementModal />
    </>
  );
}
