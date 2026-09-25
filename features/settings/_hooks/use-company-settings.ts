'use client';

import { useState, useEffect, useCallback } from 'react';
import { SettingsService } from '../_services/settings-service';
import {
  CompanyProfile,
  InvoiceDefaults,
  INITIAL_INVOICE_DEFAULTS,
} from '../_types/settings.types';
import {
  companyProfileSchema,
  invoiceDefaultsSchema,
  CompanyProfileFormData,
  InvoiceDefaultsFormData,
} from '../_schemas/settings.schemas';

export function useCompanySettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [invoiceDefaults, setInvoiceDefaults] = useState<InvoiceDefaults>(
    INITIAL_INVOICE_DEFAULTS
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await SettingsService.loadAll();
      setCompany(data.company);
      setInvoiceDefaults(data.invoiceDefaults);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Gagal memuat pengaturan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveCompany = async (data: CompanyProfileFormData): Promise<boolean> => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveMessage(null);

    const result = companyProfileSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error.issues[0]?.message || 'Data profil tidak valid.';
      setErrorMessage(msg);
      setIsSaving(false);
      return false;
    }

    try {
      const updated = await SettingsService.saveCompanyProfile(result.data);
      setCompany(updated);
      setSaveMessage('Profil bisnis berhasil disimpan ke IndexedDB!');
      return true;
    } catch (err) {
      setErrorMessage((err as Error).message || 'Gagal menyimpan profil bisnis.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveDefaults = async (data: InvoiceDefaultsFormData): Promise<boolean> => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveMessage(null);

    const result = invoiceDefaultsSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error.issues[0]?.message || 'Pengaturan faktur tidak valid.';
      setErrorMessage(msg);
      setIsSaving(false);
      return false;
    }

    try {
      const updated = await SettingsService.saveInvoiceDefaults(result.data);
      setInvoiceDefaults(updated);
      setSaveMessage('Pengaturan default faktur berhasil disimpan ke IndexedDB!');
      return true;
    } catch (err) {
      setErrorMessage((err as Error).message || 'Gagal menyimpan pengaturan faktur.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    saveMessage,
    errorMessage,
    company,
    invoiceDefaults,
    saveCompany,
    saveDefaults,
    reload: loadSettings,
    clearMessage: () => {
      setSaveMessage(null);
      setErrorMessage(null);
    },
  };
}
