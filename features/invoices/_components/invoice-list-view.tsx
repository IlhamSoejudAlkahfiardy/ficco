'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { invoiceRepository } from '@/infrastructure/database/repositories/invoice-repository';
import { customerRepository } from '@/infrastructure/database/repositories/customer-repository';
import { Invoice, Customer, InvoiceStatus } from '@/infrastructure/database/schema';
import { INVOICE_STATUS_CONFIG } from '../_types/invoice.types';
import { InvoiceDomainService } from '../_services/invoice-domain-service';
import { PaymentService } from '../_services/payment-service';
import { InvoiceDetailDrawer } from './invoice-detail-drawer';
import { PaymentModal } from './payment-modal';
import { AppSelect } from '@/shared/_components/select';
import { Icons } from '@/shared/_components/icons';

interface InvoiceWithCustomer {
  invoice: Invoice;
  customer?: Customer;
}

export type InvoiceSortBy =
  | 'created_desc'
  | 'created_asc'
  | 'due_asc'
  | 'total_desc'
  | 'total_asc';

export const InvoiceListView: React.FC = () => {
  const [allInvoices, setAllInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<InvoiceSortBy>('created_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Detail Drawer state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<InvoiceWithCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Quick Payment Modal state
  const [paymentTarget, setPaymentTarget] = useState<{
    invoice: Invoice;
    customerName?: string;
    remainingBalance: number;
  } | null>(null);

  const handleOpenPayment = async (item: InvoiceWithCustomer) => {
    const summary = await PaymentService.getSummary(item.invoice.id);
    setPaymentTarget({
      invoice: item.invoice,
      customerName: item.customer?.name,
      remainingBalance: summary?.remainingBalance ?? item.invoice.total,
    });
  };

  // Load all invoices and customers from IndexedDB
  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invoices, customers] = await Promise.all([
        invoiceRepository.getAll(),
        customerRepository.getAll(),
      ]);

      const customerMap = new Map(customers.map((c) => [c.id, c]));

      const mapped = invoices.map((inv) => ({
        invoice: inv,
        customer: customerMap.get(inv.customerId),
      }));

      setAllInvoices(mapped);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Handle opening drawer
  const handleOpenDetail = (id: string) => {
    setSelectedInvoiceId(id);
    setIsDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDrawerOpen(false);
    setSelectedInvoiceId(null);
  };

  // Handle deleting invoice
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await InvoiceDomainService.deleteInvoice(deleteTarget.invoice.id);
      setDeleteTarget(null);
      if (selectedInvoiceId === deleteTarget.invoice.id) {
        handleCloseDetail();
      }
      await loadInvoices();
    } catch (err) {
      console.error('Failed to delete invoice', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary Metrics (Computed across entire database)
  const stats = useMemo(() => {
    const totalCount = allInvoices.length;
    const totalAmount = allInvoices.reduce((sum, item) => sum + (item.invoice.total || 0), 0);
    const draftCount = allInvoices.filter((item) => item.invoice.status === 'draft').length;
    const paidCount = allInvoices.filter((item) => item.invoice.status === 'paid').length;
    const overdueCount = allInvoices.filter((item) => item.invoice.status === 'overdue').length;
    const pendingCount = allInvoices.filter(
      (item) => item.invoice.status === 'sent' || item.invoice.status === 'pending'
    ).length;

    return { totalCount, totalAmount, draftCount, paidCount, overdueCount, pendingCount };
  }, [allInvoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices
      .filter(({ invoice, customer }) => {
        // Status filter
        if (statusFilter !== 'all' && invoice.status !== statusFilter) {
          return false;
        }

        // Search query filter (invoice number, customer name, notes)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesNum = invoice.invoiceNumber.toLowerCase().includes(q);
          const matchesCust =
            customer?.name.toLowerCase().includes(q) ||
            customer?.companyName?.toLowerCase().includes(q);
          const matchesNotes = invoice.notes?.toLowerCase().includes(q);

          if (!matchesNum && !matchesCust && !matchesNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'created_asc':
            return new Date(a.invoice.createdAt).getTime() - new Date(b.invoice.createdAt).getTime();
          case 'due_asc':
            return new Date(a.invoice.dueDate).getTime() - new Date(b.invoice.dueDate).getTime();
          case 'total_desc':
            return b.invoice.total - a.invoice.total;
          case 'total_asc':
            return a.invoice.total - b.invoice.total;
          case 'created_desc':
          default:
            return new Date(b.invoice.createdAt).getTime() - new Date(a.invoice.createdAt).getTime();
        }
      });
  }, [allInvoices, statusFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(startIndex, startIndex + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  // Status Filter options
  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'draft', label: 'Draf' },
    { value: 'sent', label: 'Terkirim' },
    { value: 'pending', label: 'Menunggu Pembayaran' },
    { value: 'partially_paid', label: 'Dibayar Sebagian' },
    { value: 'paid', label: 'Lunas' },
    { value: 'overdue', label: 'Jatuh Tempo' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'created_desc', label: 'Terbaru Ditambahkan' },
    { value: 'created_asc', label: 'Terlama Ditambahkan' },
    { value: 'due_asc', label: 'Jatuh Tempo Terdekat' },
    { value: 'total_desc', label: 'Nilai Tertinggi' },
    { value: 'total_asc', label: 'Nilai Terendah' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Faktur Penjualan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola pembuatan, pelacakan, dan status penagihan faktur secara lokal di IndexedDB.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs hover:shadow-sm transition-all self-start sm:self-auto"
        >
          <Icons.plus size={16} />
          <span>Buat Faktur Baru</span>
        </Link>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Faktur
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {stats.totalCount}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Tersimpan di IndexedDB</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Nilai Tagihan
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 truncate">
            Rp {stats.totalAmount.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Akumulasi seluruh faktur</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Menunggu / Draf
          </p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {stats.pendingCount + stats.draftCount}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            {stats.draftCount} draf, {stats.pendingCount} aktif
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Sudah Lunas
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.paidCount}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Pembayaran terverifikasi</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icons.search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor faktur, nama klien, catatan..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              <Icons.close size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-52">
          <AppSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={statusOptions}
            className="w-full"
            placeholder="Filter Status"
          />
        </div>

        {/* Sort By Filter */}
        <div className="w-full sm:w-52">
          <AppSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as InvoiceSortBy)}
            options={sortOptions}
            className="w-full"
            placeholder="Urutkan"
          />
        </div>
      </div>

      {/* Main Content: Table on Desktop & Cards on Mobile */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 dark:text-zinc-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Memuat daftar faktur dari IndexedDB...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Icons.invoices size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {allInvoices.length === 0 ? 'Belum Ada Faktur' : 'Faktur Tidak Ditemukan'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                {allInvoices.length === 0
                  ? 'Mulai terbitkan faktur pertama Anda untuk menagih pembayaran ke pelanggan dengan cepat.'
                  : 'Tidak ada faktur yang cocok dengan kata kunci pencarian atau filter yang dipilih.'}
              </p>
            </div>
            {allInvoices.length === 0 ? (
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <Icons.plus size={14} />
                <span>Buat Faktur Pertama</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nomor Faktur</th>
                    <th className="py-3.5 px-4">Pelanggan</th>
                    <th className="py-3.5 px-4">Tgl Terbit</th>
                    <th className="py-3.5 px-4">Jatuh Tempo</th>
                    <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {paginatedInvoices.map((item) => {
                    const { invoice, customer } = item;
                    const statusMeta = INVOICE_STATUS_CONFIG[invoice.status] || {
                      label: invoice.status,
                      colorClass: 'text-slate-600',
                      bgClass: 'bg-slate-100',
                      borderClass: 'border-slate-200',
                    };

                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetail(invoice.id)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <span className="hover:text-blue-600 transition-colors">
                            {invoice.invoiceNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-zinc-200">
                            {customer?.name || 'Pelanggan'}
                          </div>
                          {customer?.companyName && (
                            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                              {customer.companyName}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                          {invoice.issueDate}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                          {invoice.dueDate}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                          Rp {invoice.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.colorClass} ${statusMeta.bgClass} ${statusMeta.borderClass}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Detail button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(invoice.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              title="Lihat Rincian Faktur"
                            >
                              <Icons.eye size={15} />
                            </button>

                            {/* Quick Record Payment */}
                            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayment(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                title="Catat Pembayaran"
                              >
                                <Icons.creditCard size={15} />
                              </button>
                            )}

                            {/* Edit button */}
                            <Link
                              href={`/invoices/${invoice.id}/edit`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Edit Faktur"
                            >
                              <Icons.edit size={15} />
                            </Link>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Hapus Faktur"
                            >
                              <Icons.trash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800">
              {paginatedInvoices.map((item) => {
                const { invoice, customer } = item;
                const statusMeta = INVOICE_STATUS_CONFIG[invoice.status] || {
                  label: invoice.status,
                  colorClass: 'text-slate-600',
                  bgClass: 'bg-slate-100',
                  borderClass: 'border-slate-200',
                };

                return (
                  <div
                    key={invoice.id}
                    onClick={() => handleOpenDetail(invoice.id)}
                    className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.colorClass} ${statusMeta.bgClass} ${statusMeta.borderClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-xs text-slate-800 dark:text-zinc-200">
                        {customer?.name || 'Pelanggan'}
                      </p>
                      {customer?.companyName && (
                        <p className="text-[11px] text-slate-400">{customer.companyName}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                      <span className="text-slate-400 text-[11px]">
                        Jatuh Tempo: {invoice.dueDate}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Rp {invoice.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-end gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(invoice.id)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      >
                        Detail
                      </button>
                      {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleOpenPayment(item)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800"
                        >
                          Bayar
                        </button>
                      )}
                      <Link
                        href={`/invoices/${invoice.id}/edit`}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Icons.trash size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 text-xs">
                <span className="text-slate-500 dark:text-zinc-400">
                  Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, filteredInvoices.length)} dari{' '}
                  {filteredInvoices.length} faktur
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Halaman Sebelumnya"
                  >
                    <Icons.chevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg font-semibold transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Halaman Berikutnya"
                  >
                    <Icons.chevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice Detail Sliding Drawer */}
      <InvoiceDetailDrawer
        isOpen={isDrawerOpen}
        invoiceId={selectedInvoiceId}
        onClose={handleCloseDetail}
        onInvoiceUpdated={loadInvoices}
        onInvoiceDeleted={() => {
          handleCloseDetail();
          loadInvoices();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <Icons.trash size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Faktur Ini?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Tindakan ini tidak dapat dibatalkan. Seluruh data item faktur di IndexedDB akan dihapus.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs space-y-1">
              <p><span className="font-semibold">Nomor:</span> {deleteTarget.invoice.invoiceNumber}</p>
              <p><span className="font-semibold">Klien:</span> {deleteTarget.customer?.name || '—'}</p>
              <p><span className="font-semibold">Total:</span> Rp {deleteTarget.invoice.total.toLocaleString('id-ID')}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Faktur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {paymentTarget && (
        <PaymentModal
          isOpen={Boolean(paymentTarget)}
          invoiceId={paymentTarget.invoice.id}
          invoiceNumber={paymentTarget.invoice.invoiceNumber}
          customerName={paymentTarget.customerName}
          totalAmount={paymentTarget.invoice.total}
          remainingBalance={paymentTarget.remainingBalance}
          onClose={() => setPaymentTarget(null)}
          onPaymentSuccess={() => {
            setPaymentTarget(null);
            loadInvoices();
          }}
        />
      )}
    </div>
  );
};

