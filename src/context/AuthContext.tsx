"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPING' | 'ACCOUNTANT';
  shift?: string; // Morning, Day, Evening, Night
}

interface AuthContextType {
  currentUser: StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPin: (pin: string, shift?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (email: string, password: string, shift?: string) => Promise<{ success: boolean; error?: string }>;
  switchShift: (newShift: string) => void;
  logout: () => Promise<void>;
  showStaffModal: boolean;
  setShowStaffModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default guest/staff for instant initial preview if not yet logged in
const DEFAULT_FRONTDESK_USER: StaffUser = {
  id: 'default-frontdesk',
  name: 'Pasang Sherpa (Reception Desk)',
  email: 'frontdesk@hotelsherpasoul.com',
  role: 'RECEPTIONIST',
  shift: 'Day Shift',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Initial Load: Check localStorage and /api/auth/me
  useEffect(() => {
    try {
      const cached = localStorage.getItem('hss_pms_user');
      if (cached) {
        setCurrentUser(JSON.parse(cached));
      } else {
        // By default on first launch, auto-load Front Desk user so app is never blocked
        setCurrentUser(DEFAULT_FRONTDESK_USER);
        localStorage.setItem('hss_pms_user', JSON.stringify(DEFAULT_FRONTDESK_USER));
      }
    } catch {
      setCurrentUser(DEFAULT_FRONTDESK_USER);
    }

    // Verify session in background
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && json.data) {
          setCurrentUser(json.data);
          localStorage.setItem('hss_pms_user', JSON.stringify(json.data));
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const loginWithPin = async (pin: string, shift = 'Morning Shift') => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, shift }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid PIN' };
      }

      setCurrentUser(data.data);
      localStorage.setItem('hss_pms_user', JSON.stringify(data.data));
      router.push('/front-desk');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (email: string, password: string, shift = 'Morning Shift') => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, shift }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      setCurrentUser(data.data);
      localStorage.setItem('hss_pms_user', JSON.stringify(data.data));
      router.push('/front-desk');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const switchShift = (newShift: string) => {
    if (currentUser) {
      const updated = { ...currentUser, shift: newShift };
      setCurrentUser(updated);
      localStorage.setItem('hss_pms_user', JSON.stringify(updated));
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setCurrentUser(null);
    localStorage.removeItem('hss_pms_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        loginWithPin,
        loginWithCredentials,
        switchShift,
        logout,
        showStaffModal,
        setShowStaffModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
