/**
 * Utilidades de fecha y hora garantizadas en la zona horaria oficial del Perú (America/Lima - UTC-5)
 */

export const LIMA_TIMEZONE = 'America/Lima';

export interface LimaDateTime {
  dateString: string; // 'YYYY-MM-DD'
  timeString: string; // 'HH:mm'
  year: number;
  month: number; // 1 a 12
  monthString: string; // 'YYYY-MM'
  day: number; // 1 a 31
  hours: number;
  minutes: number;
  isoLike: string; // 'YYYY-MM-DDTHH:mm:ss'
}

/**
 * Obtiene la descomposición exacta de fecha y hora en zona horaria America/Lima.
 */
export function getLimaDateTime(inputDate: Date = new Date()): LimaDateTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: LIMA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(inputDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      partMap[p.type] = p.value;
    }
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  let hours = parseInt(partMap.hour, 10);
  // Algunos motores formatean 24 como 24:00 en vez de 00:00
  if (hours === 24) hours = 0;
  const minutes = parseInt(partMap.minute, 10);

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');

  const dateString = `${year}-${mm}-${dd}`;
  const timeString = `${hh}:${min}`;
  const monthString = `${year}-${mm}`;
  const isoLike = `${dateString}T${timeString}:${partMap.second || '00'}`;

  return {
    dateString,
    timeString,
    year,
    month,
    monthString,
    day,
    hours,
    minutes,
    isoLike,
  };
}

/**
 * Suma días a una fecha 'YYYY-MM-DD' de forma determinista.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Retorna la diferencia en días enteros entre dateB y dateA (dateB - dateA).
 */
export function diffInDays(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split('-').map(Number);
  const [y2, m2, d2] = dateB.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}
