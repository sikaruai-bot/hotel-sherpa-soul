"use client";

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, KeyRound, Mail, X, Check, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function StaffManagementModal() {
  const { showStaffModal, setShowStaffModal } = useAuth();

  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RECEPTIONIST');
  const [pinCode, setPinCode] = useState('1234');
  const [password, setPassword] = useState('frontdesk123');
  const [shift, setShift] = useState('Morning');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/users');
      const json = await res.json();
      if (json.success && json.data) {
        setStaffList(json.data);
      }
    } catch {
      // Ignore fetch error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showStaffModal) {
      fetchStaff();
    }
  }, [showStaffModal]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setErrorMessage('Name and Email are required.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setMessage('');
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, pinCode, password, shift }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add staff member.');
      }

      setMessage(`Staff member ${name} added with PIN: ${pinCode}!`);
      setName('');
      setEmail('');
      setShowAddForm(false);
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error adding staff member.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showStaffModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 sm:p-8 animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Front Desk & Staff Management</h2>
              <p className="text-xs text-slate-500">Manage receptionist accounts, shifts, and 4-digit PIN access</p>
            </div>
          </div>
          <button
            onClick={() => setShowStaffModal(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check size={16} /> <span>{message}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle size={16} /> <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button: Add New Staff */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <UserPlus size={15} /> {showAddForm ? 'Hide Form' : 'Add Front Desk Staff'}
          </button>

          <button
            onClick={fetchStaff}
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>

        {/* Add Staff Form (Collapsible) */}
        {showAddForm && (
          <form onSubmit={handleAddStaff} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">New Staff Registration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dawa Sherpa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. dawa@hotelsherpasoul.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="RECEPTIONIST">RECEPTIONIST (Front Desk)</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="HOUSEKEEPING">HOUSEKEEPING</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">4-Digit Quick PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Default Shift</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
              >
                Save Staff Account
              </button>
            </div>
          </form>
        )}

        {/* Staff Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] sticky top-0">
              <tr>
                <th className="p-3">Staff Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Quick PIN</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {staffList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </td>
                  <td className="p-3">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800 tracking-wider">
                    {user.pinCode || '----'}
                  </td>
                  <td className="p-3 text-slate-600">{user.shift || 'General'}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
