import { companyRepository, settingsRepository } from '@/infrastructure/database';
import {
  CompanyProfile,
  InvoiceDefaults,
  INITIAL_INVOICE_DEFAULTS,
  AllSettings,
} from '../_types/settings.types';
import { CompanyProfileFormData, InvoiceDefaultsFormData } from '../_schemas/settings.schemas';

const INVOICE_DEFAULTS_KEY = 'invoice_defaults';

export const SettingsService = {
  /**
   * Retrieves the stored company profile or initializes a sensible default
   */
  async getCompanyProfile(): Promise<CompanyProfile> {
    const existing = await companyRepository.getPrimaryCompany();
    if (existing) {
      return existing;
    }

    // Default company template
    const defaultProfile: CompanyProfile = {
      id: 'primary-company',
      name: 'Bisnis Saya',
      currency: 'IDR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await companyRepository.savePrimaryCompany(defaultProfile);
    return defaultProfile;
  },

  /**
   * Saves company profile to IndexedDB
   */
  async saveCompanyProfile(data: CompanyProfileFormData): Promise<CompanyProfile> {
    const current = await this.getCompanyProfile();
    const updated: CompanyProfile = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await companyRepository.savePrimaryCompany(updated);
    return updated;
  },

  /**
   * Retrieves invoice default settings from IndexedDB
   */
  async getInvoiceDefaults(): Promise<InvoiceDefaults> {
    return await settingsRepository.getSetting<InvoiceDefaults>(
      INVOICE_DEFAULTS_KEY,
      INITIAL_INVOICE_DEFAULTS
    );
  },

  /**
   * Saves invoice default settings to IndexedDB
   */
  async saveInvoiceDefaults(data: InvoiceDefaultsFormData): Promise<InvoiceDefaults> {
    const merged: InvoiceDefaults = {
      prefix: data.prefix.toUpperCase().trim(),
      nextNumber: data.nextNumber,
      dueDays: data.dueDays,
      taxRate: data.taxRate,
      notes: data.notes?.trim() ?? '',
      paymentInstructions: data.paymentInstructions?.trim() ?? '',
    };

    await settingsRepository.setSetting(INVOICE_DEFAULTS_KEY, merged);
    return merged;
  },

  /**
   * Loads both company and invoice default settings in parallel
   */
  async loadAll(): Promise<AllSettings> {
    const [company, invoiceDefaults] = await Promise.all([
      this.getCompanyProfile(),
      this.getInvoiceDefaults(),
    ]);

    return { company, invoiceDefaults };
  },
};
