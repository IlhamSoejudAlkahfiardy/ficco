import { Payment } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class PaymentRepository extends BaseRepository<Payment, string> {
  constructor() {
    super(db.payments, 'Payment');
  }

  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    try {
      return await this.table.where('invoiceId').equals(invoiceId).toArray();
    } catch (err) {
      handleDbError(err, 'PaymentRepository.getByInvoiceId');
    }
  }
}

export const paymentRepository = new PaymentRepository();
