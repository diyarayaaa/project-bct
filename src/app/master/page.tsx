'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  PlusCircle,
  Sparkles,
  MapPin,
  Phone
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MasterVendor, MasterKeluhan } from '@/types';

export default function MasterDataPage() {
  const [vendors, setVendors] = useState<MasterVendor[]>([]);
  const [keluhanList, setKeluhanList] = useState<MasterKeluhan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Vendor
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [namaVendor, setNamaVendor] = useState('');
  const [wilayah, setWilayah] = useState<'BDG' | 'JKT' | 'OTHER'>('BDG');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [kontakWa, setKontakWa] = useState('');
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);

  // Modal Keluhan
  const [isKeluhanModalOpen, setIsKeluhanModalOpen] = useState(false);
  const [teksKeluhan, setTeksKeluhan] = useState('');
  const [isSubmittingKeluhan, setIsSubmittingKeluhan] = useState(false);

  const fetchMasterData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vRes, kRes] = await Promise.all([
        fetch('/api/master/vendors'),
        fetch('/api/master/keluhan')
      ]);
      const vData = await vRes.json();
      const kData = await kRes.json();
      setVendors(vData.vendors || []);
      setKeluhanList(kData.keluhan || []);
    } catch (err) {
      console.error('Failed to load master data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaVendor.trim()) return;

    setIsSubmittingVendor(true);
    try {
      const res = await fetch('/api/master/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_vendor: namaVendor.trim(),
          wilayah,
          alamat_lengkap: alamatLengkap.trim() || null,
          kontak_wa: kontakWa.trim() || null
        })
      });

      if (res.ok) {
        setIsVendorModalOpen(false);
        setNamaVendor('');
        setAlamatLengkap('');
        setKontakWa('');
        fetchMasterData();
      }
    } catch (err) {
      console.error('Failed to create vendor:', err);
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleCreateKeluhan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teksKeluhan.trim()) return;

    setIsSubmittingKeluhan(true);
    try {
      const res = await fetch('/api/master/keluhan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks_keluhan: teksKeluhan.trim() })
      });

      if (res.ok) {
        setIsKeluhanModalOpen(false);
        setTeksKeluhan('');
        fetchMasterData();
      }
    } catch (err) {
      console.error('Failed to create keluhan:', err);
    } finally {
      setIsSubmittingKeluhan(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Master Data Vendor & Keluhan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola distributor garansi resmi (Bandung / Jakarta) dan kamus keluhan kerusakan.
        </p>
      </div>

      {/* Grid 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left: Master Vendors */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Distributor & Vendor ({vendors.length})
              </h2>
            </div>

            <button
              onClick={() => setIsVendorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{v.nama_vendor}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      v.wilayah === 'BDG'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : v.wilayah === 'JKT'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {v.wilayah}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{v.alamat_lengkap || 'Alamat belum diatur'}</span>
                </p>
                <p className="text-slate-700 dark:text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{v.kontak_wa || '-'}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Master Keluhan */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Kamus Keluhan ({keluhanList.length})
              </h2>
            </div>

            <button
              onClick={() => setIsKeluhanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[550px] overflow-y-auto pr-1">
            {keluhanList.map((k) => (
              <div
                key={k.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span className="truncate">{k.teks_keluhan}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Add Vendor */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title="Tambah Vendor Garansi"
        maxWidth="md"
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Vendor *
            </label>
            <input
              type="text"
              value={namaVendor}
              onChange={(e) => setNamaVendor(e.target.value)}
              placeholder="Contoh: PT. ASIA RAYA COM BDG"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Wilayah Operasional *
            </label>
            <select
              value={wilayah}
              onChange={(e) => setWilayah(e.target.value as 'BDG' | 'JKT' | 'OTHER')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            >
              <option value="BDG">Bandung (BDG)</option>
              <option value="JKT">Jakarta (JKT)</option>
              <option value="OTHER">Lainnya (OTHER)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Alamat Lengkap
            </label>
            <textarea
              rows={3}
              value={alamatLengkap}
              onChange={(e) => setAlamatLengkap(e.target.value)}
              placeholder="Alamat ruko / toko..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Kontak WhatsApp / Telp
            </label>
            <input
              type="text"
              value={kontakWa}
              onChange={(e) => setKontakWa(e.target.value)}
              placeholder="Contoh: 08122001122"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsVendorModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingVendor}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              {isSubmittingVendor ? 'Menyimpan...' : 'Simpan Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Keluhan */}
      <Modal
        isOpen={isKeluhanModalOpen}
        onClose={() => setIsKeluhanModalOpen(false)}
        title="Tambah Kamus Keluhan Cepat"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateKeluhan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Teks Keluhan *
            </label>
            <input
              type="text"
              value={teksKeluhan}
              onChange={(e) => setTeksKeluhan(e.target.value)}
              placeholder="Contoh: Bluescreen (BSOD) terus"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsKeluhanModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingKeluhan}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              {isSubmittingKeluhan ? 'Menyimpan...' : 'Simpan Keluhan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
