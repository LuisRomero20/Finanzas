import type { Transaction } from '../utils/masterData';
import {
  getEffectiveCategoryLabel,
  isDebtTransaction,
  isCreditCardPayment,
  isCreditCardLine,
} from './categoryClassification';

export interface ReportData {
  selectedMonth: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  totalDebts?: number;
  liquidBalance?: number;
  accountingSurplus?: number;
  netSavings?: number;
  savingsRate?: number;
  accountBalances?: Record<string, number>;
  selectedEntity?: string;
}

export function generateExecutiveReportHTML(data: ReportData): string {
  const {
    selectedMonth,
    transactions,
    totalIncome,
    totalExpense,
    totalDebts: rawTotalDebts,
    liquidBalance: rawLiquidBalance,
    accountingSurplus: rawSurplus,
    accountBalances = {},
    selectedEntity = 'Todas',
  } = data;

  const currentMonthTx = transactions.filter((t) => {
    const m = t.Mes || (t as any).mes;
    return selectedMonth === 'Todos' ? true : m === selectedMonth;
  });

  // Ordenar cronológicamente por fecha
  const sortedTx = [...currentMonthTx].sort((a, b) => {
    const fA = a.Fecha || (a as any).fecha || '';
    const fB = b.Fecha || (b as any).fecha || '';
    return fA.localeCompare(fB);
  });

  // Identificar deudas del periodo
  const debtTxList = currentMonthTx.filter(
    (t) => (t.Tipo === 'Egreso' || (t as any).tipo === 'Egreso') && isDebtTransaction(t)
  );
  const totalDebts = typeof rawTotalDebts === 'number'
    ? rawTotalDebts
    : debtTxList.reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  // Identificar saldo líquido real en cuenta (Interbank o cuentas operativas líquidas)
  const interbankKey = Object.keys(accountBalances).find((k) => /^interbank$/i.test(k)) || 'Interbank';
  const liquidBalance = typeof rawLiquidBalance === 'number'
    ? rawLiquidBalance
    : (accountBalances[interbankKey] ?? 0);

  // Ahorro explícito formal registrado en transacciones (categoría 'Ahorro' o concepto afín)
  const explicitSavings = currentMonthTx
    .filter((t) => {
      const cat = (t.Categoria || (t as any).categoria || '').toLowerCase();
      const conc = (t.Concepto || (t as any).concepto || '').toLowerCase();
      return cat.includes('ahorro') || cat.includes('inversi') || conc.includes('ahorro');
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  // LO QUE REALMENTE SE PUEDE AHORRAR:
  // Si no hay categoría que diga ahorro, es lo que queda como saldo líquido disponible.
  const realSavingsOption = Math.max(0, liquidBalance) + explicitSavings;
  const realSavingsRate = totalIncome > 0 ? (realSavingsOption / totalIncome) * 100 : 0;

  // Superávit contable teórico (Ingresos - Egresos Operativos - Deudas)
  const accountingSurplus = typeof rawSurplus === 'number'
    ? rawSurplus
    : (totalIncome - totalExpense - totalDebts);
  const accountingSurplusRate = totalIncome > 0 ? (accountingSurplus / totalIncome) * 100 : 0;

  // Agrupar gastos operativos por categorías (excluye deudas y pagos de tarjeta para no duplicar)
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return (tipo === 'Egreso' || tipo === 'Gasto') && !isDebtTransaction(t) && !isCreditCardPayment(t) && !isCreditCardLine(t);
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
  const sumOperatingCategories = sortedCategories.reduce((acc, [, d]) => acc + d.total, 0) || totalExpense || 1;

  const formatPEN = (val: number) =>
    `S/ ${Math.abs(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const nowFormatted = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estado de Cuenta & Informe Ejecutivo FINPER — ${selectedMonth} 2026</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.35;
      margin: 0;
      padding: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Screen-only action toolbar */
    .screen-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0F2A1D;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.18);
    }
    .screen-toolbar button {
      background: #10b981;
      color: #0F2A1D;
      font-weight: 800;
      font-size: 13px;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      transition: all 0.15s ease;
    }
    .screen-toolbar button:hover {
      background: #34d399;
      transform: translateY(-1px);
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0F2A1D;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #0F2A1D;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-meta {
      text-align: right;
    }
    .header-period {
      font-size: 15px;
      font-weight: 900;
      color: #0F2A1D;
    }
    .header-date {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .header-pill {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 8px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      font-size: 9.5px;
      font-weight: 700;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 8px;
      text-align: center;
      position: relative;
    }
    .kpi-card.kpi-income {
      background: #f0fdf4;
      border-color: #86efac;
    }
    .kpi-card.kpi-expense {
      background: #fff1f2;
      border-color: #fca5a5;
    }
    .kpi-card.kpi-debt {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .kpi-card.kpi-liquid {
      background: #eff6ff;
      border-color: #93c5fd;
    }
    .kpi-card.kpi-savings {
      background: #fdf4ff;
      border-color: #f0abfc;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }
    .kpi-income .kpi-label { color: #166534; }
    .kpi-expense .kpi-label { color: #9f1239; }
    .kpi-debt .kpi-label { color: #92400e; }
    .kpi-liquid .kpi-label { color: #1e40af; }
    .kpi-savings .kpi-label { color: #86198f; }

    .kpi-value {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }
    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }
    .text-amber { color: #d97706; }
    .text-blue { color: #2563eb; }
    .text-purple { color: #9333ea; }

    .kpi-note {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      line-height: 1.2;
    }

    /* Explanation Banner */
    .reconciliation-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0284c7;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 10.5px;
      color: #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .reconciliation-banner strong {
      color: #0f172a;
    }
    .recon-pill {
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      white-space: nowrap;
    }

    /* Section Headings */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 18px;
      margin-bottom: 8px;
      border-bottom: 1.5px solid #0F2A1D;
      padding-bottom: 4px;
    }
    .section-title {
      font-size: 12.5px;
      font-weight: 900;
      color: #0F2A1D;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-subtitle {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10px;
      background: #ffffff;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      background: #0F2A1D;
      color: #ffffff;
      text-align: left;
      padding: 6px 10px;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Badges & Color styling */
    .badge-ingreso {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }
    .badge-egreso {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: #fff1f2;
      color: #be123c;
      border: 1px solid #fecdd3;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }
    .badge-deuda {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }

    .amount-ingreso {
      color: #059669;
      font-weight: 900;
      font-size: 10.5px;
      font-variant-numeric: tabular-nums;
    }
    .amount-egreso {
      color: #e11d48;
      font-weight: 900;
      font-size: 10.5px;
      font-variant-numeric: tabular-nums;
    }

    .progress-bar-bg {
      background: #e2e8f0;
      border-radius: 4px;
      height: 6px;
      width: 65px;
      display: inline-block;
      vertical-align: middle;
      margin-left: 6px;
      overflow: hidden;
    }
    .progress-bar-fill {
      background: #0F2A1D;
      height: 100%;
      border-radius: 4px;
    }

    .totals-row td {
      background: #f1f5f9 !important;
      font-weight: 900;
      border-top: 2px solid #0F2A1D;
      border-bottom: 2px solid #0F2A1D;
      font-size: 10.5px;
    }

    /* Account summary cards */
    .account-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .account-summary-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .account-summary-name {
      font-size: 10px;
      font-weight: 800;
      color: #475569;
    }
    .account-summary-val {
      font-size: 13px;
      font-weight: 900;
      margin-top: 2px;
    }

    /* Footer */
    .footer {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 16px;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .page-break-before {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>

  <!-- Barra de acciones solo visible en pantalla previa -->
  <div class="screen-toolbar no-print">
    <div style="font-weight: 800; font-size: 14px;">
      📄 FINPER Intelligence · Estado de Cuenta & Informe Ejecutivo (${selectedMonth} 2026)
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Imprimir / Guardar como PDF
      </button>
      <button onclick="window.close()" style="background: #334155; color: #ffffff;">
        Cerrar
      </button>
    </div>
  </div>

  <!-- Encabezado Ejecutivo Principal -->
  <div class="header">
    <div>
      <div class="brand-title">FINPER COST ANALYSIS & STATEMENT</div>
      <div class="brand-sub">Informe Ejecutivo & Estado de Cuenta Mensual · Moneda: Soles (PEN - S/)</div>
    </div>
    <div class="header-meta">
      <div class="header-period">Mes: ${selectedMonth} 2026</div>
      <div class="header-date">Emitido: ${nowFormatted}</div>
      <span class="header-pill">Entidad: ${selectedEntity}</span>
    </div>
  </div>

  <!-- Indicadores Clave de Desempeño (KPIs) con Código de Color Estricto -->
  <div class="kpi-grid">
    <!-- 1. Ingresos Totales en VERDE -->
    <div class="kpi-card kpi-income">
      <div class="kpi-label">Ingresos Totales</div>
      <div class="kpi-value text-emerald">+ ${formatPEN(totalIncome)}</div>
      <div class="kpi-note">Entradas netas reales</div>
    </div>

    <!-- 2. Egresos Operativos en ROJO -->
    <div class="kpi-card kpi-expense">
      <div class="kpi-label">Egresos Operativos</div>
      <div class="kpi-value text-rose">- ${formatPEN(totalExpense)}</div>
      <div class="kpi-note">Gastos de vida corrientes</div>
    </div>

    <!-- 3. Deudas y Obligaciones -->
    <div class="kpi-card kpi-debt">
      <div class="kpi-label">Obligaciones & Deudas</div>
      <div class="kpi-value text-amber">- ${formatPEN(totalDebts)}</div>
      <div class="kpi-note">${debtTxList.length} compromisos financieros</div>
    </div>

    <!-- 4. Saldo Líquido Disponible (Opción Real para Ahorrar) -->
    <div class="kpi-card kpi-liquid">
      <div class="kpi-label">Saldo Líquido Disponible</div>
      <div class="kpi-value text-blue">${formatPEN(liquidBalance)}</div>
      <div class="kpi-note">Disponibilidad en cuenta (Opción Ahorro)</div>
    </div>

    <!-- 5. Tasa de Ahorro Real (Basada en Liquidez Efectiva) -->
    <div class="kpi-card kpi-savings">
      <div class="kpi-label">Tasa de Ahorro Real</div>
      <div class="kpi-value text-purple">${realSavingsRate.toFixed(1)}%</div>
      <div class="kpi-note">Calculada sobre saldo líquido en mano</div>
    </div>
  </div>

  <!-- Banner de Conciliación y Aclaración de Liquidez -->
  <div class="reconciliation-banner">
    <div>
      <strong>💡 Conciliación de Capacidad de Ahorro:</strong>
      El <strong>Superávit Contable Teórico</strong> del mes fue de <strong>${formatPEN(accountingSurplus)}</strong> (${accountingSurplusRate.toFixed(1)}% de los ingresos).
      Sin embargo, al no haberse asignado transacciones a una categoría formal de 'Ahorro', la <strong>opción real y líquida disponible para ahorrar</strong> es tu <strong>Saldo Líquido en cuenta de ${formatPEN(liquidBalance)}</strong>, lo que representa una <strong>Tasa de Ahorro Real efectiva de ${realSavingsRate.toFixed(1)}%</strong>.
    </div>
    <div class="recon-pill">
      Opción Ahorro: ${formatPEN(realSavingsOption)}
    </div>
  </div>

  <!-- SECCIÓN 1: Desglose de Gastos Operativos por Categoría -->
  <div class="section-header">
    <div class="section-title">
      <span>📊 Desglose de Gastos Operativos por Categoría</span>
    </div>
    <div class="section-subtitle">
      Total Gastos de Vida: <strong>${formatPEN(totalExpense)}</strong> (100.0%)
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 45%;">Categoría</th>
        <th style="text-align: center; width: 15%;">Movimientos</th>
        <th style="text-align: right; width: 20%;">Monto Total</th>
        <th style="text-align: right; width: 20%;">% del Gasto Operativo</th>
      </tr>
    </thead>
    <tbody>
      ${
        sortedCategories.length > 0
          ? sortedCategories
              .map(([cat, d]) => {
                const pct = (d.total / sumOperatingCategories) * 100;
                return `
                <tr>
                  <td style="font-weight: 700; color: #1e293b;">${cat}</td>
                  <td style="text-align: center; font-weight: 600;">${d.count}</td>
                  <td style="text-align: right; font-weight: 800; color: #be123c;">${formatPEN(d.total)}</td>
                  <td style="text-align: right; font-weight: 700;">
                    ${pct.toFixed(1)}%
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" style="width: ${Math.min(100, Math.max(2, pct))}%;"></div>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join('')
          : `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">Sin egresos registrados en este periodo</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr class="totals-row">
        <td>TOTAL EGRESOS OPERATIVOS</td>
        <td style="text-align: center;">${sortedCategories.reduce((a, [, d]) => a + d.count, 0)}</td>
        <td style="text-align: right; color: #e11d48;">- ${formatPEN(totalExpense)}</td>
        <td style="text-align: right;">100.0%</td>
      </tr>
    </tfoot>
  </table>

  <!-- SECCIÓN 2: Deudas y Compromisos Financieros Activos -->
  ${
    debtTxList.length > 0
      ? `
    <div class="section-header">
      <div class="section-title">
        <span>⚖️ Obligaciones & Cuotas de Deudas Financieras</span>
      </div>
      <div class="section-subtitle">
        Total Compromisos: <strong>${formatPEN(totalDebts)}</strong> (${totalIncome > 0 ? ((totalDebts / totalIncome) * 100).toFixed(1) : 0}% de los ingresos)
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Concepto de Deuda</th>
          <th style="text-align: center;">Fecha</th>
          <th style="text-align: center;">Entidad</th>
          <th style="text-align: right;">Cuota / Monto Pagado</th>
          <th style="text-align: right;">% s/ Deuda Total</th>
        </tr>
      </thead>
      <tbody>
        ${debtTxList
          .map((t) => {
            const m = Number(t.Monto || (t as any).monto) || 0;
            const pct = totalDebts > 0 ? (m / totalDebts) * 100 : 0;
            return `
            <tr>
              <td style="font-weight: 800; color: #92400e;">${t.Concepto || (t as any).concepto}</td>
              <td style="text-align: center; color: #64748b;">${t.Fecha || (t as any).fecha}</td>
              <td style="text-align: center; font-weight: 600;">${t.Entidad || (t as any).entidad}</td>
              <td style="text-align: right; font-weight: 800; color: #b45309;">- ${formatPEN(m)}</td>
              <td style="text-align: right; font-weight: 700;">${pct.toFixed(1)}%</td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr class="totals-row">
          <td colspan="3">TOTAL OBLIGACIONES & DEUDAS FINANCIERAS</td>
          <td style="text-align: right; color: #b45309;">- ${formatPEN(totalDebts)}</td>
          <td style="text-align: right;">100.0%</td>
        </tr>
      </tfoot>
    </table>
  `
      : ''
  }

  <!-- SECCIÓN 3: Posición Bancaria y Saldos por Cuenta -->
  <div class="section-header">
    <div class="section-title">
      <span>🏦 Posición y Saldos por Cuenta Bancaria</span>
    </div>
    <div class="section-subtitle">
      Saldo Líquido Operativo: <strong>${formatPEN(liquidBalance)}</strong>
    </div>
  </div>

  <div class="account-summary-grid">
    <div class="account-summary-box" style="border-left: 3px solid #0284c7; background: #f0f9ff;">
      <div class="account-summary-name">Interbank (Cuenta Principal)</div>
      <div class="account-summary-val" style="color: ${liquidBalance >= 0 ? '#0369a1' : '#be123c'};">
        ${formatPEN(liquidBalance)}
      </div>
      <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Saldo líquido disponible</div>
    </div>

    ${Object.entries(accountBalances)
      .filter(([k]) => !/^interbank$/i.test(k))
      .map(([ent, bal]) => `
        <div class="account-summary-box">
          <div class="account-summary-name">${ent}</div>
          <div class="account-summary-val" style="color: ${bal >= 0 ? '#059669' : '#e11d48'};">
            ${bal >= 0 ? '+' : '-'} ${formatPEN(bal)}
          </div>
          <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Posición neta periodo</div>
        </div>
      `)
      .join('')}
  </div>

  <!-- SECCIÓN 4: ESTADO DE CUENTA DETALLADO (REGISTRO CRONOLÓGICO DE MOVIMIENTOS) -->
  <div class="section-header page-break-before" style="margin-top: 24px;">
    <div class="section-title">
      <span>🏛️ Estado de Cuenta y Registro Cronológico de Movimientos</span>
    </div>
    <div class="section-subtitle">
      ${sortedTx.length} movimientos registrados en el mes · <span style="color: #059669; font-weight: 800;">Ingresos en Verde</span> · <span style="color: #e11d48; font-weight: 800;">Egresos en Rojo</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%; text-align: center;">#</th>
        <th style="width: 12%; text-align: center;">Fecha</th>
        <th style="width: 12%; text-align: center;">Tipo</th>
        <th style="width: 31%;">Concepto</th>
        <th style="width: 22%;">Categoría</th>
        <th style="width: 18%; text-align: right;">Monto (PEN)</th>
      </tr>
    </thead>
    <tbody>
      ${
        sortedTx.length > 0
          ? sortedTx
              .map((t, idx) => {
                const tipo = (t.Tipo || (t as any).tipo || 'Egreso') as 'Ingreso' | 'Egreso';
                const isDebt = isDebtTransaction(t);
                const isIncome = tipo === 'Ingreso';
                const montoNum = Number(t.Monto || (t as any).monto) || 0;
                const catLabel = getEffectiveCategoryLabel(t);
                const concepto = t.Concepto || (t as any).concepto || '-';
                const fecha = t.Fecha || (t as any).fecha || '-';
                const entidad = t.Entidad || (t as any).entidad || '';

                return `
                <tr>
                  <td style="text-align: center; color: #94a3b8; font-weight: 600;">${idx + 1}</td>
                  <td style="text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; color: #475569;">
                    ${fecha}
                  </td>
                  <td style="text-align: center;">
                    ${
                      isIncome
                        ? `<span class="badge-ingreso">🟢 Ingreso</span>`
                        : isDebt
                        ? `<span class="badge-deuda">⚖️ Deuda</span>`
                        : `<span class="badge-egreso">🔴 Egreso</span>`
                    }
                  </td>
                  <td>
                    <div style="font-weight: 800; color: #0f172a;">${concepto}</div>
                    ${entidad ? `<div style="font-size: 8.5px; color: #64748b;">${entidad}</div>` : ''}
                  </td>
                  <td style="color: #334155; font-weight: 600;">${catLabel}</td>
                  <td style="text-align: right;">
                    ${
                      isIncome
                        ? `<span class="amount-ingreso">+ ${formatPEN(montoNum)}</span>`
                        : `<span class="amount-egreso">- ${formatPEN(montoNum)}</span>`
                    }
                  </td>
                </tr>
              `;
              })
              .join('')
          : `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 16px;">Sin transacciones para mostrar en este estado de cuenta</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="3" style="text-align: right; font-weight: 800;">RESUMEN DEL ESTADO DE CUENTA:</td>
        <td colspan="2" style="color: #475569; font-weight: 700;">
          <span style="color: #059669;">+ ${formatPEN(totalIncome)} (Ingresos)</span> / 
          <span style="color: #e11d48;">- ${formatPEN(totalExpense + totalDebts)} (Salidas)</span>
        </td>
        <td style="text-align: right; font-weight: 900; color: ${accountingSurplus >= 0 ? '#059669' : '#e11d48'};">
          ${accountingSurplus >= 0 ? '+' : '-'} ${formatPEN(accountingSurplus)}
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- Pie de página con cláusula de confidencialidad -->
  <div class="footer">
    <div>
      <strong>FINPER</strong> — Suite de Inteligencia & Gestión Financiera Personal · Titular: Luis Romero
    </div>
    <div>
      Documento confidencial oficial · Página 1 de 1 · Generado el ${nowFormatted}
    </div>
  </div>

  <script>
    window.onload = function() {
      // Abre automáticamente el diálogo nativo de impresión para guardar en PDF
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
