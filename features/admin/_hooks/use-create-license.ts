'use client';

import { useState } from 'react';
import type { License, CreateLicenseInput } from '@/features/license';
import type { CreateLicenseResponse } from '../_types/admin.types';

export function useCreateLicense(onSuccess?: (license: License) => void) {
  const [isCreating, setIsCreating] = useState(false);
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createLicense = async (input: CreateLicenseInput): Promise<License | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data: CreateLicenseResponse = await res.json();

      if (!res.ok || !data.success || !data.license) {
        const errorMsg = data.error || 'Gagal membuat kunci lisensi baru';
        setError(errorMsg);
        return null;
      }

      setCreatedLicense(data.license);
      if (onSuccess) {
        onSuccess(data.license);
      }
      return data.license;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi gangguan jaringan';
      setError(message);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setCreatedLicense(null);
    setError(null);
    setIsCreating(false);
  };

  return {
    isCreating,
    createdLicense,
    error,
    createLicense,
    reset,
  };
}
