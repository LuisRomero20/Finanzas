import { describe, it, expect } from 'vitest';
import {
  generateDiffReport,
  computeSmartMerge,
  buildDownloadableDiffBackup,
} from '../sync/diffComparison';

describe('FINPER 2.0.4 — Diff Comparison & Smart Merge Domain Logic', () => {
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

    // Check field diff for Partida 0
    const item0 = report.items.find(i => i.id === 'proy-0');
    expect(item0).toBeDefined();
    expect(item0?.status).toBe('modified');
    expect(item0?.differences?.[0].fieldName).toBe('Monto');
    expect(item0?.differences?.[0].localValue).toBe('S/ 500.00');
    expect(item0?.differences?.[0].remoteValue).toBe('S/ 600.00');

    // Test smart merge: combines into 30 unique items without duplicating
    const mergeRes = computeSmartMerge('projections', localRaw, remoteRaw);
    expect(mergeRes.totalItems).toBe(30);
    const parsedMerge = JSON.parse(mergeRes.mergedValue);
    expect(parsedMerge.items).toHaveLength(30);
    expect(parsedMerge.items.find((i: any) => i.id === 'proy-0').monto).toBe(500); // local preserved
    expect(parsedMerge.items.find((i: any) => i.id === 'proy-25')).toBeDefined(); // cloud-only rescued
  });

  it('correctly compares classifications when local has 770 and cloud has 799', () => {
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

    // Smart merge retains all 799 classifications without data loss
    const mergeRes = computeSmartMerge('classifications', localRaw, remoteRaw);
    expect(mergeRes.totalItems).toBe(799);
    const mergedObj = JSON.parse(mergeRes.mergedValue);
    expect(mergedObj['COMERCIO_1']).toBe('Restaurantes'); // local preference
    expect(mergedObj['COMERCIO_799']).toBe('General'); // rescued from cloud
  });

  it('detects changes in statements even when item counts are identical (e.g. 3 vs 3)', () => {
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
    expect(report.localOnlyCount).toBe(0);
    expect(report.remoteOnlyCount).toBe(0);

    const ibkDiff = report.items.find(i => i.id === 'card-ibk');
    expect(ibkDiff?.status).toBe('modified');
    expect(ibkDiff?.differences?.[0].fieldName).toBe('Deuda final');
    expect(ibkDiff?.differences?.[0].localValue).toBe('S/ 1250.50');
    expect(ibkDiff?.differences?.[0].remoteValue).toBe('S/ 1500.00');
  });

  it('generates downloadable JSON diff backup structure', () => {
    const report = generateDiffReport('budgets', JSON.stringify({ budgets: { A: 100 } }), JSON.stringify({ budgets: { A: 200 } }));
    const backup = buildDownloadableDiffBackup(report, JSON.stringify({ budgets: { A: 100 } }), JSON.stringify({ budgets: { A: 200 } }));

    expect(backup.module).toBe('budgets');
    expect(backup.metrics.modifiedCount).toBe(1);
    expect(backup.snapshots.local).toEqual({ budgets: { A: 100 } });
    expect(backup.snapshots.remote).toEqual({ budgets: { A: 200 } });
    expect(backup.timestamp).toBeDefined();
  });
});
