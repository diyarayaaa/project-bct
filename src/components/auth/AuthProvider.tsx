'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Validate with API
      const res = await fetch('/api/auth/me');
      const text = await res.text();
      let data: { authenticated?: boolean; user?: User } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // ignore non-json
      }

      if (data.authenticated && data.user) {
        setUser(data.user);
        localStorage.setItem('bct_auth_user', JSON.stringify(data.user));
        localStorage.setItem('bct_current_user', data.user.nama_lengkap);
      } else {
        setUser(null);
        localStorage.removeItem('bct_auth_user');
        localStorage.removeItem('bct_current_user');
        if (pathname && pathname !== '/login') {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    } catch (err) {
      console.error('Failed to check auth session:', err);
      setUser(null);
      if (pathname && pathname !== '/login') {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (username: string, password: string, rememberMe = false) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
      });

      const text = await res.text();
      let data: { success?: boolean; error?: string; user?: User } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return { success: false, error: text ? text.slice(0, 200) : `Server error ${res.status}` };
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
      localStorage.removeItem('bct_current_user');
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout
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
