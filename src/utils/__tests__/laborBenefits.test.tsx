import { describe, it, expect } from 'vitest';
import {
  calculateNetSalary,
  calculateGratification,
  calculateCts,
  calculateAnnualBenefits,
  getUser2026HistoricalAndProjectedTable,
  calculateUtilidades,
} from '../laborBenefits';

describe('Labor Benefits Calculations (Peruvian Labor Law)', () => {
  it('calculates exact previous salary net amount for S/ 2,339', () => {
    const res = calculateNetSalary({
      sueldoBruto: 2339,
      tipoPension: 'AFP_USER',
      tipoSalud: 'ESSALUD',
      tieneAsignacionFamiliar: false,
    });

    // Exact user amount: S/ 2,073.06
    expect(res.sueldoNeto).toBe(2073.06);
    expect(res.descuentoPension).toBe(265.94);
  });

  it('calculates exact current salary net amount for S/ 2,559', () => {
    const res = calculateNetSalary({
      sueldoBruto: 2559,
      tipoPension: 'AFP_USER',
      tipoSalud: 'ESSALUD',
      tieneAsignacionFamiliar: false,
    });

    // Exact user amount: S/ 2,259.63
    expect(res.sueldoNeto).toBe(2259.63);
    expect(res.descuentoPension).toBe(299.37);
  });

  it('calculates full gratification with 9% EsSalud extraordinary bonus', () => {
    const grati = calculateGratification({
      sueldoBruto: 2559,
      tipoPension: 'AFP_USER',
      tipoSalud: 'ESSALUD',
      tieneAsignacionFamiliar: false,
    });

    expect(grati.baseCalculo).toBe(2559);
    expect(grati.tasaBonificacion).toBe(9);
    expect(grati.bonificacionExtraordinaria).toBe(230.31);
    expect(grati.gratificacionTotal).toBe(2789.31);
  });

  it('calculates semestral CTS for S/ 2,559', () => {
    const cts = calculateCts({
      sueldoBruto: 2559,
      tipoPension: 'AFP_USER',
      tipoSalud: 'ESSALUD',
      tieneAsignacionFamiliar: false,
    });

    // 1/6 of grati = 426.50
    // Remuneración computable = 2559 + 426.50 = 2985.50
    // CTS semestral = 2985.50 / 2 = 1492.75
    expect(cts.unSextoGratificacion).toBe(426.50);
    expect(cts.remuneracionComputable).toBe(2985.50);
    expect(cts.ctsSemestral).toBe(1492.75);
  });

  it('calculates annual projection for S/ 2,559', () => {
    const annual = calculateAnnualBenefits({
      sueldoBruto: 2559,
      tipoPension: 'AFP_USER',
      tipoSalud: 'ESSALUD',
      tieneAsignacionFamiliar: false,
    });

    expect(annual.sueldoNetoMensual).toBe(2259.63);
    expect(annual.totalSueldosNetosAnual).toBe(27115.56);
    expect(annual.totalGratificacionesAnual).toBe(5578.62);
    expect(annual.totalCtsAnual).toBe(2985.50);
    expect(annual.totalPercibidoAnual).toBe(35679.68);
  });

  it('matches the exact user Excel pivot table for January to September 2026', () => {
    const table = getUser2026HistoricalAndProjectedTable();

    // Sum of Jan - Sep as shown in user's image:
    const janToSep = table.columns.slice(0, 9);
    const sumSueldoJanToSep = janToSep.reduce((s, c) => s + c.sueldo, 0);
    const sumTotalJanToSep = janToSep.reduce((s, c) => s + c.total, 0);

    // Ene-Mar (3 * 2073.06 = 6219.18) + Abr-Set (6 * 2259.63 = 13557.78) = 19776.96
    expect(Math.round(sumSueldoJanToSep * 100) / 100).toBe(19776.96);

    // Total general in Excel: S/ 23,968.23 (19776.96 sueldo + 1469.67 CTS + 2721.60 Grati)
    expect(Math.round(sumTotalJanToSep * 100) / 100).toBe(23968.23);

    // Check specific months
    const mayo = table.columns.find(c => c.mes === 'Mayo');
    expect(mayo?.cts).toBe(1469.67);
    expect(mayo?.total).toBe(3729.30);

    const julio = table.columns.find(c => c.mes === 'Julio');
    expect(julio?.gratificacion).toBe(2721.60);
    expect(julio?.total).toBe(4981.23);
  });

  describe('Worker Profit Sharing - Utilidades (D.L. 892)', () => {
    it('calculates utilidades by salary multiplier accurately', () => {
      const res = calculateUtilidades({
        modo: 'MULTIPLOS_SUELDO',
        sueldoBruto: 2559,
        tieneAsignacionFamiliar: false,
        multiplicadorSueldos: 1.5,
      });

      // 1.5 * 2559 = 3838.50
      expect(res.utilidadBruta).toBe(3838.50);
      expect(res.montoPorDias).toBe(1919.25);
      expect(res.montoPorRemuneracion).toBe(1919.25);
      expect(res.descuentoAfpOnp).toBe(0); // Inafecto por D.L. 892 Art. 9
      expect(res.descuentoEsSalud).toBe(0);
      expect(res.superaTope).toBe(false);
      expect(res.tope18Sueldos).toBe(2559 * 18);
    });

    it('calculates official 50/50 legal formula with sector percentage', () => {
      const res = calculateUtilidades({
        modo: 'OFICIAL_EMPRESA',
        sueldoBruto: 2559,
        tieneAsignacionFamiliar: false,
        sector: 'TELECOMUNICACIONES', // 10%
        rentaNetaEmpresa: 10000000, // S/ 10,000,000
        totalDiasEmpresa: 26000, // 100 trabajadores * 260 días
        masaSalarialEmpresa: 3582600, // 100 trabajadores * 35,826
        diasLaboradosTrabajador: 260,
      });

      // 10% de 10M = 1,000,000
      expect(res.fondoTotalDistribuir).toBe(1000000);
      expect(res.fondoDias50).toBe(500000);
      expect(res.fondoRemuneracion50).toBe(500000);

      // 50% por días = (500,000 / 26,000) * 260 = 5,000.00
      expect(res.montoPorDias).toBe(5000.00);

      // 50% por remuneración = (500,000 / 3,582,600) * 35,826 = 5,000.00
      expect(res.montoPorRemuneracion).toBe(5000.00);

      // Utilidad bruta = 10,000.00
      expect(res.utilidadBruta).toBe(10000.00);
      expect(res.superaTope).toBe(false);
    });

    it('enforces the legal limit of 18 monthly remunerations', () => {
      const res = calculateUtilidades({
        modo: 'OFICIAL_EMPRESA',
        sueldoBruto: 2000,
        tieneAsignacionFamiliar: false,
        sector: 'MINERIA', // 8%
        rentaNetaEmpresa: 100000000, // Ganancias enormes
        totalDiasEmpresa: 260, // Pocos trabajadores
        masaSalarialEmpresa: 28000,
        diasLaboradosTrabajador: 260,
      });

      // 18 sueldos = 18 * 2,000 = 36,000
      expect(res.tope18Sueldos).toBe(36000);
      expect(res.superaTope).toBe(true);
      expect(res.utilidadAfecta).toBe(36000); // Tope aplicado
      expect(res.excedenteTope).toBeGreaterThan(0);
    });
  });
});
