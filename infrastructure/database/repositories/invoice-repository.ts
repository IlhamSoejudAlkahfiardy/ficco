import { Invoice, InvoiceItem, InvoiceStatus } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export interface InvoiceWithItems {
  invoice: Invoice;
  items: InvoiceItem[];
}

export class InvoiceRepository extends BaseRepository<Invoice, string> {
  constructor() {
    super(db.invoices, 'Invoice');
  }

  async getByCustomerId(customerId: string): Promise<Invoice[]> {
    try {
      return await this.table.where('customerId').equals(customerId).toArray();
    } catch (err) {
      handleDbError(err, 'InvoiceRepository.getByCustomerId');
    }
  }

  async getByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    try {
      return await this.table.where('status').equals(status).toArray();
    } catch (err) {
      handleDbError(err, 'InvoiceRepository.getByStatus');
    }
  }

  async getWithItems(id: string): Promise<InvoiceWithItems | null> {
    try {
      const invoice = await this.getById(id);
      if (!invoice) return null;

      const items = await db.invoiceItems.where('invoiceId').equals(id).toArray();
      return { invoice, items };
    } catch (err) {
      handleDbError(err, 'InvoiceRepository.getWithItems');
    }
  }

  /**
   * Transactionally saves an invoice and all its line items
   */
  async createWithItems(invoice: Invoice, items: InvoiceItem[]): Promise<string> {
    try {
      return await db.transaction('rw', [db.invoices, db.invoiceItems], async () => {
        await db.invoices.add(invoice);
        if (items.length > 0) {
          await db.invoiceItems.bulkAdd(items);
        }
        return invoice.id;
      });
    } catch (err) {
      handleDbError(err, 'InvoiceRepository.createWithItems');
    }
  }

  /**
   * Transactionally deletes an invoice and its associated line items
   */
  async deleteWithItems(id: string): Promise<void> {
    try {
      await db.transaction('rw', [db.invoices, db.invoiceItems, db.payments], async () => {
        await db.invoices.delete(id);
        await db.invoiceItems.where('invoiceId').equals(id).delete();
        await db.payments.where('invoiceId').equals(id).delete();
      });
    } catch (err) {
      handleDbError(err, 'InvoiceRepository.deleteWithItems');
    }
  }
}

export const invoiceRepository = new InvoiceRepository();
