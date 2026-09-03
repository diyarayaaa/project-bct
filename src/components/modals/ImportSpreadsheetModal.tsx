'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface ImportSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportSpreadsheetModal({
  isOpen,
  onClose,
  onSuccess
}: ImportSpreadsheetModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    importedCount?: number;
    skippedCount?: number;
    totalInDb?: number;
    message?: string;
    error?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleImport = async (usePresetName?: string) => {
    setIsUploading(true);
    setResult(null);

    try {
      let res: Response;

      if (usePresetName) {
        res = await fetch('/api/tickets/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usePreset: usePresetName })
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('file', file);
        res = await fetch('/api/tickets/import', {
          method: 'POST',
          body: formData
        });
      } else {
        throw new Error('Pilih file Excel (.xlsx) atau CSV terlebih dahulu');
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal mengimpor data spreadsheet');
      }

      setResult({
        success: true,
        importedCount: data.importedCount,
        skippedCount: data.skippedCount,
        totalInDb: data.totalInDb,
        message: data.message
      });

      onSuccess();
    } catch (err: any) {
      setResult({
        error: err.message || 'Terjadi kesalahan saat mengimpor data'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data Tiket Spreadsheet"
      size="lg"
    >
      <div className="space-y-5">
        {/* Info Box */}
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            Mendukung format file <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>. Sistem otomatis membaca header kolom (No RMA, Customer, HP, Perangkat, Keluhan, Status, Teknisi, dll) dan memperbarui data secara aman.
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            file
              ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-orange-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className={`p-3.5 rounded-full ${file ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600' : 'bg-orange-100 dark:bg-orange-950/60 text-orange-600'}`}>
              {file ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
            </div>

            {file ? (
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB — Siap diimpor</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Klik untuk pilih file atau seret file ke sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format yang didukung: Microsoft Excel (.xlsx, .xls) atau Comma-Separated Values (.csv)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Option: File yang sudah tersimpan di public */}
        <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Gunakan file database-lama yang tersimpan
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              public/database-lama.csv & public/database-lama.xlsx (320 data)
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => handleImport('database-lama.csv')}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Impor CSV
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => handleImport('database-lama.xlsx')}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Impor Excel
            </button>
          </div>
        </div>

        {/* Result Message */}
        {result?.error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{result.error}</span>
          </div>
        )}

        {result?.success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{result.message}</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pl-6">
              Total tiket aktif di sistem saat ini: <strong>{result.totalInDb}</strong> data.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {result?.success ? 'Selesai' : 'Batal'}
          </button>
          
          <button
            type="button"
            disabled={!file || isUploading}
            onClick={() => handleImport()}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Data...</span>
              </>
            ) : (
              <>
                <span>Mulai Proses Import</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
