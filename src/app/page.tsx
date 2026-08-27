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
  AlertCircle
} from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge, ServiceTypeBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CustomerReceiptModal } from '@/components/prints/CustomerReceiptModal';
import { ShippingLabelModal } from '@/components/prints/ShippingLabelModal';
import { Ticket, DashboardStats } from '@/types';
import { formatDateIndo } from '@/lib/whatsapp-formatter';
import { useAuth } from '@/components/auth/AuthProvider';

type FilterTab = 'all' | 'on_progress' | 'waiting_vendor' | 'ready_pickup' | 'internal_stock';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalServiceAktif: 0,
    pendingService: 0,
    barangBelumDiambil: 0,
    garansiDiVendor: 0,
    stokTokoReady: 0,
    totalTiket: 0,
    serviceSelesaiBulanIni: 0
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selection state for Bulk Delete
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  // Modals state
  const [selectedReceiptTicket, setSelectedReceiptTicket] = useState<Ticket | null>(null);
  const [selectedLabelTicket, setSelectedLabelTicket] = useState<Ticket | null>(null);

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

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (!data.error) setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16">
      {/* Dashboard Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard Layanan & Antrean
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoring pengerjaan servis reguler, alur garansi distributor BDG/JKT & stok toko.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              fetchStats();
              fetchTickets();
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
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

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          title="Total Service Aktif"
          value={stats.totalServiceAktif}
          subtitle="Unit sedang diservis"
          icon={Wrench}
          colorScheme="blue"
          onClick={() => setActiveTab('on_progress')}
          isActive={activeTab === 'on_progress'}
        />
        <MetricCard
          title="Pending Service"
          value={stats.pendingService}
          subtitle="Menunggu konfirmasi"
          icon={Clock}
          colorScheme="amber"
          onClick={() => setActiveTab('all')}
        />
        <MetricCard
          title="Siap Diambil"
          value={stats.barangBelumDiambil}
          subtitle="Selesai & siap ambil"
          icon={CheckCircle2}
          colorScheme="emerald"
          onClick={() => setActiveTab('ready_pickup')}
          isActive={activeTab === 'ready_pickup'}
        />
        <MetricCard
          title="Garansi di Vendor"
          value={stats.garansiDiVendor}
          subtitle="Di BDG / JKT"
          icon={Truck}
          colorScheme="purple"
          onClick={() => setActiveTab('waiting_vendor')}
          isActive={activeTab === 'waiting_vendor'}
        />
        <div className="col-span-2 lg:col-span-1">
          <MetricCard
            title="Stok Toko Ready"
            value={stats.stokTokoReady}
            subtitle="STOCK BCT / GHITP"
            icon={Boxes}
            colorScheme="orange"
            onClick={() => setActiveTab('internal_stock')}
            isActive={activeTab === 'internal_stock'}
          />
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
        {/* Table Filter Tabs & Search Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { key: 'all', label: 'Semua Tiket' },
              { key: 'on_progress', label: 'Service On Progress' },
              { key: 'waiting_vendor', label: 'Menunggu Vendor' },
              { key: 'ready_pickup', label: 'Siap Ambil' },
              { key: 'internal_stock', label: 'Stok Toko' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as FilterTab)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-slate-900 dark:bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari RMA, Customer, SN..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500 focus:outline-hidden"
            />
          </div>
        </div>

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
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">No RMA</th>
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
              ) : tickets.length === 0 ? (
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
                tickets.map((t) => {
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
