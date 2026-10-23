import { describe, it, expect } from 'vitest';
import {
  generateDiffReport,
  computeSmartMerge,
  computeAssistedMerge,
  simulateReconciliationImpact,
  buildDownloadableDiffBackup,
  ItemResolution,
} from '../sync/diffComparison';

describe('FINPER 2.0.4 — Diff Comparison & Assisted Reconciliation Domain Logic', () => {
  it('correctly compares projections when counts differ (e.g. 19 local vs 30 cloud)', () => {
    const localItems = Array.from({ length: 19 }, (_, i) => ({
      id: `proy-${i}`,
      concepto: `Partida ${i}`,
      monto: i === 0 ? 500 : 100, // Partida 0 has different amount in local
      tipo: 'Egreso',
      categoria: 'Servicios',
    }));

    const remoteItems = Array.from({ length: 30 }, (_, i) => ({
      id: `proy-${i}`,
      concepto: `Partida ${i}`,
      monto: i === 0 ? 600 : 100, // Partida 0 has S/ 600 in cloud
      tipo: 'Egreso',
      categoria: 'Servicios',
    }));

    const localRaw = JSON.stringify({ items: localItems, probabilidadSueldoPorMes: { '2026-11': 100 } });
    const remoteRaw = JSON.stringify({ items: remoteItems, probabilidadSueldoPorMes: { '2026-11': 90 } });

    const report = generateDiffReport('projections', localRaw, remoteRaw);

    expect(report.name).toBe('projections');
    expect(report.localTotal).toBe(20); // 19 items + 1 prob scenario
    expect(report.remoteTotal).toBe(31); // 30 items + 1 prob scenario
    expect(report.remoteOnlyCount).toBe(11); // items 19..29 exist only in cloud
    expect(report.localOnlyCount).toBe(0);
    expect(report.modifiedCount).toBe(2); // Partida 0 + probabilidad de sueldo
    expect(report.identicalCount).toBe(18); // items 1..18 identical
    expect(report.canAutoMerge).toBe(false);

    // Check field diff for Partida 0
    const item0 = report.items.find(i => i.id === 'proy-0');
    expect(item0).toBeDefined();
    expect(item0?.status).toBe('modified');
    expect(item0?.differences?.[0].fieldName).toBe('Monto');
    expect(item0?.differences?.[0].localValue).toBe('S/ 500.00');
    expect(item0?.differences?.[0].remoteValue).toBe('S/ 600.00');
  });

  it('strictly rejects computeSmartMerge when modifiedCount > 0 for safety', () => {
    const localRaw = JSON.stringify({
      items: [{ id: 'p-1', concepto: 'BBVA Bfree', monto: 271.84, tipo: 'Egreso' }],
    });
    const remoteRaw = JSON.stringify({
      items: [{ id: 'p-1', concepto: 'BBVA Bfree', monto: 272.80, tipo: 'Egreso' }],
    });

    // Automatically merging differing financial figures is forbidden
    expect(() => computeSmartMerge('projections', localRaw, remoteRaw)).toThrowError(
      /Fusi[oó]n autom[aá]tica rechazada por seguridad/i
    );
  });

  it('allows computeSmartMerge when modifiedCount === 0 (only identical or additive items)', () => {
    const localItems = [
      { id: 'p-common', concepto: 'Luz', monto: 120, tipo: 'Egreso' },
      { id: 'p-local-only', concepto: 'Agua', monto: 45, tipo: 'Egreso' },
    ];
    const remoteItems = [
      { id: 'p-common', concepto: 'Luz', monto: 120, tipo: 'Egreso' },
      { id: 'p-remote-only', concepto: 'Internet', monto: 99, tipo: 'Egreso' },
    ];

    const localRaw = JSON.stringify({ items: localItems });
    const remoteRaw = JSON.stringify({ items: remoteItems });

    const result = computeSmartMerge('projections', localRaw, remoteRaw);
    expect(result.totalItems).toBe(3);

    const parsed = JSON.parse(result.mergedValue);
    expect(parsed.items).toHaveLength(3);
    expect(parsed.items.some((i: any) => i.id === 'p-common')).toBe(true);
    expect(parsed.items.some((i: any) => i.id === 'p-local-only')).toBe(true);
    expect(parsed.items.some((i: any) => i.id === 'p-remote-only')).toBe(true);
  });

  it('preserves two distinct payments sharing identical concept, month and type if IDs differ', () => {
    // Crucial requirement: Do NOT collapse legitimate distinct payments
    const localItems = [
      { id: 'sub-gym-a', concepto: 'Membresía Gym', mes: '2026-11', monto: 150, tipo: 'Egreso' },
      { id: 'sub-gym-b', concepto: 'Membresía Gym', mes: '2026-11', monto: 150, tipo: 'Egreso' },
    ];
    const remoteItems = [
      { id: 'sub-gym-a', concepto: 'Membresía Gym', mes: '2026-11', monto: 150, tipo: 'Egreso' },
      { id: 'sub-gym-b', concepto: 'Membresía Gym', mes: '2026-11', monto: 150, tipo: 'Egreso' },
      { id: 'sub-gym-c', concepto: 'Membresía Gym', mes: '2026-11', monto: 150, tipo: 'Egreso' },
    ];

    const localRaw = JSON.stringify({ items: localItems });
    const remoteRaw = JSON.stringify({ items: remoteItems });

    const report = generateDiffReport('projections', localRaw, remoteRaw);
    expect(report.identicalCount).toBe(2);
    expect(report.remoteOnlyCount).toBe(1);
    expect(report.modifiedCount).toBe(0);

    const merged = computeSmartMerge('projections', localRaw, remoteRaw);
    const parsed = JSON.parse(merged.mergedValue);
    expect(parsed.items).toHaveLength(3);
    const ids = parsed.items.map((i: any) => i.id);
    expect(ids).toContain('sub-gym-a');
    expect(ids).toContain('sub-gym-b');
    expect(ids).toContain('sub-gym-c');
  });

  it('throws error in computeAssistedMerge when a modified item has no decision', () => {
    const localRaw = JSON.stringify({
      items: [
        { id: 'ibk-amex', concepto: 'Interbank Amex', monto: 36.60, tipo: 'Egreso' },
        { id: 'bbva-bfree', concepto: 'BBVA Bfree', monto: 271.84, tipo: 'Egreso' },
      ],
    });
    const remoteRaw = JSON.stringify({
      items: [
        { id: 'ibk-amex', concepto: 'Interbank Amex', monto: 465.30, tipo: 'Egreso' },
        { id: 'bbva-bfree', concepto: 'BBVA Bfree', monto: 272.80, tipo: 'Egreso' },
      ],
    });

    const resolutions: Record<string, ItemResolution> = {
      'ibk-amex': { itemId: 'ibk-amex', type: 'use_remote' },
      // 'bbva-bfree' is intentionally missing
    };

    expect(() => computeAssistedMerge('projections', localRaw, remoteRaw, resolutions)).toThrowError(
      /Conciliaci[oó]n asistida incompleta: hay 1 registro\(s\) modificado\(s\) sin decisi[oó]n/i
    );
  });

  it('faithfully resolves the 5 real-world conflicts with custom, local, and cloud choices', () => {
    // Exact realistic scenario from user screenshots
    const localRaw = JSON.stringify({
      items: [
        { id: 'p-ibk', concepto: 'Pago Tarjeta Interbank Amex', monto: 36.60, tipo: 'Egreso', categoria: 'Financiero', cuotas: '1/1' },
        { id: 'p-bbva', concepto: 'Pago Tarjeta BBVA Bfree', monto: 271.84, tipo: 'Egreso', categoria: 'Financiero', customMeta: 'preservar' },
        { id: 'p-ripley', concepto: 'Pago Tarjeta Ripley', monto: 381.88, tipo: 'Egreso', categoria: 'Financiero' },
        { id: 'p-sueldo', concepto: 'Sueldo Mensual', monto: 2259.63, tipo: 'Ingreso', categoria: 'Ingresos' },
        { id: 'p-cloud-1', concepto: 'Seguro Rímac', monto: 85.00, tipo: 'Egreso', categoria: 'Seguros' },
      ],
      probabilidadSueldoPorMes: { '2026-11': 100, '2026-12': 90 },
    });

    const remoteRaw = JSON.stringify({
      items: [
        { id: 'p-ibk', concepto: 'Pago Tarjeta Interbank Amex', monto: 465.30, tipo: 'Egreso', categoria: 'Financiero', cuotas: '1/1' },
        { id: 'p-bbva', concepto: 'Pago Tarjeta BBVA Bfree', monto: 272.80, tipo: 'Egreso', categoria: 'Financiero', customMeta: 'preservar' },
        { id: 'p-ripley', concepto: 'Pago Tarjeta Ripley', monto: 374.82, tipo: 'Egreso', categoria: 'Financiero' },
        { id: 'p-sueldo', concepto: 'Sueldo Mensual', monto: 2384.15, tipo: 'Ingreso', categoria: 'Ingresos' },
        { id: 'p-cloud-1', concepto: 'Seguro Rímac', monto: 85.00, tipo: 'Egreso', categoria: 'Seguros' },
        { id: 'p-cloud-2', concepto: 'Netflix', monto: 44.90, tipo: 'Egreso', categoria: 'Suscripciones' },
      ],
      probabilidadSueldoPorMes: { '2026-11': 95, '2026-12': 85 },
    });

    const resolutions: Record<string, ItemResolution> = {
      'p-ibk': { itemId: 'p-ibk', type: 'use_remote' }, // S/ 465.30 from cloud
      'p-bbva': { itemId: 'p-bbva', type: 'use_local' }, // S/ 271.84 from local PC
      'p-ripley': { itemId: 'p-ripley', type: 'custom', customAmount: 380.00 }, // S/ 380.00 custom
      'p-sueldo': { itemId: 'p-sueldo', type: 'use_remote' }, // S/ 2,384.15 from cloud
    };

    const assisted = computeAssistedMerge(
      'projections',
      localRaw,
      remoteRaw,
      resolutions,
      'use_remote' // Salary probability chosen from cloud
    );

    const parsed = JSON.parse(assisted.mergedValue);
    expect(parsed.items).toHaveLength(6); // 4 modified + 1 identical + 1 cloud-only

    // 1. Interbank Amex takes cloud value
    const ibkItem = parsed.items.find((i: any) => i.id === 'p-ibk');
    expect(ibkItem.monto).toBe(465.30);
    expect(ibkItem.cuotas).toBe('1/1'); // metadata preserved

    // 2. BBVA Bfree takes local value and preserves customMeta
    const bbvaItem = parsed.items.find((i: any) => i.id === 'p-bbva');
    expect(bbvaItem.monto).toBe(271.84);
    expect(bbvaItem.customMeta).toBe('preservar');

    // 3. Ripley takes custom value
    const ripleyItem = parsed.items.find((i: any) => i.id === 'p-ripley');
    expect(ripleyItem.monto).toBe(380.00);

    // 4. Sueldo takes cloud value
    const sueldoItem = parsed.items.find((i: any) => i.id === 'p-sueldo');
    expect(sueldoItem.monto).toBe(2384.15);

    // 5. Cloud-only item is safely retained
    const netflixItem = parsed.items.find((i: any) => i.id === 'p-cloud-2');
    expect(netflixItem).toBeDefined();
    expect(netflixItem.monto).toBe(44.90);

    // 6. Salary probability takes chosen cloud settings
    expect(parsed.probabilidadSueldoPorMes).toEqual({ '2026-11': 95, '2026-12': 85 });
  });

  it('accurately computes real-time financial simulation deltas with simulateReconciliationImpact', () => {
    const localRaw = JSON.stringify({
      items: [
        { id: 'i-1', concepto: 'Sueldo', monto: 2000, tipo: 'Ingreso' },
        { id: 'o-1', concepto: 'Alquiler', monto: 800, tipo: 'Egreso' },
        { id: 'o-2', concepto: 'Tarjeta', monto: 200, tipo: 'Egreso' },
      ],
    });
    const remoteRaw = JSON.stringify({
      items: [
        { id: 'i-1', concepto: 'Sueldo', monto: 2500, tipo: 'Ingreso' },
        { id: 'o-1', concepto: 'Alquiler', monto: 800, tipo: 'Egreso' },
        { id: 'o-2', concepto: 'Tarjeta', monto: 350, tipo: 'Egreso' },
      ],
    });

    // Case A: Partial resolutions (o-2 not resolved yet)
    const partialSim = simulateReconciliationImpact('projections', localRaw, remoteRaw, {
      'i-1': { itemId: 'i-1', type: 'use_remote' }, // resolved to 2500
    });
    expect(partialSim.localTotalIncome).toBe(2000);
    expect(partialSim.remoteTotalIncome).toBe(2500);
    expect(partialSim.resolvedTotalIncome).toBe(2500);
    expect(partialSim.unresolvedModifiedCount).toBe(1);

    // Case B: Fully resolved (i-1 remote, o-2 custom 300)
    const fullSim = simulateReconciliationImpact('projections', localRaw, remoteRaw, {
      'i-1': { itemId: 'i-1', type: 'use_remote' }, // 2500
      'o-2': { itemId: 'o-2', type: 'custom', customAmount: 300 }, // 300 instead of 200
    });
    expect(fullSim.unresolvedModifiedCount).toBe(0);
    expect(fullSim.localTotalObligations).toBe(1000); // 800 + 200
    expect(fullSim.remoteTotalObligations).toBe(1150); // 800 + 350
    expect(fullSim.resolvedTotalObligations).toBe(1100); // 800 + 300
    expect(fullSim.netObligationChangeVsLocal).toBe(100); // +100 S/ vs local
    expect(fullSim.netIncomeChangeVsLocal).toBe(500); // +500 S/ vs local
  });

  it('correctly compares classifications and resolves modifications consciously', () => {
    const localMap: Record<string, string> = {};
    for (let i = 1; i <= 770; i++) {
      localMap[`COMERCIO_${i}`] = i === 1 ? 'Restaurantes' : 'General';
    }

    const remoteMap: Record<string, string> = {};
    for (let i = 1; i <= 799; i++) {
      remoteMap[`COMERCIO_${i}`] = i === 1 ? 'Alimentación' : 'General';
    }

    const localRaw = JSON.stringify(localMap);
    const remoteRaw = JSON.stringify(remoteMap);

    const report = generateDiffReport('classifications', localRaw, remoteRaw);

    expect(report.remoteOnlyCount).toBe(29); // 799 - 770 = 29 cloud-only
    expect(report.localOnlyCount).toBe(0);
    expect(report.modifiedCount).toBe(1); // COMERCIO_1 differs in category
    expect(report.identicalCount).toBe(769);

    // Smart merge fails because COMERCIO_1 has differing classifications
    expect(() => computeSmartMerge('classifications', localRaw, remoteRaw)).toThrowError();

    // Assisted merge explicitly chooses remote 'Alimentación'
    const resolutions: Record<string, ItemResolution> = {
      'COMERCIO_1': { itemId: 'COMERCIO_1', type: 'use_remote' },
    };
    const assisted = computeAssistedMerge('classifications', localRaw, remoteRaw, resolutions);
    expect(assisted.totalItems).toBe(799);
    const mergedObj = JSON.parse(assisted.mergedValue);
    expect(mergedObj['COMERCIO_1']).toBe('Alimentación');
    expect(mergedObj['COMERCIO_799']).toBe('General');
  });

  it('detects changes in statements and supports assisted resolution per card', () => {
    const localStatements = {
      'card-ibk': { finalDebt: 1250.50, cutOffDate: '2026-10-21' },
      'card-ripley': { finalDebt: 800.00, cutOffDate: '2026-10-03' },
      'card-bbva': { finalDebt: 450.00, cutOffDate: '2026-10-10' },
    };

    const remoteStatements = {
      'card-ibk': { finalDebt: 1500.00, cutOffDate: '2026-10-21' }, // Different debt!
      'card-ripley': { finalDebt: 800.00, cutOffDate: '2026-10-03' },
      'card-bbva': { finalDebt: 450.00, cutOffDate: '2026-10-10' },
    };

    const report = generateDiffReport('statements', JSON.stringify(localStatements), JSON.stringify(remoteStatements));

    expect(report.modifiedCount).toBe(1);
    expect(report.identicalCount).toBe(2);

    const assisted = computeAssistedMerge(
      'statements',
      JSON.stringify(localStatements),
      JSON.stringify(remoteStatements),
      {
        'card-ibk': { itemId: 'card-ibk', type: 'use_local' },
      }
    );

    const parsed = JSON.parse(assisted.mergedValue);
    expect(parsed['card-ibk'].finalDebt).toBe(1250.50);
  });

  it('generates downloadable JSON diff backup structure with resolutions metadata', () => {
    const report = generateDiffReport('budgets', JSON.stringify({ budgets: { A: 100 } }), JSON.stringify({ budgets: { A: 200 } }));
    const resolutions: Record<string, ItemResolution> = {
      A: { itemId: 'A', type: 'use_local' },
    };
    const backup = buildDownloadableDiffBackup(
      report,
      JSON.stringify({ budgets: { A: 100 } }),
      JSON.stringify({ budgets: { A: 200 } }),
      resolutions
    );

    expect(backup.module).toBe('budgets');
    expect(backup.metrics.modifiedCount).toBe(1);
    expect(backup.resolutionsApplied).toEqual(resolutions);
    expect(backup.snapshots.local).toEqual({ budgets: { A: 100 } });
    expect(backup.snapshots.remote).toEqual({ budgets: { A: 200 } });
    expect(backup.timestamp).toBeDefined();
  });
});
