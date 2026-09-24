import React from 'react';

export default function AdminLoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Ficco Admin Portal</h1>
        <p className="text-xs text-slate-400">Protected administrative area</p>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs text-slate-400">
          Admin authentication will be integrated in Step 20.
        </div>
      </div>
    </div>
  );
}
