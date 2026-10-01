import { PdfColor, PdfDocumentBuilder } from './pdf-document-builder';
import { Invoice, InvoiceItem, Customer } from '../database/schema';
import { CompanyProfile } from '@/features/settings/_types/settings.types';
import {
  InvoiceCalculationResult,
  InvoicePaymentSummary,
} from '@/features/invoices/_types/invoice.types';
import { Payment } from '@/features/invoices/_types/payment.types';

export interface InvoicePdfData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer?: Customer | Partial<Customer>;
  company?: Partial<CompanyProfile>;
  calculation: InvoiceCalculationResult;
  paymentSummary: InvoicePaymentSummary;
  payments?: Payment[];
  paymentInstructions?: string;
}

// Harmonious business color palette
const COLORS: Record<string, PdfColor> = {
  primary: { r: 37, g: 99, b: 235 }, // Blue 600
  primaryDark: { r: 30, g: 58, b: 138 }, // Blue 900
  textDark: { r: 15, g: 23, b: 42 }, // Slate 900
  textMuted: { r: 100, g: 116, b: 139 }, // Slate 500
  textLight: { r: 148, g: 163, b: 184 }, // Slate 400
  bgLight: { r: 248, g: 250, b: 252 }, // Slate 50
  bgHeader: { r: 241, g: 245, b: 249 }, // Slate 100
  border: { r: 226, g: 232, b: 240 }, // Slate 200
  borderDark: { r: 203, g: 213, b: 225 }, // Slate 300
  success: { r: 16, g: 185, b: 129 }, // Emerald 500
  successBg: { r: 236, g: 253, b: 245 }, // Emerald 50
  warning: { r: 245, g: 158, b: 11 }, // Amber 500
  warningBg: { r: 254, g: 243, b: 199 }, // Amber 50
  danger: { r: 239, g: 68, b: 68 }, // Rose 500
  dangerBg: { r: 254, g: 242, b: 242 }, // Rose 50
  white: { r: 255, g: 255, b: 255 },
};

/**
 * Formats a numeric currency value into Indonesian standard format (Rp 1.500.000).
 */
function formatCurrency(amount: number, currency: string = 'Rp'): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const parts = rounded.toFixed(0).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${currency} ${integerPart}`;
}

/**
 * Maps invoice status to human-readable label and status color theme.
 */
function getStatusBadgeConfig(status: string, isOverdue: boolean) {
  if (status === 'paid') {
    return { label: 'LUNAS (PAID)', bg: COLORS.successBg, text: COLORS.success };
  }
  if (isOverdue || status === 'overdue') {
    return { label: 'JATUH TEMPO (OVERDUE)', bg: COLORS.dangerBg, text: COLORS.danger };
  }
  if (status === 'partially_paid') {
    return { label: 'SEBAGIAN (PARTIALLY PAID)', bg: COLORS.warningBg, text: COLORS.warning };
  }
  if (status === 'sent') {
    return { label: 'TERBIT (SENT)', bg: COLORS.bgHeader, text: COLORS.primary };
  }
  if (status === 'cancelled') {
    return { label: 'DIBATALKAN (CANCELLED)', bg: COLORS.bgHeader, text: COLORS.textMuted };
  }
  return { label: 'DRAF (DRAFT)', bg: COLORS.bgHeader, text: COLORS.textMuted };
}

/**
 * Builds a professional vector-based A4 invoice PDF document.
 */
export function buildInvoicePdf(data: InvoicePdfData): PdfDocumentBuilder {
  const {
    invoice,
    items,
    customer,
    company,
    calculation,
    paymentSummary,
    payments = [],
    paymentInstructions,
  } = data;

  const title = `Faktur - ${invoice.invoiceNumber || 'INV'}`;
  const pdf = new PdfDocumentBuilder(title);

  const pageWidth = PdfDocumentBuilder.A4_WIDTH;
  const pageHeight = PdfDocumentBuilder.A4_HEIGHT;
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;

  let y = 36;

  // 1. Top Decorative Accent Bar
  pdf.drawRect(0, 0, pageWidth, 6, {
    fillColor: COLORS.primary,
  });

  // 2. Document Header (Company Profile on Left, Invoice Title & Meta on Right)
  const companyName = company?.name || company?.legalName || 'Ficco Local Business';
  const companyTax = company?.taxNumber ? `NPWP: ${company.taxNumber}` : '';
  const companyPhone = company?.phone ? `Telp: ${company.phone}` : '';
  const companyEmail = company?.email ? `Email: ${company.email}` : '';
  const companyAddress = company?.address || '';

  // Left: Company Info
  pdf.drawText(companyName, marginX, y + 14, {
    font: 'Helvetica-Bold',
    size: 15,
    color: COLORS.textDark,
  });

  let companyY = y + 28;
  if (companyAddress) {
    companyY = pdf.drawWrappedText(companyAddress, marginX, companyY, 240, {
      font: 'Helvetica',
      size: 8.5,
      color: COLORS.textMuted,
      lineHeight: 11,
    });
  }

  const contactLine = [companyPhone, companyEmail, companyTax].filter(Boolean).join(' | ');
  if (contactLine) {
    pdf.drawText(contactLine, marginX, companyY + 4, {
      font: 'Helvetica',
      size: 8,
      color: COLORS.textLight,
    });
    companyY += 12;
  }

  // Right: INVOICE / FAKTUR Banner
  const rightX = pageWidth - marginX;
  pdf.drawText('FAKTUR PENJUALAN', rightX, y + 14, {
    font: 'Helvetica-Bold',
    size: 16,
    color: COLORS.primaryDark,
    align: 'right',
  });

  pdf.drawText(invoice.invoiceNumber, rightX, y + 28, {
    font: 'Helvetica-Bold',
    size: 11,
    color: COLORS.primary,
    align: 'right',
  });

  // Status Badge Box
  const statusBadge = getStatusBadgeConfig(invoice.status, paymentSummary.isOverdue);
  const badgeWidth = pdf.measureTextWidth(statusBadge.label, 8, true) + 14;
  const badgeX = rightX - badgeWidth;
  const badgeY = y + 36;
  pdf.drawRect(badgeX, badgeY, badgeWidth, 16, {
    fillColor: statusBadge.bg,
    strokeColor: statusBadge.text,
    lineWidth: 0.5,
  });
  pdf.drawText(statusBadge.label, badgeX + badgeWidth / 2, badgeY + 11, {
    font: 'Helvetica-Bold',
    size: 7.5,
    color: statusBadge.text,
    align: 'center',
  });

  // Date metadata under status badge
  let metaY = badgeY + 26;
  pdf.drawText(`Tgl Terbit: ${invoice.issueDate}`, rightX, metaY, {
    font: 'Helvetica',
    size: 8.5,
    color: COLORS.textMuted,
    align: 'right',
  });
  metaY += 12;
  pdf.drawText(`Jatuh Tempo: ${invoice.dueDate}`, rightX, metaY, {
    font: paymentSummary.isOverdue ? 'Helvetica-Bold' : 'Helvetica',
    size: 8.5,
    color: paymentSummary.isOverdue ? COLORS.danger : COLORS.textMuted,
    align: 'right',
  });

  // Position y below header
  y = Math.max(companyY + 16, metaY + 18);

  // Divider Line
  pdf.drawLine(marginX, y, rightX, y, {
    color: COLORS.border,
    lineWidth: 1,
  });
  y += 14;

  // 3. Customer Info Section (Bill To)
  pdf.drawRect(marginX, y, contentWidth, 54, {
    fillColor: COLORS.bgLight,
    strokeColor: COLORS.border,
    lineWidth: 0.5,
  });

  const billToY = y + 14;
  pdf.drawText('DITAGIHKAN KEPADA (BILL TO):', marginX + 12, billToY, {
    font: 'Helvetica-Bold',
    size: 7.5,
    color: COLORS.textLight,
  });

  const customerName = customer?.name || 'Pelanggan Tunai';
  pdf.drawText(customerName, marginX + 12, billToY + 14, {
    font: 'Helvetica-Bold',
    size: 11,
    color: COLORS.textDark,
  });

  const customerMetaParts = [
    customer?.companyName,
    customer?.phone,
    customer?.email,
    customer?.taxNumber ? `NPWP: ${customer.taxNumber}` : '',
  ].filter(Boolean);

  if (customerMetaParts.length > 0) {
    pdf.drawText(customerMetaParts.join('  •  '), marginX + 12, billToY + 27, {
      font: 'Helvetica',
      size: 8,
      color: COLORS.textMuted,
    });
  }

  if (customer?.address) {
    pdf.drawText(customer.address, marginX + 12, billToY + 37, {
      font: 'Helvetica',
      size: 7.5,
      color: COLORS.textMuted,
    });
  }

  y += 66;

  // 4. Line Items Table
  // Column definitions & widths (contentWidth = ~515 pt)
  const cols = {
    num: { x: marginX + 8, w: 22, align: 'center' as const },
    desc: { x: marginX + 32, w: 210, align: 'left' as const },
    qty: { x: marginX + 246, w: 35, align: 'right' as const },
    unitPrice: { x: marginX + 286, w: 75, align: 'right' as const },
    discount: { x: marginX + 366, w: 55, align: 'right' as const },
    tax: { x: marginX + 426, w: 35, align: 'right' as const },
    total: { x: rightX - 8, w: 75, align: 'right' as const },
  };

  const tableHeaderHeight = 22;
  // Header background
  pdf.drawRect(marginX, y, contentWidth, tableHeaderHeight, {
    fillColor: COLORS.primaryDark,
  });

  const thY = y + 15;
  pdf.drawText('#', cols.num.x + cols.num.w / 2, thY, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.white,
    align: 'center',
  });
  pdf.drawText('DESKRIPSI ITEM / PRODUK', cols.desc.x, thY, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.white,
    align: 'left',
  });
  pdf.drawText('QTY', cols.qty.x + cols.qty.w, thY, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.white,
    align: 'right',
  });
  pdf.drawText('HARGA SATUAN', cols.unitPrice.x + cols.unitPrice.w, thY, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.white,
    align: 'right',
  });
  pdf.drawText('DISKON', cols.discount.x + cols.discount.w, thY, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.white,
    align: 'right',
  });
  pdf.drawText('PAJAK', cols.tax.x + cols.tax.w, thY, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.white,
    align: 'right',
  });
  pdf.drawText('TOTAL', cols.total.x, thY, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.white,
    align: 'right',
  });

  y += tableHeaderHeight;

  // Table Rows
  const rowHeight = 20;
  items.forEach((item, index) => {
    // Check page overflow
    if (y + rowHeight > pageHeight - 160) {
      pdf.addPage();
      y = 40;
    }

    const isEven = index % 2 === 1;
    if (isEven) {
      pdf.drawRect(marginX, y, contentWidth, rowHeight, {
        fillColor: COLORS.bgLight,
      });
    }

    const rowTextY = y + 14;

    pdf.drawText(String(index + 1), cols.num.x + cols.num.w / 2, rowTextY, {
      font: 'Helvetica',
      size: 8,
      color: COLORS.textMuted,
      align: 'center',
    });

    pdf.drawText(item.description || 'Item', cols.desc.x, rowTextY, {
      font: 'Helvetica-Bold',
      size: 8.5,
      color: COLORS.textDark,
      align: 'left',
    });

    pdf.drawText(String(item.quantity), cols.qty.x + cols.qty.w, rowTextY, {
      font: 'Helvetica',
      size: 8.5,
      color: COLORS.textDark,
      align: 'right',
    });

    pdf.drawText(formatCurrency(item.unitPrice), cols.unitPrice.x + cols.unitPrice.w, rowTextY, {
      font: 'Helvetica',
      size: 8.5,
      color: COLORS.textDark,
      align: 'right',
    });

    const discountText = item.discount > 0 ? formatCurrency(item.discount) : '-';
    pdf.drawText(discountText, cols.discount.x + cols.discount.w, rowTextY, {
      font: 'Helvetica',
      size: 8,
      color: item.discount > 0 ? COLORS.danger : COLORS.textMuted,
      align: 'right',
    });

    const taxText = item.taxRate > 0 ? `${item.taxRate}%` : '-';
    pdf.drawText(taxText, cols.tax.x + cols.tax.w, rowTextY, {
      font: 'Helvetica',
      size: 8,
      color: COLORS.textMuted,
      align: 'right',
    });

    pdf.drawText(formatCurrency(item.total), cols.total.x, rowTextY, {
      font: 'Helvetica-Bold',
      size: 8.5,
      color: COLORS.textDark,
      align: 'right',
    });

    // Row bottom separator
    pdf.drawLine(marginX, y + rowHeight, rightX, y + rowHeight, {
      color: COLORS.border,
      lineWidth: 0.5,
    });

    y += rowHeight;
  });

  y += 12;

  // 5. Bottom Section: Notes, Payment Instructions, History (Left) & Totals (Right)
  const leftColWidth = contentWidth * 0.56;
  const rightColWidth = contentWidth * 0.40;
  const rightColX = rightX - rightColWidth;

  const summaryStartY = y;

  // Left Column Content: Notes & Bank Instructions
  let leftY = summaryStartY;

  // Notes Box
  if (invoice.notes) {
    pdf.drawText('CATATAN / SYARAT & KETENTUAN:', marginX, leftY + 8, {
      font: 'Helvetica-Bold',
      size: 7.5,
      color: COLORS.textLight,
    });
    leftY += 14;
    leftY = pdf.drawWrappedText(invoice.notes, marginX, leftY, leftColWidth, {
      font: 'Helvetica',
      size: 8,
      color: COLORS.textDark,
      lineHeight: 11,
    });
    leftY += 8;
  }

  // Bank / Payment Instructions Box
  if (paymentInstructions) {
    pdf.drawText('INFORMASI REKENING & PEMBAYARAN:', marginX, leftY + 8, {
      font: 'Helvetica-Bold',
      size: 7.5,
      color: COLORS.primaryDark,
    });
    leftY += 14;
    leftY = pdf.drawWrappedText(paymentInstructions, marginX, leftY, leftColWidth, {
      font: 'Helvetica',
      size: 8,
      color: COLORS.textDark,
      lineHeight: 11,
    });
    leftY += 8;
  }

  // Payment History Summary (if any payments recorded)
  if (payments && payments.length > 0) {
    pdf.drawText('RIWAYAT TRANSAKSI PEMBAYARAN:', marginX, leftY + 8, {
      font: 'Helvetica-Bold',
      size: 7.5,
      color: COLORS.success,
    });
    leftY += 14;

    payments.slice(0, 3).forEach((p) => {
      const pLine = `${p.paymentDate} • ${p.paymentMethod.toUpperCase()}: ${formatCurrency(p.amount)}`;
      pdf.drawText(pLine, marginX, leftY, {
        font: 'Helvetica',
        size: 7.5,
        color: COLORS.textMuted,
      });
      leftY += 10;
    });
  }

  // Right Column Content: Financial Totals Table
  let rightY = summaryStartY;
  const totalsLabelX = rightColX;
  const totalsValueX = rightX;

  const drawTotalLine = (label: string, value: string, bold: boolean = false, color?: PdfColor) => {
    pdf.drawText(label, totalsLabelX, rightY + 10, {
      font: bold ? 'Helvetica-Bold' : 'Helvetica',
      size: 8.5,
      color: color || (bold ? COLORS.textDark : COLORS.textMuted),
    });
    pdf.drawText(value, totalsValueX, rightY + 10, {
      font: bold ? 'Helvetica-Bold' : 'Helvetica',
      size: 8.5,
      color: color || (bold ? COLORS.textDark : COLORS.textMuted),
      align: 'right',
    });
    rightY += 16;
  };

  drawTotalLine('Subtotal', formatCurrency(calculation.subtotal));

  if (calculation.totalDiscount > 0) {
    drawTotalLine(
      'Total Diskon',
      `- ${formatCurrency(calculation.totalDiscount)}`,
      false,
      COLORS.danger
    );
  }

  drawTotalLine('Dasar Pengenaan Pajak (DPP)', formatCurrency(calculation.taxableAmount));
  drawTotalLine('PPN / Total Pajak', formatCurrency(calculation.totalTax));

  // Grand Total Divider
  rightY += 4;
  pdf.drawLine(totalsLabelX, rightY, rightX, rightY, {
    color: COLORS.primaryDark,
    lineWidth: 1.5,
  });
  rightY += 6;

  // GRAND TOTAL Block
  pdf.drawText('GRAND TOTAL', totalsLabelX, rightY + 12, {
    font: 'Helvetica-Bold',
    size: 11,
    color: COLORS.primaryDark,
  });
  pdf.drawText(formatCurrency(calculation.grandTotal), totalsValueX, rightY + 12, {
    font: 'Helvetica-Bold',
    size: 12,
    color: COLORS.primary,
    align: 'right',
  });
  rightY += 24;

  // Payment Balance Card Box
  pdf.drawRect(totalsLabelX, rightY, rightColWidth, 42, {
    fillColor: paymentSummary.isFullyPaid ? COLORS.successBg : COLORS.bgLight,
    strokeColor: paymentSummary.isFullyPaid ? COLORS.success : COLORS.borderDark,
    lineWidth: 0.5,
  });

  pdf.drawText('Total Terbayar:', totalsLabelX + 8, rightY + 14, {
    font: 'Helvetica',
    size: 8,
    color: COLORS.textMuted,
  });
  pdf.drawText(formatCurrency(paymentSummary.totalPaid), totalsValueX - 8, rightY + 14, {
    font: 'Helvetica-Bold',
    size: 8.5,
    color: COLORS.success,
    align: 'right',
  });

  pdf.drawText('Sisa Tagihan:', totalsLabelX + 8, rightY + 30, {
    font: 'Helvetica-Bold',
    size: 8,
    color: COLORS.textDark,
  });
  pdf.drawText(formatCurrency(paymentSummary.remainingBalance), totalsValueX - 8, rightY + 30, {
    font: 'Helvetica-Bold',
    size: 9,
    color: paymentSummary.remainingBalance > 0 ? COLORS.danger : COLORS.textDark,
    align: 'right',
  });

  // 6. Professional Page Footer (at bottom of A4)
  const footerY = pageHeight - 32;
  pdf.drawLine(marginX, footerY, rightX, footerY, {
    color: COLORS.border,
    lineWidth: 0.5,
  });

  pdf.drawText(
    'Faktur ini diterbitkan secara sah dan disimpan secara lokal via Ficco Local-First Invoice Management.',
    marginX,
    footerY + 14,
    {
      font: 'Helvetica',
      size: 7,
      color: COLORS.textLight,
    }
  );

  pdf.drawText('Halaman 1 dari 1', rightX, footerY + 14, {
    font: 'Helvetica',
    size: 7,
    color: COLORS.textLight,
    align: 'right',
  });

  return pdf;
}

/**
 * High-level helper to generate and trigger instant client-side download of the invoice PDF.
 */
export async function downloadInvoicePdf(
  data: InvoicePdfData,
  filename?: string
): Promise<void> {
  const pdf = buildInvoicePdf(data);
  const name = filename || `Faktur-${data.invoice.invoiceNumber || 'INV'}.pdf`;
  pdf.download(name);
}

/**
 * High-level helper to generate a Blob for the invoice PDF.
 */
export async function generateInvoicePdfBlob(data: InvoicePdfData): Promise<Blob> {
  const pdf = buildInvoicePdf(data);
  return pdf.toBlob();
}
