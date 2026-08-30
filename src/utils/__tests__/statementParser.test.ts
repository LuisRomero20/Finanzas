import { describe, it, expect } from 'vitest';
import {
  parseAmount,
  normalizeDate,
  detectBankEntity,
  parseStatementText,
  reconcileStatement,
} from '../statementParser';
import type { Transaction } from '../masterData';

describe('statementParser utils', () => {
  describe('parseAmount', () => {
    it('debe parsear correctamente montos con formato peruano e internacional', () => {
      expect(parseAmount('1,450.50')).toBe(1450.5);
      expect(parseAmount('S/ 2,340.00')).toBe(2340);
      expect(parseAmount('S/. 150.25')).toBe(150.25);
      expect(parseAmount('$ 99.99')).toBe(99.99);
      expect(parseAmount('1.250,50')).toBe(1250.5);
      expect(parseAmount('45.00')).toBe(45);
      expect(parseAmount('-731.69')).toBe(-731.69);
    });
  });

  describe('normalizeDate', () => {
    it('debe normalizar DD/MM/YYYY a YYYY-MM-DD', () => {
      expect(normalizeDate('15/08/2026')).toBe('2026-08-15');
      expect(normalizeDate('05-03-2026')).toBe('2026-03-05');
      expect(normalizeDate('1/2/2026')).toBe('2026-02-01');
    });

    it('debe normalizar DD-Mmm a YYYY-MM-DD', () => {
      expect(normalizeDate('23-Jul', 2026)).toBe('2026-07-23');
      expect(normalizeDate('01-Ago', 2026)).toBe('2026-08-01');
      expect(normalizeDate('21-Ago', 2026)).toBe('2026-08-21');
    });
  });

  describe('detectBankEntity', () => {
    it('debe identificar el banco por palabras clave', () => {
      expect(detectBankEntity('ESTADO DE CUENTA INTERBANK AMERICAN EXPRESS')).toBe('Interbank Amex');
      expect(detectBankEntity('BBVA BANCO CONTINENTAL TARJETA BFREE')).toBe('BBVA Bfree');
      expect(detectBankEntity('BANCO RIPLEY TARJETA DE CREDITO')).toBe('Ripley');
    });
  });

  describe('parseStatementText con formato Interbank real', () => {
    it('debe extraer la deuda final (751.89), vencimiento (15/09/2026), pago mínimo (59.08) y movimientos', () => {
      const mockInterbankPDFText = `
        Interbank
        AMERICAN EXPRESS BLUE 3777 54** ***9 058 - SOLES
        ROMERO CASTRO LUIS JESUS
        LIMA

        ¡Hola LUIS!
        Queremos contarte todo lo que necesitas saber sobre el estado de cuenta
        de tu Tarjeta de Crédito del 21/07/2026 al cierre de 21/08/2026

        Tu Línea de Crédito es de: S/ 1,000.00
        Tu saldo disponible al 21/08/2026 es: S/ 250.31
        Al cierre de 21/08/2026 tu Deuda Total* es S/ 751.89 y US$ 0.00

        ÚLTIMO DÍA DE PAGO 15/09/2026
        PAGO DEL MES S/ 751.89 US$ 0.00
        PAGO MÍNIMO S/ 59.08 US$ 0.00

        --- PAGE BREAK ---
        DETALLE DE PAGO DEL MES
        TU ESTADO DE CUENTA ANTERIOR
        Debías en el estado de cuenta anterior * 731.69 0.00
        PAGOS REALIZADOS
        28-Jul PAGO TARJ WEB APP -731.69 0.00
        SUBTOTAL 0.00 0.00

        TUS CONSUMOS
        ROMERO LUIS
        Fecha Comercio S/ US$
        23-Jul CULQI 108.00 0.00
        23-Jul CULQI 9.00 0.00
        26-Jul Los Buenos Sabores 34.50 0.00
        26-Jul Riot Games Peru 31.90 0.00
        28-Jul IZI*AMAQ PUENTE PIEDRA 21.00 0.00
        28-Jul Inkafarma 20.00 0.00
        28-Jul VD+*JAPI 53.00 0.00
        01-Ago Spotify 11.90 0.00
        02-Ago Tottus 35.50 0.00
        03-Ago Chifa Hong Fu 43.00 0.00
        09-Ago Starbucks 19.00 0.00
        12-Ago Planet Chicken 75.90 0.00
        13-Ago CULQI 118.00 0.00
        SUBTOTAL 749.69 0.00

        OTROS COBROS S/ US$
        21-Ago SEGURO DESGRAVAMEN 2.20
        SUBTOTAL 2.20 0.00

        PAGO DEL MES (Suma de subtotales) = 751.89 0.00
        PAGO MÍNIMO DEL MES = 59.08 0.00
      `;

      const parsed = parseStatementText(mockInterbankPDFText, 'EECC_LUIS_000010032092_000_unlocked.pdf');

      expect(parsed.entidadDetectada).toBe('Interbank Amex');
      expect(parsed.deudaFinal).toBe(751.89);
      expect(parsed.pagoMinimo).toBe(59.08);
      expect(parsed.fechaCorte).toBe('2026-08-21');
      expect(parsed.fechaVencimiento).toBe('2026-09-15');
      expect(parsed.periodoInicio).toBe('2026-07-21');
      expect(parsed.periodoFin).toBe('2026-08-21');
      
      // Comprobar que extrajo movimientos
      expect(parsed.movimientos.length).toBeGreaterThanOrEqual(10);

      const culqi = parsed.movimientos.find(m => m.concepto === 'CULQI' && m.monto === 108);
      expect(culqi).toBeDefined();
      expect(culqi?.fecha).toBe('2026-07-23');

      const seguro = parsed.movimientos.find(m => m.concepto === 'SEGURO DESGRAVAMEN');
      expect(seguro).toBeDefined();
      expect(seguro?.monto).toBe(2.20);
      expect(seguro?.fecha).toBe('2026-08-21');

      const pagoRealizado = parsed.movimientos.find(m => m.concepto.includes('PAGO TARJ'));
      expect(pagoRealizado).toBeDefined();
      expect(pagoRealizado?.tipo).toBe('abono');
    });
  });

  describe('reconcileStatement', () => {
    it('debe clasificar correctamente entre coincidentes, solo en banco y solo en FinPer', () => {
      const mockStatementData = {
        entidadDetectada: 'Interbank Amex',
        deudaFinal: 751.89,
        movimientos: [
          { id: '1', fecha: '2026-07-23', concepto: 'CULQI', monto: 108, moneda: 'PEN' as const, tipo: 'cargo' as const },
          { id: '2', fecha: '2026-08-01', concepto: 'Spotify', monto: 11.9, moneda: 'PEN' as const, tipo: 'cargo' as const },
          { id: '3', fecha: '2026-08-21', concepto: 'SEGURO DESGRAVAMEN', monto: 2.2, moneda: 'PEN' as const, tipo: 'cargo' as const },
        ],
        textoCompleto: '',
        nombreArchivo: 'statement.pdf',
      };

      const mockAppTransactions: Transaction[] = [
        { id: 'tx-1', Tipo: 'Egreso', Fecha: '2026-07-23', Categoria: 'Servicios', Concepto: 'Pago Culqi', Monto: 108, Entidad: 'Interbank Amex', Mes: 'Julio' },
        { id: 'tx-2', Tipo: 'Egreso', Fecha: '2026-08-01', Categoria: 'Suscripciones', Concepto: 'Spotify', Monto: 11.9, Entidad: 'Interbank Amex', Mes: 'Agosto' },
      ];

      const report = reconcileStatement(mockStatementData, mockAppTransactions, 'Interbank Amex');

      expect(report.cardEntity).toBe('Interbank Amex');
      expect(report.deudaFinalEstadoCuenta).toBe(751.89);

      const matched = report.matches.filter(m => m.status === 'matched');
      const stmtOnly = report.matches.filter(m => m.status === 'statement_only');

      expect(matched.length).toBe(2);
      expect(stmtOnly.length).toBe(1); // SEGURO DESGRAVAMEN
    });
  });
});
