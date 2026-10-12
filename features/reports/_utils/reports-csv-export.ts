import { ReportsData } from '../_types/reports.types';

function triggerCsvDownload(csvContent: string, fileName: string) {
  // Add BOM so Excel opens UTF-8 Indonesian accents cleanly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportProfitLossCsv(data: ReportsData): void {
  const lines: string[] = [];

  lines.push('LAPORAN LABA RUGI (PROFIT & LOSS)');
  lines.push(`Periode,${escapeCsvCell(`${data.startDate} s/d ${data.endDate}`)}`);
  lines.push('');

  // Ringkasan Eksekutif
  lines.push('RINGKASAN UTAMA');
  lines.push(`Total Pendapatan,${data.profitLoss.revenue}`);
  lines.push(`Total Beban Operasional,${data.profitLoss.expenses}`);
  lines.push(`Laba/Rugi Bersih,${data.profitLoss.netProfit}`);
  lines.push(`Margin Laba Bersih (%),${data.profitLoss.profitMargin}%`);
  lines.push('');

  // Rincian Per Periode
  lines.push('RINCIAN PER PERIODE BULANAN');
  lines.push('Periode,Pendapatan,Pengeluaran,Laba Bersih,Margin (%),Jumlah Faktur,Jumlah Transaksi Beban');

  data.periodicRows.forEach((row) => {
    lines.push(
      [
        escapeCsvCell(row.periodLabel),
        row.revenue,
        row.expenses,
        row.netProfit,
        `${row.profitMargin}%`,
        row.invoicesCount,
        row.expensesCount,
      ].join(',')
    );
  });

  const fileName = `laba-rugi_${data.startDate}_sd_${data.endDate}.csv`;
  triggerCsvDownload(lines.join('\r\n'), fileName);
}

export function exportRevenueCsv(data: ReportsData): void {
  const lines: string[] = [];

  lines.push('LAPORAN PENDAPATAN (REVENUE REPORT)');
  lines.push(`Periode,${escapeCsvCell(`${data.startDate} s/d ${data.endDate}`)}`);
  lines.push(`Total Pendapatan,${data.revenue.totalRevenue}`);
  lines.push(`Total Nilai Faktur Diterbitkan,${data.revenue.totalInvoiced}`);
  lines.push(`Tingkat Pelunasan (Collection Rate),${data.revenue.collectionRate}%`);
  lines.push('');

  // Pendapatan Per Pelanggan
  lines.push('PENDAPATAN PER PELANGGAN');
  lines.push('Nama Pelanggan,Total Faktur,Faktur Lunas,Total Pendapatan,Kontribusi (%)');

  data.revenue.byCustomer.forEach((cust) => {
    lines.push(
      [
        escapeCsvCell(cust.customerName),
        cust.invoicesCount,
        cust.paidInvoicesCount,
        cust.totalRevenue,
        `${cust.percentage}%`,
      ].join(',')
    );
  });

  lines.push('');

  // Pendapatan Per Produk / Layanan
  if (data.revenue.byProduct.length > 0) {
    lines.push('PENDAPATAN PER ITEM / LAYANAN');
    lines.push('Nama Produk/Layanan,Kuantitas Terjual,Total Nilai,Pangsa (%)');

    data.revenue.byProduct.forEach((prod) => {
      lines.push(
        [
          escapeCsvCell(prod.productName),
          prod.quantity,
          prod.totalRevenue,
          `${prod.percentage}%`,
        ].join(',')
      );
    });
  }

  const fileName = `laporan-pendapatan_${data.startDate}_sd_${data.endDate}.csv`;
  triggerCsvDownload(lines.join('\r\n'), fileName);
}

export function exportExpenseCsv(data: ReportsData): void {
  const lines: string[] = [];

  lines.push('LAPORAN PENGELUARAN (EXPENSE REPORT)');
  lines.push(`Periode,${escapeCsvCell(`${data.startDate} s/d ${data.endDate}`)}`);
  lines.push(`Total Beban,${data.expenses.totalExpenses}`);
  lines.push(`Total Transaksi,${data.expenses.totalTransactions}`);
  lines.push(`Rata-rata per Transaksi,${data.expenses.averageExpense}`);
  lines.push('');

  // Pengeluaran Berdasarkan Kategori
  lines.push('PENGELUARAN BERDASARKAN KATEGORI');
  lines.push('Kategori,Jumlah Transaksi,Total Beban,Pangsa (%)');

  data.expenses.byCategory.forEach((cat) => {
    lines.push(
      [
        escapeCsvCell(cat.categoryName),
        cat.transactionCount,
        cat.totalAmount,
        `${cat.percentage}%`,
      ].join(',')
    );
  });

  lines.push('');

  // Pengeluaran Berdasarkan Metode Pembayaran
  lines.push('PENGELUARAN BERDASARKAN METODE PEMBAYARAN');
  lines.push('Metode Pembayaran,Jumlah Transaksi,Total Beban,Pangsa (%)');

  data.expenses.byPaymentMethod.forEach((met) => {
    lines.push(
      [
        escapeCsvCell(met.methodLabel),
        met.count,
        met.totalAmount,
        `${met.percentage}%`,
      ].join(',')
    );
  });

  const fileName = `laporan-pengeluaran_${data.startDate}_sd_${data.endDate}.csv`;
  triggerCsvDownload(lines.join('\r\n'), fileName);
}
