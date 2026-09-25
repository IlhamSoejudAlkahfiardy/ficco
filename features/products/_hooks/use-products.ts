'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProductService } from '../_services/product-service';
import {
  Product,
  ProductFilterStatus,
  ProductSortBy,
  ProductStats,
} from '../_types/product.types';
import { ProductFormData, productSchema } from '../_schemas/product.schemas';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProductsRaw, setAllProductsRaw] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ProductFilterStatus>('all');
  const [sortBy, setSortBy] = useState<ProductSortBy>('created_desc');

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<{
    product: Product;
    invoiceUsageCount: number;
  } | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ProductService.getAll(searchQuery, statusFilter, sortBy);
      setProducts(data);

      // Also fetch un-filtered total for stats
      const raw = await ProductService.getAll('', 'all', 'created_desc');
      setAllProductsRaw(raw);
    } catch (err) {
      setNotification({
        type: 'error',
        message: (err as Error).message || 'Gagal memuat katalog produk.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Derived stats
  const stats: ProductStats = useMemo(() => {
    const list = allProductsRaw.length > 0 ? allProductsRaw : products;
    return {
      totalProducts: list.length,
      activeCount: list.filter((p) => p.active).length,
      inactiveCount: list.filter((p) => !p.active).length,
    };
  }, [allProductsRaw, products]);

  const openCreateModal = useCallback(() => {
    setEditingProduct(null);
    setIsFormOpen(true);
  }, []);

  const openEditModal = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setEditingProduct(null);
  }, []);

  const openDeleteDialog = useCallback(async (product: Product) => {
    try {
      const count = await ProductService.getInvoiceUsageCount(product.id);
      setDeleteTarget({ product, invoiceUsageCount: count });
    } catch {
      setDeleteTarget({ product, invoiceUsageCount: 0 });
    }
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const saveProduct = useCallback(
    async (formData: ProductFormData): Promise<boolean> => {
      setIsSubmitting(true);
      clearNotification();

      const validation = productSchema.safeParse(formData);
      if (!validation.success) {
        setNotification({
          type: 'error',
          message: validation.error.issues[0]?.message || 'Data produk tidak valid.',
        });
        setIsSubmitting(false);
        return false;
      }

      try {
        if (editingProduct) {
          await ProductService.update(editingProduct.id, validation.data);
          setNotification({
            type: 'success',
            message: `Produk "${validation.data.name}" berhasil diperbarui.`,
          });
        } else {
          await ProductService.create(validation.data);
          setNotification({
            type: 'success',
            message: `Produk "${validation.data.name}" berhasil ditambahkan ke katalog IndexedDB.`,
          });
        }
        closeFormModal();
        await loadProducts();
        return true;
      } catch (err) {
        setNotification({
          type: 'error',
          message: (err as Error).message || 'Gagal menyimpan data produk.',
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingProduct, clearNotification, closeFormModal, loadProducts]
  );

  const toggleStatus = useCallback(
    async (product: Product): Promise<void> => {
      clearNotification();
      try {
        const nextState = await ProductService.toggleActive(product.id, product.active);
        setNotification({
          type: 'success',
          message: `Status "${product.name}" diubah menjadi ${
            nextState ? 'Aktif' : 'Non-Aktif'
          }.`,
        });
        await loadProducts();
      } catch (err) {
        setNotification({
          type: 'error',
          message: (err as Error).message || 'Gagal mengubah status produk.',
        });
      }
    },
    [clearNotification, loadProducts]
  );

  const confirmDelete = useCallback(async (): Promise<boolean> => {
    if (!deleteTarget) return false;
    setIsSubmitting(true);
    clearNotification();
    try {
      await ProductService.delete(deleteTarget.product.id);
      setNotification({
        type: 'success',
        message: `Produk "${deleteTarget.product.name}" berhasil dihapus dari katalog.`,
      });
      closeDeleteDialog();
      await loadProducts();
      return true;
    } catch (err) {
      setNotification({
        type: 'error',
        message: (err as Error).message || 'Gagal menghapus produk.',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTarget, clearNotification, closeDeleteDialog, loadProducts]);

  const seedSampleData = useCallback(async () => {
    setIsSubmitting(true);
    clearNotification();
    try {
      await ProductService.seedSampleProducts();
      setNotification({
        type: 'success',
        message: '4 sample produk & layanan berhasil dimuat ke IndexedDB!',
      });
      await loadProducts();
    } catch (err) {
      setNotification({
        type: 'error',
        message: (err as Error).message || 'Gagal menambahkan sample produk.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [clearNotification, loadProducts]);

  return {
    products,
    isLoading,
    isSubmitting,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    stats,
    notification,
    clearNotification,
    refresh: loadProducts,

    // Form Modal
    isFormOpen,
    editingProduct,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveProduct,

    // Delete Dialog
    deleteTarget,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,

    // Quick Actions
    toggleStatus,
    seedSampleData,
  };
}
