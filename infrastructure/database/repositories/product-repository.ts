import { Product } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class ProductRepository extends BaseRepository<Product, string> {
  constructor() {
    super(db.products, 'Product');
  }

  async getActive(): Promise<Product[]> {
    try {
      return await this.table.filter((p) => p.active).toArray();
    } catch (err) {
      handleDbError(err, 'ProductRepository.getActive');
    }
  }

  async search(query: string): Promise<Product[]> {
    try {
      const q = query.trim().toLowerCase();
      if (!q) return this.getAll();

      return await this.table
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku?.toLowerCase().includes(q) ?? false) ||
            (p.description?.toLowerCase().includes(q) ?? false)
        )
        .toArray();
    } catch (err) {
      handleDbError(err, 'ProductRepository.search');
    }
  }
}

export const productRepository = new ProductRepository();
