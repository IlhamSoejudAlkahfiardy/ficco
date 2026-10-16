'use client';

import { create } from 'zustand';
import type { BeforeInstallPromptEvent, PwaState } from './types';

interface PwaStore extends PwaState {
  initPwa: () => void;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setSwRegistered: (registered: boolean) => void;
  setHasUpdate: (hasUpdate: boolean) => void;
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  updateServiceWorker: () => void;
}

export const usePwaStore = create<PwaStore>((set, get) => ({
  isSupported: false,
  isStandalone: false,
  isInstalled: false,
  canInstall: false,
  isSwRegistered: false,
  hasUpdate: false,
  deferredPrompt: null,

  initPwa: () => {
    if (typeof window === 'undefined') return;

    const isSupported = 'serviceWorker' in navigator;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS Safari legacy property
      navigator.standalone === true;

    set({
      isSupported,
      isStandalone,
      isInstalled: isStandalone,
    });

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic browser banner
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      set({
        deferredPrompt: promptEvent,
        canInstall: true,
      });
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      set({
        canInstall: false,
        deferredPrompt: null,
        isInstalled: true,
        isStandalone: true,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
  },

  setDeferredPrompt: (prompt) => {
    set({
      deferredPrompt: prompt,
      canInstall: !!prompt,
    });
  },

  setSwRegistered: (isSwRegistered) => {
    set({ isSwRegistered });
  },

  setHasUpdate: (hasUpdate) => {
    set({ hasUpdate });
  },

  triggerInstall: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) {
      return 'unavailable';
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        set({ canInstall: false, deferredPrompt: null, isInstalled: true });
        return 'accepted';
      } else {
        set({ canInstall: false, deferredPrompt: null });
        return 'dismissed';
      }
    } catch {
      return 'unavailable';
    }
  },

  updateServiceWorker: () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  },
}));
