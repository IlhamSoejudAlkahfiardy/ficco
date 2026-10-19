'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icons } from '@/shared/_components/icons';
import { useAdminAuth } from '../_hooks/use-admin-auth';
import { ADMIN_OBSCURE_PATH } from '../_services/admin-auth-service';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || ADMIN_OBSCURE_PATH;

  const { login, isLoading, error, setError } = useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);
    setError(null);

    if (!username.trim()) {
      setFormValidationError('Username wajib diisi');
      return;
    }
    if (!password) {
      setFormValidationError('Password wajib diisi');
      return;
    }

    const success = await login({ username: username.trim(), password });
    if (success) {
      router.push(from);
      router.refresh();
    }
  };

  const handleFillDemoCredentials = () => {
    setUsername('admin');
    setPassword('ficco-admin-2026');
    setFormValidationError(null);
    setError(null);
  };

  const activeError = formValidationError || error;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl backdrop-blur-sm p-6 sm:p-8 space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-1">
            <Icons.shield size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Ficco Admin Portal
          </h1>
          <p className="text-xs text-slate-400">
            Akses internal khusus pengelolaan lisensi & aktivasi sistem
          </p>
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Area Terproteksi • Jalur Khusus
          </div>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn"
          >
            <Icons.alertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Autentikasi Gagal</span>
              {activeError}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Username */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="admin-username"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Username Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Icons.user size={18} />
              </div>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Icons.lock size={18} />
              </div>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                disabled={isLoading}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Icons.loader size={18} className="animate-spin" />
                <span>Memverifikasi Sesi...</span>
              </>
            ) : (
              <>
                <Icons.shield size={18} />
                <span>Masuk ke Admin Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill in Dev Mode */}
        {process.env.NEXT_PUBLIC_DEVELOPMENT === 'TRUE' && (
          <div className="pt-2 border-t border-slate-700/60">
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icons.key size={14} className="text-amber-400" />
              <span>Isi Kredensial Admin Bawaan (Dev Mode)</span>
            </button>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="pt-2 text-[11px] text-slate-500 leading-relaxed">
          <p>
            🔒 Sesi admin disimpan secara aman menggunakan HTTP-Only cookie bertanda tangan kriptografis. Kredensial tidak pernah terekspos di browser klien.
          </p>
        </div>
      </div>
    </div>
  );
}
