import { describe, it, expect } from 'vitest';
import { generateFinancialBriefing } from '../alerts/obligationAlertsEngine';
import { getLimaDateTime } from '../alerts/dateUtils';
import type { EffectiveProjectedRow } from '../../store/projectionStore';
import type { Transaction } from '../../utils/masterData';

// Snapshot sintético del escenario de referencia de Noviembre 2026 (23 partidas)
export const SCENARIO_NOV_2026_ROWS: EffectiveProjectedRow[] = [
    // Ingresos (Suma: S/ 4,007.32)
    {
      id: 'row-ing-1',
      itemId: 'proj-sueldo',
      tipo: 'Ingreso',
      fecha: '2026-11-01',
      categoria: 'Sueldo',
      concepto: 'Sueldo',
      monto: 2375.30,
      montoOriginal: 2375.30,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-ing-2',
      itemId: 'proj-cts',
      tipo: 'Ingreso',
      fecha: '2026-11-15',
      categoria: 'Otro Ing',
      concepto: 'CTS Noviembre',
      monto: 1632.02,
      montoOriginal: 1632.02,
      entidad: 'Interbank',
      recurrencia: 'unico',
      esFijo: false,
      esTemporal: false,
      esUnico: true,
      esModificado: false,
      esTarjetaCredito: false,
    },
    // Egresos (21 partidas, Suma: S/ 4,228.74)
    {
      id: 'row-eg-1',
      itemId: 'proj-spotify',
      tipo: 'Egreso',
      fecha: '2026-11-01',
      categoria: 'Servicio',
      concepto: 'Spotify',
      monto: 12.00,
      montoOriginal: 12.00,
      entidad: 'Interbank Amex',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: true,
    },
    {
      id: 'row-eg-2',
      itemId: 'proj-internet',
      tipo: 'Egreso',
      fecha: '2026-11-01',
      categoria: 'Servicio',
      concepto: 'Internet',
      monto: 79.00,
      montoOriginal: 79.00,
      entidad: 'BBVA Bfree',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: true,
    },
    {
      id: 'row-eg-3',
      itemId: 'proj-gas',
      tipo: 'Egreso',
      fecha: '2026-11-01',
      categoria: 'Servicio',
      concepto: 'Gas',
      monto: 50.00,
      montoOriginal: 50.00,
      entidad: 'BBVA Bfree',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: true,
    },
    {
      id: 'row-eg-4',
      itemId: 'proj-corte',
      tipo: 'Egreso',
      fecha: '2026-11-01',
      categoria: 'Servicio',
      concepto: 'Corte de Cabello',
      monto: 20.00,
      montoOriginal: 20.00,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-5',
      itemId: 'proj-iphone',
      tipo: 'Egreso',
      fecha: '2026-11-01',
      categoria: 'Tecnología & Gadgets',
      concepto: 'iPhone 16',
      monto: 246.75,
      montoOriginal: 246.75,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-6',
      itemId: 'proj-pago-ripley',
      tipo: 'Egreso',
      fecha: '2026-11-01',
      categoria: 'Servicio',
      concepto: 'Pago de Tarjeta Ripley',
      monto: 155.05,
      montoOriginal: 155.05,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
      esPagoLiquidacionTarjeta: true,
    },
    {
      id: 'row-eg-7',
      itemId: 'proj-yape',
      tipo: 'Egreso',
      fecha: '2026-11-01',
      categoria: 'Deuda',
      concepto: 'Prestamo Yape',
      monto: 116.85,
      montoOriginal: 116.85,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-8',
      itemId: 'proj-pastilla',
      tipo: 'Egreso',
      fecha: '2026-11-04',
      categoria: 'Gasto',
      concepto: 'Pastilla Madre',
      monto: 120.00,
      montoOriginal: 120.00,
      entidad: 'Ripley',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: true,
    },
    {
      id: 'row-eg-9',
      itemId: 'proj-limpieza',
      tipo: 'Egreso',
      fecha: '2026-11-04',
      categoria: 'Hogar & Mantenimiento',
      concepto: 'Utensilios de Limpieza',
      monto: 30.00,
      montoOriginal: 30.00,
      entidad: 'Ripley',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: true,
    },
    {
      id: 'row-eg-10',
      itemId: 'proj-agua',
      tipo: 'Egreso',
      fecha: '2026-11-05',
      categoria: 'Servicio',
      concepto: 'Agua + Mantenimiento',
      monto: 180.00,
      montoOriginal: 180.00,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-11',
      itemId: 'proj-pago-amex',
      tipo: 'Egreso',
      fecha: '2026-11-05',
      categoria: 'Servicio',
      concepto: 'Pago de Tarjeta Interbank Amex',
      monto: 12.00,
      montoOriginal: 12.00,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
      esPagoLiquidacionTarjeta: true,
    },
    {
      id: 'row-eg-12',
      itemId: 'proj-pago-bbva',
      tipo: 'Egreso',
      fecha: '2026-11-05',
      categoria: 'Servicio',
      concepto: 'Pago de Tarjeta BBVA Bfree',
      monto: 120.80,
      montoOriginal: 120.80,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
      esPagoLiquidacionTarjeta: true,
    },
    {
      id: 'row-eg-13',
      itemId: 'proj-madre',
      tipo: 'Egreso',
      fecha: '2026-11-05',
      categoria: 'Servicio',
      concepto: 'Madre',
      monto: 90.00,
      montoOriginal: 90.00,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-14',
      itemId: 'proj-movil',
      tipo: 'Egreso',
      fecha: '2026-11-11',
      categoria: 'Servicio',
      concepto: 'Telefonia Movil',
      monto: 39.90,
      montoOriginal: 39.90,
      entidad: 'BBVA Bfree',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: true,
    },
    {
      id: 'row-eg-15',
      itemId: 'proj-luz',
      tipo: 'Egreso',
      fecha: '2026-11-11',
      categoria: 'Servicio',
      concepto: 'Luz',
      monto: 120.00,
      montoOriginal: 120.00,
      entidad: 'BBVA Bfree',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: true,
    },
    {
      id: 'row-eg-16',
      itemId: 'proj-bcp',
      tipo: 'Egreso',
      fecha: '2026-11-15',
      categoria: 'Deuda',
      concepto: 'Prestamo BCP',
      monto: 143.16,
      montoOriginal: 143.16,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-17',
      itemId: 'proj-titulacion',
      tipo: 'Egreso',
      fecha: '2026-11-15',
      categoria: 'Otro Egre',
      concepto: 'Titulación',
      monto: 980.00,
      montoOriginal: 980.00,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-18',
      itemId: 'proj-kevin',
      tipo: 'Egreso',
      fecha: '2026-11-20',
      categoria: 'Deuda',
      concepto: 'Kevin',
      monto: 500.00,
      montoOriginal: 500.00,
      entidad: 'Interbank',
      recurrencia: 'unico',
      esFijo: false,
      esTemporal: false,
      esUnico: true,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-19',
      itemId: 'proj-icloud',
      tipo: 'Egreso',
      fecha: '2026-11-23',
      categoria: 'Servicio',
      concepto: 'iCloud',
      monto: 15.00,
      montoOriginal: 15.00,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-20',
      itemId: 'proj-viaje-brasil',
      tipo: 'Egreso',
      fecha: '2026-11-25',
      categoria: 'Viajes & Ocio',
      concepto: 'Viaje Brasil',
      monto: 1108.23,
      montoOriginal: 1108.23,
      entidad: 'Interbank',
      recurrencia: 'unico',
      esFijo: false,
      esTemporal: false,
      esUnico: true,
      esModificado: false,
      esTarjetaCredito: false,
    },
    {
      id: 'row-eg-21',
      itemId: 'proj-ahorro',
      tipo: 'Egreso',
      fecha: '2026-11-30',
      categoria: 'Ahorro',
      concepto: 'Meta Ahorro Emergencia',
      monto: 90.00,
      montoOriginal: 90.00,
      entidad: 'Interbank',
      recurrencia: 'fijo',
      esFijo: true,
      esTemporal: false,
      esUnico: false,
      esModificado: false,
      esTarjetaCredito: false,
    },
  ];

describe('FINPER 2.1 — Sprint 02: Motor de Alertas Tempranas y Obligaciones', () => {
  it('1. El escenario de referencia de noviembre 2026 suma exactamente 23 partidas con las cifras auditadas', () => {
    expect(SCENARIO_NOV_2026_ROWS.length).toBe(23);

    const ingresos = SCENARIO_NOV_2026_ROWS.filter(r => r.tipo === 'Ingreso').reduce((s, r) => s + r.monto, 0);
    const egresos = SCENARIO_NOV_2026_ROWS.filter(r => r.tipo === 'Egreso').reduce((s, r) => s + r.monto, 0);
    const balance = Math.round((ingresos - egresos) * 100) / 100;

    expect(Math.round(ingresos * 100) / 100).toBe(4007.32);
    expect(Math.round(egresos * 100) / 100).toBe(4228.74);
    expect(balance).toBe(-221.42);
  });

  it('2. El motor de alertas es estrictamente libre de mutaciones (no altera los 23 registros originales)', () => {
    // Clon profundo para comprobar inmutabilidad
    const snapshotBefore = JSON.parse(JSON.stringify(SCENARIO_NOV_2026_ROWS));
    const txsBefore: Transaction[] = [];

    // Evaluamos a las 07:30 a. m. del 11 de noviembre de 2026 (hora de Lima: UTC-5 -> 12:30 UTC)
    const refDate = new Date('2026-11-11T12:30:00.000Z');

    const briefing = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: txsBefore,
      referenceNow: refDate,
      targetMonth: '2026-11',
    });

    // Comprobamos que el input no fue modificado en lo absoluto
    expect(SCENARIO_NOV_2026_ROWS).toEqual(snapshotBefore);
    expect(txsBefore.length).toBe(0);

    // Métricas del briefing
    expect(briefing.monthlyProjectedIncome).toBe(4007.32);
    expect(briefing.monthlyProjectedExpense).toBe(4228.74);
    expect(briefing.monthlyProjectedBalance).toBe(-221.42);
    expect(briefing.liquidityStatus).toBe('deficit');
    expect(briefing.liquidityAlertMessage).toContain('Déficit mensual proyectado de S/ 221.42');
  });

  it('3. Reconoce la franja horaria matutina en Lima (7:30 a. m. es isMorningBriefing === true)', () => {
    // 07:30 a. m. Lima (UTC-5) = 12:30 UTC
    const date730am = new Date('2026-11-11T12:30:00.000Z');
    const limaTime = getLimaDateTime(date730am);

    expect(limaTime.hours).toBe(7);
    expect(limaTime.minutes).toBe(30);
    expect(limaTime.timeString).toBe('07:30');

    const briefing = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: [],
      referenceNow: date730am,
      targetMonth: '2026-11',
    });

    expect(briefing.isMorningBriefing).toBe(true);
    expect(briefing.timeLima).toBe('07:30');
    expect(briefing.dateLima).toBe('2026-11-11');
  });

  it('4. Clasifica correctamente obligaciones de hoy (11 nov: Telefonia Movil S/ 39.90 y Luz S/ 120.00)', () => {
    const refDate = new Date('2026-11-11T12:30:00.000Z'); // 11 nov 7:30 a. m. Lima

    const briefing = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: [],
      referenceNow: refDate,
      targetMonth: '2026-11',
    });

    // Hoy vencen: Telefonia Movil (39.90) y Luz (120.00)
    expect(briefing.obligationsToday.length).toBe(2);
    const conceptosHoy = briefing.obligationsToday.map(o => o.concepto);
    expect(conceptosHoy).toContain('Telefonia Movil');
    expect(conceptosHoy).toContain('Luz');
    expect(briefing.totalTodayPending).toBe(159.90);
    expect(briefing.totalTodayExecuted).toBe(0);

    // Todas las obligaciones conservan estricta referencia al ID de partida
    briefing.obligationsToday.forEach(o => {
      expect(o.referenceItemId).toBeTruthy();
      expect(o.source).toBe('projection');
    });
  });

  it('5. Distingue pagos previamente ejecutados en lista maestra y no los marca como pendientes ni vencidos', () => {
    const refDate = new Date('2026-11-11T12:30:00.000Z'); // 11 nov

    // El usuario ya registró el pago de Telefonia Movil en transacciones reales
    const executedTxs: Transaction[] = [
      {
        id: 'tx-real-movil',
        Fecha: '2026-11-10',
        Mes: '2026-11',
        Tipo: 'Egreso',
        Categoria: 'Servicio',
        Concepto: 'Telefonia Movil Bitel',
        Monto: 39.90,
        Entidad: 'BBVA Bfree',
      },
    ];

    const briefing = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: executedTxs,
      referenceNow: refDate,
      targetMonth: '2026-11',
    });

    const movilAlert = briefing.obligationsToday.find(o => o.concepto === 'Telefonia Movil');
    expect(movilAlert).toBeDefined();
    expect(movilAlert?.executionStatus).toBe('executed');
    expect(movilAlert?.matchedTransactionId).toBe('tx-real-movil');

    // Telefonia Movil ya fue pagada: solo Luz queda pendiente hoy
    expect(briefing.totalTodayPending).toBe(120.00);
    expect(briefing.totalTodayExecuted).toBe(39.90);
  });

  it('6. Agrupa vencimientos de los próximos 7 días (del 12 al 18 nov: Titulación S/ 980 y Préstamo BCP S/ 143.16)', () => {
    const refDate = new Date('2026-11-11T12:30:00.000Z'); // 11 nov

    const briefing = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: [],
      referenceNow: refDate,
      targetMonth: '2026-11',
    });

    // En los siguientes 7 días (12 al 18 de nov) vencen el día 15: Prestamo BCP (143.16) y Titulacion (980.00)
    const conceptosNext7 = briefing.obligationsNext7Days.map(o => o.concepto);
    expect(conceptosNext7).toContain('Prestamo BCP');
    expect(conceptosNext7).toContain('Titulación');
    expect(briefing.totalNext7DaysPending).toBe(1123.16);
  });

  it('7. Identifica obligaciones pasadas no ejecutadas como vencidas (overdue) sin duplicar transacciones', () => {
    const refDate = new Date('2026-11-11T12:30:00.000Z'); // 11 nov

    // Supongamos que Agua + Mantenimiento (vence día 5, S/ 180) aún no tiene transacción real registrada
    const briefing = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: [],
      referenceNow: refDate,
      targetMonth: '2026-11',
    });

    const overdueConceptos = briefing.obligationsOverdue.map(o => o.concepto);
    expect(overdueConceptos).toContain('Agua + Mantenimiento');
    expect(briefing.totalOverduePending).toBeGreaterThan(0);

    // Pero si el usuario ya pagó Agua, desaparece de vencidos pendientes
    const txAgua: Transaction = {
      id: 'tx-agua-pago',
      Fecha: '2026-11-05',
      Mes: '2026-11',
      Tipo: 'Egreso',
      Categoria: 'Servicio',
      Concepto: 'Agua + Mantenimiento Edificio',
      Monto: 180.00,
      Entidad: 'Interbank',
    };

    const briefingConAgua = generateFinancialBriefing({
      projectedRows: SCENARIO_NOV_2026_ROWS,
      executedTransactions: [txAgua],
      referenceNow: refDate,
      targetMonth: '2026-11',
    });

    const overdueActualizado = briefingConAgua.obligationsOverdue.map(o => o.concepto);
    expect(overdueActualizado).not.toContain('Agua + Mantenimiento');
  });

  it('8. Maneja listas vacías y errores de conexión con tolerancia a fallos', () => {
    const briefingVacio = generateFinancialBriefing({
      projectedRows: [],
      executedTransactions: [],
    });

    expect(briefingVacio.obligationsToday).toEqual([]);
    expect(briefingVacio.obligationsNext7Days).toEqual([]);
    expect(briefingVacio.obligationsOverdue).toEqual([]);
    expect(briefingVacio.cardsDue).toEqual([]);
    expect(briefingVacio.totalTodayPending).toBe(0);
    expect(briefingVacio.monthlyProjectedBalance).toBe(0);
    expect(briefingVacio.liquidityStatus).toBe('insufficient_data');
    expect(briefingVacio.liquidityAlertMessage).toBeUndefined();
  });
});
