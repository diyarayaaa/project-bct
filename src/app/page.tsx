'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Truck,
  Boxes,
  PlusCircle,
  Search,
  MessageSquare,
  Printer,
  RefreshCw,
  ChevronRight,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  PackagePlus,
  CalendarCheck,
  ShieldCheck,
  CheckCheck,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge, ServiceTypeBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CustomerReceiptModal } from '@/components/prints/CustomerReceiptModal';
import { ShippingLabelModal } from '@/components/prints/ShippingLabelModal';
import { Ticket, DashboardStats } from '@/types';
import { formatDateIndo } from '@/lib/whatsapp-formatter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/components/theme/ThemeProvider';

type FilterTab =
  | 'all'
  | 'masuk_hari_ini'
  | 'service_on_progress'
  | 'barang_di_vendor'
  | 'garansi_minggu_ini'
  | 'garansi_belum_dikirim'
  | 'barang_belum_diambil'
  | 'garansi_selesai'
  | 'service_selesai'
  | 'on_progress'
  | 'waiting_vendor'
  | 'ready_pickup'
  | 'internal_stock';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isSidebarPinned } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    barangMasukHariIni: 0,
    serviceOnProgress: 0,
    barangDiVendor: 0,
    garansiMasukMingguIni: 0,
    garansiBelumDikirim: 0,
    barangBelumDiambil: 0,
    garansiSelesai: 0,
    serviceSelesai: 0,
    totalTiket: 0
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Selection state for Bulk Delete
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  // Modals state
  const [selectedReceiptTicket, setSelectedReceiptTicket] = useState<Ticket | null>(null);
  const [selectedLabelTicket, setSelectedLabelTicket] = useState<Ticket | null>(null);

  // Detect scroll position to show sticky slim status strip
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = (e.target as HTMLElement) || document.documentElement;
      const top = target.scrollTop || window.scrollY || 0;
      setIsScrolled(top > 120);
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('scroll', handleScroll as any, { passive: true });

    const scroller = document.querySelector('.overflow-x-hidden');
    if (scroller) {
      scroller.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('scroll', handleScroll as any);
      if (scroller) {
        scroller.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Fetch Tickets based on tab & search
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('tab', activeTab);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('sortBy', 'nomor_layanan');
      params.append('order', sortOrder);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (!data.error) setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, sortOrder]);

  const sortedTickets = React.useMemo(() => {
    return [...tickets].sort((a, b) => {
      return sortOrder === 'desc'
        ? b.nomor_layanan.localeCompare(a.nomor_layanan)
        : a.nomor_layanan.localeCompare(b.nomor_layanan);
    });
  }, [tickets, sortOrder]);

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, [fetchStats, fetchTickets]);

  // Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === tickets.length && tickets.length > 0) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(tickets.map((t) => t.id));
    }
  };

  const handleToggleSelectTicket = (id: string) => {
    if (selectedTicketIds.includes(id)) {
      setSelectedTicketIds(selectedTicketIds.filter((tId) => tId !== id));
    } else {
      setSelectedTicketIds([...selectedTicketIds, id]);
    }
  };

  const handleExecuteBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return;

    setIsDeletingBulk(true);
    setBulkDeleteError('');

    try {
      const activeActor = user?.nama_lengkap || localStorage.getItem('bct_current_user') || 'Admin Kasir';
      const res = await fetch('/api/tickets/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedTicketIds,
          actor: activeActor
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus tiket');
      }

      setIsBulkDeleteModalOpen(false);
      setSelectedTicketIds([]);
      fetchStats();
      fetchTickets();
    } catch (err) {
      setBulkDeleteError((err as Error).message);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const isAllSelected = tickets.length > 0 && selectedTicketIds.length === tickets.length;
  const isPartiallySelected = selectedTicketIds.length > 0 && !isAllSelected;

  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-16">
      {/* Dashboard Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard Layanan & Antrean
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            title={sortOrder === 'desc' ? 'Urutan: Nomor Terbaru ke Terlama (Klik untuk balik)' : 'Urutan: Nomor Terlama ke Terbaru (Klik untuk balik)'}
          >
            {sortOrder === 'desc' ? (
              <>
                <ArrowDownWideNarrow className="w-4 h-4 text-orange-500" />
                <span>Terbaru ⬇</span>
              </>
            ) : (
              <>
                <ArrowUpNarrowWide className="w-4 h-4 text-orange-500" />
                <span>Terlama ⬆</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              fetchStats();
              fetchTickets();
            }}
            className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20 rounded-xl transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Penerimaan Tiket</span>
          </Link>
        </div>
      </div>

      {/* 8 KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. BARANG MASUK HARI INI */}
        <MetricCard
          title="Barang Masuk Hari Ini"
          value={stats.barangMasukHariIni}
          subtitle="Service & Garansi Hari Ini"
          icon={PackagePlus}
          colorScheme="sky"
          onClick={() => setActiveTab(activeTab === 'masuk_hari_ini' ? 'all' : 'masuk_hari_ini')}
          isActive={activeTab === 'masuk_hari_ini'}
        />

        {/* 2. SERVICE ON PROGRES */}
        <MetricCard
          title="Service On Progres"
          value={stats.serviceOnProgress}
          subtitle="Proses & Pending Service"
          icon={Wrench}
          colorScheme="amber"
          onClick={() => setActiveTab(activeTab === 'service_on_progress' ? 'all' : 'service_on_progress')}
          isActive={activeTab === 'service_on_progress' || activeTab === 'on_progress'}
        />

        {/* 3. BARANG DI VENDOR */}
        <MetricCard
          title="Barang di Vendor"
          value={stats.barangDiVendor}
          subtitle="Proses Garansi & Alih Servis"
          icon={Truck}
          colorScheme="purple"
          onClick={() => setActiveTab(activeTab === 'barang_di_vendor' ? 'all' : 'barang_di_vendor')}
          isActive={activeTab === 'barang_di_vendor' || activeTab === 'waiting_vendor'}
        />

        {/* 4. GARANSI MASUK MINGGU INI */}
        <MetricCard
          title="Garansi Masuk Minggu Ini"
          value={stats.garansiMasukMingguIni}
          subtitle="Klaim Masuk Pekan Ini"
          icon={CalendarCheck}
          colorScheme="indigo"
          onClick={() => setActiveTab(activeTab === 'garansi_minggu_ini' ? 'all' : 'garansi_minggu_ini')}
          isActive={activeTab === 'garansi_minggu_ini'}
        />

        {/* 5. GARANSI BELUM DIKIRIM */}
        <MetricCard
          title="Garansi Belum Dikirim"
          value={stats.garansiBelumDikirim}
          subtitle="Menunggu Surat Jalan"
          icon={Clock}
          colorScheme="rose"
          onClick={() => setActiveTab(activeTab === 'garansi_belum_dikirim' ? 'all' : 'garansi_belum_dikirim')}
          isActive={activeTab === 'garansi_belum_dikirim'}
        />

        {/* 6. BARANG BELUM DIAMBIL */}
        <MetricCard
          title="Barang Belum Diambil"
          value={stats.barangBelumDiambil}
          subtitle="Selesai Nunggu Pelanggan"
          icon={AlertCircle}
          colorScheme="emerald"
          onClick={() => setActiveTab(activeTab === 'barang_belum_diambil' ? 'all' : 'barang_belum_diambil')}
          isActive={activeTab === 'barang_belum_diambil' || activeTab === 'ready_pickup'}
        />

        {/* 7. GARANSI SELESAI */}
        <MetricCard
          title="Garansi Selesai"
          value={stats.garansiSelesai}
          subtitle="Selesai & Diambil Cust"
          icon={ShieldCheck}
          colorScheme="teal"
          onClick={() => setActiveTab(activeTab === 'garansi_selesai' ? 'all' : 'garansi_selesai')}
          isActive={activeTab === 'garansi_selesai'}
        />

        {/* 8. SERVICE SELESAI */}
        <MetricCard
          title="Service Selesai"
          value={stats.serviceSelesai}
          subtitle="Selesai & Diambil Cust"
          icon={CheckCheck}
          colorScheme="blue"
          onClick={() => setActiveTab(activeTab === 'service_selesai' ? 'all' : 'service_selesai')}
          isActive={activeTab === 'service_selesai'}
        />
      </div>

      {/* Sticky Compact Status Bar (Menipis & Melayang saat di-scroll) */}
      <div
        className={`sticky top-[71px] sm:top-[83px] z-20 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-y border-slate-200/90 dark:border-slate-800 shadow-xs transition-all duration-200 ${
          isScrolled ? 'block animate-in fade-in slide-in-from-top-1 duration-150' : 'hidden'
        }`}
      >
        <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Compact Title */}
          <button
            type="button"
            onClick={() => {
              const scroller = document.querySelector('.overflow-x-hidden') || window;
              scroller.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:flex items-center gap-1.5 text-left shrink-0 group cursor-pointer"
            title="Klik untuk kembali ke atas"
          >
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight group-hover:text-orange-600 transition-colors">
              Antrean
            </span>
          </button>

          {/* Center: Slim Metric Pills for all 8 categories */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {/* 1. Masuk Hari Ini */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'masuk_hari_ini' ? 'all' : 'masuk_hari_ini')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'masuk_hari_ini'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 hover:bg-sky-100'
              }`}
              title="Barang Masuk Hari Ini"
            >
              <PackagePlus className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Masuk Hari Ini:</span>
              <span className="font-extrabold">{stats.barangMasukHariIni}</span>
            </button>

            {/* 2. Service On Progres */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'service_on_progress' ? 'all' : 'service_on_progress')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'service_on_progress' || activeTab === 'on_progress'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100'
              }`}
              title="Service On Progres"
            >
              <Wrench className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Servis Progres:</span>
              <span className="font-extrabold">{stats.serviceOnProgress}</span>
            </button>

            {/* 3. Barang di Vendor */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'barang_di_vendor' ? 'all' : 'barang_di_vendor')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'barang_di_vendor' || activeTab === 'waiting_vendor'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 hover:bg-purple-100'
              }`}
              title="Barang di Vendor"
            >
              <Truck className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Di Vendor:</span>
              <span className="font-extrabold">{stats.barangDiVendor}</span>
            </button>

            {/* 4. Garansi Masuk Minggu Ini */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'garansi_minggu_ini' ? 'all' : 'garansi_minggu_ini')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'garansi_minggu_ini'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100'
              }`}
              title="Garansi Masuk Minggu Ini"
            >
              <CalendarCheck className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Garansi Minggu Ini:</span>
              <span className="font-extrabold">{stats.garansiMasukMingguIni}</span>
            </button>

            {/* 5. Garansi Belum Dikirim */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'garansi_belum_dikirim' ? 'all' : 'garansi_belum_dikirim')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'garansi_belum_dikirim'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 hover:bg-rose-100'
              }`}
              title="Garansi Belum Dikirim"
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Belum Kirim:</span>
              <span className="font-extrabold">{stats.garansiBelumDikirim}</span>
            </button>

            {/* 6. Barang Belum Diambil */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'barang_belum_diambil' ? 'all' : 'barang_belum_diambil')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'barang_belum_diambil' || activeTab === 'ready_pickup'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100'
              }`}
              title="Barang Belum Diambil"
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Belum Diambil:</span>
              <span className="font-extrabold">{stats.barangBelumDiambil}</span>
            </button>

            {/* 7. Garansi Selesai */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'garansi_selesai' ? 'all' : 'garansi_selesai')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'garansi_selesai'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 hover:bg-teal-100'
              }`}
              title="Garansi Selesai"
            >
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Garansi Selesai:</span>
              <span className="font-extrabold">{stats.garansiSelesai}</span>
            </button>

            {/* 8. Service Selesai */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'service_selesai' ? 'all' : 'service_selesai')}
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'service_selesai'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 hover:bg-blue-100'
              }`}
              title="Service Selesai"
            >
              <CheckCheck className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Servis Selesai:</span>
              <span className="font-extrabold">{stats.serviceSelesai}</span>
            </button>
          </div>

          {/* Right: Compact Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                fetchStats();
                fetchTickets();
              }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <Link
              href="/tickets/new"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-xs rounded-lg transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Penerimaan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedTicketIds.length > 0 && (
        <div className="p-3 sm:p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center">
              {selectedTicketIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              {selectedTicketIds.length} Tiket Dipilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTicketIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Batal Pilihan
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedTicketIds.length} Tiket Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Active Queue Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Active Filter Indicator (Only shown when a KPI card filter is active) */}
        {activeTab !== 'all' && (
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Filter aktif: <strong className="text-slate-900 dark:text-white capitalize">{activeTab.replace(/_/g, ' ')}</strong> ({tickets.length} tiket)
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Tampilkan Semua Tiket
            </button>
          </div>
        )}

        {/* Table Content with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 sm:p-3.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    aria-label="Pilih Semua Tiket"
                  />
                </th>
                <th
                  onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Klik untuk mengurutkan No RMA"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>No RMA</span>
                    {sortOrder === 'desc' ? (
                      <ArrowDownWideNarrow className="w-3.5 h-3.5 text-orange-500" />
                    ) : (
                      <ArrowUpNarrowWide className="w-3.5 h-3.5 text-orange-500" />
                    )}
                  </div>
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Tanggal</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Customer</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Perangkat & SN</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Keluhan</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Teknisi</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Status</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Memuat antrean tiket...
                  </td>
                </tr>
              ) : sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada tiket di kategori ini</p>
                      <p className="text-xs text-slate-400">Silakan ubah filter pencarian atau buat tiket baru.</p>
                      <Link
                        href="/tickets/new"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-lg font-bold text-xs hover:bg-orange-100 dark:hover:bg-orange-900/50 mt-2"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Buat Tiket Baru
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTickets.map((t) => {
                  const isStock =
                    t.nama_customer.toUpperCase().includes('STOCK BCT') ||
                    t.nama_customer.toUpperCase().includes('GHITP');
                  const isChecked = selectedTicketIds.includes(t.id);

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group ${
                        isChecked ? 'bg-orange-50/50 dark:bg-orange-950/30' : ''
                      }`}
                    >
                      {/* Checkbox per baris */}
                      <td className="p-3 sm:p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectTicket(t.id)}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          aria-label={`Pilih tiket ${t.nomor_layanan}`}
                        />
                      </td>

                      {/* No RMA & Jenis */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <Link
                          href={`/tickets/${t.id}`}
                          className="text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          {t.nomor_layanan}
                        </Link>
                        <div className="mt-0.5">
                          <ServiceTypeBadge type={t.jenis_layanan} />
                        </div>
                      </td>

                      {/* Tanggal Masuk */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDateIndo(t.tanggal_masuk)}
                      </td>

                      {/* Customer */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span className="truncate max-w-[140px]">{t.nama_customer}</span>
                          {isStock && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold shrink-0">
                              STOK
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.no_hp}</div>
                      </td>

                      {/* Perangkat & SN */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 min-w-[130px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {t.nama_barang}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">SN: {t.serial_number}</div>
                      </td>

                      {/* Keluhan */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 max-w-[180px]">
                        <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300" title={t.keluhan}>
                          {t.keluhan}
                        </p>
                        {t.distributor_vendor && (
                          <span className="inline-block text-[9px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1 py-0.5 rounded mt-0.5 truncate max-w-[160px]">
                            {t.distributor_vendor}
                          </span>
                        )}
                      </td>

                      {/* Teknisi */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          {t.teknisi}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">
                        <StatusBadge status={t.status} size="sm" />
                      </td>

                      {/* Aksi Cepat */}
                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptTicket(t)}
                            title="Cetak Tanda Terima Servis"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {t.distributor_vendor && (
                            <button
                              type="button"
                              onClick={() => setSelectedLabelTicket(t)}
                              title="Cetak Label Vendor"
                              className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            href={`/whatsapp?tab=quick&ticket_id=${t.id}`}
                            title="WhatsApp"
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/tickets/${t.id}`}
                            title="Detail"
                            className="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Delete */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Konfirmasi Hapus Beberapa Tiket"
        subtitle={`Anda memilih ${selectedTicketIds.length} tiket untuk dihapus permanen`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {bulkDeleteError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{bulkDeleteError}</span>
            </div>
          )}

          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm space-y-1">
            <p className="font-bold">Peringatan: Tindakan ini tidak dapat dibatalkan!</p>
            <p className="text-slate-600 dark:text-slate-300 text-xs">
              Sebanyak <strong className="text-rose-600 dark:text-rose-400">{selectedTicketIds.length} tiket</strong> beserta riwayat detailnya akan dihapus dari sistem database.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              disabled={isDeletingBulk}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteBulkDelete}
              disabled={isDeletingBulk}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeletingBulk ? 'Menghapus...' : `Ya, Hapus ${selectedTicketIds.length} Tiket`}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Print Modals */}
      <CustomerReceiptModal
        isOpen={!!selectedReceiptTicket}
        onClose={() => setSelectedReceiptTicket(null)}
        ticket={selectedReceiptTicket}
      />

      {selectedLabelTicket && (
        <ShippingLabelModal
          isOpen={!!selectedLabelTicket}
          onClose={() => setSelectedLabelTicket(null)}
          vendorName={selectedLabelTicket.distributor_vendor || ''}
          noSuratJalan={selectedLabelTicket.no_surat_jalan || undefined}
          tickets={[selectedLabelTicket]}
        />
      )}
    </div>
  );
}
