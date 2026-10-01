import {
  expenseRepository,
  ExpenseRepository,
} from '@/infrastructure/database/repositories/expense-repository';
import {
  expenseCategoryRepository,
  ExpenseCategoryRepository,
} from '@/infrastructure/database/repositories/expense-category-repository';
import {
  Expense,
  ExpenseCategory,
  ExpenseWithCategory,
  ExpenseFilter,
  ExpenseSummaryStats,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../_types/expense.types';
import {
  expenseSchema,
  ExpenseFormData,
  expenseCategorySchema,
  ExpenseCategoryFormData,
} from '../_schemas/expense.schemas';
import {
  filterExpenses,
  calculateExpenseSummary,
} from '../_utils/expense-calculations';
import { NotFoundError, ValidationError } from '@/infrastructure/database/errors';

export class ExpenseDomainService {
  constructor(
    private readonly expenseRepo: ExpenseRepository = expenseRepository,
    private readonly categoryRepo: ExpenseCategoryRepository = expenseCategoryRepository
  ) {}

  /**
   * Initializes predefined standard categories if the table is empty
   */
  async seedDefaultCategoriesIfEmpty(): Promise<ExpenseCategory[]> {
    const existing = await this.categoryRepo.getAll();
    if (existing.length > 0) {
      return existing;
    }

    const categoriesToSeed: ExpenseCategory[] = DEFAULT_EXPENSE_CATEGORIES.map(
      (cat, index) => ({
        id: `cat_default_${index + 1}`,
        name: cat.name,
        description: cat.description,
        active: cat.active,
      })
    );

    await this.categoryRepo.bulkCreate(categoriesToSeed);
    return categoriesToSeed;
  }

  /**
   * Seeds demo/sample expenses for immediate testing
   */
  async seedSampleExpenses(): Promise<void> {
    const categories = await this.seedDefaultCategoriesIfEmpty();
    const opsCat = categories.find((c) => c.name.includes('Operasional'))?.id || categories[0].id;
    const softwareCat = categories.find((c) => c.name.includes('Software'))?.id || categories[0].id;
    const marketingCat = categories.find((c) => c.name.includes('Pemasaran'))?.id || categories[0].id;
    const salaryCat = categories.find((c) => c.name.includes('Gaji'))?.id || categories[0].id;

    const today = new Date();
    const nowIso = today.toISOString();
    const formatYmd = (d: Date) => d.toISOString().slice(0, 10);

    const dateToday = formatYmd(today);
    const date3DaysAgo = formatYmd(new Date(today.getTime() - 3 * 86400000));
    const date7DaysAgo = formatYmd(new Date(today.getTime() - 7 * 86400000));
    const date15DaysAgo = formatYmd(new Date(today.getTime() - 15 * 86400000));

    const sampleExpenses: Expense[] = [
      {
        id: `exp_sample_1`,
        categoryId: opsCat,
        description: 'Sewa Ruang Kerja & Keamanan Kantor',
        amount: 3500000,
        date: dateToday,
        paymentMethod: 'bank_transfer',
        notes: 'Tagihan bulanan pengelola gedung',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: `exp_sample_2`,
        categoryId: softwareCat,
        description: 'Langganan Domain & Cloud Hosting',
        amount: 450000,
        date: date3DaysAgo,
        paymentMethod: 'credit_card',
        notes: 'Invoice #SRV-2026-X1',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: `exp_sample_3`,
        categoryId: marketingCat,
        description: 'Kampanye Iklan Instagram & Google Ads',
        amount: 1250000,
        date: date7DaysAgo,
        paymentMethod: 'credit_card',
        notes: 'Target lead klien UKM',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: `exp_sample_4`,
        categoryId: salaryCat,
        description: 'Honor Freelance Desainer Grafis',
        amount: 1800000,
        date: date15DaysAgo,
        paymentMethod: 'bank_transfer',
        notes: 'Proyek aset promosi Q4',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    for (const exp of sampleExpenses) {
      const exists = await this.expenseRepo.getById(exp.id);
      if (!exists) {
        await this.expenseRepo.create(exp);
      }
    }
  }

  /**
   * Retrieves all categories, ensuring defaults exist
   */
  async getAllCategories(onlyActive = false): Promise<ExpenseCategory[]> {
    await this.seedDefaultCategoriesIfEmpty();
    if (onlyActive) {
      return await this.categoryRepo.getActive();
    }
    return await this.categoryRepo.getAll();
  }

  /**
   * Creates a new category
   */
  async createCategory(data: ExpenseCategoryFormData): Promise<ExpenseCategory> {
    const validated = expenseCategorySchema.parse(data);

    // Check duplicate name
    const all = await this.categoryRepo.getAll();
    const isDuplicate = all.some(
      (c) => c.name.trim().toLowerCase() === validated.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      throw new ValidationError(`Kategori dengan nama "${validated.name}" sudah ada.`);
    }

    const newCategory: ExpenseCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: validated.name.trim(),
      description: validated.description?.trim(),
      active: validated.active ?? true,
    };

    await this.categoryRepo.create(newCategory);
    return newCategory;
  }

  /**
   * Updates an existing category
   */
  async updateCategory(
    id: string,
    data: ExpenseCategoryFormData
  ): Promise<ExpenseCategory> {
    const validated = expenseCategorySchema.parse(data);
    const existing = await this.categoryRepo.getById(id);
    if (!existing) {
      throw new NotFoundError('ExpenseCategory', id);
    }

    // Check duplicate name against others
    const all = await this.categoryRepo.getAll();
    const isDuplicate = all.some(
      (c) =>
        c.id !== id &&
        c.name.trim().toLowerCase() === validated.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      throw new ValidationError(`Kategori dengan nama "${validated.name}" sudah ada.`);
    }

    const updated: ExpenseCategory = {
      ...existing,
      name: validated.name.trim(),
      description: validated.description?.trim(),
      active: validated.active,
    };

    await this.categoryRepo.update(id, updated);
    return updated;
  }

  /**
   * Toggles category active status
   */
  async toggleCategoryActive(id: string, active: boolean): Promise<void> {
    const existing = await this.categoryRepo.getById(id);
    if (!existing) {
      throw new NotFoundError('ExpenseCategory', id);
    }
    await this.categoryRepo.update(id, { active });
  }

  /**
   * Counts how many expense records reference a given category
   */
  async getCategoryUsageCount(categoryId: string): Promise<number> {
    const expenses = await this.expenseRepo.getByCategory(categoryId);
    return expenses.length;
  }

  /**
   * Deletes a category if not in use
   */
  async deleteCategory(id: string): Promise<void> {
    const usage = await this.getCategoryUsageCount(id);
    if (usage > 0) {
      throw new ValidationError(
        `Kategori tidak dapat dihapus karena telah digunakan pada ${usage} transaksi pengeluaran. Anda dapat menonaktifkannya.`
      );
    }
    await this.categoryRepo.delete(id);
  }

  /**
   * Retrieves all expenses with populated category details and optional filters
   */
  async getAllExpenses(filter?: ExpenseFilter): Promise<ExpenseWithCategory[]> {
    const categories = await this.getAllCategories();
    const categoryMap = new Map<string, ExpenseCategory>();
    categories.forEach((c) => categoryMap.set(c.id, c));

    const rawExpenses = await this.expenseRepo.getAll();

    const filtered = filter
      ? filterExpenses(rawExpenses, categories, filter)
      : rawExpenses.sort((a, b) => b.date.localeCompare(a.date));

    return filtered.map((exp) => {
      const category = categoryMap.get(exp.categoryId);
      return {
        ...exp,
        category,
        categoryName: category?.name || 'Kategori Lain',
      };
    });
  }

  /**
   * Retrieves single expense with resolved category
   */
  async getExpenseById(id: string): Promise<ExpenseWithCategory | null> {
    const exp = await this.expenseRepo.getById(id);
    if (!exp) return null;

    const category = await this.categoryRepo.getById(exp.categoryId);
    return {
      ...exp,
      category: category ?? undefined,
      categoryName: category?.name || 'Kategori Lain',
    };
  }

  /**
   * Creates a new expense
   */
  async createExpense(data: ExpenseFormData): Promise<Expense> {
    const validated = expenseSchema.parse(data);
    const nowIso = new Date().toISOString();

    const newExpense: Expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      categoryId: validated.categoryId,
      description: validated.description.trim(),
      amount: validated.amount,
      date: validated.date,
      paymentMethod: validated.paymentMethod,
      notes: validated.notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await this.expenseRepo.create(newExpense);
    return newExpense;
  }

  /**
   * Updates an existing expense
   */
  async updateExpense(id: string, data: ExpenseFormData): Promise<Expense> {
    const validated = expenseSchema.parse(data);
    const existing = await this.expenseRepo.getById(id);
    if (!existing) {
      throw new NotFoundError('Expense', id);
    }

    const updated: Expense = {
      ...existing,
      categoryId: validated.categoryId,
      description: validated.description.trim(),
      amount: validated.amount,
      date: validated.date,
      paymentMethod: validated.paymentMethod,
      notes: validated.notes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    await this.expenseRepo.update(id, updated);
    return updated;
  }

  /**
   * Deletes an expense record
   */
  async deleteExpense(id: string): Promise<void> {
    const existing = await this.expenseRepo.getById(id);
    if (!existing) {
      throw new NotFoundError('Expense', id);
    }
    await this.expenseRepo.delete(id);
  }

  /**
   * Computes summary metrics for expenses
   */
  async getSummaryStats(refDate: Date = new Date()): Promise<ExpenseSummaryStats> {
    const [expenses, categories] = await Promise.all([
      this.expenseRepo.getAll(),
      this.getAllCategories(),
    ]);

    return calculateExpenseSummary(expenses, categories, refDate);
  }
}

export const expenseDomainService = new ExpenseDomainService();
