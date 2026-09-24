import Dexie, { type Table } from 'dexie';
import {
  Company,
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  Expense,
  ExpenseCategory,
  Payment,
  AppSetting,
} from './schema';
import { applyMigrations, CURRENT_DB_VERSION } from './migrations';

export class FiccoDatabase extends Dexie {
  companies!: Table<Company, string>;
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  invoices!: Table<Invoice, string>;
  invoiceItems!: Table<InvoiceItem, string>;
  expenses!: Table<Expense, string>;
  expenseCategories!: Table<ExpenseCategory, string>;
  payments!: Table<Payment, string>;
  settings!: Table<AppSetting, string>;

  constructor(dbName = 'ficco_business_db') {
    super(dbName);
    applyMigrations(this);
  }

  /**
   * Clears all business data tables (used for testing or backup restoration)
   */
  async clearAllTables(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all(this.tables.map((table) => table.clear()));
    });
  }

  /**
   * Returns current active schema version
   */
  getCurrentVersion(): number {
    return CURRENT_DB_VERSION;
  }
}

// Singleton instance
let databaseInstance: FiccoDatabase | null = null;

export function getDatabase(): FiccoDatabase {
  if (typeof window === 'undefined') {
    // If called during SSR, instantiate with dummy or guarded access
    if (!databaseInstance) {
      databaseInstance = new FiccoDatabase();
    }
    return databaseInstance;
  }

  if (!databaseInstance) {
    databaseInstance = new FiccoDatabase();
  }

  // Expose to window for manual testing in browser DevTools Console
  if (typeof window !== 'undefined') {
    (window as unknown as { ficcoDb?: FiccoDatabase }).ficcoDb = databaseInstance;
  }

  return databaseInstance;
}

export const db = getDatabase();
