'use client';

import React, { useRef, useState } from 'react';

interface LogoUploaderProps {
  value?: string;
  onChange: (base64: string) => void;
  onRemove: () => void;
  companyName?: string;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  value,
  onChange,
  onRemove,
  companyName = 'F',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (PNG, JPG, WebP, SVG).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress/resize on canvas to max 400x400 to keep IndexedDB lean
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
          onChange(compressedDataUrl);
        } else {
          onChange(event.target?.result as string);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-5">
      {/* Logo Display */}
      <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 overflow-hidden flex items-center justify-center flex-shrink-0 group shadow-xs">
        {value ? (
          <img
            src={value}
            alt="Company Logo Preview"
            className="w-full h-full object-contain p-1.5"
          />
        ) : (
          <span className="text-2xl font-bold text-slate-400 dark:text-zinc-500 uppercase select-none">
            {companyName.trim().charAt(0) || 'F'}
          </span>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="space-y-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            {value ? 'Ganti Logo' : 'Upload Logo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
          PNG, JPG, atau WebP. Maks 400×400px (otomatis dioptimasi).
        </p>
      </div>
    </div>
  );
};
