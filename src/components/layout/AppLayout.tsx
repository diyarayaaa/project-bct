'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/components/auth/AuthProvider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarPinned } = useTheme();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // If on login page, render full screen without dashboard chrome
  if (pathname === '/login') {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  // If checking authentication, show elegant loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Memuat sesi pengguna...</span>
      </div>
    );
  }

  // If unauthenticated on protected page, AuthProvider will redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden ${
          isSidebarPinned ? 'lg:pl-64' : 'lg:pl-16'
        }`}
      >
        <Topbar />
        <main className="flex-1 p-3 sm:p-5 lg:px-6 lg:py-5 bg-slate-50/70 dark:bg-slate-950 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
