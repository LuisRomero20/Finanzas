const DEFAULT_SCALE = 2;

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${label} debe ser un número finito.`);
}

export function toMinorUnits(amount: number, scale = DEFAULT_SCALE): number {
  assertFinite(amount, 'El importe');
  if (!Number.isInteger(scale) || scale < 0 || scale > 6) {
    throw new RangeError('La escala monetaria debe ser un entero entre 0 y 6.');
  }
  const factor = 10 ** scale;
  const minorUnits = Math.round((amount + Math.sign(amount) * Number.EPSILON) * factor);
  if (!Number.isSafeInteger(minorUnits)) throw new RangeError('El importe excede el rango monetario seguro.');
  return minorUnits;
}

export function fromMinorUnits(minorUnits: number, scale = DEFAULT_SCALE): number {
  if (!Number.isSafeInteger(minorUnits)) throw new TypeError('Las unidades menores deben ser un entero seguro.');
  return minorUnits / (10 ** scale);
}

export function roundMoney(amount: number, scale = DEFAULT_SCALE): number {
  return fromMinorUnits(toMinorUnits(amount, scale), scale);
}

/**
 * Distribuye un importe sin perder centavos. El residuo se asigna a las últimas
 * cuotas para mantener compatibilidad con los cronogramas bancarios existentes.
 */
export function allocateMoney(total: number, parts: number, scale = DEFAULT_SCALE): number[] {
  if (!Number.isInteger(parts) || parts <= 0) throw new RangeError('El número de partes debe ser un entero positivo.');
  const totalMinor = toMinorUnits(total, scale);
  const sign = Math.sign(totalMinor) || 1;
  const absolute = Math.abs(totalMinor);
  const base = Math.floor(absolute / parts);
  const remainder = absolute % parts;
  return Array.from({ length: parts }, (_, index) => {
    const receivesRemainder = index >= parts - remainder;
    return fromMinorUnits(sign * (base + (receivesRemainder ? 1 : 0)), scale);
  });
}

export function sumMoney(amounts: readonly number[], scale = DEFAULT_SCALE): number {
  const totalMinor = amounts.reduce((sum, amount) => sum + toMinorUnits(amount, scale), 0);
  return fromMinorUnits(totalMinor, scale);
}
