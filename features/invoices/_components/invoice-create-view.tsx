'use client';

import React from 'react';
import Link from 'next/link';
import { Controller } from 'react-hook-form';
import { useInvoiceForm } from '../_hooks/use-invoice-form';
import { AppSelect } from '@/shared/_components/select';
import { Icons } from '@/shared/_components/icons';
import { CustomerFormModal } from '@/features/customers/_components/customer-form-modal';
import { CustomerService } from '@/features/customers/_services/customer-service';
import { CustomerFormData } from '@/features/customers/_schemas/customer.schemas';
import { calculateLineItem } from '../_utils/invoice-calculations';

export const InvoiceCreateView: React.FC = () => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    errors,
    fields,
    handleAddItem,
    handleRemoveItem,
    handleSelectProduct,
    setDueDatePreset,
    refreshInvoiceNumber,
    saveInvoice,
    isLoadingInit,
    isSubmitting,
    submitError,
    customers,
    products,
    selectedCustomer,
    refreshCustomers,
    watchedItems,
    watchedDiscount,
    watchedIssueDate,
    watchedDueDate,
    watchedStatus,
    totals,
    isNewCustomerModalOpen,
    setIsNewCustomerModalOpen,
    isCreatingCustomer,
    setIsCreatingCustomer,
  } = useInvoiceForm();

  // Handle Quick Customer creation
  const handleQuickCreateCustomer = async (data: CustomerFormData) => {
    setIsCreatingCustomer(true);
    try {
      const created = await CustomerService.create(data);
      await refreshCustomers(created.id);
      setIsNewCustomerModalOpen(false);
      return true;
    } catch (err) {
      console.error('Failed to create customer', err);
      return false;
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Customer options for AppSelect
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name}${c.companyName ? ` — (${c.companyName})` : ''}`,
  }));

  // Product options for AppSelect
  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} (Rp ${p.price.toLocaleString('id-ID')}/${p.unit})`,
  }));

  if (isLoadingInit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          Memuat formulir faktur dan nomor urut lokal...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            title="Kembali ke Daftar Faktur"
          >
            <Icons.arrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Buat Faktur Baru
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                Lokal IndexedDB
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Terbitkan faktur profesional dan simpan secara privat di perangkat Anda.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => saveInvoice('draft')}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-xs disabled:opacity-50"
          >
            {isSubmitting && watchedStatus === 'draft' ? 'Menyimpan...' : 'Simpan Draf'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => saveInvoice('sent')}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Icons.check size={16} />
            <span>{isSubmitting && watchedStatus === 'sent' ? 'Menerbitkan...' : 'Terbitkan Faktur'}</span>
          </button>
        </div>
      </div>

      {/* Submit Error Alert */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 flex items-start gap-3 animate-in shake duration-200">
          <Icons.alertTriangle size={20} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="text-sm">
            <p className="font-semibold">Gagal Menyimpan Faktur</p>
            <p className="mt-0.5 text-rose-700 dark:text-rose-300/90">{submitError}</p>
          </div>
        </div>
      )}

      {/* Section 1: Customer Selection & Invoice Identifiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Select Card (2 Cols on lg) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icons.user size={16} className="text-blue-600 dark:text-blue-400" />
              Pilih Pelanggan / Klien <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Icons.plus size={14} />
              + Pelanggan Baru
            </button>
          </div>

          <Controller
            control={control}
            name="customerId"
            rules={{ required: 'Pelanggan wajib dipilih' }}
            render={({ field }) => (
              <AppSelect
                placeholder="Cari atau pilih pelanggan..."
                options={customerOptions}
                value={field.value || undefined}
                onChange={(val) => field.onChange(val)}
                className="w-full"
                status={errors.customerId ? 'error' : undefined}
                allowClear
              />
            )}
          />

          {errors.customerId && (
            <p className="text-xs text-rose-500 font-medium">
              {errors.customerId.message}
            </p>
          )}

          {/* Selected Customer Preview Card */}
          {selectedCustomer ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 space-y-2 text-xs text-slate-600 dark:text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.companyName && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium text-slate-700 dark:text-zinc-300">
                    {selectedCustomer.companyName}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-500 dark:text-zinc-400">
                {selectedCustomer.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Icons.mail size={14} className="shrink-0 text-slate-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Icons.phone size={14} className="shrink-0 text-slate-400" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-1.5 truncate sm:col-span-2">
                    <Icons.mapPin size={14} className="shrink-0 text-slate-400" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400 dark:text-zinc-500">
              Pilih kontak pelanggan untuk mengisi otomatis alamat dan tujuan penagihan faktur.
            </div>
          )}
        </div>

        {/* Invoice Number & Dates Card (1 Col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Nomor Faktur
            </label>
            <button
              type="button"
              onClick={refreshInvoiceNumber}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              title="Perbarui nomor urut dari IndexedDB"
            >
              <Icons.refresh size={12} />
              Segarkan
            </button>
          </div>

          <div>
            <input
              type="text"
              {...register('invoiceNumber', { required: 'Nomor faktur wajib diisi' })}
              className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.invoiceNumber && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.invoiceNumber.message}
              </p>
            )}
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Tgl Terbit
              </label>
              <input
                type="date"
                {...register('issueDate', { required: 'Tanggal terbit wajib diisi' })}
                className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Jatuh Tempo
              </label>
              <input
                type="date"
                {...register('dueDate', { required: 'Tanggal jatuh tempo wajib diisi' })}
                className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          {errors.dueDate && (
            <p className="text-xs text-rose-500 font-medium">{errors.dueDate.message}</p>
          )}

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-1.5">
              Jatuh Tempo Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[7, 14, 30, 45].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDueDatePreset(days)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 transition-colors"
                >
                  +{days} Hari
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Line Items Dynamic Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Rincian Item & Jasa
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Tambahkan produk dari katalog atau masukkan deskripsi item kustom.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800 flex items-center gap-1.5 transition-colors self-start"
          >
            <Icons.plus size={14} />
            <span>Tambah Baris Item</span>
          </button>
        </div>

        {/* Items Container */}
        <div className="space-y-4">
          {fields.map((field, index) => {
            const watchedItem = watchedItems?.[index] || {
              quantity: 1,
              unitPrice: 0,
              discount: 0,
              taxRate: 0,
            };

            const lineCalc = calculateLineItem({
              description: watchedItem.description || '',
              quantity: Number(watchedItem.quantity) || 0,
              unitPrice: Number(watchedItem.unitPrice) || 0,
              discount: Number(watchedItem.discount) || 0,
              taxRate: Number(watchedItem.taxRate) || 0,
            });

            return (
              <div
                key={field.id}
                className="p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors space-y-3"
              >
                {/* Row 1: Product Selector & Item Description */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Catalog product selector */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                      Katalog Produk (Opsional)
                    </label>
                    <AppSelect
                      placeholder="Pilih dari katalog..."
                      options={productOptions}
                      value={watchedItem.productId || undefined}
                      onChange={(val) => handleSelectProduct(index, val)}
                      className="w-full"
                      allowClear
                    />
                  </div>

                  {/* Description input */}
                  <div className="md:col-span-8">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                      Deskripsi Item / Jasa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.description`, {
                        required: 'Deskripsi wajib diisi',
                      })}
                      placeholder="Contoh: Pembuatan Website E-Commerce..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-[11px] text-rose-500 mt-0.5">
                        {errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Numerical figures (Qty, Price, Discount, Tax, Total, Action) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-12 gap-3 items-end pt-1">
                  {/* Qty */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                      Kuantitas
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        min: 0.0001,
                      })}
                      className="w-full px-2.5 py-1.5 text-xs text-right font-medium rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                      Harga Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                        min: 0,
                      })}
                      className="w-full px-2.5 py-1.5 text-xs text-right font-medium rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Item Discount */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                      Diskon (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      {...register(`items.${index}.discount`, {
                        valueAsNumber: true,
                        min: 0,
                      })}
                      className="w-full px-2.5 py-1.5 text-xs text-right font-medium rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Tax Rate % */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                      PPN (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...register(`items.${index}.taxRate`, {
                        valueAsNumber: true,
                        min: 0,
                        max: 100,
                      })}
                      className="w-full px-2.5 py-1.5 text-xs text-right font-medium rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Line Total Live Box */}
                  <div className="md:col-span-2">
                    <span className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                      Total Item
                    </span>
                    <div className="px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 rounded-lg text-right truncate">
                      Rp {lineCalc.total.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Delete Item Button */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={fields.length <= 1}
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Hapus baris item"
                    >
                      <Icons.trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Notes & Live Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Notes & Instructions (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
              Catatan & Instruksi Pembayaran
            </label>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Informasi rekening bank, instruksi transfer, atau syarat dan ketentuan penagihan.
            </p>
          </div>

          <textarea
            rows={5}
            {...register('notes')}
            placeholder="Contoh: Silakan transfer ke Bank Mandiri No. Rek: 123-00-09876543-2 a.n PT Bisnis Sukses..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
          />
        </div>

        {/* Live Calculation Summary (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-900 dark:to-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-200/60 dark:border-zinc-800">
            Ringkasan Finansial
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Subtotal Item:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Rp {totals.subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {totals.lineItemDiscountsTotal > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Diskon Item:</span>
                <span className="font-semibold">
                  - Rp {totals.lineItemDiscountsTotal.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Global Invoice Discount Input */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-slate-600 dark:text-zinc-400">Diskon Faktur (Rp):</span>
              <input
                type="number"
                min="0"
                {...register('discount', { valueAsNumber: true, min: 0 })}
                className="w-32 px-2.5 py-1 text-right text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Rp {totals.taxableAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Total PPN / Pajak:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Rp {totals.totalTax.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Grand Total Divider */}
            <div className="pt-3 border-t-2 border-slate-200 dark:border-zinc-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Grand Total:
              </span>
              <div className="text-right">
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                  Rp {totals.grandTotal.toLocaleString('id-ID')}
                </span>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {totals.lineItems.length} baris item tagihan
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="pt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => saveInvoice('sent')}
              className="w-full py-3 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Icons.check size={18} />
              <span>{isSubmitting ? 'Menyimpan Faktur...' : 'Terbitkan & Simpan Faktur'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => saveInvoice('draft')}
              className="w-full py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Simpan sebagai Draf Sementara
            </button>
          </div>
        </div>
      </div>

      {/* Quick Customer Creation Modal */}
      <CustomerFormModal
        isOpen={isNewCustomerModalOpen}
        editingCustomer={null}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={handleQuickCreateCustomer}
        isSubmitting={isCreatingCustomer}
      />
    </div>
  );
};
