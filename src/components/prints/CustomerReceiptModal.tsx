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

// Satu copy tanda terima: ATAS (kotak -> pelanggan) + BAWAH (stiker barang)
function ReceiptCopy({ ticket }: { ticket: Ticket }) {
  const kelengkapanList = Array.isArray(ticket.kelengkapan) ? ticket.kelengkapan : [];
  const kelengkapanStr = kelengkapanList.length > 0 ? kelengkapanList.join(', ') : 'Unit Saja';

  return (
    <div className="print-cell flex flex-col" style={{ minHeight: '48%' }}>
      {/* ATAS: copy pelanggan (dikotakin) */}
      <div className="border-2 border-dashed border-slate-700 p-2 rounded-md mb-1.5">
        <div className="flex items-start justify-between gap-1 border-b border-slate-300 pb-1 mb-1">
          <div>
            <p className="text-[11px] font-black leading-tight text-slate-900">{COMPANY_INFO.name}</p>
            <p className="text-[8px] font-bold text-orange-600 uppercase tracking-wider">{COMPANY_INFO.subName}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-orange-500 uppercase">Tanda Terima {ticket.jenis_layanan}</p>
            <p className="text-[11px] font-mono font-extrabold text-slate-900">{ticket.nomor_layanan}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-700">
          <p><span className="font-bold">Nama:</span> {ticket.nama_customer}</p>
          <p className="font-mono"><span className="font-bold">HP:</span> {ticket.no_hp}</p>
          <p><span className="font-bold">Barang:</span> {ticket.nama_barang}</p>
          <p className="font-mono"><span className="font-bold">SN:</span> {ticket.serial_number}</p>
          <p><span className="font-bold">Keluhan:</span> {ticket.keluhan}</p>
          <p><span className="font-bold">Kelengkapan:</span> {kelengkapanStr}</p>
          <p><span className="font-bold">Teknisi:</span> {ticket.teknisi}</p>
          <p><span className="font-bold">Est. Selesai:</span> {formatDateIndo(ticket.estimasi_selesai)}</p>
          <p><span className="font-bold">Biaya:</span> Rp {Number(ticket.estimasi_biaya || 0).toLocaleString('id-ID')}</p>
          <p><span className="font-bold">DP:</span> Rp {Number(ticket.dp || 0).toLocaleString('id-ID')}</p>
          <p className="col-span-2"><span className="font-bold">Sisa:</span> Rp {Number(ticket.sisa || 0).toLocaleString('id-ID')}</p>
        </div>
        <div className="grid grid-cols-2 text-center text-[8px] mt-1 pt-1 border-t border-slate-200">
          <p>Pelanggan: (______________)</p>
          <p>Teknisi: ({ticket.teknisi})</p>
        </div>
      </div>

      {/* BAWAH: stiker barang */}
      <div className="bg-slate-100 border border-slate-400 p-1.5 rounded text-[8px] text-slate-800 leading-tight">
        <p className="font-mono font-extrabold text-slate-900">{ticket.nomor_layanan}</p>
        <p><span className="font-bold">Unit:</span> {ticket.nama_barang}</p>
        <p className="font-mono"><span className="font-bold">S/N:</span> {ticket.serial_number}</p>
        <p><span className="font-bold">Cust:</span> {ticket.nama_customer}</p>
        <p><span className="font-bold">Keluhan:</span> {ticket.keluhan}</p>
        <p><span className="font-bold">Tgl:</span> {formatDateTimeIndo(ticket.tanggal_masuk)}</p>
      </div>
    </div>
  );
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Tanda Terima Servis (A4 → 4 copy)"
      subtitle={`No RMA: ${ticket.nomor_layanan}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div
          id="receipt-print-area"
          className="printable-area bg-white p-2 rounded-xl border border-slate-300 text-slate-800 text-sm"
        >
          <div className="print-grid-4 print-sheet">
            {[0, 1, 2, 3].map((i) => (
              <ReceiptCopy key={i} ticket={ticket} />
            ))}
          </div>
        </div>

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
