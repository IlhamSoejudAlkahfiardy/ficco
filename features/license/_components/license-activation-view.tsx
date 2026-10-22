'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  ActivateLicenseInput,
  activateLicenseSchema,
  useActivateLicense,
} from '@/features/license';
import { Icons, CopyIcon } from '@/shared/_components/icons';

export function LicenseActivationView() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const searchParams = useSearchParams();
  const rawFrom = searchParams.get('from');
  const redirectFrom =
    rawFrom && rawFrom.startsWith('/') && !rawFrom.startsWith('//')
      ? rawFrom
      : null;

  const {
    isActivating,
    activatedLicense,
    error,
    errorCode,
    deviceId,
    activateLicense,
    reset: resetHook,
    clearActivation,
  } = useActivateLicense();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ActivateLicenseInput>({
    defaultValues: {
      licenseKey: '',
    },
  });

  const onSubmit = async (data: ActivateLicenseInput) => {
    clearErrors();
    resetHook();

    const parseResult = activateLicenseSchema.safeParse({
      licenseKey: data.licenseKey?.trim() || '',
    });

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      if (issue) {
        setError('licenseKey', { message: issue.message });
      }
      return;
    }

    const result = await activateLicense(parseResult.data.licenseKey);
    if (result.success) {
      setIsReactivating(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setValue('licenseKey', text.trim().toUpperCase(), {
            shouldValidate: true,
          });
        }
      }
    } catch {
      // Clipboard read permission might be denied
    }
  };

  const handleCopy = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const isCurrentlyActive = Boolean(activatedLicense && !isReactivating);

  return (
    <div data-testid="license-activation-view" className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2">
            <Icons.shield size={12} />
            <span>Step 26: Customer License Activation</span>
            <span className="text-slate-300 dark:text-zinc-600">|</span>
            <span>Step 27: Local License State</span>
            <span className="text-slate-300 dark:text-zinc-600">|</span>
            <span>Step 28: Protect Application Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Aktivasi Lisensi Perangkat
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Ficco beroperasi secara lokal (Local-First). Aktifkan perangkat Anda dengan kunci lisensi komersial.
          </p>
        </div>

        {/* Status Badge */}
        <div>
          {isCurrentlyActive ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Perangkat Teraktivasi</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Belum Diaktivasi</span>
            </div>
          )}
        </div>
      </div>

      {/* Redirect Notice if routed from protected area */}
      {redirectFrom && !isCurrentlyActive && (
        <div
          data-testid="license-redirect-from-notice"
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm animate-in fade-in"
        >
          <Icons.lock size={18} className="shrink-0 text-amber-500" />
          <p>
            Halaman <strong className="font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">{redirectFrom}</strong> memerlukan aktivasi lisensi. Silakan aktifkan perangkat ini untuk membuka akses penuh.
          </p>
        </div>
      )}

      {/* Activated State Banner */}
      {isCurrentlyActive && activatedLicense && (
        <div data-testid="activation-success-banner" className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Icons.checkCircle size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Aplikasi Berhasil Diaktivasi!
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300">
                Perangkat ini telah terdaftar secara sah dan memiliki izin lisensi aktif untuk mengakses seluruh fitur Ficco.
              </p>
            </div>
          </div>

          {/* License Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                Kunci Lisensi Terdaftar
              </span>
              <div className="flex items-center justify-between gap-2">
                <span data-testid="registered-license-key" className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wider">
                  {activatedLicense.licenseKey}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activatedLicense.licenseKey)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                  title="Salin Kunci Lisensi"
                >
                  {copiedKey ? (
                    <Icons.check size={16} className="text-emerald-500" />
                  ) : (
                    <CopyIcon size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                Pemilik / Pelanggan
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {activatedLicense.customerName || 'Lisensi Komersial Ficco'}
              </p>
              {activatedLicense.customerEmail && (
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                  {activatedLicense.customerEmail}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                Waktu Aktivasi
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {activatedLicense.activatedAt
                  ? new Date(activatedLicense.activatedAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Baru saja diaktivasi'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                ID Perangkat Terikat
              </span>
              <p className="font-mono text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {activatedLicense.deviceFingerprint || deviceId || 'DEV-LOCAL-REGISTERED'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {redirectFrom && (
              <Link
                href={redirectFrom}
                data-testid="continue-to-destination-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-sm transition shadow-sm"
              >
                <Icons.chevronRight size={16} />
                <span>Lanjutkan ke ({redirectFrom})</span>
              </Link>
            )}

            <Link
              href="/dashboard"
              data-testid="open-dashboard-btn"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${
                redirectFrom
                  ? 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              } active:scale-95 font-medium text-sm transition`}
            >
              <Icons.dashboard size={16} />
              <span>Buka Dashboard Aplikasi</span>
            </Link>

            <button
              data-testid="reactivate-btn"
              type="button"
              onClick={() => {
                setIsReactivating(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-300 font-medium text-sm transition"
            >
              <Icons.refresh size={16} />
              <span>Ganti Kunci / Aktivasi Ulang</span>
            </button>
          </div>
        </div>
      )}

      {/* Activation Form Card (shown when inactive or reactivating) */}
      {(!isCurrentlyActive || isReactivating) && (
        <div data-testid="activation-form-card" className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icons.key size={20} className="text-blue-500" />
              <span>Masukkan Kunci Lisensi</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Ketik atau tempel kunci lisensi yang Anda peroleh saat pembelian aplikasi Ficco.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              data-testid="activation-error-alert"
              role="alert"
              className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm animate-shake"
            >
              <Icons.alertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">
                  {errorCode === 'ALREADY_USED'
                    ? 'Lisensi Sudah Pernah Digunakan'
                    : errorCode === 'NOT_FOUND'
                    ? 'Kunci Lisensi Tidak Ditemukan'
                    : errorCode === 'INVALID_FORMAT'
                    ? 'Format Kunci Tidak Sesuai'
                    : 'Aktivasi Gagal'}
                </span>
                <p className="text-xs opacity-90 leading-relaxed">{error}</p>
                {errorCode === 'ALREADY_USED' && (
                  <p className="text-xs text-rose-500 dark:text-rose-400/80 mt-1">
                    Kunci lisensi Ficco bersifat single-device. Silakan hubungi admin jika Anda telah berpindah perangkat.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="licenseKey"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300"
                >
                  Kunci Lisensi (License Key) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <CopyIcon size={12} />
                  <span>Tempel dari Clipboard</span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="licenseKey"
                  data-testid="license-key-input"
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="FCC-XXXX-XXXX-XXXX-XXXX"
                  aria-invalid={Boolean(errors.licenseKey)}
                  {...register('licenseKey')}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border ${
                    errors.licenseKey
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500'
                  } font-mono text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-4 transition`}
                />
              </div>

              {errors.licenseKey && (
                <p data-testid="license-key-error" className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <Icons.alertCircle size={12} />
                  <span>{errors.licenseKey.message}</span>
                </p>
              )}

              <p className="text-xs text-slate-400 dark:text-zinc-500">
                Format: 12-64 karakter alfanumerik (contoh: FCC-ABCD-1234-EFGH-5678).
              </p>
            </div>

            {/* Device Fingerprint Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Icons.shield size={14} className="text-slate-400" />
                <span>ID Perangkat Anda:</span>
                <span
                  data-testid="device-fingerprint-display"
                  suppressHydrationWarning
                  className="font-mono font-medium text-slate-700 dark:text-zinc-300"
                >
                  {deviceId || 'DEV-INITIALIZING'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Akan dikaitkan otomatis
              </span>
            </div>

            {/* Submit & Cancel Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                data-testid="activate-license-submit-btn"
                type="submit"
                disabled={isActivating}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 disabled:pointer-events-none text-white font-medium text-sm transition shadow-sm"
              >
                {isActivating ? (
                  <>
                    <Icons.loader size={16} className="animate-spin" />
                    <span>Sedang Memverifikasi Lisensi...</span>
                  </>
                ) : (
                  <>
                    <Icons.key size={16} />
                    <span>Aktivasi Perangkat Sekarang</span>
                  </>
                )}
              </button>

              {isReactivating && (
                <button
                  type="button"
                  onClick={() => setIsReactivating(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-sm font-medium transition"
                >
                  Batal
                </button>
              )}

              {activatedLicense && !isReactivating && (
                <button
                  type="button"
                  onClick={() => clearActivation()}
                  className="px-3 py-2 text-xs text-rose-500 hover:underline"
                >
                  Hapus Cache Lisensi
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Feature & FAQ Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
            <Icons.shield size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            100% Local-First & Privat
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Data transaksi, faktur, dan pelanggan tersimpan aman di IndexedDB browser Anda. Server hanya memvalidasi kunci lisensi saat aktivasi pertama.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
            <Icons.wifiOff size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Operasional Offline Bebas
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Setelah perangkat teraktivasi, Anda dapat menggunakan seluruh fitur pembuatan invoice dan pencatatan pengeluaran tanpa sambungan internet.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
            <Icons.key size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Satu Lisensi Satu Perangkat
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Kunci lisensi mengikat ID perangkat Anda secara unik saat aktivasi untuk memastikan lisensi komersial digunakan secara tertib.
          </p>
        </div>
      </div>
    </div>
  );
}
