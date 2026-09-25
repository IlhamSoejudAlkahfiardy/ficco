'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CustomerService } from '../_services/customer-service';
import {
  Customer,
  CustomerSortBy,
  CustomerStats,
  CustomerWithInvoiceSummary,
} from '../_types/customer.types';
import { CustomerFormData, customerSchema } from '../_schemas/customer.schemas';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<CustomerSortBy>('created_desc');

  // Modals & Panels state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedSummary, setSelectedSummary] = useState<CustomerWithInvoiceSummary | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    customer: Customer;
    invoiceCount: number;
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CustomerService.getAll(searchQuery, sortBy);
      setCustomers(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: (err as Error).message || 'Gagal memuat data pelanggan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Derived statistics
  const stats: CustomerStats = useMemo(() => {
    return {
      totalCustomers: customers.length,
      withCompanyCount: customers.filter((c) => Boolean(c.companyName)).length,
      withEmailCount: customers.filter((c) => Boolean(c.email)).length,
      withInvoicesCount: 0, // dynamic if needed
    };
  }, [customers]);

  const openCreateModal = useCallback(() => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  }, []);

  const openEditModal = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  }, []);

  const openDetail = useCallback(async (customer: Customer) => {
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    try {
      const summary = await CustomerService.getWithSummary(customer.id);
      setSelectedSummary(
        summary || {
          customer,
          invoiceCount: 0,
          totalInvoiced: 0,
          unpaidAmount: 0,
        }
      );
    } catch {
      setSelectedSummary({
        customer,
        invoiceCount: 0,
        totalInvoiced: 0,
        unpaidAmount: 0,
      });
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedSummary(null);
  }, []);

  const openDeleteDialog = useCallback(async (customer: Customer) => {
    try {
      const count = await CustomerService.getAssociatedInvoiceCount(customer.id);
      setDeleteTarget({ customer, invoiceCount: count });
    } catch {
      setDeleteTarget({ customer, invoiceCount: 0 });
    }
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const saveCustomer = useCallback(
    async (formData: CustomerFormData): Promise<boolean> => {
      setIsSubmitting(true);
      clearNotification();

      const validation = customerSchema.safeParse(formData);
      if (!validation.success) {
        setNotification({
          type: 'error',
          message: validation.error.issues[0]?.message || 'Data formulir tidak valid.',
        });
        setIsSubmitting(false);
        return false;
      }

      try {
        if (editingCustomer) {
          await CustomerService.update(editingCustomer.id, validation.data);
          setNotification({
            type: 'success',
            message: `Pelanggan "${validation.data.name}" berhasil diperbarui.`,
          });
        } else {
          await CustomerService.create(validation.data);
          setNotification({
            type: 'success',
            message: `Pelanggan "${validation.data.name}" berhasil ditambahkan ke IndexedDB.`,
          });
        }
        closeFormModal();
        await loadCustomers();
        return true;
      } catch (err) {
        setNotification({
          type: 'error',
          message: (err as Error).message || 'Gagal menyimpan data pelanggan.',
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingCustomer, clearNotification, closeFormModal, loadCustomers]
  );

  const confirmDelete = useCallback(async (): Promise<boolean> => {
    if (!deleteTarget) return false;
    setIsSubmitting(true);
    clearNotification();
    try {
      await CustomerService.delete(deleteTarget.customer.id);
      setNotification({
        type: 'success',
        message: `Pelanggan "${deleteTarget.customer.name}" berhasil dihapus.`,
      });
      closeDeleteDialog();
      if (selectedSummary?.customer.id === deleteTarget.customer.id) {
        closeDetail();
      }
      await loadCustomers();
      return true;
    } catch (err) {
      setNotification({
        type: 'error',
        message: (err as Error).message || 'Gagal menghapus pelanggan.',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTarget, clearNotification, closeDeleteDialog, selectedSummary, closeDetail, loadCustomers]);

  const seedSampleData = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await CustomerService.seedSampleCustomers();
      setNotification({
        type: 'success',
        message: '3 sample pelanggan berhasil dimuat ke IndexedDB!',
      });
      await loadCustomers();
    } catch (err) {
      setNotification({
        type: 'error',
        message: (err as Error).message || 'Gagal menambahkan sample pelanggan.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [loadCustomers]);

  return {
    customers,
    isLoading,
    isSubmitting,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    stats,
    notification,
    clearNotification,
    refresh: loadCustomers,

    // Form Modal
    isFormOpen,
    editingCustomer,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveCustomer,

    // Detail Panel
    isDetailOpen,
    selectedSummary,
    isLoadingDetail,
    openDetail,
    closeDetail,

    // Delete Dialog
    deleteTarget,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,

    // Quick seed demo
    seedSampleData,
  };
}
