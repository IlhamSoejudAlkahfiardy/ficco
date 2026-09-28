'use client';

import React from 'react';
import { InvoiceDetailView } from './invoice-detail-view';

interface InvoiceDetailDrawerProps {
  isOpen: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onInvoiceUpdated?: () => void;
  onInvoiceDeleted?: () => void;
}

export const InvoiceDetailDrawer: React.FC<InvoiceDetailDrawerProps> = ({
  isOpen,
  invoiceId,
  onClose,
  onInvoiceUpdated,
  onInvoiceDeleted,
}) => {
  if (!isOpen || !invoiceId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end">
      {/* Backdrop click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-slate-200 dark:border-zinc-800 overflow-y-auto animate-in slide-in-from-right duration-300">
        <InvoiceDetailView
          invoiceId={invoiceId}
          isDrawer={true}
          onClose={onClose}
          onInvoiceUpdated={onInvoiceUpdated}
          onInvoiceDeleted={onInvoiceDeleted}
        />
      </div>
    </div>
  );
};
