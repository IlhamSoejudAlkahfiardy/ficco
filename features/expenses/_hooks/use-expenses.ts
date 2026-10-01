'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ExpenseWithCategory,
  ExpenseCategory,
  ExpenseFilter,
  ExpenseSummaryStats,
  ExpenseDateRangePreset,
  ExpenseSortBy,
} from '../_types/expense.types';
import {
  ExpenseFormData,
  ExpenseCategoryFormData,
} from '../_schemas/expense.schemas';
import { expenseDomainService } from '../_services/expense-service';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stats, setStats] = useState<ExpenseSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<ExpenseDateRangePreset>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<ExpenseSortBy>('date_desc');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Dialog / Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [viewingExpense, setViewingExpense] = useState<ExpenseWithCategory | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithCategory | null>(null);

  // Feedback toast / alert state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 4500);
  }, []);

  // Fetch all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const activeFilter: ExpenseFilter = {
        search,
        categoryId,
        paymentMethod,
        dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined,
        sortBy,
      };

      const [loadedExpenses, loadedCategories, loadedStats] = await Promise.all([
        expenseDomainService.getAllExpenses(activeFilter),
        expenseDomainService.getAllCategories(),
        expenseDomainService.getSummaryStats(),
      ]);

      setExpenses(loadedExpenses);
      setCategories(loadedCategories);
      setStats(loadedStats);
    } catch (err) {
      console.error('Failed to load expenses data:', err);
      setError((err as Error).message || 'Gagal memuat data pengeluaran');
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryId, paymentMethod, dateRange, startDate, endDate, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset pagination to page 1 when filter parameters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryId, paymentMethod, dateRange, startDate, endDate, sortBy]);

  // Derived pagination
  const totalPages = Math.max(1, Math.ceil(expenses.length / pageSize));
  const paginatedExpenses = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return expenses.slice(startIndex, startIndex + pageSize);
  }, [expenses, page, pageSize]);

  // Handlers for Expense CRUD
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (expense: ExpenseWithCategory) => {
    setViewingExpense(expense);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (expense: ExpenseWithCategory) => {
    setDeletingExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveExpense = async (data: ExpenseFormData) => {
    try {
      if (editingExpense) {
        await expenseDomainService.updateExpense(editingExpense.id, data);
        showFeedback('success', 'Catatan pengeluaran berhasil diperbarui.');
      } else {
        await expenseDomainService.createExpense(data);
        showFeedback('success', 'Pengeluaran baru berhasil dicatat.');
      }
      setIsFormModalOpen(false);
      setEditingExpense(null);
      await loadData();
    } catch (err) {
      showFeedback('error', (err as Error).message || 'Gagal menyimpan pengeluaran.');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    try {
      await expenseDomainService.deleteExpense(deletingExpense.id);
      showFeedback('success', 'Pengeluaran berhasil dihapus.');
      setIsDeleteDialogOpen(false);
      setDeletingExpense(null);
      if (viewingExpense?.id === deletingExpense.id) {
        setIsDetailModalOpen(false);
        setViewingExpense(null);
      }
      await loadData();
    } catch (err) {
      showFeedback('error', (err as Error).message || 'Gagal menghapus pengeluaran.');
    }
  };

  // Handlers for Category Management
  const handleCreateCategory = async (data: ExpenseCategoryFormData) => {
    try {
      await expenseDomainService.createCategory(data);
      showFeedback('success', `Kategori "${data.name}" berhasil dibuat.`);
      const updatedCategories = await expenseDomainService.getAllCategories();
      setCategories(updatedCategories);
      await loadData();
    } catch (err) {
      showFeedback('error', (err as Error).message || 'Gagal membuat kategori.');
      throw err;
    }
  };

  const handleUpdateCategory = async (
    id: string,
    data: ExpenseCategoryFormData
  ) => {
    try {
      await expenseDomainService.updateCategory(id, data);
      showFeedback('success', `Kategori "${data.name}" berhasil diperbarui.`);
      const updatedCategories = await expenseDomainService.getAllCategories();
      setCategories(updatedCategories);
      await loadData();
    } catch (err) {
      showFeedback('error', (err as Error).message || 'Gagal memperbarui kategori.');
      throw err;
    }
  };

  const handleToggleCategoryActive = async (id: string, active: boolean) => {
    try {
      await expenseDomainService.toggleCategoryActive(id, active);
      const updatedCategories = await expenseDomainService.getAllCategories();
      setCategories(updatedCategories);
      await loadData();
    } catch (err) {
      showFeedback('error', (err as Error).message || 'Gagal mengubah status kategori.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await expenseDomainService.deleteCategory(id);
      showFeedback('success', 'Kategori pengeluaran berhasil dihapus.');
      const updatedCategories = await expenseDomainService.getAllCategories();
      setCategories(updatedCategories);
      await loadData();
    } catch (err) {
      showFeedback('error', (err as Error).message || 'Gagal menghapus kategori.');
      throw err;
    }
  };

  const handleSeedSampleData = async () => {
    try {
      setIsLoading(true);
      await expenseDomainService.seedSampleExpenses();
      showFeedback('success', 'Data contoh pengeluaran berhasil dimuat.');
      await loadData();
    } catch (err) {
      showFeedback('error', (err as Error).message || 'Gagal memuat data contoh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilter = () => {
    setSearch('');
    setCategoryId('all');
    setPaymentMethod('all');
    setDateRange('this_month');
    setStartDate('');
    setEndDate('');
    setSortBy('date_desc');
  };

  return {
    expenses,
    paginatedExpenses,
    categories,
    stats,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    // Filter controls
    search,
    setSearch,
    categoryId,
    setCategoryId,
    paymentMethod,
    setPaymentMethod,
    dateRange,
    setDateRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortBy,
    setSortBy,
    handleResetFilter,
    // Modal states & controls
    isFormModalOpen,
    setIsFormModalOpen,
    editingExpense,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveExpense,
    // Detail modal
    isDetailModalOpen,
    setIsDetailModalOpen,
    viewingExpense,
    handleOpenDetail,
    // Delete dialog
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deletingExpense,
    handleOpenDelete,
    handleConfirmDelete,
    // Category modal
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    handleCreateCategory,
    handleUpdateCategory,
    handleToggleCategoryActive,
    handleDeleteCategory,
    // Utility
    handleSeedSampleData,
    refresh: loadData,
    feedback,
    clearFeedback,
  };
}
