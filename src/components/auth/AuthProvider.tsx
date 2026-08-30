'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    try {
      // 1. Check localStorage first for instant client response
      const savedUserStr = localStorage.getItem('bct_auth_user');
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          setUser(parsed);
        } catch {
          // ignore
        }
      }

      // 2. Validate with API
      const res = await fetch('/api/auth/me');
      const text = await res.text();
      let data: { authenticated?: boolean; user?: User } = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* ignore non-json */ }

      if (data.authenticated && data.user) {
        setUser(data.user);
        localStorage.setItem('bct_auth_user', JSON.stringify(data.user));
        localStorage.setItem('bct_current_user', data.user.nama_lengkap);
      } else if (!savedUserStr) {
        setUser(null);
        localStorage.removeItem('bct_auth_user');
      }
    } catch (err) {
      console.error('Failed to check auth session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === '/login';

    if (!user && !isLoginPage) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user && isLoginPage) {
      router.push('/');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password = 'bct123') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const text = await res.text();
      let data: { success?: boolean; error?: string; user?: User } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return { success: false, error: text ? text.slice(0, 200) : `Server error ${res.status}: respon kosong (cek log Vercel)` };
      }

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || `Login gagal (${res.status})` };
      }

      setUser(data.user!);
      localStorage.setItem('bct_auth_user', JSON.stringify(data.user));
      localStorage.setItem('bct_current_user', data.user!.nama_lengkap);

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem('bct_auth_user');
      router.push('/login');
    }
  };

  const switchUser = async (username: string) => {
    const res = await login(username, 'bct123');
    if (res.success) {
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        switchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
