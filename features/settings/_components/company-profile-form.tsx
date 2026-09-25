'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { CompanyProfile, DEFAULT_CURRENCIES } from '../_types/settings.types';
import { CompanyProfileFormData } from '../_schemas/settings.schemas';
import { LogoUploader } from './logo-uploader';
import { AppSelect } from '@/shared';

interface CompanyProfileFormProps {
  initialData: CompanyProfile | null;
  onSubmit: (data: CompanyProfileFormData) => Promise<boolean>;
  isSaving: boolean;
}

export const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({
  initialData,
  onSubmit,
  isSaving,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CompanyProfileFormData>({
    defaultValues: {
      name: initialData?.name ?? 'Bisnis Saya',
      legalName: initialData?.legalName ?? '',
      taxNumber: initialData?.taxNumber ?? '',
      currency: initialData?.currency ?? 'IDR',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      address: initialData?.address ?? '',
      logo: initialData?.logo ?? '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        legalName: initialData.legalName ?? '',
        taxNumber: initialData.taxNumber ?? '',
        currency: initialData.currency,
        email: initialData.email ?? '',
        phone: initialData.phone ?? '',
        address: initialData.address ?? '',
        logo: initialData.logo ?? '',
      });
    }
  }, [initialData, reset]);

  const companyNameWatch = watch('name');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload Section */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
          Logo Perusahaan / Bisnis
        </label>
        <Controller
          name="logo"
          control={control}
          render={({ field }) => (
            <LogoUploader
              value={field.value}
              onChange={field.onChange}
              onRemove={() => field.onChange('')}
              companyName={companyNameWatch}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Business Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Nama Bisnis / Brand <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('name', { required: 'Nama bisnis wajib diisi' })}
            placeholder="Contoh: Acme Studio"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Legal Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Nama Badan Usaha (Opsional)
          </label>
          <input
            type="text"
            {...register('legalName')}
            placeholder="Contoh: PT Acme Kreasi Digital"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tax Number / NPWP */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            NPWP / Tax ID (Opsional)
          </label>
          <input
            type="text"
            {...register('taxNumber')}
            placeholder="00.000.000.0-000.000"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Mata Uang Utama <span className="text-rose-500">*</span>
          </label>
          <Controller
            name="currency"
            control={control}
            rules={{ required: 'Mata uang wajib dipilih' }}
            render={({ field }) => (
              <AppSelect
                value={field.value}
                onChange={field.onChange}
                options={DEFAULT_CURRENCIES.map((c) => ({
                  label: c.label,
                  value: c.code,
                }))}
                placeholder="Pilih mata uang"
                className="w-full"
                status={errors.currency ? 'error' : undefined}
              />
            )}
          />
          {errors.currency && (
            <p className="text-xs text-rose-500 mt-1">{errors.currency.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Email Kontak
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="billing@acmestudio.com"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Nomor Telepon / WhatsApp
          </label>
          <input
            type="tel"
            {...register('phone')}
            placeholder="08123456789"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
          Alamat Lengkap Kantor / Usaha
        </label>
        <textarea
          rows={3}
          {...register('address')}
          placeholder="Jl. Sudirman No. 123, Jakarta Selatan, 12190"
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
          {isSaving ? 'Menyimpan ke IndexedDB...' : 'Simpan Profil Bisnis'}
        </button>
      </div>
    </form>
  );
};
