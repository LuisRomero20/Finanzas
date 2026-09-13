import { describe, it, expect } from 'vitest';
import { parseDateParts, addMonthsKeepingDay, formatLocalDatePE } from '../debtUtils';
import { sanitizeDeudaDates, type Deuda } from '../../store';

describe('Debt Schedule Dates & Timezone Robustness', () => {
  it('parses YYYY-MM-DD cleanly without UTC/local timezone shifts', () => {
    const p1 = parseDateParts('2026-07-01');
    expect(p1).toEqual({ year: 2026, month: 7, day: 1 });

    const p2 = parseDateParts('2026-07-15');
    expect(p2).toEqual({ year: 2026, month: 7, day: 15 });

    const p3 = parseDateParts('2026-03-30');
    expect(p3).toEqual({ year: 2026, month: 3, day: 30 });
  });

  it('formats dates into Peruvian format without timezone shifts', () => {
    expect(formatLocalDatePE('2026-07-01')).toBe('1/7/2026');
    expect(formatLocalDatePE('2026-07-15')).toBe('15/7/2026');
    expect(formatLocalDatePE('2026-03-30')).toBe('30/3/2026');
    expect(formatLocalDatePE('2027-02-28')).toBe('28/2/2027');
  });

  it('calculates consecutive monthly payment dates with dayOverride correctly', () => {
    // Prestamo Yape: starts 2026-07-01, day 1 of each month
    const yapeDates = [0, 1, 2, 3, 4, 5].map(m => {
      const d = addMonthsKeepingDay('2026-07-01', m, 1);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    });
    expect(yapeDates).toEqual([
      '1/7/2026',
      '1/8/2026',
      '1/9/2026',
      '1/10/2026',
      '1/11/2026',
      '1/12/2026',
    ]);

    // Prestamo BCP: starts 2026-07-15, day 15 of each month
    const bcpDates = [0, 1, 2, 3].map(m => {
      const d = addMonthsKeepingDay('2026-07-15', m, 15);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    });
    expect(bcpDates).toEqual([
      '15/7/2026',
      '15/8/2026',
      '15/9/2026',
      '15/10/2026',
    ]);

    // iPhone 16: starts 2026-03-30, day 30 (February clamped to 28)
    const iphoneFeb = addMonthsKeepingDay('2026-03-30', 11, 30);
    expect(`${iphoneFeb.getDate()}/${iphoneFeb.getMonth() + 1}/${iphoneFeb.getFullYear()}`).toBe('28/2/2027');
  });

  it('sanitizes legacy incorrect initial dates in store cache', () => {
    const legacyDebts: Deuda[] = [
      {
        id: '2',
        acreedor: 'Prestamo Yape',
        monto: 701.10,
        tasa_anual: 0.0,
        plazo_meses: 6,
        meses_pagados: 3,
        fecha_inicio: '2026-01-07',
        tipo_tasa: 'efectiva',
        moneda: 'PEN',
        estado: 'activa',
      },
      {
        id: '3',
        acreedor: 'Prestamo BCP',
        monto: 1717.92,
        tasa_anual: 0.0,
        plazo_meses: 12,
        meses_pagados: 3,
        fecha_inicio: '2026-01-15',
        tipo_tasa: 'efectiva',
        moneda: 'PEN',
        estado: 'activa',
      },
      {
        id: '1',
        acreedor: 'iPhone 16',
        monto: 2949.00,
        tasa_anual: 0.0,
        plazo_meses: 12,
        meses_pagados: 6,
        fecha_inicio: '2026-03-30',
        tipo_tasa: 'efectiva',
        moneda: 'PEN',
        estado: 'activa',
      },
    ];

    const sanitized = sanitizeDeudaDates(legacyDebts);
    expect(sanitized.find(d => d.acreedor === 'Prestamo Yape')?.fecha_inicio).toBe('2026-07-01');
    expect(sanitized.find(d => d.acreedor === 'Prestamo BCP')?.fecha_inicio).toBe('2026-07-15');
    expect(sanitized.find(d => d.acreedor === 'iPhone 16')?.fecha_inicio).toBe('2026-03-30');
  });
});
