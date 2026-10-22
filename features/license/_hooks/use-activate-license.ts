'use client';

import { useCallback, useMemo } from 'react';
import type {
  License,
  LicenseErrorCode,
} from '../_types/license.types';
import { useLicenseStore } from '../_stores/license-store';
import { getOrCreateDeviceFingerprint } from '../_services/device-fingerprint';

export function useActivateLicense(onSuccess?: (license: License) => void) {
  const isActivated = useLicenseStore((state) => state.isActivated);
  const licenseKey = useLicenseStore((state) => state.licenseKey);
  const customerName = useLicenseStore((state) => state.customerName);
  const customerEmail = useLicenseStore((state) => state.customerEmail);
  const activatedAt = useLicenseStore((state) => state.activatedAt);
  const deviceFingerprint = useLicenseStore((state) => state.deviceFingerprint);
  const isActivating = useLicenseStore((state) => state.isActivating);
  const error = useLicenseStore((state) => state.error);
  const errorCode = useLicenseStore((state) => state.errorCode);
  const isHydrated = useLicenseStore((state) => state.isHydrated);

  const activateWithServer = useLicenseStore((state) => state.activateWithServer);
  const clearStoreActivation = useLicenseStore((state) => state.clearActivation);
  const resetStoreError = useLicenseStore((state) => state.resetError);

  const deviceId = useMemo(() => {
    return deviceFingerprint || getOrCreateDeviceFingerprint();
  }, [deviceFingerprint]);

  const activatedLicense = useMemo<License | null>(() => {
    if (!isActivated || !licenseKey) return null;
    return {
      id: 'local_active',
      licenseKey,
      used: true,
      createdAt: activatedAt || new Date().toISOString(),
      customerName,
      customerEmail,
      activatedAt,
      deviceFingerprint: deviceId,
    };
  }, [isActivated, licenseKey, customerName, customerEmail, activatedAt, deviceId]);

  const activateLicense = useCallback(
    async (
      rawLicenseKey: string
    ): Promise<{
      success: boolean;
      license?: License;
      error?: string;
      code?: LicenseErrorCode;
    }> => {
      const result = await activateWithServer(rawLicenseKey);
      if (result.success && result.license && onSuccess) {
        onSuccess(result.license);
      }
      return result;
    },
    [activateWithServer, onSuccess]
  );

  const reset = useCallback(() => {
    resetStoreError();
  }, [resetStoreError]);

  const clearActivation = useCallback(() => {
    clearStoreActivation();
  }, [clearStoreActivation]);

  return {
    isActivated,
    isActivating,
    isHydrated,
    activatedLicense,
    error,
    errorCode,
    deviceId,
    activateLicense,
    reset,
    clearActivation,
  };
}
