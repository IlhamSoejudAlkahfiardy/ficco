'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  License,
  LicenseErrorCode,
  ActivateLicenseResponse,
} from '../_types/license.types';
import { getOrCreateDeviceFingerprint } from '../_services/device-fingerprint';

const ACTIVATED_LICENSE_STORAGE_KEY = 'ficco_activated_license';

export function useActivateLicense(onSuccess?: (license: License) => void) {
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activatedLicense, setActivatedLicense] = useState<License | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<LicenseErrorCode | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  // Initial read for device fingerprint and local cached license
  useEffect(() => {
    let ignore = false;

    const initDeviceAndLicense = () => {
      try {
        const fp = getOrCreateDeviceFingerprint();
        const cached = localStorage.getItem(ACTIVATED_LICENSE_STORAGE_KEY);
        let parsedLic: License | null = null;
        if (cached) {
          try {
            parsedLic = JSON.parse(cached);
          } catch {
            parsedLic = null;
          }
        }

        if (!ignore) {
          setDeviceId(fp);
          if (parsedLic && parsedLic.licenseKey) {
            setActivatedLicense(parsedLic);
          }
        }
      } catch {
        // Fallback for SSR or storage disabled
      }
    };

    initDeviceAndLicense();

    return () => {
      ignore = true;
    };
  }, []);

  const activateLicense = useCallback(
    async (
      rawLicenseKey: string
    ): Promise<{
      success: boolean;
      license?: License;
      error?: string;
      code?: LicenseErrorCode;
    }> => {
      setIsActivating(true);
      setError(null);
      setErrorCode(null);

      const deviceFp = deviceId || getOrCreateDeviceFingerprint();

      try {
        const res = await fetch('/api/license/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            licenseKey: rawLicenseKey,
            deviceFingerprint: deviceFp,
          }),
        });

        const data: ActivateLicenseResponse = await res.json().catch(() => ({
          success: false,
          error: 'Respon server tidak valid.',
        }));

        if (!res.ok || !data.success || !data.license) {
          const errMsg = data.error || 'Aktivasi lisensi gagal.';
          const code = data.code || 'DATABASE_ERROR';
          setError(errMsg);
          setErrorCode(code);
          return { success: false, error: errMsg, code };
        }

        // Activation succeeded: update state and persist
        setActivatedLicense(data.license);
        try {
          localStorage.setItem(
            ACTIVATED_LICENSE_STORAGE_KEY,
            JSON.stringify(data.license)
          );
        } catch {
          // Ignore localStorage errors
        }

        if (onSuccess) {
          onSuccess(data.license);
        }

        return { success: true, license: data.license };
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : 'Gangguan koneksi jaringan.';
        setError(errMsg);
        setErrorCode('DATABASE_ERROR');
        return { success: false, error: errMsg, code: 'DATABASE_ERROR' };
      } finally {
        setIsActivating(false);
      }
    },
    [deviceId, onSuccess]
  );

  const reset = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const clearActivation = useCallback(() => {
    setActivatedLicense(null);
    setError(null);
    setErrorCode(null);
    try {
      localStorage.removeItem(ACTIVATED_LICENSE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    isActivating,
    activatedLicense,
    error,
    errorCode,
    deviceId,
    activateLicense,
    reset,
    clearActivation,
  };
}
