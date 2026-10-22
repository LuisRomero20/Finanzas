export type DateOnly = string;

export interface BillingRule {
  cutoffDay: number;
  dueDay: number;
  purchaseOnCutoffStartsNewCycle?: boolean;
  moveWeekendDueDateToMonday?: boolean;
}

export interface BillingCycleOverride {
  periodStart: DateOnly;
  periodEnd: DateOnly;
  dueDate: DateOnly;
}

export interface BillingCycleResult {
  periodStart: DateOnly;
  periodEnd: DateOnly;
  dueDate: DateOnly;
  billingMonth: string;
  source: 'calculated' | 'confirmed_override';
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatDateOnly(year: number, month: number, day: number): DateOnly {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new TypeError('La fecha debe usar componentes enteros.');
  }
  if (month < 1 || month > 12) throw new RangeError('El mes debe estar entre 1 y 12.');
  const safeDay = Math.min(Math.max(day, 1), daysInMonth(year, month));
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function parseDateOnly(value: DateOnly): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new TypeError('La fecha debe tener formato YYYY-MM-DD.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (formatDateOnly(year, month, day) !== value) throw new RangeError(`Fecha inválida: ${value}.`);
  return { year, month, day };
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12 + 12) % 12 + 1 };
}

export function addMonthsKeepingDay(value: DateOnly, months: number, preferredDay?: number): DateOnly {
  const current = parseDateOnly(value);
  const shifted = shiftMonth(current.year, current.month, months);
  return formatDateOnly(shifted.year, shifted.month, preferredDay ?? current.day);
}

export function moveWeekendToMonday(value: DateOnly): DateOnly {
  const { year, month, day } = parseDateOnly(value);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const weekDay = date.getUTCDay();
  if (weekDay === 6) date.setUTCDate(date.getUTCDate() + 2);
  if (weekDay === 0) date.setUTCDate(date.getUTCDate() + 1);
  return formatDateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function validateRule(rule: BillingRule): void {
  if (!Number.isInteger(rule.cutoffDay) || rule.cutoffDay < 1 || rule.cutoffDay > 31) {
    throw new RangeError('El día de corte debe estar entre 1 y 31.');
  }
  if (!Number.isInteger(rule.dueDay) || rule.dueDay < 1 || rule.dueDay > 31) {
    throw new RangeError('El día de vencimiento debe estar entre 1 y 31.');
  }
}

export function calculateBillingCycle(
  purchaseDate: DateOnly,
  rule: BillingRule,
  overrides: readonly BillingCycleOverride[] = [],
): BillingCycleResult {
  const purchase = parseDateOnly(purchaseDate);
  validateRule(rule);

  const confirmed = overrides.find(item => purchaseDate >= item.periodStart && purchaseDate <= item.periodEnd);
  if (confirmed) {
    parseDateOnly(confirmed.periodStart);
    parseDateOnly(confirmed.periodEnd);
    parseDateOnly(confirmed.dueDate);
    return { ...confirmed, billingMonth: confirmed.dueDate.slice(0, 7), source: 'confirmed_override' };
  }

  const cutoffThisMonth = formatDateOnly(purchase.year, purchase.month, rule.cutoffDay);
  const startsNewCycle = rule.purchaseOnCutoffStartsNewCycle === false
    ? purchaseDate > cutoffThisMonth
    : purchaseDate >= cutoffThisMonth;
  const cycleStartMonth = startsNewCycle
    ? { year: purchase.year, month: purchase.month }
    : shiftMonth(purchase.year, purchase.month, -1);
  const periodStart = formatDateOnly(cycleStartMonth.year, cycleStartMonth.month, rule.cutoffDay);
  const nextCycleStartMonth = shiftMonth(cycleStartMonth.year, cycleStartMonth.month, 1);
  const nextCycleStart = new Date(Date.UTC(
    nextCycleStartMonth.year,
    nextCycleStartMonth.month - 1,
    Math.min(rule.cutoffDay, daysInMonth(nextCycleStartMonth.year, nextCycleStartMonth.month)),
    12,
  ));
  nextCycleStart.setUTCDate(nextCycleStart.getUTCDate() - 1);
  const periodEnd = formatDateOnly(
    nextCycleStart.getUTCFullYear(),
    nextCycleStart.getUTCMonth() + 1,
    nextCycleStart.getUTCDate(),
  );

  const dueMonth = shiftMonth(cycleStartMonth.year, cycleStartMonth.month, 2);
  let dueDate = formatDateOnly(dueMonth.year, dueMonth.month, rule.dueDay);
  if (rule.moveWeekendDueDateToMonday) dueDate = moveWeekendToMonday(dueDate);

  return { periodStart, periodEnd, dueDate, billingMonth: dueDate.slice(0, 7), source: 'calculated' };
}
