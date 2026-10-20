'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createLicenseSchema,
  CreateLicenseInput,
  License,
} from '@/features/license';
import { Icons, CopyIcon } from '@/shared/_components/icons';
import { useCreateLicense } from '../_hooks/use-create-license';

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseCreated?: (license: License) => void;
}

export function CreateLicenseModal({
  isOpen,
  onClose,
  onLicenseCreated,
}: CreateLicenseModalProps) {
  const [copied, setCopied] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);

  const {
    isCreating,
    createdLicense,
    error,
    createLicense,
    reset: resetHook,
  } = useCreateLicense((newLic) => {
    if (onLicenseCreated) {
      onLicenseCreated(newLic);
    }
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateLicenseInput>({
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customKey: '',
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    resetHook();
    clearErrors();
    setCopied(false);
    setUseCustomKey(false);
    onClose();
  };

  const onSubmit = async (data: CreateLicenseInput) => {
    clearErrors();
    const payload: CreateLicenseInput = {
      customerName: data.customerName?.trim() || undefined,
      customerEmail: data.customerEmail?.trim() || undefined,
      customKey: useCustomKey && data.customKey?.trim() ? data.customKey.trim() : undefined,
    };

    const parseResult = createLicenseSchema.safeParse(payload);
    if (!parseResult.success) {
      (parseResult.error.issues || []).forEach((err) => {
        const field = err.path[0] as keyof CreateLicenseInput;
        if (field) {
          setError(field, { message: err.message });
        }
      });
      return;
    }

    await createLicense(parseResult.data);
  };

  const handleCopy = (key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(key).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    resetForm();
    resetHook();
    clearErrors();
    setCopied(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-license-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 text-white space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Icons.key size={12} />
              <span>Step 24: Add License</span>
            </div>
            <h2 id="create-license-modal-title" className="text-xl font-bold text-white">
              {createdLicense ? 'Kunci Lisensi Berhasil Dibuat' : 'Buat Kunci Lisensi Baru'}
            </h2>
            <p className="text-xs text-slate-400">
              {createdLicense
                ? 'Lisensi telah tersimpan di database dengan status awal belum digunakan (used=false).'
                : 'Generate kunci lisensi kriptografis unik untuk dialokasikan kepada pelanggan.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <Icons.close size={20} />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5"
          >
            <Icons.alertCircle size={16} className="text-red-400 shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* State A: License Created Successfully */}
        {createdLicense ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Icons.checkCircle size={14} />
                  <span>Status: Belum Digunakan (used=false)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(createdLicense.createdAt).toLocaleTimeString('id-ID')}
                </span>
              </div>

              {/* License Key Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Kunci Lisensi Resmi:
                </label>
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-700/80">
                  <span
                    data-testid="created-license-key"
                    className="font-mono text-base sm:text-lg font-bold text-blue-400 tracking-wider select-all break-all"
                  >
                    {createdLicense.licenseKey}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(createdLicense.licenseKey)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm active:scale-95"
                    data-testid="copy-license-btn"
                  >
                    <CopyIcon size={14} />
                    <span>{copied ? 'Tersalin!' : 'Salin Kunci'}</span>
                  </button>
                </div>
              </div>

              {/* Metadata Info */}
              {(createdLicense.customerName || createdLicense.customerEmail) && (
                <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1">
                  <span className="text-slate-400 block font-medium">Dialokasikan Untuk:</span>
                  <div className="text-white font-medium">
                    {createdLicense.customerName && <span>{createdLicense.customerName}</span>}
                    {createdLicense.customerName && createdLicense.customerEmail && (
                      <span className="text-slate-400 font-normal"> — </span>
                    )}
                    {createdLicense.customerEmail && (
                      <span className="text-slate-300 font-mono text-[11px]">
                        {createdLicense.customerEmail}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Practical Guidance */}
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-200 text-xs flex items-start gap-2.5">
              <Icons.shield size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Kirimkan kunci lisensi ini kepada pelanggan. Pelanggan dapat memasukkan kunci ini pada layar
                aktivasi aplikasi Ficco untuk membuka akses penuh.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCreateAnother}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer"
              >
                + Buat Lisensi Lain
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-md"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          /* State B: Input Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Customer Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="customerName" className="text-xs font-medium text-slate-300 block">
                Nama Pelanggan / Entitas Bisnis{' '}
                <span className="text-slate-500 text-[11px]">(Opsional)</span>
              </label>
              <input
                id="customerName"
                type="text"
                placeholder="Contoh: PT Maju Bersama atau Bapak Budi"
                {...register('customerName')}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              {errors.customerName && (
                <p className="text-[11px] text-red-400">{errors.customerName.message}</p>
              )}
            </div>

            {/* Customer Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="customerEmail" className="text-xs font-medium text-slate-300 block">
                Email Pelanggan{' '}
                <span className="text-slate-500 text-[11px]">(Opsional)</span>
              </label>
              <input
                id="customerEmail"
                type="email"
                placeholder="Contoh: finance@majubersama.com"
                {...register('customerEmail')}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              {errors.customerEmail && (
                <p className="text-[11px] text-red-400">{errors.customerEmail.message}</p>
              )}
            </div>

            {/* Key Generation Mode Toggle */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Format Kunci Lisensi:</span>
                <button
                  type="button"
                  onClick={() => setUseCustomKey(!useCustomKey)}
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  {useCustomKey ? 'Gunakan Acak Otomatis (Rekomendasi)' : 'Masukkan Kunci Kustom'}
                </button>
              </div>

              {!useCustomKey ? (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block text-[11px]">Format Standar Aman:</span>
                    <span className="font-mono font-semibold text-blue-400 text-xs tracking-wider">
                      FCC-XXXX-XXXX-XXXX-XXXX
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Kriptografis 8-byte
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 animate-fadeIn">
                  <input
                    id="customKey"
                    type="text"
                    placeholder="Contoh: FCC-9988-7766-5544-3322"
                    {...register('customKey')}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-700/80 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all uppercase"
                  />
                  {errors.customKey && (
                    <p className="text-[11px] text-red-400">{errors.customKey.message}</p>
                  )}
                  <p className="text-[10px] text-slate-500">
                    Kunci kustom harus unik dan minimal 12 karakter.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/30 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
                data-testid="submit-create-license-btn"
              >
                {isCreating ? (
                  <>
                    <Icons.loader size={14} className="animate-spin text-white" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <Icons.key size={14} />
                    <span>Generate & Simpan Lisensi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
