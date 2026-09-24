import { ExpenseCategory } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class ExpenseCategoryRepository extends BaseRepository<ExpenseCategory, string> {
  constructor() {
    super(db.expenseCategories, 'ExpenseCategory');
  }

  async getActive(): Promise<ExpenseCategory[]> {
    try {
      return await this.table.filter((c) => c.active).toArray();
    } catch (err) {
      handleDbError(err, 'ExpenseCategoryRepository.getActive');
    }
  }
}

export const expenseCategoryRepository = new ExpenseCategoryRepository();
