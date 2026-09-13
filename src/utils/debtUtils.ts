export function calcularCuota(deuda: any) {
  const i_mensual = deuda.tipo_tasa === 'efectiva' ? Math.pow(1 + deuda.tasa_anual, 1 / 12) - 1 : deuda.tasa_anual / 12;
  const plazo = deuda.plazo_meses || 1;
  // Si la tasa es cero, asumimos cuota fija = monto / plazo (no recalcular sobre saldo pendiente)
  if (!i_mensual || i_mensual === 0) {
    if (plazo <= 0) return 0;
    return Number((deuda.monto / plazo).toFixed(2));
  }
  const n = Math.max(0, deuda.plazo_meses - deuda.meses_pagados);
  if (n <= 0) return 0;
  return (deuda.monto * i_mensual) / (1 - Math.pow(1 + i_mensual, -n));
}

export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  const d = new Date(dateStr);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function formatLocalDatePE(dateOrStr: Date | string): string {
  if (!dateOrStr) return '';
  if (typeof dateOrStr === 'string') {
    const clean = dateOrStr.slice(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
  }
  const d = new Date(dateOrStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function addMonthsKeepingDay(dateStr: string, monthsToAdd: number, dayOverride?: number): Date {
  const { year, month, day } = parseDateParts(dateStr);
  const totalMonths = year * 12 + (month - 1) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(dayOverride || day, daysInTargetMonth);
  // Setting hour to 12 ensures that regardless of local timezone (e.g. UTC-5 in Peru),
  // getFullYear(), getMonth(), getDate() and toLocaleDateString() will not roll over to another day.
  return new Date(targetYear, targetMonth - 1, targetDay, 12, 0, 0);
}
