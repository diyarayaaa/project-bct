'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MasterVendor, Ticket } from '@/types';
import { COMPANY_INFO } from '@/lib/constants';
import { Printer, Box, Truck } from 'lucide-react';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  noSuratJalan?: string;
  tickets?: Ticket[];
}

export function ShippingLabelModal({
  isOpen,
  onClose,
  vendorName,
  noSuratJalan,
  tickets = []
}: ShippingLabelModalProps) {
  const [vendor, setVendor] = useState<MasterVendor | null>(null);

  useEffect(() => {
    if (!vendorName || !isOpen) return;

    fetch('/api/master/vendors')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.vendors || []).find(
          (v: MasterVendor) => v.nama_vendor.toLowerCase() === vendorName.toLowerCase()
        );
        if (found) {
          setVendor(found);
        } else {
          setVendor({
            id: 0,
            nama_vendor: vendorName,
            wilayah: vendorName.toUpperCase().includes('BDG') ? 'BDG' : 'JKT',
            alamat_lengkap: 'Alamat distributor / vendor tujuan',
            kontak_wa: '-',
            is_active: true
          });
        }
      })
      .catch((err) => console.error('Failed to load vendor info:', err));
  }, [vendorName, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Label Alamat Paket Pengiriman Vendor"
      subtitle={`Tujuan: ${vendorName}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Label Box */}
        <div
          id="shipping-label-area"
          className="printable-area bg-white p-6 rounded-2xl border-2 border-dashed border-slate-800 text-slate-900 text-sm shadow-sm space-y-4"
        >
          {/* Header Label */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-900 text-white rounded-lg">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight uppercase">
                  LABEL PENGIRIMAN PAKET RMA
                </h3>
                <p className="text-xs font-semibold text-slate-600">FRAGILE / HATI-HATI BARANG ELEKTRONIK</p>
              </div>
            </div>
            {noSuratJalan && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">No. Surat Jalan</span>
                <span className="font-mono font-bold text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {noSuratJalan}
                </span>
              </div>
            )}
          </div>

          {/* Grid Pengirim vs Penerima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pengirim */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-300">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                PENGIRIM (FROM):
              </p>
              <p className="font-bold text-slate-900">{COMPANY_INFO.name}</p>
              <p className="text-xs font-semibold text-orange-600">{COMPANY_INFO.subName}</p>
              <p className="text-xs text-slate-600 mt-1">{COMPANY_INFO.address}</p>
              <p className="text-xs text-slate-800 font-mono mt-1">Telp/WA: {COMPANY_INFO.phone}</p>
            </div>

            {/* Penerima */}
            <div className="p-3 bg-amber-50/60 rounded-xl border-2 border-amber-400">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900">
                  PENERIMA (TO):
                </p>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-200 text-amber-900 border border-amber-400">
                  {vendor?.wilayah || 'VENDOR'}
                </span>
              </div>
              <p className="font-extrabold text-base text-slate-900">{vendor?.nama_vendor || vendorName}</p>
              <p className="text-xs text-slate-700 mt-1 whitespace-pre-line font-medium">
                {vendor?.alamat_lengkap || 'Alamat vendor'}
              </p>
              <p className="text-xs text-slate-900 font-mono font-bold mt-2">
                Kontak/WA: {vendor?.kontak_wa || '-'}
              </p>
            </div>
          </div>

          {/* Isi Paket Ringkas */}
          {tickets.length > 0 && (
            <div className="pt-2 border-t border-slate-200 text-xs">
              <p className="font-bold text-slate-700 mb-1">Isi Paket ({tickets.length} Unit Perangkat):</p>
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                {tickets.map((t, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>
                      {idx + 1}. {t.nama_barang} (SN: {t.serial_number})
                    </span>
                    <span className="text-slate-500 font-sans">[{t.nomor_layanan}]</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <span>Cetak Label Alamat (Stiker)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
