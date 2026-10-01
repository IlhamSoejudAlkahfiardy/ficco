'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import {
  ExpenseWithCategory,
  ExpenseCategory,
  EXPENSE_PAYMENT_METHODS,
} from '../_types/expense.types';
import { expenseSchema, ExpenseFormData } from '../_schemas/expense.schemas';
import { AppSelect } from '@/shared/_components/select';
import { Icons } from '@/shared/_components/icons';
import { isDevelopmentMode } from '@/shared/_utils/env';

interface ExpenseFormModalProps {
  isOpen: boolean;
  editingExpense: ExpenseWithCategory | null;
  categories: ExpenseCategory[];
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onOpenCategoryManager: () => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  editingExpense,
  categories,
  onClose,
  onSubmit,
  onOpenCategoryManager,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeCategories = categories.filter((c) => c.active);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      categoryId: '',
      paymentMethod: 'bank_transfer',
      description: '',
      notes: '',
    },
  });

  const currentAmount = watch('amount');

  // Format currency helper
  const formatRupiahPreview = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  useEffect(() => {
    if (editingExpense) {
      reset({
        date: editingExpense.date,
        amount: editingExpense.amount,
        categoryId: editingExpense.categoryId,
        paymentMethod: editingExpense.paymentMethod,
        description: editingExpense.description,
        notes: editingExpense.notes || '',
      });
    } else {
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        categoryId: activeCategories.length > 0 ? activeCategories[0].id : '',
        paymentMethod: 'bank_transfer',
        description: '',
        notes: '',
      });
    }
    setSubmitError(null);
  }, [editingExpense, reset, isOpen]);

  const handleFormSubmit = async (data: ExpenseFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const validated = expenseSchema.parse(data);
      await onSubmit(validated);
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message || 'Terjadi kesalahan saat menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevFill = () => {
    const samples = [
      { desc: 'Beli Kertas HVS & Tinta Printer', amt: 350000, cat: 'Operasional', method: 'cash' },
      { desc: 'Langganan Google Workspace Bulanan', amt: 210000, cat: 'Software', method: 'credit_card' },
      { desc: 'Biaya Iklan Facebook & Instagram Ads', amt: 1200000, cat: 'Pemasaran', method: 'credit_card' },
      { desc: 'Servis AC Ruang Kerja & Pembersihan', amt: 450000, cat: 'Pemeliharaan', method: 'bank_transfer' },
      { desc: 'Konsumsi Rapat Evaluasi Bulanan', amt: 175000, cat: 'Operasional', method: 'qris' },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    const matchingCat = categories.find((c) => c.name.toLowerCase().includes(picked.cat.toLowerCase())) || categories[0];

    setValue('description', picked.desc, { shouldValidate: true });
    setValue('amount', picked.amt, { shouldValidate: true });
    setValue('date', format(new Date(), 'yyyy-MM-dd'), { shouldValidate: true });
    setValue('paymentMethod', picked.method, { shouldValidate: true });
    if (matchingCat) {
      setValue('categoryId', matchingCat.id, { shouldValidate: true });
    }
    setValue('notes', 'Pengeluaran operasional (Auto-Generated).', { shouldValidate: true });
  };

  if (!isOpen) return null;

  const categoryOptions = activeCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const paymentMethodOptions = EXPENSE_PAYMENT_METHODS.map((m) => ({
    value: m.value,
    label: m.label,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
              <Icons.expenses size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExpense ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {editingExpense
                  ? 'Perbarui rincian atau nominal transaksi pengeluaran'
                  : 'Catat beban operasional lokal ke dalam IndexedDB'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDevelopmentMode() && (
              <button
                type="button"
                onClick={handleDevFill}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1"
                title="Isi data contoh cepat untuk testing"
              >
                <Icons.zap size={13} />
                <span>Dev Sample</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Icons.close size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-sm"
        >
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <Icons.alertTriangle size={16} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Row 1: Tanggal & Jumlah (Amount) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Tanggal Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('date', { required: 'Tanggal pengeluaran wajib diisi.' })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500 transition-colors"
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-xs text-rose-500">{errors.date.message}</p>
              )}
            </div>

            {/* Nominal (Amount) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                {currentAmount > 0 && (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {formatRupiahPreview(currentAmount)}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-zinc-500 select-none">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  {...register('amount', {
                    required: 'Nominal pengeluaran wajib diisi.',
                    min: { value: 1, message: 'Nominal minimal Rp 1.' },
                  })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500 transition-colors"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Kategori & Metode Pembayaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Icons.settings size={12} />
                  <span>Kelola</span>
                </button>
              </div>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Kategori pengeluaran wajib dipilih.' }}
                render={({ field }) => (
                  <AppSelect
                    options={categoryOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Pilih kategori pengeluaran"
                    className="w-full"
                  />
                )}
              />
              {errors.categoryId && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Metode Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Metode Pembayaran <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="paymentMethod"
                control={control}
                rules={{ required: 'Metode pembayaran wajib dipilih.' }}
                render={({ field }) => (
                  <AppSelect
                    options={paymentMethodOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Pilih metode pembayaran"
                    className="w-full"
                  />
                )}
              />
              {errors.paymentMethod && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Deskripsi Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Pembayaran internet Indihome kantor bulan Oktober"
              {...register('description', { required: 'Deskripsi pengeluaran wajib diisi.' })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500 transition-colors"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Catatan Tambahan (Notes) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Catatan / Nomor Struk (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Nomor kuitansi, nama vendor, tautan berkas struk, atau catatan internal lainnya..."
              {...register('notes')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500 transition-colors resize-none"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-rose-500">{errors.notes.message}</p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icons.check size={16} />
                  <span>{editingExpense ? 'Simpan Perubahan' : 'Catat Pengeluaran'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
