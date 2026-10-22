import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  License,
  LicenseStoreState,
  LocalLicenseState,
  ActivateLicenseResponse,
} from '../_types/license.types';
import { getOrCreateDeviceFingerprint } from '../_services/device-fingerprint';

const INITIAL_LICENSE_STATE: LocalLicenseState = {
  isActivated: false,
  licenseKey: null,
  customerName: null,
  customerEmail: null,
  activatedAt: null,
  deviceFingerprint: null,
  lastVerifiedAt: null,
};

export const useLicenseStore = create<LicenseStoreState>()(
  persist(
    (set, get) => ({
      ...INITIAL_LICENSE_STATE,
      isHydrated: false,
      isActivating: false,
      error: null,
      errorCode: null,

      setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),

      resetError: () => set({ error: null, errorCode: null }),

      setActivated: (license: License) => {
        set({
          isActivated: true,
          licenseKey: license.licenseKey,
          customerName: license.customerName || null,
          customerEmail: license.customerEmail || null,
          activatedAt: license.activatedAt || new Date().toISOString(),
          deviceFingerprint:
            license.deviceFingerprint || getOrCreateDeviceFingerprint(),
          lastVerifiedAt: new Date().toISOString(),
          error: null,
          errorCode: null,
        });
      },

      clearActivation: () => {
        set({
          ...INITIAL_LICENSE_STATE,
          error: null,
          errorCode: null,
        });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('ficco_activated_license');
          } catch {
            // Ignore localStorage errors
          }
        }
      },

      activateWithServer: async (rawLicenseKey: string) => {
        set({ isActivating: true, error: null, errorCode: null });

        const deviceFp =
          get().deviceFingerprint || getOrCreateDeviceFingerprint();

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
            set({
              isActivating: false,
              error: errMsg,
              errorCode: code,
            });
            return { success: false, error: errMsg, code };
          }

          // Update store with activated license
          get().setActivated(data.license);
          set({ isActivating: false });

          // Also keep backwards-compatible key for legacy checks if needed
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                'ficco_activated_license',
                JSON.stringify(data.license)
              );
            } catch {
              // Ignore
            }
          }

          return { success: true, license: data.license };
        } catch (err) {
          const errMsg =
            err instanceof Error ? err.message : 'Gangguan koneksi jaringan.';
          set({
            isActivating: false,
            error: errMsg,
            errorCode: 'DATABASE_ERROR',
          });
          return { success: false, error: errMsg, code: 'DATABASE_ERROR' };
        }
      },
    }),
    {
      name: 'ficco_license_store',
      storage: createJSONStorage(() => localStorage),
      // Only persist local license domain state (exclude transient UI flags)
      partialize: (state) => ({
        isActivated: state.isActivated,
        licenseKey: state.licenseKey,
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        activatedAt: state.activatedAt,
        deviceFingerprint: state.deviceFingerprint,
        lastVerifiedAt: state.lastVerifiedAt,
      }),
      onRehydrateStorage: () => (state) => {
        // Backwards compatibility migration from Step 26 raw localStorage if present
        if (state && !state.isActivated && typeof window !== 'undefined') {
          try {
            const legacy = localStorage.getItem('ficco_activated_license');
            if (legacy) {
              const parsed = JSON.parse(legacy);
              if (parsed && parsed.licenseKey) {
                state.setActivated(parsed);
              }
            }
          } catch {
            // Ignore
          }
        }
        state?.setHydrated(true);
      },
    }
  )
);

// Convenient selectors for performant re-renders
export const useIsLicenseActivated = () =>
  useLicenseStore((state) => state.isActivated);

export const useLicenseKey = () =>
  useLicenseStore((state) => state.licenseKey);

export const useIsLicenseHydrated = () =>
  useLicenseStore((state) => state.isHydrated);
