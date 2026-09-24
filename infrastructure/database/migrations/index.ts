import Dexie, { type Transaction } from 'dexie';

export const CURRENT_DB_VERSION = 1;

/**
 * Migration definition interface for Dexie schema versioning
 */
export interface MigrationDefinition {
  version: number;
  stores: Record<string, string>;
  upgrade?: (trans: Transaction) => Promise<void> | void;
}

/**
 * Version 1 initial schema
 * Defines all primary keys and indexed query fields
 */
export const V1_STORES: Record<string, string> = {
  companies: 'id, name, createdAt',
  customers: 'id, name, companyName, email, phone, createdAt',
  products: 'id, name, sku, active, createdAt',
  invoices: 'id, invoiceNumber, customerId, status, issueDate, dueDate, createdAt',
  invoiceItems: 'id, invoiceId, productId',
  expenses: 'id, categoryId, date, paymentMethod, createdAt',
  expenseCategories: 'id, name, active',
  payments: 'id, invoiceId, paymentDate, paymentMethod, createdAt',
  settings: 'key, updatedAt',
};

/**
 * Registered database migrations
 */
export const MIGRATIONS: MigrationDefinition[] = [
  {
    version: 1,
    stores: V1_STORES,
  },
  // Future migrations will be added here:
  // {
  //   version: 2,
  //   stores: { ...V1_STORES, ... },
  //   upgrade: async (trans) => { ... }
  // }
];

/**
 * Applies all registered migrations to a Dexie database instance
 */
export function applyMigrations(db: Dexie): void {
  for (const migration of MIGRATIONS) {
    const versionDef = db.version(migration.version).stores(migration.stores);
    if (migration.upgrade) {
      versionDef.upgrade(migration.upgrade);
    }
  }
}
