'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Product, COMMON_UNITS } from '../_types/product.types';
import { ProductFormData } from '../_schemas/product.schemas';
import { Icons } from '@/shared/_components/icons';
import { AppSelect } from '@/shared';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  editingProduct,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      unit: 'pcs',
      price: 0,
      taxRate: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        sku: editingProduct.sku ?? '',
        description: editingProduct.description ?? '',
        unit: editingProduct.unit,
        price: editingProduct.price,
        taxRate: editingProduct.taxRate,
        active: editingProduct.active,
      });
    } else {
      reset({
        name: '',
        sku: '',
        description: '',
        unit: 'pcs',
        price: 0,
        taxRate: 0,
        active: true,
      });
    }
  }, [editingProduct, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingProduct ? 'Edit Produk / Layanan' : 'Tambah Produk / Layanan Baru'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {editingProduct
                ? 'Perbarui harga, unit, atau informasi katalog'
                : 'Daftarkan item atau jasa baru ke katalog lokal Anda'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Icons.close size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Nama Produk / Layanan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Nama produk/layanan wajib diisi' })}
              placeholder="Contoh: Jasa Konsultasi IT / Lisensi Software"
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* SKU & Unit (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Kode SKU / Part No. (Opsional)
              </label>
              <input
                type="text"
                {...register('sku')}
                placeholder="Contoh: SRV-001"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Satuan Unit <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="unit"
                control={control}
                rules={{ required: 'Satuan unit wajib dipilih' }}
                render={({ field }) => (
                  <AppSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={COMMON_UNITS}
                    placeholder="Pilih Satuan"
                    className="w-full"
                    status={errors.unit ? 'error' : undefined}
                  />
                )}
              />
              {errors.unit && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.unit.message}</p>
              )}
            </div>
          </div>

          {/* Price & Tax Rate (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Harga Satuan (IDR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  {...register('price', {
                    required: 'Harga wajib diisi',
                    min: { value: 0, message: 'Harga tidak boleh negatif' },
                  })}
                  placeholder="0"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              {errors.price && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Tarif PPN / Pajak Default (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  {...register('taxRate', {
                    min: { value: 0, message: 'Minimal 0%' },
                    max: { value: 100, message: 'Maksimal 100%' },
                  })}
                  placeholder="Contoh: 11"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-8"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              {errors.taxRate && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.taxRate.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Deskripsi Item (Opsional)
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Rincian fitur, cakupan kerja, spesifikasi barang/jasa..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Active Status Checkbox */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">
                Status Aktif
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Item aktif dapat langsung dipilih saat membuat faktur baru.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('active')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icons.check size={16} />
                  <span>{editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
