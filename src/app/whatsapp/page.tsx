'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  Building2,
  Boxes,
  Users,
  Search,
  RefreshCw
} from 'lucide-react';
import { SALES_WA_NUMBER, SALES_WA_DISPLAY } from '@/lib/constants';
import { Ticket } from '@/types';
import {
  formatCustomerReceiptMessage,
  formatCustomerDoneMessage,
  createWhatsAppUrl
} from '@/lib/whatsapp-formatter';

function WhatsAppHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'sales' ? 'sales' : tabParam === 'quick' ? 'quick' : 'operational';
  const initialTicketId = searchParams.get('ticket_id') || '';

  const [activeTab, setActiveTab] = useState<'operational' | 'sales' | 'quick'>(initialTab);

  // Sync tab state when URL searchParams changes (e.g. navigation from Sidebar)
  useEffect(() => {
    if (tabParam === 'sales') {
      setActiveTab('sales');
    } else if (tabParam === 'quick') {
      setActiveTab('quick');
    } else {
      setActiveTab('operational');
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'operational' | 'sales' | 'quick') => {
    setActiveTab(tab);
    if (tab === 'operational') {
      router.replace('/whatsapp', { scroll: false });
    } else {
      router.replace(`/whatsapp?tab=${tab}`, { scroll: false });
    }
  };

  // Operational Report State
  const [operationalText, setOperationalText] = useState('');
  const [isOpLoading, setIsOpLoading] = useState(false);

  // Sales Report State
  const [salesText, setSalesText] = useState('');
  const [isSalesLoading, setIsSalesLoading] = useState(false);

  // Quick Dispatch State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId);
  const [templateType, setTemplateType] = useState<'receipt' | 'done'>('receipt');
  const [searchTicket, setSearchTicket] = useState('');

  // Copy Feedback
  const [isCopied, setIsCopied] = useState(false);

  const fetchOperationalReport = useCallback(async () => {
    setIsOpLoading(true);
    try {
      const res = await fetch('/api/whatsapp/generate?type=operational');
      const data = await res.json();
      if (!data.error) setOperationalText(data.message);
    } catch (err) {
      console.error('Failed to load operational report:', err);
    } finally {
      setIsOpLoading(false);
    }
  }, []);

  const fetchSalesReport = useCallback(async () => {
    setIsSalesLoading(true);
    try {
      const res = await fetch('/api/whatsapp/generate?type=sales');
      const data = await res.json();
      if (!data.error) setSalesText(data.message);
    } catch (err) {
      console.error('Failed to load sales report:', err);
    } finally {
      setIsSalesLoading(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (!data.error) {
        setTickets(data.tickets || []);
        if (!selectedTicketId && data.tickets?.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    fetchOperationalReport();
    fetchSalesReport();
    fetchTickets();
  }, [fetchOperationalReport, fetchSalesReport, fetchTickets]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  const quickMessage = selectedTicket
    ? templateType === 'receipt'
      ? formatCustomerReceiptMessage(selectedTicket)
      : formatCustomerDoneMessage(selectedTicket)
    : '';

  const quickWaUrl = selectedTicket ? createWhatsAppUrl(selectedTicket.no_hp, quickMessage) : '';
  const salesWaUrl = createWhatsAppUrl(SALES_WA_NUMBER, salesText);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
            WhatsApp Automation Hub
          </h1>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => handleTabChange('operational')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'operational'
              ? 'bg-slate-900 dark:bg-orange-500 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-orange-400 dark:text-white" />
          <span>Laporan WA Mingguan</span>
        </button>

        <button
          onClick={() => handleTabChange('sales')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'sales'
              ? 'bg-slate-900 dark:bg-orange-500 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4 text-purple-400 dark:text-white" />
          <span>Laporan WA Garansi Stock</span>
        </button>

        <button
          onClick={() => handleTabChange('quick')}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'quick'
              ? 'bg-slate-900 dark:bg-orange-500 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>Laporan WA Customer</span>
        </button>
      </div>

      {/* TAB 1: OPERATIONAL REPORT */}
      {activeTab === 'operational' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-5 animate-in fade-in transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>Rekap Logistik & Alur Servis Vendor (Grup WA Tim)</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                  Hari Kamis
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Barang ke BDG, Di Vendor BDG, Di Vendor JKT, dan Belum Diproses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchOperationalReport}
                className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                title="Refresh Teks"
              >
                <RefreshCw className={`w-4 h-4 ${isOpLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => handleCopyText(operationalText)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 dark:hover:bg-orange-600 text-white rounded-xl shadow-xs transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400 dark:text-white" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Format WA'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={16}
              readOnly
              value={operationalText}
              className="w-full p-3.5 sm:p-4 bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm rounded-xl border border-slate-800 focus:outline-hidden leading-relaxed shadow-inner"
            />
          </div>
        </div>
      )}

      {/* TAB 2: SALES REPORT */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-5 animate-in fade-in transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                <span>Laporan RMA Stok Toko (STOCK BCT & GHITP)</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                  {SALES_WA_DISPLAY}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan SN Lama vs SN Baru unit garansi stok toko yang sudah selesai.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchSalesReport}
                className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                title="Refresh Teks"
              >
                <RefreshCw className={`w-4 h-4 ${isSalesLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => handleCopyText(salesText)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
              </button>

              <a
                href={salesWaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Kirim ke Sales</span>
              </a>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={16}
              readOnly
              value={salesText}
              className="w-full p-3.5 sm:p-4 bg-slate-900 dark:bg-slate-950 text-purple-300 font-mono text-xs sm:text-sm rounded-xl border border-slate-800 focus:outline-hidden leading-relaxed shadow-inner"
            />
          </div>
        </div>
      )}

      {/* TAB 3: QUICK DISPATCH */}
      {activeTab === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pilih Tiket Pelanggan
              </h3>
              <span className="text-[11px] text-slate-400">{tickets.length} Tiket</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder="Cari RMA / Customer..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            <div className="max-h-80 lg:max-h-96 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {tickets
                .filter(
                  (t) =>
                    !searchTicket ||
                    t.nomor_layanan.toLowerCase().includes(searchTicket.toLowerCase()) ||
                    t.nama_customer.toLowerCase().includes(searchTicket.toLowerCase())
                )
                .map((t) => {
                  const isSelected = t.id === selectedTicketId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 shadow-xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{t.nomor_layanan}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.no_hp}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{t.nama_customer}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.nama_barang}</p>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            {selectedTicket ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tujuan:</span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                      {selectedTicket.nama_customer} ({selectedTicket.no_hp})
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTemplateType('receipt')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                        templateType === 'receipt'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Tanda Terima
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateType('done')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                        templateType === 'done'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Selesai
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={12}
                    readOnly
                    value={quickMessage}
                    className="w-full p-3.5 sm:p-4 bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm rounded-xl border border-slate-800 focus:outline-hidden leading-relaxed shadow-inner"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText(quickMessage)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                  </button>

                  <a
                    href={quickWaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim via WhatsApp</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400">Pilih tiket untuk membuat pesan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400">Memuat WhatsApp Hub...</div>}>
      <WhatsAppHubContent />
    </Suspense>
  );
}
