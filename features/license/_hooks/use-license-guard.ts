'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLicenseStore } from '../_stores/license-store';

/**
 * Public routes that do not require an active license.
 */
export const PUBLIC_ROUTES = ['/license', '/offline'] as const;

/**
 * Determines whether a pathname requires an active license.
 */
export function isPathProtected(pathname: string): boolean {
  // Ignore Next.js internals, static assets, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js'
  ) {
    return false;
  }

  // Admin portal has its own separate authentication gate (Step 22)
  if (pathname.startsWith('/admin-dashboard')) {
    return false;
  }

  // Exempt public customer routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return false;
  }

  // All other customer business routes (/dashboard, /invoices, /expenses, /customers, /products, /reports, /settings, /backup) are protected
  return true;
}

export function useLicenseGuard() {
  const pathname = usePathname();
  const isHydrated = useLicenseStore((state) => state.isHydrated);
  const isActivated = useLicenseStore((state) => state.isActivated);

  const isProtected = useMemo(() => isPathProtected(pathname), [pathname]);
  const isAllowed = useMemo(() => {
    if (!isProtected) return true;
    return isHydrated && isActivated;
  }, [isProtected, isHydrated, isActivated]);

  return {
    pathname,
    isHydrated,
    isActivated,
    isProtected,
    isAllowed,
  };
}
