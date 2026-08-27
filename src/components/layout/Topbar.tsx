'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  MessageSquare,
  Truck,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    toggleMobileSidebar,
    isSidebarCollapsed,
    toggleSidebarCollapse
  } = useTheme();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // If on login page, don't show topbar
  if (pathname === '/login') return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tickets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="topbar-container bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 shadow-xs transition-colors duration-200">
      {/* Left: Mobile Hamburger & Desktop Sidebar Collapse Toggle */}
      <div className="flex items-center gap-2">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          aria-label="Buka Menu Samping"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          title={isSidebarCollapsed ? 'Lebarkan Menu Samping' : 'Kecilkan / Sembunyikan Menu Samping'}
          aria-label="Toggle Sidebar Collapse"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-orange-500" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        <Link
          href="/"
          className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1"
        >
          <span>BCT</span>
          <span className="text-[10px] px-1 py-0.2 bg-orange-500 text-white rounded font-bold">RMA</span>
        </Link>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs sm:max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari RMA, Customer, SN..."
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-hidden transition-all placeholder:text-slate-400"
          />
        </div>
      </form>

      {/* Right Actions: Theme Toggle, WhatsApp, Surat Jalan, New Ticket, User & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Toggle (Terang / Gelap / Auto) */}
        <ThemeToggle />

        <Link
          href="/whatsapp"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden lg:inline">WhatsApp</span>
        </Link>

        <Link
          href="/surat-jalan"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
        >
          <Truck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span className="hidden lg:inline">Surat Jalan</span>
        </Link>

        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20 rounded-xl transition-all whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Buat Tiket</span>
          <span className="sm:hidden">Tiket</span>
        </Link>

        {/* User Pill / Logout on Mobile/Desktop */}
        {user && (
          <div className="flex items-center gap-1.5 pl-1">
            <button
              type="button"
              onClick={() => logout()}
              title={`Keluar dari ${user.nama_lengkap}`}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
