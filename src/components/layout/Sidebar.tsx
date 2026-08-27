'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Truck,
  MessageSquareShare,
  History,
  Database,
  Wrench,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/components/auth/AuthProvider';

const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Antrean Tiket', href: '/tickets', icon: ClipboardList },
  { name: 'Buat Tiket Baru', href: '/tickets/new', icon: PlusCircle },
  { name: 'Surat Jalan Vendor', href: '/surat-jalan', icon: Truck },
  { name: 'WhatsApp Hub', href: '/whatsapp', icon: MessageSquareShare },
  { name: 'Master Data', href: '/master', icon: Database },
  { name: 'Audit Log Trail', href: '/logs', icon: History }
];

const ALL_PROFILES = [
  { username: 'wandi', name: 'Wandi', role: 'Teknisi Utama', type: 'TEKNISI' },
  { username: 'satryo', name: 'Satryo', role: 'Teknisi Servis', type: 'TEKNISI' },
  { username: 'derida', name: 'Derida', role: 'Teknisi', type: 'TEKNISI' },
  { username: 'anzar', name: 'Anzar', role: 'Teknisi', type: 'TEKNISI' },
  { username: 'admin', name: 'Admin Kasir', role: 'Administrasi & Kasir', type: 'ADMIN' },
  { username: 'sales', name: 'Sales Toko', role: 'Stok BCT & GHITP', type: 'SALES' }
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse
  } = useTheme();
  const { user, logout, switchUser } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // If on login page, don't show sidebar
  if (pathname === '/login') return null;

  const currentUserName = user?.nama_lengkap || 'Wandi';
  const currentUserRole =
    user?.spesialisasi ||
    (user?.role === 'ADMIN'
      ? 'Administrasi & Logistik'
      : user?.role === 'SALES'
      ? 'Stok BCT & GHITP'
      : 'Teknisi Servis');

  const handleSelectUser = async (username: string) => {
    await switchUser(username);
    setIsRoleDropdownOpen(false);
  };

  const sidebarContent = (isMini: boolean) => (
    <div className="flex flex-col h-full bg-slate-900 dark:bg-slate-950 text-slate-300 select-none transition-all duration-300">
      {/* Brand Header */}
      <div
        className={`p-3.5 sm:p-4 border-b border-slate-800 dark:border-slate-800/80 flex items-center ${
          isMini ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          {!isMini && (
            <div className="min-w-0 truncate animate-in fade-in">
              <h1 className="font-bold text-white tracking-wide text-sm flex items-center gap-1.5 truncate">
                BEST COMPUTEL
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                  RMA
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium truncate">Service & Garansi System</p>
            </div>
          )}
        </div>

        {/* Toggle Collapse on Desktop / Close on Mobile */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
          {!isMini && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Sembunyikan / Kecilkan Menu Samping"
              aria-label="Kecilkan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expand Button when Mini */}
      {isMini && (
        <div className="hidden lg:flex justify-center py-2 border-b border-slate-800/60">
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="p-2 rounded-xl text-slate-400 hover:text-orange-400 hover:bg-slate-800/80 transition-colors"
            title="Buka / Lebarkan Menu Samping"
            aria-label="Lebarkan Sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className={`flex-1 py-3 px-2 space-y-1.5 overflow-y-auto ${isMini ? 'items-center' : ''}`}>
        {!isMini && (
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>
        )}
        {NAVIGATION.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileSidebarOpen(false)}
              title={isMini ? item.name : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isMini
                  ? 'justify-center p-3 w-12 h-12 mx-auto'
                  : 'gap-3 px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-orange-500 text-white font-semibold shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {!isMini && <span className="truncate">{item.name}</span>}

              {/* Floating Tooltip when Mini */}
              {isMini && (
                <span className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Active User Switcher & Logout */}
      <div className="p-2 sm:p-3 border-t border-slate-800 dark:border-slate-800/80 relative">
        {!isMini && (
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
            <span>Akun Aktif</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          title={isMini ? `${currentUserName} (${currentUserRole})` : undefined}
          className={`w-full flex items-center rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors text-left ${
            isMini ? 'justify-center p-2' : 'justify-between p-2.5'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUserName.charAt(0)}
            </div>
            {!isMini && (
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{currentUserName}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUserRole}</p>
              </div>
            )}
          </div>
          {!isMini && (
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                isRoleDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {/* Dropdown Menu */}
        {isRoleDropdownOpen && (
          <div
            className={`absolute bottom-16 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
              isMini ? 'left-16 w-56' : 'left-3 right-3'
            }`}
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-700/50 mb-1 flex items-center justify-between">
              <span>Ganti Pengguna</span>
            </div>
            {ALL_PROFILES.map((p) => (
              <button
                key={p.username}
                type="button"
                onClick={() => handleSelectUser(p.username)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                  user?.username === p.username || currentUserName === p.name
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[10px] opacity-75">{p.role}</div>
                </div>
                {(user?.username === p.username || currentUserName === p.name) && (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </button>
            ))}

            <div className="pt-1 mt-1 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors font-semibold text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible: w-20 in mini mode, w-64 in full mode) */}
      <aside
        className={`sidebar-container hidden lg:flex shrink-0 min-h-screen border-r border-slate-800 dark:border-slate-800/80 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent(isSidebarCollapsed)}
      </aside>

      {/* Mobile Drawer (Visible on < lg when open) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
