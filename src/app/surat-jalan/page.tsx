'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  PlusCircle,
  Printer,
  Boxes,
  RefreshCw
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ShippingLabelModal } from '@/components/prints/ShippingLabelModal';
import { SuratJalan, Ticket, MasterVendor } from '@/types';
import { formatDateIndo } from '@/lib/whatsapp-formatter';

export default function SuratJalanPage() {
  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [vendors, setVendors] = useState<MasterVendor[]>([]);
  const [availableTickets, setAvailableTickets] = useState<Ticket[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [tglKirim, setTglKirim] = useState(new Date().toISOString().split('T')[0]);
  const [ekspedisi, setEkspedisi] = useState('Travel Cipaganti / Kirim Langsung');
  const [noResi, setNoResi] = useState('');
  const [catatan, setCatatan] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Shipping Label Modal
  const [labelModalData, setLabelModalData] = useState<{
    vendor: string;
    noSj: string;
    tickets: Ticket[];
  } | null>(null);

  const fetchSuratJalan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/surat-jalan');
      const data = await res.json();
      if (!data.error) setSuratJalanList(data.suratJalan || []);
    } catch (err) {
      console.error('Failed to load surat jalan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCreateData = async () => {
    try {
      const [vendorRes, ticketRes] = await Promise.all([
        fetch('/api/master/vendors'),
        fetch('/api/tickets')
      ]);
      const vendorData = await vendorRes.json();
      const ticketData = await ticketRes.json();

      setVendors(vendorData.vendors || []);

      const tickets: Ticket[] = ticketData.tickets || [];
      const eligible = tickets.filter(
        (t) =>
          (t.jenis_layanan === 'GARANSI' || t.status === 'PROSES GARANSI' || t.status === 'ALIH SERVICE') &&
          t.status !== 'SELESAI & DIAMBIL'
      );
      setAvailableTickets(eligible);
    } catch (err) {
      console.error('Failed to fetch modal data:', err);
    }
  };

  useEffect(() => {
    fetchSuratJalan();
  }, [fetchSuratJalan]);

  const handleOpenCreateModal = () => {
    fetchCreateData();
    setIsCreateModalOpen(true);
    setCreateError('');
    setSelectedTicketIds([]);
  };

  const handleToggleTicketSelect = (id: string) => {
    if (selectedTicketIds.includes(id)) {
      setSelectedTicketIds(selectedTicketIds.filter((tId) => tId !== id));
    } else {
      setSelectedTicketIds([...selectedTicketIds, id]);
    }
  };

  const handleCreateSuratJalan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!selectedVendor) {
      setCreateError('Pilih distributor / vendor tujuan');
      return;
    }

    if (selectedTicketIds.length === 0) {
      setCreateError('Pilih minimal 1 unit perangkat untuk dimasukkan ke Surat Jalan');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeUser = localStorage.getItem('bct_current_user') || 'Admin Kasir';
      const payload = {
        distributor_vendor: selectedVendor,
        tgl_kirim: tglKirim,
        ekspedisi,
        no_resi: noResi || null,
        catatan: catatan || null,
        created_by: activeUser,
        ticket_ids: selectedTicketIds
      };

      const res = await fetch('/api/surat-jalan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat surat jalan');
      }

      setIsCreateModalOpen(false);
      fetchSuratJalan();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
            Manajemen Surat Jalan Vendor
          </h1>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20 rounded-xl transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Surat Jalan</span>
        </button>
      </div>

      {/* Surat Jalan Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-4 sm:px-5 py-3 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Daftar Riwayat Surat Jalan ({suratJalanList.length})</span>
          <button
            onClick={fetchSuratJalan}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">No Surat Jalan</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Tgl Kirim</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Distributor / Vendor</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Ekspedisi & Resi</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5 text-center">Jumlah</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5">Dibuat Oleh</th>
                <th className="px-3 sm:px-4 py-3 sm:py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Memuat data surat jalan...
                  </td>
                </tr>
              ) : suratJalanList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Belum ada data Surat Jalan. Klik tombol "Buat Surat Jalan" di atas.
                  </td>
                </tr>
              ) : (
                suratJalanList.map((sj) => (
                  <tr key={sj.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <Link
                        href={`/surat-jalan/print/${sj.no_surat_jalan}`}
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        {sj.no_surat_jalan}
                      </Link>
                    </td>

                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDateIndo(sj.tgl_kirim)}
                    </td>

                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-slate-900 dark:text-white">
                      {sj.distributor_vendor}
                    </td>

                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{sj.ekspedisi || 'Ekspedisi Toko'}</div>
                      {sj.no_resi && (
                        <div className="text-[11px] font-mono text-slate-400">Resi: {sj.no_resi}</div>
                      )}
                    </td>

                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-center whitespace-nowrap">
                      <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 font-extrabold text-xs rounded-full">
                        {sj.ticket_count || 0} Unit
                      </span>
                    </td>

                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {sj.created_by}
                    </td>

                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/surat-jalan/print/${sj.no_surat_jalan}`}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cetak A4</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setLabelModalData({
                              vendor: sj.distributor_vendor,
                              noSj: sj.no_surat_jalan,
                              tickets: []
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Label</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Surat Jalan Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Surat Jalan Pengiriman Vendor"
        subtitle="Pilih distributor tujuan dan centang barang yang akan dikirim"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateSuratJalan} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Distributor / Vendor Tujuan *
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
              >
                <option value="">-- Pilih Distributor / Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.nama_vendor}>
                    {v.nama_vendor} ({v.wilayah})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tanggal Pengiriman *
              </label>
              <input
                type="date"
                value={tglKirim}
                onChange={(e) => setTglKirim(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ekspedisi / Pengiriman
              </label>
              <input
                type="text"
                value={ekspedisi}
                onChange={(e) => setEkspedisi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                No. Resi Pengiriman
              </label>
              <input
                type="text"
                value={noResi}
                onChange={(e) => setNoResi(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Pilih Barang yang Dikirim ({selectedTicketIds.length} terpilih) *
              </label>
              <span className="text-[11px] text-slate-400">Centang unit yang masuk</span>
            </div>

            <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              {availableTickets.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada tiket garansi/alih servis yang menunggu pengiriman.
                </div>
              ) : (
                availableTickets.map((t) => {
                  const isChecked = selectedTicketIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-start gap-3 p-2.5 sm:p-3 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        isChecked ? 'bg-orange-50/60 dark:bg-orange-950/40' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTicketSelect(t.id)}
                        className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{t.nomor_layanan}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">• {t.nama_barang}</span>
                          <span className="text-slate-400 font-mono text-[11px]">(SN: {t.serial_number})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          Keluhan: {t.keluhan} • Pemilik: {t.nama_customer}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Catatan Pengiriman
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Surat Jalan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Shipping Label Modal */}
      {labelModalData && (
        <ShippingLabelModal
          isOpen={!!labelModalData}
          onClose={() => setLabelModalData(null)}
          vendorName={labelModalData.vendor}
          noSuratJalan={labelModalData.noSj}
          tickets={labelModalData.tickets}
        />
      )}
    </div>
  );
}
