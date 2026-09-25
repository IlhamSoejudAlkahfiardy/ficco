import { customerRepository } from '@/infrastructure/database/repositories/customer-repository';
import { invoiceRepository } from '@/infrastructure/database/repositories/invoice-repository';
import { Customer, CustomerSortBy, CustomerWithInvoiceSummary } from '../_types/customer.types';
import { CustomerFormData } from '../_schemas/customer.schemas';

export class CustomerService {
  /**
   * Fetches all customers with optional search and sorting
   */
  static async getAll(search?: string, sortBy: CustomerSortBy = 'name_asc'): Promise<Customer[]> {
    let list: Customer[];
    if (search && search.trim().length > 0) {
      list = await customerRepository.search(search.trim());
    } else {
      list = await customerRepository.getAll();
    }

    return this.sortCustomers(list, sortBy);
  }

  /**
   * Retrieves single customer by ID
   */
  static async getById(id: string): Promise<Customer | undefined> {
    return customerRepository.getById(id);
  }

  /**
   * Retrieves customer details along with invoice summary
   */
  static async getWithSummary(id: string): Promise<CustomerWithInvoiceSummary | null> {
    const customer = await customerRepository.getById(id);
    if (!customer) return null;

    const invoices = (await invoiceRepository.getByCustomerId(id)) || [];
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const unpaidAmount = invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    return {
      customer,
      invoiceCount: invoices.length,
      totalInvoiced,
      unpaidAmount,
    };
  }

  /**
   * Creates a new customer with timestamp and ID
   */
  static async create(data: CustomerFormData): Promise<Customer> {
    const now = new Date().toISOString();
    const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newCustomer: Customer = {
      id,
      name: data.name.trim(),
      companyName: data.companyName?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      taxNumber: data.taxNumber?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await customerRepository.create(newCustomer);
    return newCustomer;
  }

  /**
   * Updates an existing customer
   */
  static async update(id: string, data: CustomerFormData): Promise<Customer> {
    const now = new Date().toISOString();
    const updates: Partial<Customer> = {
      name: data.name.trim(),
      companyName: data.companyName?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      taxNumber: data.taxNumber?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      updatedAt: now,
    };

    await customerRepository.update(id, updates);
    const updated = await customerRepository.getById(id);
    if (!updated) {
      throw new Error('Pelanggan tidak ditemukan setelah diperbarui.');
    }
    return updated;
  }

  /**
   * Checks if customer has associated invoices before deletion
   */
  static async getAssociatedInvoiceCount(customerId: string): Promise<number> {
    const invoices = (await invoiceRepository.getByCustomerId(customerId)) || [];
    return invoices.length;
  }

  /**
   * Deletes a customer
   */
  static async delete(id: string): Promise<void> {
    await customerRepository.delete(id);
  }

  /**
   * Populates demo/sample customers for instant exploration
   */
  static async seedSampleCustomers(): Promise<Customer[]> {
    const samples: Array<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        name: 'Ahmad Fauzi',
        companyName: 'PT Nusantara Jaya Abadi',
        email: 'ahmad.fauzi@nusantarajaya.co.id',
        phone: '081234567890',
        address: 'Jl. Sudirman No. 45, Jakarta Selatan',
        taxNumber: '01.234.567.8-012.000',
        notes: 'Klien korporat langganan jasa konsultasi IT bulanan.',
      },
      {
        name: 'Siti Rahmawati',
        companyName: 'Studio Kreatif Bintang',
        email: 'halo@bintangstudio.com',
        phone: '085678901234',
        address: 'Jl. Kaliurang KM 5, Sleman, DI Yogyakarta',
        notes: 'Term pembayaran Net 14 hari.',
      },
      {
        name: 'Budi Santoso',
        companyName: 'CV Makmur Sejahtera',
        email: 'budi@makmursejahtera.id',
        phone: '082198765432',
        address: 'Jl. Pemuda No. 12, Surabaya',
        taxNumber: '02.345.678.9-023.000',
        notes: 'Prioritaskan pengiriman invoice melalui WhatsApp.',
      },
    ];

    const createdList: Customer[] = [];
    for (const item of samples) {
      const created = await this.create(item);
      createdList.push(created);
    }
    return createdList;
  }

  /**
   * In-memory sorter for customer list
   */
  private static sortCustomers(list: Customer[], sortBy: CustomerSortBy): Customer[] {
    const copy = [...list];
    switch (sortBy) {
      case 'name_asc':
        return copy.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      case 'name_desc':
        return copy.sort((a, b) => b.name.localeCompare(a.name, 'id'));
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
