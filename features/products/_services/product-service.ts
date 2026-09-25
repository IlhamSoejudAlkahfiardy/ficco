import { productRepository } from '@/infrastructure/database/repositories/product-repository';
import { db } from '@/infrastructure/database/db';
import {
  Product,
  ProductFilterStatus,
  ProductSortBy,
} from '../_types/product.types';
import { ProductFormData } from '../_schemas/product.schemas';

export class ProductService {
  /**
   * Retrieves products with search, status filtering, and sorting
   */
  static async getAll(
    search?: string,
    status: ProductFilterStatus = 'all',
    sortBy: ProductSortBy = 'created_desc'
  ): Promise<Product[]> {
    let list: Product[];
    if (search && search.trim().length > 0) {
      list = await productRepository.search(search.trim());
    } else {
      list = await productRepository.getAll();
    }

    // Filter by active status
    if (status === 'active') {
      list = list.filter((p) => p.active);
    } else if (status === 'inactive') {
      list = list.filter((p) => !p.active);
    }

    return this.sortProducts(list, sortBy);
  }

  /**
   * Retrieves active products for invoice line items referencing
   */
  static async getActiveProducts(): Promise<Product[]> {
    return productRepository.getActive();
  }

  /**
   * Retrieves single product by ID
   */
  static async getById(id: string): Promise<Product | undefined> {
    return productRepository.getById(id);
  }

  /**
   * Creates a new product or service
   */
  static async create(data: ProductFormData): Promise<Product> {
    const now = new Date().toISOString();
    const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newProduct: Product = {
      id,
      name: data.name.trim(),
      sku: data.sku?.trim().toUpperCase() || undefined,
      description: data.description?.trim() || undefined,
      unit: data.unit.trim().toLowerCase(),
      price: Number(data.price),
      taxRate: Number(data.taxRate) || 0,
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await productRepository.create(newProduct);
    return newProduct;
  }

  /**
   * Updates an existing product or service
   */
  static async update(id: string, data: ProductFormData): Promise<Product> {
    const now = new Date().toISOString();
    const updates: Partial<Product> = {
      name: data.name.trim(),
      sku: data.sku?.trim().toUpperCase() || undefined,
      description: data.description?.trim() || undefined,
      unit: data.unit.trim().toLowerCase(),
      price: Number(data.price),
      taxRate: Number(data.taxRate) || 0,
      active: data.active ?? true,
      updatedAt: now,
    };

    await productRepository.update(id, updates);
    const updated = await productRepository.getById(id);
    if (!updated) {
      throw new Error('Produk/jasa tidak ditemukan setelah diperbarui.');
    }
    return updated;
  }

  /**
   * Toggles product active/inactive state
   */
  static async toggleActive(id: string, currentActive: boolean): Promise<boolean> {
    const nextState = !currentActive;
    await productRepository.update(id, {
      active: nextState,
      updatedAt: new Date().toISOString(),
    });
    return nextState;
  }

  /**
   * Counts how many invoice line items reference this product
   */
  static async getInvoiceUsageCount(productId: string): Promise<number> {
    try {
      return await db.invoiceItems.where('productId').equals(productId).count();
    } catch {
      return 0;
    }
  }

  /**
   * Deletes a product
   */
  static async delete(id: string): Promise<void> {
    await productRepository.delete(id);
  }

  /**
   * Populates realistic sample products and services for instant testing
   */
  static async seedSampleProducts(): Promise<Product[]> {
    const samples: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        name: 'Pengembangan Aplikasi Web & Mobile',
        sku: 'DEV-APP-01',
        description: 'Pembuatan software kustom berbasis Next.js, API, dan PWA.',
        unit: 'proyek',
        price: 15000000,
        taxRate: 11,
        active: true,
      },
      {
        name: 'Konsultasi UI/UX & Design System',
        sku: 'DSN-UI-02',
        description: 'Perancangan wireframe, user flow, dan prototype interaktif Figma.',
        unit: 'jam',
        price: 350000,
        taxRate: 0,
        active: true,
      },
      {
        name: 'Pemeliharaan & Server Hosting Bulanan',
        sku: 'MNT-SRV-03',
        description: 'Layanan monitoring server, backup data, dan technical support 24/7.',
        unit: 'bulan',
        price: 1250000,
        taxRate: 11,
        active: true,
      },
      {
        name: 'Lisensi Perangkat Lunak Ficco Pro',
        sku: 'LIC-FICCO-PRO',
        description: 'Lisensi seumur hidup sistem manajemen invoice & pengeluaran offline.',
        unit: 'unit',
        price: 2500000,
        taxRate: 11,
        active: false,
      },
    ];

    const results: Product[] = [];
    for (const item of samples) {
      const created = await this.create(item);
      results.push(created);
    }
    return results;
  }

  /**
   * In-memory sorter for products list
   */
  private static sortProducts(list: Product[], sortBy: ProductSortBy): Product[] {
    const copy = [...list];
    switch (sortBy) {
      case 'name_asc':
        return copy.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      case 'name_desc':
        return copy.sort((a, b) => b.name.localeCompare(a.name, 'id'));
      case 'price_asc':
        return copy.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return copy.sort((a, b) => b.price - a.price);
      case 'created_asc':
        return copy.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'created_desc':
      default:
        return copy.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }
}
