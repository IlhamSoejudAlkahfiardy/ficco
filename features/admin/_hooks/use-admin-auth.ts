'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminUser, AdminLoginDTO, AdminAuthResponse, AdminMeResponse } from '../_types/admin.types';
import { ADMIN_OBSCURE_PATH } from '../_services/admin-auth-service';

export function useAdminAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me');
      const data: AdminMeResponse = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const verifyInitialSession = async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data: AdminMeResponse = await res.json();
        if (!ignore) {
          if (data.authenticated && data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (!ignore) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    verifyInitialSession();

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (credentials: AdminLoginDTO): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: AdminAuthResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Login gagal, periksa kembali username dan password.');
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi gangguan jaringan';
      setError(msg);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push(`${ADMIN_OBSCURE_PATH}/login`);
      router.refresh();
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    setError,
    login,
    logout,
    checkAuth,
  };
}
