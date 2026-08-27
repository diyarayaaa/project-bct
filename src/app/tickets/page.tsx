'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  RefreshCw,
  Printer,
  ChevronRight,
  MessageSquare,
  Truck,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { StatusBadge, ServiceTypeBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CustomerReceiptModal } from '@/components/prints/CustomerReceiptModal';
import { ShippingLabelModal } from '@/components/prints/ShippingLabelModal';
import { Ticket } from '@/types';
import { TEKNISI_LIST, STATUS_LIST } from '@/lib/constants';
import { formatDateIndo } from '@/lib/whatsapp-formatter';
import { useAuth } from '@/components/auth/AuthProvider';

function TicketsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTeknisi, setSelectedTeknisi] = useState('ALL');
  const [selectedJenis, setSelectedJenis] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Selection state for Bulk Actions
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  // Modals state
  const [selectedReceiptTicket, setSelectedReceiptTicket] = useState<Ticket | null>(null);
  const [selectedLabelTicket, setSelectedLabelTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedTeknisi !== 'ALL') params.append('teknisi', selectedTeknisi);
      if (selectedJenis !== 'ALL') params.append('jenis_layanan', selectedJenis);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (!data.error) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatus, selectedTeknisi, selectedJenis]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Antrean & Riwayat Tiket Servis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar lengkap seluruh tiket servis reguler, klaim garansi vendor, dan stok internal.
          </p>
        </div>

        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20 rounded-xl transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Tiket Baru</span>
        </Link>
      </div>

      {/* Floating / Sticky Bulk Action Bar (Visible when 1 or more tickets are selected) */}
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

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No RMA, Customer, SN..."
              className="w-full pl-8 sm:pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-hidden font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-hidden font-medium"
            >
              <option value="ALL">-- Semua Status --</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Teknisi Filter */}
          <div>
            <select
              value={selectedTeknisi}
              onChange={(e) => setSelectedTeknisi(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-hidden font-medium"
            >
              <option value="ALL">-- Semua Teknisi --</option>
              {TEKNISI_LIST.map((t) => (
                <option key={t} value={t}>
                  Teknisi: {t}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Layanan */}
          <div className="flex gap-2">
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-hidden font-medium"
            >
              <option value="ALL">-- Semua Jenis --</option>
              <option value="SERVICE">Service Reguler</option>
              <option value="GARANSI">Klaim Garansi</option>
            </select>

            <button
              onClick={fetchTickets}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-4 sm:px-5 py-3 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={isAllSelected ? 'Batalkan Semua Pilihan' : 'Pilih Semua Tiket'}
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-orange-500" />
              ) : isPartiallySelected ? (
                <div className="w-4 h-4 rounded border-2 border-orange-500 bg-orange-500/20 flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-orange-500" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <span>Menampilkan {tickets.length} Tiket</span>
          </div>

          {selectedTicketIds.length > 0 && (
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              {selectedTicketIds.length} terpilih
            </span>
          )}
        </div>

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
                    Memuat tiket...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Tidak ada tiket yang cocok dengan kriteria pencarian.
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
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
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

                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDateIndo(t.tanggal_masuk)}
                      </td>

                      <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span className="truncate max-w-[130px]">{t.nama_customer}</span>
                          {isStock && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-extrabold shrink-0">
                              STOK
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.no_hp}</div>
                      </td>

                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 min-w-[130px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{t.nama_barang}</div>
                        <div className="text-[11px] font-mono text-slate-400">SN: {t.serial_number}</div>
                      </td>

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

                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          {t.teknisi}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">
                        <StatusBadge status={t.status} size="sm" />
                      </td>

                      <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptTicket(t)}
                            title="Cetak Tanda Terima"
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
                            title="Kirim Pesan WhatsApp"
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/tickets/${t.id}`}
                            title="Detail Tiket"
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

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400">Memuat tiket...</div>}>
      <TicketsContent />
    </Suspense>
  );
}
