'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { format, addDays, parseISO } from 'date-fns';
import { customerRepository } from '@/infrastructure/database/repositories/customer-repository';
import { productRepository } from '@/infrastructure/database/repositories/product-repository';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import { Customer, Product } from '@/infrastructure/database/schema';
import { InvoiceFormData, invoiceSchema } from '../_schemas/invoice.schemas';
import {
  calculateInvoiceTotals,
  calculateLineItem,
} from '../_utils/invoice-calculations';
import { InvoiceDomainService } from '../_services/invoice-domain-service';
import { InvoiceCalculationResult } from '../_types/invoice.types';

export interface UseInvoiceFormOptions {
  onSuccess?: (invoiceId: string) => void;
  defaultStatus?: 'draft' | 'sent' | 'pending';
}

export function useInvoiceForm(options?: UseInvoiceFormOptions) {
  const router = useRouter();

  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingInit, setIsLoadingInit] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Quick customer modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Default dates
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const defaultDueStr = useMemo(
    () => format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    []
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    defaultValues: {
      invoiceNumber: 'INV-TEMP',
      customerId: '',
      issueDate: todayStr,
      dueDate: defaultDueStr,
      status: options?.defaultStatus || 'draft',
      notes: '',
      discount: 0,
      tax: 0,
      items: [
        {
          productId: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxRate: 0,
        },
      ],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items',
  });

  // Load initial settings, numbers, and master data from IndexedDB
  const loadInitialData = useCallback(async () => {
    setIsLoadingInit(true);
    try {
      const [custList, prodList, defaults, nextNum] = await Promise.all([
        customerRepository.getAll(),
        productRepository.getAll(),
        settingsRepository.get<{
          prefix?: string;
          nextNumber?: number;
          dueDays?: number;
          taxRate?: number;
          notes?: string;
          paymentInstructions?: string;
        }>('invoice_defaults'),
        InvoiceDomainService.getNextInvoiceNumber(),
      ]);

      setCustomers(custList);
      setProducts(prodList.filter((p) => p.active));

      const dueDays = defaults?.dueDays || 14;
      const calculatedDueDate = format(addDays(new Date(), dueDays), 'yyyy-MM-dd');

      let combinedNotes = defaults?.notes || '';
      if (defaults?.paymentInstructions) {
        combinedNotes = combinedNotes
          ? `${combinedNotes}\n\nInstruksi Pembayaran:\n${defaults.paymentInstructions}`
          : `Instruksi Pembayaran:\n${defaults.paymentInstructions}`;
      }

      setValue('invoiceNumber', nextNum);
      setValue('dueDate', calculatedDueDate);
      setValue('notes', combinedNotes);

      // If defaults has taxRate, set it to the first empty item
      if (defaults?.taxRate && defaults.taxRate > 0) {
        setValue('items.0.taxRate', defaults.taxRate);
      }
    } catch (err) {
      console.error('Error loading initial invoice data', err);
    } finally {
      setIsLoadingInit(false);
    }
  }, [setValue]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Regenerate number on demand
  const refreshInvoiceNumber = useCallback(async () => {
    try {
      const nextNum = await InvoiceDomainService.getNextInvoiceNumber();
      setValue('invoiceNumber', nextNum);
    } catch (err) {
      console.error('Failed to refresh invoice number', err);
    }
  }, [setValue]);

  // Watch form fields to drive live calculation
  const watchedItems = useWatch({ control, name: 'items' });
  const watchedDiscount = useWatch({ control, name: 'discount' });
  const watchedCustomerId = useWatch({ control, name: 'customerId' });
  const watchedIssueDate = useWatch({ control, name: 'issueDate' });
  const watchedDueDate = useWatch({ control, name: 'dueDate' });
  const watchedStatus = useWatch({ control, name: 'status' });

  // Selected customer details preview
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === watchedCustomerId);
  }, [customers, watchedCustomerId]);

  // Central domain calculation of live totals (Strict Rule: Zero Duplication)
  const totals: InvoiceCalculationResult = useMemo(() => {
    return calculateInvoiceTotals({
      items: (watchedItems || []).map((it) => ({
        productId: it?.productId,
        description: it?.description || '',
        quantity: Number(it?.quantity) || 0,
        unitPrice: Number(it?.unitPrice) || 0,
        discount: Number(it?.discount) || 0,
        taxRate: Number(it?.taxRate) || 0,
      })),
      invoiceDiscount: Number(watchedDiscount) || 0,
      invoiceTaxRate: 0,
    });
  }, [watchedItems, watchedDiscount]);

  // Handle selecting a catalog product for a line item
  const handleSelectProduct = useCallback(
    (index: number, productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setValue(`items.${index}.productId`, product.id);
        setValue(`items.${index}.description`, product.name);
        setValue(`items.${index}.unitPrice`, product.price);
        setValue(`items.${index}.taxRate`, product.taxRate || 0);
        // keep existing quantity or default to 1
        const currentQty = watchedItems?.[index]?.quantity;
        if (!currentQty || currentQty <= 0) {
          setValue(`items.${index}.quantity`, 1);
        }
      } else {
        setValue(`items.${index}.productId`, '');
      }
    },
    [products, setValue, watchedItems]
  );

  // Quick Due Date Presets
  const setDueDatePreset = useCallback(
    (days: number) => {
      try {
        const baseDate = watchedIssueDate ? parseISO(watchedIssueDate) : new Date();
        const nextDue = format(addDays(baseDate, days), 'yyyy-MM-dd');
        setValue('dueDate', nextDue);
      } catch {
        const nextDue = format(addDays(new Date(), days), 'yyyy-MM-dd');
        setValue('dueDate', nextDue);
      }
    },
    [watchedIssueDate, setValue]
  );

  // Add line item
  const handleAddItem = useCallback(() => {
    append({
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
    });
  }, [append]);

  // Remove line item (preserves at least 1 item)
  const handleRemoveItem = useCallback(
    (index: number) => {
      if (fields.length > 1) {
        remove(index);
      }
    },
    [fields.length, remove]
  );

  // Save handler with designated status ('draft' or 'sent')
  const saveInvoice = useCallback(
    async (targetStatus: 'draft' | 'sent') => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        setValue('status', targetStatus);
        const currentValues = watch();
        currentValues.status = targetStatus;

        // Validate using Zod schema
        const validated = invoiceSchema.safeParse(currentValues);
        if (!validated.success) {
          const firstErr = validated.error.issues[0]?.message || 'Formulir tidak valid.';
          setSubmitError(firstErr);
          setIsSubmitting(false);
          return false;
        }

        const result = await InvoiceDomainService.createInvoice(validated.data);

        if (options?.onSuccess) {
          options.onSuccess(result.invoice.id);
        } else {
          router.push('/invoices');
        }

        return true;
      } catch (err) {
        console.error('Failed to create invoice', err);
        setSubmitError((err as Error).message || 'Gagal menyimpan faktur ke IndexedDB.');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [setValue, watch, options, router]
  );

  // Reload customer list after quick add
  const refreshCustomers = useCallback(async (newSelectedId?: string) => {
    try {
      const custList = await customerRepository.getAll();
      setCustomers(custList);
      if (newSelectedId) {
        setValue('customerId', newSelectedId);
      }
    } catch (err) {
      console.error('Failed to refresh customers', err);
    }
  }, [setValue]);

  return {
    // Form handlers & state
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    errors,
    fields,
    handleAddItem,
    handleRemoveItem,
    handleSelectProduct,
    setDueDatePreset,
    refreshInvoiceNumber,
    saveInvoice,

    // State
    isLoadingInit,
    isSubmitting,
    submitError,
    setSubmitError,

    // Master references
    customers,
    products,
    selectedCustomer,
    refreshCustomers,

    // Live watched values & calculations
    watchedItems,
    watchedDiscount,
    watchedCustomerId,
    watchedIssueDate,
    watchedDueDate,
    watchedStatus,
    totals,

    // Quick customer creation modal state
    isNewCustomerModalOpen,
    setIsNewCustomerModalOpen,
    isCreatingCustomer,
    setIsCreatingCustomer,
  };
}
