'use client';

import { create } from 'zustand';

interface ShellState {
  isSidebarCollapsed: boolean;
  isMobileNavOpen: boolean;
  isOnline: boolean;
  isCheckingConnectivity: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;
  closeMobileNav: () => void;
  setIsOnline: (online: boolean) => void;
  checkConnectivity: () => Promise<boolean>;
}

export const useShellStore = create<ShellState>((set) => ({
  isSidebarCollapsed: false,
  isMobileNavOpen: false,
  // Start with true to ensure SSR and initial client hydration match
  isOnline: true,
  isCheckingConnectivity: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleMobileNav: () =>
    set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  setIsOnline: (online) => set({ isOnline: online }),
  checkConnectivity: async () => {
    set({ isCheckingConnectivity: true });
    try {
      // First check navigator if available
      const navOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // Always test active probe to our local server /api/ping
      // This solves cases where mobile Wi-Fi flags 'no internet' even though ngrok is fully reachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const isConnected = res.ok || navOnline;
      set({ isOnline: isConnected, isCheckingConnectivity: false });
      return isConnected;
    } catch {
      // Probe failed: fallback to navigator.onLine
      const fallbackOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
      set({ isOnline: fallbackOnline, isCheckingConnectivity: false });
      return fallbackOnline;
    }
  },
}));
