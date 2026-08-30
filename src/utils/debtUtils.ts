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

export function addMonthsKeepingDay(dateStr: string, monthsToAdd: number, dayOverride?: number) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth();
  const target = new Date(year, month + monthsToAdd, 1);
  const day = dayOverride || d.getDate();
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}
