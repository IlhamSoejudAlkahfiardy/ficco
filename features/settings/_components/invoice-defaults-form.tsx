'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { InvoiceDefaults } from '../_types/settings.types';
import { InvoiceDefaultsFormData } from '../_schemas/settings.schemas';

interface InvoiceDefaultsFormProps {
  initialData: InvoiceDefaults;
  onSubmit: (data: InvoiceDefaultsFormData) => Promise<boolean>;
  isSaving: boolean;
}

export const InvoiceDefaultsForm: React.FC<InvoiceDefaultsFormProps> = ({
  initialData,
  onSubmit,
  isSaving,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InvoiceDefaultsFormData>({
    defaultValues: {
      prefix: initialData.prefix,
      nextNumber: initialData.nextNumber,
      dueDays: initialData.dueDays,
      taxRate: initialData.taxRate,
      notes: initialData.notes ?? '',
      paymentInstructions: initialData.paymentInstructions ?? '',
    },
  });

  useEffect(() => {
    reset({
      prefix: initialData.prefix,
      nextNumber: initialData.nextNumber,
      dueDays: initialData.dueDays,
      taxRate: initialData.taxRate,
      notes: initialData.notes ?? '',
      paymentInstructions: initialData.paymentInstructions ?? '',
    });
  }, [initialData, reset]);

  const prefixWatch = watch('prefix') || 'INV';
  const nextNumWatch = watch('nextNumber') || 1;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Numbering Preview Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            Preview Format Nomor Faktur Selanjutnya:
          </span>
          <p className="font-mono text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {prefixWatch.toUpperCase()}-{new Date().getFullYear()}-{String(nextNumWatch).padStart(4, '0')}
          </p>
        </div>
        <span className="text-[11px] text-slate-400 px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
          Otomatis bertambah
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prefix */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Awalan / Prefix Faktur <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('prefix', { required: 'Prefix faktur wajib diisi' })}
            placeholder="INV"
            className="w-full px-3.5 py-2 text-sm uppercase rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.prefix && (
            <p className="text-xs text-rose-500 mt-1">{errors.prefix.message}</p>
          )}
        </div>

        {/* Next Number */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Nomor Urut Berikutnya <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            {...register('nextNumber', { required: 'Nomor berikutnya wajib diisi' })}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nextNumber && (
            <p className="text-xs text-rose-500 mt-1">{errors.nextNumber.message}</p>
          )}
        </div>

        {/* Due Days Offset */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Jangka Waktu Jatuh Tempo Default (Hari)
          </label>
          <input
            type="number"
            min={0}
            max={365}
            {...register('dueDays')}
            placeholder="14"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Contoh: 14 hari setelah tanggal faktur diterbitkan.
          </p>
        </div>

        {/* Default Tax Rate */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Tarif Pajak Default / PPN (%)
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={100}
            {...register('taxRate')}
            placeholder="11"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Default tarif pajak barang/jasa saat membuat faktur baru.
          </p>
        </div>
      </div>

      {/* Default Payment Instructions */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
          Instruksi Rekening & Pembayaran Default
        </label>
        <textarea
          rows={3}
          {...register('paymentInstructions')}
          placeholder="Transfer Bank:\nBank BCA No. Rekening: 123456789 a/n Nama Anda"
          className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Instruksi ini akan otomatis tercetak pada invoice PDF dan halaman faktur pelanggan.
        </p>
      </div>

      {/* Default Invoice Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
          Catatan Kaki Faktur Default
        </label>
        <textarea
          rows={2}
          {...register('notes')}
          placeholder="Terima kasih atas kerja samanya."
          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isSaving ? 'Menyimpan ke IndexedDB...' : 'Simpan Default Faktur'}
        </button>
      </div>
    </form>
  );
};
