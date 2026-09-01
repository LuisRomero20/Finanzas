import type { Transaction } from '../utils/masterData';
import { getEffectiveCategoryLabel, isDebtTransaction } from './categoryClassification';

export interface ReportData {
  selectedMonth: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  accountBalances?: Record<string, number>;
}

export function generateExecutiveReportHTML(data: ReportData): string {
  const { selectedMonth, transactions, totalIncome, totalExpense, netSavings, savingsRate } = data;

  const currentMonthTx = transactions.filter((t) => (t.Mes || (t as any).mes) === selectedMonth);

  // Agrupar gastos por las 21 categorías
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return (tipo === 'Egreso' || tipo === 'Gasto') && !isDebtTransaction(t);
    })
    .forEach((t) => {
      const cat = getEffectiveCategoryLabel(t);
      const amount = Number(t.Monto || (t as any).monto) || 0;
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: 0, count: 0 };
      }
      categoryTotals[cat].total += amount;
      categoryTotals[cat].count += 1;
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1].total - a[1].total);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Ejecutivo FINPER — ${selectedMonth} 2026</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      margin: 0;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0F2A1D;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand { font-size: 24px; font-weight: 900; color: #0F2A1D; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; color: #64748b; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }
    .kpi-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .kpi-value { font-size: 18px; font-weight: 900; }
    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }
    .text-blue { color: #2563eb; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th {
      background: #0F2A1D;
      color: white;
      text-align: left;
      padding: 8px 12px;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand">FINPER COST ANALYSIS</div>
      <div class="subtitle">Informe Ejecutivo Mensual · Moneda: Soles (PEN - S/)</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: bold; color: #0F2A1D;">Mes: ${selectedMonth} 2026</div>
      <div style="font-size: 10px; color: #64748b;">Generado: ${new Date().toLocaleDateString('es-PE')}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Ingresos Totales</div>
      <div class="kpi-value text-emerald">S/ ${totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Egresos Totales</div>
      <div class="kpi-value text-rose">S/ ${totalExpense.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Ahorro Neto</div>
      <div class="kpi-value ${netSavings >= 0 ? 'text-emerald' : 'text-rose'}">
        S/ ${netSavings.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Tasa de Ahorro</div>
      <div class="kpi-value text-blue">${savingsRate.toFixed(1)}%</div>
    </div>
  </div>

  <h3 style="font-size: 14px; margin-bottom: 8px; color: #0F2A1D;">Desglose de Gastos por Categoría</h3>
  <table>
    <thead>
      <tr>
        <th>Categoría</th>
        <th style="text-align: center;">Movimientos</th>
        <th style="text-align: right;">Monto Total</th>
        <th style="text-align: right;">% del Gasto</th>
      </tr>
    </thead>
    <tbody>
      ${sortedCategories
        .map(([cat, data]) => {
          const pct = totalExpense > 0 ? (data.total / totalExpense) * 100 : 0;
          return `
          <tr>
            <td style="font-weight: bold;">${cat}</td>
            <td style="text-align: center;">${data.count}</td>
            <td style="text-align: right; font-weight: bold;">S/ ${data.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;">${pct.toFixed(1)}%</td>
          </tr>
        `;
        })
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>FINPER — Suite de Inteligencia & Gestión Financiera Personal</div>
    <div>Documento confidencial para uso del titular</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}

export function openExecutiveReportPrintWindow(data: ReportData) {
  const html = generateExecutiveReportHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
