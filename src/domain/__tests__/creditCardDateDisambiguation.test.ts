import { describe, it, expect } from 'vitest';
import {
  calculateCardPaymentDate,
  useProjectionStore,
  INITIAL_PROJECTIONS,
} from '../../store/projectionStore';

describe('FINPER 2.1 — Desambiguación de Fechas en Proyecciones y Tarjetas', () => {
  it('1. BBVA Bfree: Internet y Gas (día 01) vs Teléfono Móvil y Luz (día 11)', () => {
    // BBVA Bfree: Corte día 10, Pago día 5

    // A) Consumo antes del corte: 01/11/2026 (Internet y Gas)
    const resDia1 = calculateCardPaymentDate('BBVA Bfree', 2026, 10, 1); // 10 = Noviembre (0-indexed)
    expect(resDia1.pagaEnMesSiguiente).toBe(true);
    expect(resDia1.desfaseMeses).toBe(1);
    expect(resDia1.mesPago).toBe('2026-12');
    expect(resDia1.fechaPago).toBe('2026-12-05');
    expect(resDia1.periodoFacturado).toBe('10/10 — 09/11');

    // B) Consumo después del corte: 11/11/2026 (Teléfono Móvil y Luz)
    const resDia11 = calculateCardPaymentDate('BBVA Bfree', 2026, 10, 11);
    expect(resDia11.pagaEnMesSiguiente).toBe(false);
    expect(resDia11.desfaseMeses).toBe(2);
    expect(resDia11.mesPago).toBe('2027-01');
    expect(resDia11.fechaPago).toBe('2027-01-05');
    expect(resDia11.periodoFacturado).toBe('10/11 — 09/12');
  });

  it('2. Interbank Amex (corte 21, pago 15): Spotify día 01 vs consumo post-corte día 25', () => {
    // Spotify: 01/11/2026 (antes del corte del día 21)
    const spotify = calculateCardPaymentDate('Interbank Amex', 2026, 10, 1);
    expect(spotify.pagaEnMesSiguiente).toBe(true);
    expect(spotify.desfaseMeses).toBe(1);
    expect(spotify.mesPago).toBe('2026-12');
    expect(spotify.fechaPago).toBe('2026-12-15');
    expect(spotify.periodoFacturado).toBe('21/10 — 20/11');

    // Consumo el 25/11/2026 (después del corte del día 21)
    const postCorte = calculateCardPaymentDate('Interbank Amex', 2026, 10, 25);
    expect(postCorte.pagaEnMesSiguiente).toBe(false);
    expect(postCorte.desfaseMeses).toBe(2);
    expect(postCorte.mesPago).toBe('2027-01');
    expect(postCorte.fechaPago).toBe('2027-01-15');
    expect(postCorte.periodoFacturado).toBe('21/11 — 20/12');
  });

  it('3. Ripley (corte 3, pago 1): Pastilla Madre (día 04) entra en ciclo que paga en enero', () => {
    // Pastilla Madre: 04/11/2026 (posterior al corte del día 3)
    const ripley = calculateCardPaymentDate('Ripley', 2026, 10, 4);
    expect(ripley.pagaEnMesSiguiente).toBe(false);
    expect(ripley.desfaseMeses).toBe(2);
    expect(ripley.mesPago).toBe('2027-01');
    expect(ripley.fechaPago).toBe('2027-01-01');
    expect(ripley.periodoFacturado).toBe('03/11 — 02/12');

    // Consumo pre-corte: 02/11/2026
    const preCorteRipley = calculateCardPaymentDate('Ripley', 2026, 10, 2);
    expect(preCorteRipley.pagaEnMesSiguiente).toBe(true);
    expect(preCorteRipley.desfaseMeses).toBe(1);
    expect(preCorteRipley.mesPago).toBe('2026-12');
    expect(preCorteRipley.fechaPago).toBe('2026-12-01');
    expect(preCorteRipley.periodoFacturado).toBe('03/10 — 02/11');
  });

  it('4. getMonthlyProjections asigna triple fecha explícita en cada fila efectiva', () => {
    const store = useProjectionStore.getState();
    const rows = store.getMonthlyProjections('2026-11');

    // Internet (BBVA Bfree)
    const internet = rows.find(r => r.concepto === 'Internet');
    expect(internet).toBeDefined();
    expect(internet?.fechaConsumo).toBe('2026-11-01');
    expect(internet?.mesConsumo).toBe('2026-11');
    expect(internet?.fechaPagoEfectiva).toBe('2026-12-05');
    expect(internet?.mesImpactoCaja).toBe('2026-12');
    expect(internet?.desfaseMesesCaja).toBe(1);
    expect(internet?.cicloFacturacion).toBe('10/10 — 09/11');

    // Telefonia Movil (BBVA Bfree)
    const movil = rows.find(r => r.concepto === 'Telefonia Movil');
    expect(movil).toBeDefined();
    expect(movil?.fechaConsumo).toBe('2026-11-11');
    expect(movil?.mesConsumo).toBe('2026-11');
    expect(movil?.fechaPagoEfectiva).toBe('2027-01-05');
    expect(movil?.mesImpactoCaja).toBe('2027-01');
    expect(movil?.desfaseMesesCaja).toBe(2);
    expect(movil?.cicloFacturacion).toBe('10/11 — 09/12');

    // Luz (BBVA Bfree)
    const luz = rows.find(r => r.concepto === 'Luz');
    expect(luz).toBeDefined();
    expect(luz?.fechaConsumo).toBe('2026-11-11');
    expect(luz?.fechaPagoEfectiva).toBe('2027-01-05');
    expect(luz?.mesImpactoCaja).toBe('2027-01');
    expect(luz?.desfaseMesesCaja).toBe(2);

    // Sueldo (Interbank - No tarjeta)
    const sueldo = rows.find(r => r.concepto === 'Sueldo');
    expect(sueldo).toBeDefined();
    expect(sueldo?.fechaConsumo).toBe('2026-11-01');
    expect(sueldo?.fechaPagoEfectiva).toBe('2026-11-01');
    expect(sueldo?.mesImpactoCaja).toBe('2026-11');
    expect(sueldo?.desfaseMesesCaja).toBe(0);
    expect(sueldo?.cicloFacturacion).toBeUndefined();
  });

  it('5. Cruce de año: Consumo en diciembre cruza limpiamente a enero y febrero', () => {
    // Consumo el 15 de diciembre de 2026 en BBVA Bfree (corte 10, posterior al corte)
    const resDiciembre = calculateCardPaymentDate('BBVA Bfree', 2026, 11, 15); // 11 = Diciembre
    expect(resDiciembre.mesPago).toBe('2027-02');
    expect(resDiciembre.fechaPago).toBe('2027-02-05');
    expect(resDiciembre.desfaseMeses).toBe(2);
    expect(resDiciembre.periodoFacturado).toBe('10/12 — 09/01');
  });

  it('6. Las 20 partidas iniciales de la plantilla base conservan sus propiedades inmutables', () => {
    expect(INITIAL_PROJECTIONS.length).toBe(20);
    const conceptosBase = INITIAL_PROJECTIONS.map(p => p.concepto);
    expect(conceptosBase).toContain('Internet');
    expect(conceptosBase).toContain('Gas');
    expect(conceptosBase).toContain('Telefonia Movil');
    expect(conceptosBase).toContain('Luz');
    expect(conceptosBase).toContain('Sueldo');
    expect(conceptosBase).toContain('Prestamo BCP');
    expect(conceptosBase).toContain('Titulación');

    // Comprobamos que ningún id fue modificado
    expect(INITIAL_PROJECTIONS.find(p => p.concepto === 'Internet')?.id).toBe('proj-4');
    expect(INITIAL_PROJECTIONS.find(p => p.concepto === 'Telefonia Movil')?.id).toBe('proj-14');
    expect(INITIAL_PROJECTIONS.find(p => p.concepto === 'Luz')?.id).toBe('proj-15');
  });
});
