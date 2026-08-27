'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Ticket } from '@/types';
import { COMPANY_INFO } from '@/lib/constants';
import { formatDateIndo, formatDateTimeIndo } from '@/lib/whatsapp-formatter';
import { Printer, X, CheckCircle, Smartphone } from 'lucide-react';

interface CustomerReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export function CustomerReceiptModal({
  isOpen,
  onClose,
  ticket
}: CustomerReceiptModalProps) {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const kelengkapanList = Array.isArray(ticket.kelengkapan) ? ticket.kelengkapan : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Tanda Terima Servis (Customer)"
      subtitle={`No RMA: ${ticket.nomor_layanan}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Printable Paper Area */}
        <div
          id="receipt-print-area"
          className="printable-area bg-white p-6 sm:p-8 rounded-xl border border-slate-300 text-slate-800 text-sm shadow-sm"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {COMPANY_INFO.name}
              </h2>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                {COMPANY_INFO.subName}
              </p>
              <p className="text-xs text-slate-500 mt-1">{COMPANY_INFO.address}</p>
              <p className="text-xs text-slate-500 font-medium">WhatsApp / Telp: {COMPANY_INFO.phone}</p>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <div className="inline-block bg-slate-900 text-white px-3 py-1.5 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider block text-orange-400">
                  Tanda Terima {ticket.jenis_layanan}
                </span>
                <span className="text-base sm:text-lg font-mono font-extrabold tracking-wider">
                  {ticket.nomor_layanan}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tgl Masuk: <span className="font-semibold text-slate-700">{formatDateTimeIndo(ticket.tanggal_masuk)}</span>
              </p>
            </div>
          </div>

          {/* Grid Informasi Customer & Barang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-xs sm:text-sm">
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                Informasi Pelanggan
              </p>
              <p className="font-bold text-slate-900 text-sm">{ticket.nama_customer}</p>
              <p className="text-slate-600 font-mono">No. HP: {ticket.no_hp}</p>
              <p className="text-slate-600">Teknisi: <span className="font-semibold text-slate-800">{ticket.teknisi}</span></p>
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500">
                Informasi Perangkat
              </p>
              <p className="font-bold text-slate-900 text-sm">{ticket.nama_barang}</p>
              <p className="text-slate-600 font-mono">SN: <span className="font-bold text-slate-800">{ticket.serial_number}</span></p>
              <p className="text-slate-600">Kategori: <span className="font-medium">{ticket.jenis_barang}</span></p>
            </div>
          </div>

          {/* Keluhan & Kelengkapan */}
          <div className="py-4 border-b border-slate-200 space-y-3 text-xs sm:text-sm">
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">Keluhan / Kerusakan:</span>
              <p className="bg-amber-50/70 border border-amber-200 text-amber-950 p-2.5 rounded-lg font-medium">
                {ticket.keluhan}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-1">Kelengkapan yang Dititipkan:</span>
              <div className="flex flex-wrap gap-1.5">
                {kelengkapanList.length > 0 ? (
                  kelengkapanList.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-md border border-slate-300"
                    >
                      ✓ {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Hanya Unit Saja</span>
                )}
              </div>
            </div>

            {ticket.catatan && (
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">Catatan Khusus:</span>
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                  {ticket.catatan}
                </p>
              </div>
            )}
          </div>

          {/* Rincian Biaya */}
          <div className="py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs text-slate-500">
              <p>Estimasi Selesai: <span className="font-semibold text-slate-800">{formatDateIndo(ticket.estimasi_selesai)}</span></p>
              <p className="mt-0.5">Status Saat Ini: <span className="font-bold text-orange-600">{ticket.status}</span></p>
            </div>

            <div className="w-full sm:w-64 bg-slate-100 p-3 rounded-lg border border-slate-300 space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Estimasi Biaya:</span>
                <span className="font-semibold">Rp {Number(ticket.estimasi_biaya || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">DP / Uang Muka:</span>
                <span className="font-semibold text-emerald-700">Rp {Number(ticket.dp || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
                <span>Sisa Pembayaran:</span>
                <span className="text-orange-600">Rp {Number(ticket.sisa || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Ketentuan Servis */}
          <div className="pt-3 pb-6 text-[10px] text-slate-500 space-y-0.5 border-b border-slate-200">
            <p className="font-bold text-slate-700 uppercase tracking-wider">Syarat & Ketentuan Pengambilan:</p>
            <p>1. Pengambilan perangkat wajib menunjukkan lembar tanda terima ini atau bukti pesan resmi WhatsApp.</p>
            <p>2. Perangkat yang tidak diambil dalam waktu lebih dari 30 hari setelah pemberitahuan selesai bukan tanggung jawab kami atas kerusakan/kehilangan.</p>
            <p>3. Harap cek kondisi fisik dan fungsi perangkat di depan kasir/teknisi saat pengambilan.</p>
          </div>

          {/* Tanda Tangan */}
          <div className="pt-6 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-600 mb-12">Pelanggan / Yang Menyerahkan,</p>
              <p className="font-bold text-slate-900 uppercase">({ticket.nama_customer.replace('TN/NY. ', '')})</p>
            </div>
            <div>
              <p className="text-slate-600 mb-12">Penerima / Teknisi Best Computel,</p>
              <p className="font-bold text-slate-900 uppercase">({ticket.teknisi})</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Tanda Terima (Ctrl+P)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
