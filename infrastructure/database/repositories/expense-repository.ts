import { Expense } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class ExpenseRepository extends BaseRepository<Expense, string> {
  constructor() {
    super(db.expenses, 'Expense');
  }

  async getByCategory(categoryId: string): Promise<Expense[]> {
    try {
      return await this.table.where('categoryId').equals(categoryId).toArray();
    } catch (err) {
      handleDbError(err, 'ExpenseRepository.getByCategory');
    }
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      return await this.table
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray();
    } catch (err) {
      handleDbError(err, 'ExpenseRepository.getByDateRange');
    }
  }
}

export const expenseRepository = new ExpenseRepository();
