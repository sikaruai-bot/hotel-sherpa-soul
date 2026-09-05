"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, Mail, Lock, Clock, ShieldCheck, UserCircle, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { loginWithPin, loginWithCredentials, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'pin' | 'credentials'>('pin');
  const [pin, setPin] = useState<string>('');
  const [email, setEmail] = useState<string>('frontdesk@hotelsherpasoul.com');
  const [password, setPassword] = useState<string>('frontdesk123');
  const [shift, setShift] = useState<string>('Day Shift (2:00 PM - 10:00 PM)');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        // Auto submit when 4 digits entered
        handlePinSubmit(newPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handlePinSubmit = async (pinToSubmit?: string) => {
    const finalPin = pinToSubmit || pin;
    if (finalPin.length < 4) {
      setErrorMessage('Please enter a 4-digit PIN code.');
      return;
    }
    setErrorMessage('');
    const result = await loginWithPin(finalPin, shift);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid PIN. Try 1234 for Front Desk or 9999 for Manager.');
      setPin('');
    } else {
      setSuccessMessage('Welcome! Redirecting to Front Desk...');
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    setErrorMessage('');
    const result = await loginWithCredentials(email, password, shift);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials.');
    } else {
      setSuccessMessage('Welcome! Redirecting to Front Desk...');
    }
  };

  const handleQuickLogin = (demoRole: 'frontdesk' | 'manager') => {
    setErrorMessage('');
    if (demoRole === 'frontdesk') {
      setEmail('frontdesk@hotelsherpasoul.com');
      setPassword('frontdesk123');
      loginWithPin('1234', shift);
    } else {
      setEmail('manager@hotelsherpasoul.com');
      setPassword('manager123');
      loginWithPin('9999', shift);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6">
        {/* Hotel Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-56 h-14 mx-auto flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Hotel Sherpa Soul" className="max-h-14 w-auto object-contain" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 mt-2">
            Front Desk & Staff Portal
          </h1>
          <p className="text-xs text-slate-500">
            Hotel Sherpa Soul PMS • Thamel, Kathmandu
          </p>
        </div>

        {/* Shift Selection Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
            <Clock size={14} className="text-amber-600" /> Reception Shift (कार्य सिफ्ट):
          </label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
          >
            <option value="Morning Shift (6:00 AM - 2:00 PM)">Morning Shift (6:00 AM - 2:00 PM)</option>
            <option value="Day Shift (2:00 PM - 10:00 PM)">Day Shift (2:00 PM - 10:00 PM)</option>
            <option value="Night Shift (10:00 PM - 6:00 AM)">Night Shift (10:00 PM - 6:00 AM)</option>
          </select>
        </div>

        {/* Auth Mode Tabs: Quick PIN vs Email/Password */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pin');
              setErrorMessage('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'pin' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound size={15} /> Quick 4-Digit PIN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('credentials');
              setErrorMessage('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'credentials' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail size={15} /> Email & Password
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-shake">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: QUICK PIN MODE */}
        {activeTab === 'pin' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Enter your 4-digit staff PIN code</p>
              {/* PIN Display Dots */}
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center font-mono text-xl font-black transition-all ${
                      pin.length > index
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {pin[index] ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') setPin('');
                    else if (k === '⌫') handlePinBackspace();
                    else handlePinDigit(k);
                  }}
                  className={`h-12 rounded-xl font-bold text-base transition active:scale-95 shadow-xs ${
                    k === 'C' || k === '⌫'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm'
                      : 'bg-white hover:bg-indigo-50 text-slate-900 border border-slate-200'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isLoading || pin.length < 4}
              onClick={() => handlePinSubmit()}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In with PIN'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD MODE */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Staff Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="frontdesk@hotelsherpasoul.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In with Password'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Quick Demo Access Bar */}
        <div className="border-t border-slate-200/80 pt-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-amber-500" /> 1-Click Fast Reception Login
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('frontdesk')}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-left transition"
            >
              <p className="font-bold">Front Desk</p>
              <p className="text-[10px] text-slate-500">PIN: 1234 • Reception</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('manager')}
              className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-left transition"
            >
              <p className="font-bold">Manager</p>
              <p className="text-[10px] text-slate-500">PIN: 9999 • Full Admin</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
