'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { AppSelect } from '@/shared/_components/select';
import { Icons } from '@/shared/_components/icons';
import { PAYMENT_METHODS } from '../_types/payment.types';
import { PaymentFormData, paymentSchema } from '../_schemas/payment.schemas';
import { PaymentService } from '../_services/payment-service';
import { isDevelopmentMode } from '@/shared/_utils/env';
import { generatePaymentDummy } from '@/shared/_utils/dev-data-generator';

interface PaymentModalProps {
  isOpen: boolean;
  invoiceId: string;
  invoiceNumber: string;
  customerName?: string;
  totalAmount: number;
  remainingBalance: number;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  invoiceId,
  invoiceNumber,
  customerName,
  totalAmount,
  remainingBalance,
  onClose,
  onPaymentSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      invoiceId,
      amount: remainingBalance > 0 ? remainingBalance : 0,
      paymentDate: todayStr,
      paymentMethod: 'Transfer Bank',
      notes: '',
    },
  });

  // Reset form when modal opens or invoice changes
  useEffect(() => {
    if (isOpen) {
      reset({
        invoiceId,
        amount: remainingBalance > 0 ? remainingBalance : 0,
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'Transfer Bank',
        notes: '',
      });
      setErrorMessage(null);
    }
  }, [isOpen, invoiceId, remainingBalance, reset]);

  const watchedAmount = watch('amount');

  // Quick action: set full remaining balance
  const handleSetFullPayment = () => {
    setValue('amount', Math.max(0, remainingBalance));
  };

  const handleGenerateDummy = () => {
    const dummy = generatePaymentDummy(invoiceId, remainingBalance);
    setValue('amount', dummy.amount, { shouldValidate: true });
    setValue('paymentMethod', dummy.paymentMethod, { shouldValidate: true });
    setValue('paymentDate', dummy.paymentDate, { shouldValidate: true });
    setValue('notes', dummy.notes, { shouldValidate: true });
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const validated = paymentSchema.safeParse(data);
      if (!validated.success) {
        setErrorMessage(validated.error.issues[0]?.message || 'Data pembayaran tidak valid.');
        setIsSubmitting(false);
        return;
      }

      await PaymentService.recordPayment(validated.data);

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to record payment', err);
      setErrorMessage((err as Error).message || 'Gagal menyimpan pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const paymentMethodOptions = PAYMENT_METHODS.map((method) => ({
    value: method,
    label: method,
  }));

  const isOverpaying = Number(watchedAmount) > remainingBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Icons.creditCard size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Catat Pembayaran
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Faktur: <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">{invoiceNumber}</span>
                {customerName && ` • ${customerName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDevelopmentMode() && (
              <button
                type="button"
                onClick={handleGenerateDummy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
                title="Mode Development: Isi data pembayaran dummy otomatis"
              >
                <Icons.zap size={13} />
                <span>Generate Data</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Icons.close size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Balance Summary Banner */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 dark:text-zinc-400">Total Tagihan:</span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5 text-sm">
              Rp {totalAmount.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 dark:text-zinc-400">Sisa Tagihan Saat Ini:</span>
            <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 text-sm">
              Rp {remainingBalance.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <Icons.alertTriangle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Jumlah Pembayaran (Rp) <span className="text-rose-500">*</span>
              </label>
              {remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={handleSetFullPayment}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Lunasi Penuh (Rp {remainingBalance.toLocaleString('id-ID')})
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              step="any"
              {...register('amount', {
                required: 'Jumlah pembayaran wajib diisi',
                valueAsNumber: true,
                min: { value: 1, message: 'Jumlah pembayaran minimal Rp 1' },
              })}
              className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="0"
              autoFocus
            />
            {errors.amount && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.amount.message}</p>
            )}
            {isOverpaying && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                <Icons.alertTriangle size={13} />
                Jumlah pembayaran melebihi sisa tagihan saat ini.
              </p>
            )}
          </div>

          {/* Payment Date & Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Tanggal Pembayaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('paymentDate', { required: 'Tanggal pembayaran wajib diisi' })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.paymentDate && (
                <p className="text-xs text-rose-500 mt-1">{errors.paymentDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Metode Pembayaran <span className="text-rose-500">*</span>
              </label>
              <Controller
                control={control}
                name="paymentMethod"
                rules={{ required: 'Metode pembayaran wajib dipilih' }}
                render={({ field }) => (
                  <AppSelect
                    placeholder="Pilih metode..."
                    options={paymentMethodOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    className="w-full"
                  />
                )}
              />
              {errors.paymentMethod && (
                <p className="text-xs text-rose-500 mt-1">{errors.paymentMethod.message}</p>
              )}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Catatan / Nomor Referensi (Opsional)
            </label>
            <textarea
              rows={3}
              {...register('notes')}
              placeholder="Contoh: No. Ref: BCA-20260928-8921 / Pelunasan termin 1..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icons.check size={14} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
