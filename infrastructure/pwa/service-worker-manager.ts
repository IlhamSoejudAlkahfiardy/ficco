'use client';

import { usePwaStore } from './pwa-store';

/**
 * Service Worker Registration & Lifecycle Manager
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // Do not register in non-secure context unless localhost
  if (
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    const store = usePwaStore.getState();
    store.setSwRegistered(true);

    // Check if an update is already waiting
    if (registration.waiting) {
      store.setHasUpdate(true);
    }

    // Listen for new service worker updates being installed
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (
          installingWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          // New version found and waiting
          usePwaStore.getState().setHasUpdate(true);
        }
      });
    });

    // Detect controllerchange (when new SW takes control via skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        // Optionally reload or state update
      }
    });

    return registration;
  } catch (error) {
    console.warn('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister all active Service Workers (useful for testing or cache reset)
 */
export async function unregisterServiceWorkers(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
    usePwaStore.getState().setSwRegistered(false);
    return true;
  } catch {
    return false;
  }
}

/**
 * Precaches currently loaded static bundles and page HTML for complete offline shell operation
 */
export async function cacheCurrentPageAssets(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const staticCache = await caches.open('ficco-static-v1.0.1');
    const pagesCache = await caches.open('ficco-pages-v1.0.1');

    // 1. Cache current page HTML
    const pageRes = await fetch(window.location.href, { cache: 'no-cache' });
    if (pageRes.ok) {
      await pagesCache.put(window.location.href, pageRes.clone());
      await pagesCache.put(window.location.pathname, pageRes);
    }

    // 2. Cache all loaded scripts, styles, and static assets
    const resources = performance
      .getEntriesByType('resource')
      .filter((r) => r.name.includes('/_next/static/') || r.name.includes('/icons/'))
      .map((r) => r.name);

    for (const url of resources) {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (res.ok) {
          await staticCache.put(url, res);
        }
      } catch {
        // Ignore individual failures
      }
    }
  } catch (err) {
    console.warn('[PWA] Failed to cache page assets:', err);
  }
}
