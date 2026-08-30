'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  PlusCircle,
  Sparkles,
  MapPin,
  Phone,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  Smartphone
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MasterVendor, MasterKeluhan, Ticket } from '@/types';

function MasterDataContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'vendor';

  const [activeTab, setActiveTab] = useState<'vendor' | 'customer' | 'keluhan'>('vendor');

  useEffect(() => {
    if (tabParam === 'customer') {
      setActiveTab('customer');
    } else if (tabParam === 'keluhan') {
      setActiveTab('keluhan');
    } else {
      setActiveTab('vendor');
    }
  }, [tabParam]);

  const [vendors, setVendors] = useState<MasterVendor[]>([]);
  const [keluhanList, setKeluhanList] = useState<MasterKeluhan[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

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
      const [vRes, kRes, tRes] = await Promise.all([
        fetch('/api/master/vendors'),
        fetch('/api/master/keluhan'),
        fetch('/api/tickets')
      ]);
      const vData = await vRes.json();
      const kData = await kRes.json();
      const tData = await tRes.json();
      setVendors(vData.vendors || []);
      setKeluhanList(kData.keluhan || []);
      setTickets(tData.tickets || []);
    } catch (err) {
      console.error('Failed to load master data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const handleTabChange = (tab: 'vendor' | 'customer' | 'keluhan') => {
    setActiveTab(tab);
    router.push(`/master?tab=${tab}`);
  };

  // Build unique customers list
  const customerMap = new Map<string, { nama: string; no_hp: string; totalTiket: number; lastDate: string }>();
  tickets.forEach((t) => {
    const key = t.nama_customer.trim().toLowerCase();
    if (!key) return;
    const existing = customerMap.get(key);
    if (existing) {
      existing.totalTiket += 1;
      if (new Date(t.tanggal_masuk) > new Date(existing.lastDate)) {
        existing.lastDate = t.tanggal_masuk;
      }
    } else {
      customerMap.set(key, {
        nama: t.nama_customer,
        no_hp: t.no_hp || '-',
        totalTiket: 1,
        lastDate: t.tanggal_masuk
      });
    }
  });
  const customers = Array.from(customerMap.values());

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

  // Filtered lists
  const filteredVendors = vendors.filter((v) =>
    v.nama_vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.wilayah.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.no_hp.includes(searchQuery)
  );

  const filteredKeluhan = keluhanList.filter((k) =>
    k.teks_keluhan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('vendor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'vendor'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Data Master Vendor ({vendors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('customer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'customer'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Master Customer ({customers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('keluhan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'keluhan'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Preset Form Option / Keluhan ({keluhanList.length})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari data master..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tab 1: Vendor */}
      {activeTab === 'vendor' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Distributor & Vendor Garansi
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsVendorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Vendor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredVendors.map((v) => (
              <div
                key={v.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
      )}

      {/* Tab 2: Customer */}
      {activeTab === 'customer' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Pelanggan / Master Customer
              </h2>
            </div>
            <span className="text-xs text-slate-400">Total {customers.length} Pelanggan Terdaftar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCustomers.map((c) => (
              <div
                key={c.nama}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{c.nama}</h3>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                    {c.totalTiket} Tiket
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.no_hp}</span>
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Kunjungan terakhir: {c.lastDate}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Keluhan */}
      {activeTab === 'keluhan' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Preset Form Option / Kamus Keluhan
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsKeluhanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Preset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredKeluhan.map((k) => (
              <div
                key={k.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                <span className="truncate">{k.teks_keluhan}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              placeholder="Alamat distributor untuk pengiriman RMA..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Kontak WhatsApp / HP
            </label>
            <input
              type="text"
              value={kontakWa}
              onChange={(e) => setKontakWa(e.target.value)}
              placeholder="08123456789"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsVendorModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingVendor || !namaVendor.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors disabled:opacity-50"
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
        title="Tambah Preset Keluhan"
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
              placeholder="Contoh: Mati Total (No Power)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsKeluhanModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingKeluhan || !teksKeluhan.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmittingKeluhan ? 'Menyimpan...' : 'Simpan Preset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense fallback={null}>
      <MasterDataContent />
    </Suspense>
  );
}
