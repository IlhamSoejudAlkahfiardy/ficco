import { Customer } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class CustomerRepository extends BaseRepository<Customer, string> {
  constructor() {
    super(db.customers, 'Customer');
  }

  async search(query: string): Promise<Customer[]> {
    try {
      const q = query.trim().toLowerCase();
      if (!q) return this.getAll();

      return await this.table
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.companyName?.toLowerCase().includes(q) ?? false) ||
            (c.email?.toLowerCase().includes(q) ?? false) ||
            (c.phone?.includes(q) ?? false)
        )
        .toArray();
    } catch (err) {
      handleDbError(err, 'CustomerRepository.search');
    }
  }
}

export const customerRepository = new CustomerRepository();
