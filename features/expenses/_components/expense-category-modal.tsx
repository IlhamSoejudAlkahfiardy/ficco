'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ExpenseCategory } from '../_types/expense.types';
import {
  expenseCategorySchema,
  ExpenseCategoryFormData,
} from '../_schemas/expense.schemas';
import { Icons } from '@/shared/_components/icons';

interface ExpenseCategoryModalProps {
  isOpen: boolean;
  categories: ExpenseCategory[];
  onClose: () => void;
  onCreateCategory: (data: ExpenseCategoryFormData) => Promise<void>;
  onUpdateCategory: (id: string, data: ExpenseCategoryFormData) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({
  isOpen,
  categories,
  onClose,
  onCreateCategory,
  onUpdateCategory,
  onToggleActive,
  onDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseCategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      active: true,
    },
  });

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingCategory(null);
    setIsAddingNew(true);
    setErrorMsg(null);
    reset({ name: '', description: '', active: true });
  };

  const handleStartEdit = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setIsAddingNew(true);
    setErrorMsg(null);
    reset({
      name: cat.name,
      description: cat.description || '',
      active: cat.active,
    });
  };

  const handleCancelForm = () => {
    setIsAddingNew(false);
    setEditingCategory(null);
    setErrorMsg(null);
    reset();
  };

  const handleFormSubmit = async (data: ExpenseCategoryFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const validated = expenseCategorySchema.parse(data);
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, validated);
      } else {
        await onCreateCategory(validated);
      }
      handleCancelForm();
    } catch (err) {
      setErrorMsg((err as Error).message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onDeleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Gagal menghapus kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <Icons.tag size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kelola Kategori Pengeluaran
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Atur klasifikasi beban usaha untuk laporan dan filter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingNew && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Icons.plus size={14} />
                <span>Tambah Kategori</span>
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <Icons.alertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Delete confirmation sub-modal / alert */}
          {deleteTarget && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                <Icons.alertTriangle size={16} />
                <span>Konfirmasi Hapus Kategori</span>
              </div>
              <p className="text-slate-600 dark:text-zinc-300">
                Apakah Anda yakin ingin menghapus kategori{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  &ldquo;{deleteTarget.name}&rdquo;
                </strong>
                ? Penghapusan hanya dapat dilakukan jika kategori tidak memiliki riwayat transaksi.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          )}

          {/* Inline Form (Create or Edit) */}
          {isAddingNew && (
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-blue-200 dark:border-blue-900/60 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  {editingCategory ? 'Edit Kategori' : 'Kategori Baru'}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Disimpan langsung ke IndexedDB
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Nama Kategori <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Operasional Kantor"
                    {...register('name', { required: 'Nama kategori wajib diisi.' })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  {errors.name && (
                    <p className="mt-1 text-[11px] text-rose-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Deskripsi Singkat (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Keterangan pengeluaran terkait..."
                    {...register('description')}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-zinc-300 select-none">
                  <input
                    type="checkbox"
                    {...register('active')}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Aktifkan kategori untuk transaksi baru</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {isSubmitting ? (
                      'Menyimpan...'
                    ) : (
                      <>
                        <Icons.check size={14} />
                        <span>{editingCategory ? 'Perbarui' : 'Simpan Kategori'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Category List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-1">
              Daftar Kategori ({categories.length})
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                <Icons.tag size={28} className="mx-auto mb-2 opacity-60" />
                <p className="text-xs">Belum ada kategori pengeluaran.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {cat.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            cat.active
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                          }`}
                        >
                          {cat.active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleActive(cat.id, !cat.active)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          cat.active
                            ? 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={cat.active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {cat.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Kategori"
                      >
                        <Icons.edit size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus Kategori"
                      >
                        <Icons.trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
