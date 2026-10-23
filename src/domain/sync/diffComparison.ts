export type SyncName = 'budgets' | 'projections' | 'statements' | 'classifications';

export type DiffItemStatus = 'local_only' | 'remote_only' | 'modified' | 'identical';

export type ResolutionDecisionType = 'use_local' | 'use_remote' | 'custom';

export interface FieldDiff {
  fieldName: string;
  localValue: string | number | boolean | null;
  remoteValue: string | number | boolean | null;
}

export interface DetailedDiffItem {
  id: string;
  title: string;
  category?: string;
  secondaryInfo?: string;
  status: DiffItemStatus;
  differences?: FieldDiff[];
  localRaw?: any;
  remoteRaw?: any;
}

export interface DiffReport {
  name: SyncName;
  displayName: string;
  localTotal: number;
  remoteTotal: number;
  localOnlyCount: number;
  remoteOnlyCount: number;
  modifiedCount: number;
  identicalCount: number;
  items: DetailedDiffItem[];
  canAutoMerge: boolean;
  autoMergeSummary: string;
}

export interface ItemResolution {
  itemId: string;
  type: ResolutionDecisionType;
  customAmount?: number;
  customConcept?: string;
  customCategory?: string;
  customMonth?: string;
}

export interface MonthlyCashflowImpact {
  targetMonth: string; // 'YYYY-MM'
  localActiveIncome: number;
  remoteActiveIncome: number;
  resolvedActiveIncome: number;
  localActiveObligations: number;
  remoteActiveObligations: number;
  resolvedActiveObligations: number;
  localNetLiquidity: number;
  remoteNetLiquidity: number;
  resolvedNetLiquidity: number;
  netLiquidityDeltaVsLocal: number;
  activeItemsCount: number;
}

export interface FinancialImpactSimulation {
  // 1. Total Agregado del Catálogo (Inventario Bruto de Partidas)
  catalogTotalIncomeLocal: number;
  catalogTotalIncomeRemote: number;
  catalogTotalIncomeResolved: number;
  catalogTotalObligationsLocal: number;
  catalogTotalObligationsRemote: number;
  catalogTotalObligationsResolved: number;
  catalogNetChangeVsLocal: number;

  // Compatibilidad hacia atrás
  localTotalIncome: number;
  remoteTotalIncome: number;
  resolvedTotalIncome: number;
  localTotalObligations: number;
  remoteTotalObligations: number;
  resolvedTotalObligations: number;
  netObligationChangeVsLocal: number;
  netIncomeChangeVsLocal: number;
  totalItemsCount: number;
  unresolvedModifiedCount: number;

  // 2. Flujo de Caja Mensual Proyectado (Calculado con motor de recurrencias)
  monthlyCashflow?: MonthlyCashflowImpact;
}

const DISPLAY_NAMES: Record<SyncName, string> = {
  projections: 'Proyecciones e Ingresos Fijos',
  classifications: 'Clasificación de Movimientos',
  statements: 'Deudas regularizadas de Tarjetas',
  budgets: 'Presupuestos por Categoría',
};

function normStr(v: unknown): string {
  return String(v ?? '').trim().toLowerCase();
}

/**
 * Genera un reporte comparativo exhaustivo elemento por elemento.
 * No asume que elementos con el mismo concepto y mes son duplicados si tienen IDs distintos.
 */
export function generateDiffReport(
  name: SyncName,
  localRawStr: string,
  remoteRawStr: string,
): DiffReport {
  const displayName = DISPLAY_NAMES[name] || name;

  let localParsed: any = {};
  let remoteParsed: any = {};

  try {
    localParsed = localRawStr ? JSON.parse(localRawStr) : {};
  } catch {
    localParsed = {};
  }

  try {
    remoteParsed = remoteRawStr ? JSON.parse(remoteRawStr) : {};
  } catch {
    remoteParsed = {};
  }

  const items: DetailedDiffItem[] = [];

  // ============================================================================
  // CASO 1: PROYECCIONES
  // ============================================================================
  if (name === 'projections') {
    const localItems: any[] = Array.isArray(localParsed?.items) ? localParsed.items : [];
    const remoteItems: any[] = Array.isArray(remoteParsed?.items) ? remoteParsed.items : [];

    const localMap = new Map<string, any>();
    const remoteMap = new Map<string, any>();

    // Indexar por ID estricto para no colapsar pagos legítimos con igual concepto/mes
    for (let i = 0; i < localItems.length; i++) {
      const item = localItems[i];
      const key = item.id ? String(item.id) : `loc-idx-${i}__${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}`;
      localMap.set(key, item);
    }

    for (let i = 0; i < remoteItems.length; i++) {
      const item = remoteItems[i];
      const key = item.id ? String(item.id) : `rem-idx-${i}__${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}`;
      remoteMap.set(key, item);
    }

    const allKeys = new Set([...localMap.keys(), ...remoteMap.keys()]);

    for (const key of allKeys) {
      const loc = localMap.get(key);
      const rem = remoteMap.get(key);

      if (loc && !rem) {
        items.push({
          id: key,
          title: loc.concepto || 'Partida sin concepto',
          category: loc.categoria,
          secondaryInfo: `${loc.tipo || 'Egreso'} · S/ ${Number(loc.monto || 0).toFixed(2)}${loc.mes ? ` · ${loc.mes}` : ''}`,
          status: 'local_only',
          localRaw: loc,
        });
      } else if (!loc && rem) {
        items.push({
          id: key,
          title: rem.concepto || 'Partida sin concepto',
          category: rem.categoria,
          secondaryInfo: `${rem.tipo || 'Egreso'} · S/ ${Number(rem.monto || 0).toFixed(2)}${rem.mes ? ` · ${rem.mes}` : ''}`,
          status: 'remote_only',
          remoteRaw: rem,
        });
      } else if (loc && rem) {
        const diffs: FieldDiff[] = [];

        if (Number(loc.monto) !== Number(rem.monto)) {
          diffs.push({
            fieldName: 'Monto',
            localValue: `S/ ${Number(loc.monto).toFixed(2)}`,
            remoteValue: `S/ ${Number(rem.monto).toFixed(2)}`,
          });
        }
        if (normStr(loc.concepto) !== normStr(rem.concepto)) {
          diffs.push({
            fieldName: 'Concepto',
            localValue: loc.concepto,
            remoteValue: rem.concepto,
          });
        }
        if (normStr(loc.categoria) !== normStr(rem.categoria)) {
          diffs.push({
            fieldName: 'Categoría',
            localValue: loc.categoria,
            remoteValue: rem.categoria,
          });
        }
        if (normStr(loc.tipo) !== normStr(rem.tipo)) {
          diffs.push({
            fieldName: 'Tipo',
            localValue: loc.tipo,
            remoteValue: rem.tipo,
          });
        }
        if (normStr(loc.mes) !== normStr(rem.mes)) {
          diffs.push({
            fieldName: 'Mes',
            localValue: loc.mes || '(no asignado)',
            remoteValue: rem.mes || '(no asignado)',
          });
        }

        if (diffs.length > 0) {
          items.push({
            id: key,
            title: loc.concepto || rem.concepto,
            category: loc.categoria || rem.categoria,
            secondaryInfo: `${diffs.length} campo(s) con valores distintos`,
            status: 'modified',
            differences: diffs,
            localRaw: loc,
            remoteRaw: rem,
          });
        } else {
          items.push({
            id: key,
            title: loc.concepto,
            category: loc.categoria,
            secondaryInfo: `S/ ${Number(loc.monto).toFixed(2)} · Idéntico en ambos`,
            status: 'identical',
            localRaw: loc,
            remoteRaw: rem,
          });
        }
      }
    }

    // Comparar escenarios de probabilidad de sueldo
    const localProb = localParsed?.probabilidadSueldoPorMes || {};
    const remoteProb = remoteParsed?.probabilidadSueldoPorMes || {};
    const allProbMonths = new Set([...Object.keys(localProb), ...Object.keys(remoteProb)]);
    const probDiffs: FieldDiff[] = [];

    for (const m of allProbMonths) {
      if (localProb[m] !== remoteProb[m]) {
        probDiffs.push({
          fieldName: `Probabilidad ${m}`,
          localValue: localProb[m] !== undefined ? `${localProb[m]}%` : '(no definido)',
          remoteValue: remoteProb[m] !== undefined ? `${remoteProb[m]}%` : '(no definido)',
        });
      }
    }

    if (probDiffs.length > 0) {
      items.push({
        id: '__salary_probability_scenarios__',
        title: 'Escenarios de Probabilidad de Sueldo',
        secondaryInfo: `${probDiffs.length} mes(es) con probabilidades distintas`,
        status: 'modified',
        differences: probDiffs,
        localRaw: localProb,
        remoteRaw: remoteProb,
      });
    }
  }

  // ============================================================================
  // CASO 2: CLASIFICACIONES
  // ============================================================================
  else if (name === 'classifications') {
    const localMap: Record<string, string> = localParsed && typeof localParsed === 'object' ? localParsed : {};
    const remoteMap: Record<string, string> = remoteParsed && typeof remoteParsed === 'object' ? remoteParsed : {};

    const allKeys = new Set([...Object.keys(localMap), ...Object.keys(remoteMap)]);

    for (const key of allKeys) {
      const locCat = localMap[key];
      const remCat = remoteMap[key];

      if (locCat && !remCat) {
        items.push({
          id: key,
          title: key,
          category: locCat,
          secondaryInfo: `Categoría local: ${locCat}`,
          status: 'local_only',
          localRaw: locCat,
        });
      } else if (!locCat && remCat) {
        items.push({
          id: key,
          title: key,
          category: remCat,
          secondaryInfo: `Categoría nube: ${remCat}`,
          status: 'remote_only',
          remoteRaw: remCat,
        });
      } else if (locCat && remCat) {
        if (locCat !== remCat) {
          items.push({
            id: key,
            title: key,
            category: `${locCat} vs ${remCat}`,
            secondaryInfo: 'Difiere la categoría asignada',
            status: 'modified',
            differences: [
              {
                fieldName: 'Categoría',
                localValue: locCat,
                remoteValue: remCat,
              },
            ],
            localRaw: locCat,
            remoteRaw: remCat,
          });
        } else {
          items.push({
            id: key,
            title: key,
            category: locCat,
            secondaryInfo: 'Categoría coincidente',
            status: 'identical',
            localRaw: locCat,
            remoteRaw: remCat,
          });
        }
      }
    }
  }

  // ============================================================================
  // CASO 3: DEUDAS REGULARIZADAS (STATEMENTS)
  // ============================================================================
  else if (name === 'statements') {
    const localMap: Record<string, any> = localParsed && typeof localParsed === 'object' ? localParsed : {};
    const remoteMap: Record<string, any> = remoteParsed && typeof remoteParsed === 'object' ? remoteParsed : {};

    const allKeys = new Set([...Object.keys(localMap), ...Object.keys(remoteMap)]);

    for (const key of allKeys) {
      const loc = localMap[key];
      const rem = remoteMap[key];

      if (loc && !rem) {
        items.push({
          id: key,
          title: key,
          secondaryInfo: `Saldo deudor local: S/ ${Number(loc.finalDebt || 0).toFixed(2)}`,
          status: 'local_only',
          localRaw: loc,
        });
      } else if (!loc && rem) {
        items.push({
          id: key,
          title: key,
          secondaryInfo: `Saldo deudor nube: S/ ${Number(rem.finalDebt || 0).toFixed(2)}`,
          status: 'remote_only',
          remoteRaw: rem,
        });
      } else if (loc && rem) {
        const diffs: FieldDiff[] = [];
        if (Number(loc.finalDebt) !== Number(rem.finalDebt)) {
          diffs.push({
            fieldName: 'Deuda final',
            localValue: `S/ ${Number(loc.finalDebt || 0).toFixed(2)}`,
            remoteValue: `S/ ${Number(rem.finalDebt || 0).toFixed(2)}`,
          });
        }
        if (normStr(loc.cutOffDate) !== normStr(rem.cutOffDate)) {
          diffs.push({
            fieldName: 'Fecha de corte',
            localValue: loc.cutOffDate || '(vacío)',
            remoteValue: rem.cutOffDate || '(vacío)',
          });
        }
        if (normStr(loc.dueDate) !== normStr(rem.dueDate)) {
          diffs.push({
            fieldName: 'Fecha de pago',
            localValue: loc.dueDate || '(vacío)',
            remoteValue: rem.dueDate || '(vacío)',
          });
        }

        if (diffs.length > 0) {
          items.push({
            id: key,
            title: key,
            secondaryInfo: `${diffs.length} diferencia(s) en regularización`,
            status: 'modified',
            differences: diffs,
            localRaw: loc,
            remoteRaw: rem,
          });
        } else {
          items.push({
            id: key,
            title: key,
            secondaryInfo: `S/ ${Number(loc.finalDebt || 0).toFixed(2)} · Coincidente`,
            status: 'identical',
            localRaw: loc,
            remoteRaw: rem,
          });
        }
      }
    }
  }

  // ============================================================================
  // CASO 4: PRESUPUESTOS (BUDGETS)
  // ============================================================================
  else if (name === 'budgets') {
    const localBudgets = localParsed?.budgets || {};
    const remoteBudgets = remoteParsed?.budgets || {};
    const localModes = localParsed?.budgetModes || {};
    const remoteModes = remoteParsed?.budgetModes || {};

    const allCats = new Set([...Object.keys(localBudgets), ...Object.keys(remoteBudgets)]);

    for (const cat of allCats) {
      const locLimit = localBudgets[cat];
      const remLimit = remoteBudgets[cat];
      const locMode = localModes[cat] || 'manual';
      const remMode = remoteModes[cat] || 'manual';

      if (locLimit !== undefined && remLimit === undefined) {
        items.push({
          id: cat,
          title: cat,
          secondaryInfo: `Límite local: S/ ${Number(locLimit).toFixed(2)} (${locMode})`,
          status: 'local_only',
          localRaw: { limit: locLimit, mode: locMode },
        });
      } else if (locLimit === undefined && remLimit !== undefined) {
        items.push({
          id: cat,
          title: cat,
          secondaryInfo: `Límite nube: S/ ${Number(remLimit).toFixed(2)} (${remMode})`,
          status: 'remote_only',
          remoteRaw: { limit: remLimit, mode: remMode },
        });
      } else if (locLimit !== undefined && remLimit !== undefined) {
        const diffs: FieldDiff[] = [];
        if (Number(locLimit) !== Number(remLimit)) {
          diffs.push({
            fieldName: 'Límite presupuestario',
            localValue: `S/ ${Number(locLimit).toFixed(2)}`,
            remoteValue: `S/ ${Number(remLimit).toFixed(2)}`,
          });
        }
        if (locMode !== remMode) {
          diffs.push({
            fieldName: 'Modo de cálculo',
            localValue: locMode,
            remoteValue: remMode,
          });
        }

        if (diffs.length > 0) {
          items.push({
            id: cat,
            title: cat,
            secondaryInfo: `${diffs.length} diferencia(s) en presupuesto`,
            status: 'modified',
            differences: diffs,
            localRaw: { limit: locLimit, mode: locMode },
            remoteRaw: { limit: remLimit, mode: remMode },
          });
        } else {
          items.push({
            id: cat,
            title: cat,
            secondaryInfo: `S/ ${Number(locLimit).toFixed(2)} · Coincidente`,
            status: 'identical',
            localRaw: { limit: locLimit, mode: locMode },
            remoteRaw: { limit: remLimit, mode: remMode },
          });
        }
      }
    }
  }

  const orderWeight: Record<DiffItemStatus, number> = {
    modified: 0,
    local_only: 1,
    remote_only: 2,
    identical: 3,
  };

  items.sort((a, b) => {
    const diff = orderWeight[a.status] - orderWeight[b.status];
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });

  const localOnlyCount = items.filter(i => i.status === 'local_only').length;
  const remoteOnlyCount = items.filter(i => i.status === 'remote_only').length;
  const modifiedCount = items.filter(i => i.status === 'modified').length;
  const identicalCount = items.filter(i => i.status === 'identical').length;

  const localTotal = localOnlyCount + modifiedCount + identicalCount;
  const remoteTotal = remoteOnlyCount + modifiedCount + identicalCount;

  // Solo se permite auto-merge cuando modifiedCount === 0 (cero conflictos de contenido)
  const canAutoMerge = modifiedCount === 0;
  let autoMergeSummary = '';

  if (canAutoMerge && (localOnlyCount > 0 || remoteOnlyCount > 0)) {
    autoMergeSummary = `Fusión no conflictiva disponible: se integran ${localOnlyCount} registros de PC y ${remoteOnlyCount} de la nube sin colisiones.`;
  } else if (modifiedCount > 0) {
    autoMergeSummary = `Fusión asistida requerida: existen ${modifiedCount} registros con importes o campos diferentes. Debes elegir o editar el valor de cada uno.`;
  } else {
    autoMergeSummary = 'Las versiones son idénticas en contenido.';
  }

  return {
    name,
    displayName,
    localTotal,
    remoteTotal,
    localOnlyCount,
    remoteOnlyCount,
    modifiedCount,
    identicalCount,
    items,
    canAutoMerge,
    autoMergeSummary,
  };
}

/**
 * Evalúa si una partida proyectada está activa en un mes específico y calcula su importe
 * efectivo aplicando el motor financiero de recurrencias (fijo, temporal, único), mes de inicio,
 * excepciones de supresión/modificación y escenarios de probabilidad de sueldo.
 */
export function evaluateProjectedItemInMonth(
  item: any,
  targetMonthStr: string,
  salaryProbMap?: Record<string, number>,
): { isActive: boolean; effectiveAmount: number; tipo: 'Ingreso' | 'Egreso' } {
  if (!item) return { isActive: false, effectiveAmount: 0, tipo: 'Egreso' };

  const tipo: 'Ingreso' | 'Egreso' = item.tipo === 'Ingreso' ? 'Ingreso' : 'Egreso';
  const startMonthStr = item.mesInicio || item.mes || targetMonthStr;

  const [startYear, startMonth] = String(startMonthStr).split('-').map(Number);
  const [targetYear, targetMonth] = String(targetMonthStr).split('-').map(Number);

  if (!startYear || !startMonth || !targetYear || !targetMonth) {
    return { isActive: true, effectiveAmount: Number(item.monto || 0), tipo };
  }

  const startDateVal = startYear * 12 + (startMonth - 1);
  const targetDateVal = targetYear * 12 + (targetMonth - 1);

  // Si el mes objetivo es anterior al mes de inicio de la partida, no aplica
  if (targetDateVal < startDateVal) {
    return { isActive: false, effectiveAmount: 0, tipo };
  }

  const monthsDiff = targetDateVal - startDateVal;

  // Reglas de recurrencia
  const rec = item.recurrencia || 'fijo';
  if (rec === 'unico' && monthsDiff !== 0) {
    return { isActive: false, effectiveAmount: 0, tipo };
  }
  if (rec === 'temporal') {
    const dur = Number(item.mesesDuracion || 1);
    if (monthsDiff >= dur) {
      return { isActive: false, effectiveAmount: 0, tipo };
    }
  }

  // Reglas de excepciones en el mes objetivo
  const exc = item.excepciones?.[targetMonthStr];
  if (exc?.suprimido) {
    return { isActive: false, effectiveAmount: 0, tipo };
  }

  let effectiveAmount = exc?.montoModificado !== undefined ? Number(exc.montoModificado) : Number(item.monto || 0);

  // Escenario de probabilidad de sueldo para el mes objetivo
  if (salaryProbMap && salaryProbMap[targetMonthStr] !== undefined && /sueldo/i.test(item.concepto || '')) {
    const val = Number(salaryProbMap[targetMonthStr]);
    if (val <= 100) {
      effectiveAmount = Math.round((effectiveAmount * (val / 100)) * 100) / 100;
    } else {
      effectiveAmount = val;
    }
  }

  return { isActive: true, effectiveAmount, tipo };
}

/**
 * Simula el impacto financiero de las decisiones tomadas en la conciliación.
 * Diferencia explícitamente:
 * 1. Total Agregado del Catálogo (Inventario estático de todas las partidas registradas).
 * 2. Flujo de Caja Mensual Proyectado (Calculado con motor de recurrencias, meses de vigencia y excepciones).
 */
export function simulateReconciliationImpact(
  name: SyncName,
  localRawStr: string,
  remoteRawStr: string,
  resolutions: Record<string, ItemResolution>,
  targetMonthStr?: string,
): FinancialImpactSimulation {
  const report = generateDiffReport(name, localRawStr, remoteRawStr);

  let localTotalIncome = 0;
  let remoteTotalIncome = 0;
  let resolvedTotalIncome = 0;

  let localTotalObligations = 0;
  let remoteTotalObligations = 0;
  let resolvedTotalObligations = 0;

  let unresolvedModifiedCount = 0;

  const activeMonth = targetMonthStr || '2026-10';
  let localActiveIncome = 0;
  let remoteActiveIncome = 0;
  let resolvedActiveIncome = 0;
  let localActiveObligations = 0;
  let remoteActiveObligations = 0;
  let resolvedActiveObligations = 0;
  let activeItemsCount = 0;

  let localParsed: any = {};
  let remoteParsed: any = {};
  try { localParsed = JSON.parse(localRawStr); } catch {}
  try { remoteParsed = JSON.parse(remoteRawStr); } catch {}

  const localProb = localParsed?.probabilidadSueldoPorMes || {};
  const remoteProb = remoteParsed?.probabilidadSueldoPorMes || {};

  if (name === 'projections') {
    for (const item of report.items) {
      if (item.id === '__salary_probability_scenarios__') continue;

      const locMonto = Number(item.localRaw?.monto || 0);
      const remMonto = Number(item.remoteRaw?.monto || 0);
      const isIncomeLoc = item.localRaw?.tipo === 'Ingreso';
      const isIncomeRem = item.remoteRaw?.tipo === 'Ingreso';

      const locMonthly = evaluateProjectedItemInMonth(item.localRaw, activeMonth, localProb);
      const remMonthly = evaluateProjectedItemInMonth(item.remoteRaw, activeMonth, remoteProb);

      if (locMonthly.isActive) {
        if (locMonthly.tipo === 'Ingreso') localActiveIncome += locMonthly.effectiveAmount;
        else localActiveObligations += locMonthly.effectiveAmount;
      }
      if (remMonthly.isActive) {
        if (remMonthly.tipo === 'Ingreso') remoteActiveIncome += remMonthly.effectiveAmount;
        else remoteActiveObligations += remMonthly.effectiveAmount;
      }

      if (item.status === 'local_only') {
        if (isIncomeLoc) {
          localTotalIncome += locMonto;
          resolvedTotalIncome += locMonto;
        } else {
          localTotalObligations += locMonto;
          resolvedTotalObligations += locMonto;
        }
        if (locMonthly.isActive) {
          activeItemsCount++;
          if (locMonthly.tipo === 'Ingreso') resolvedActiveIncome += locMonthly.effectiveAmount;
          else resolvedActiveObligations += locMonthly.effectiveAmount;
        }
      } else if (item.status === 'remote_only') {
        if (isIncomeRem) {
          remoteTotalIncome += remMonto;
          resolvedTotalIncome += remMonto;
        } else {
          remoteTotalObligations += remMonto;
          resolvedTotalObligations += remMonto;
        }
        if (remMonthly.isActive) {
          activeItemsCount++;
          if (remMonthly.tipo === 'Ingreso') resolvedActiveIncome += remMonthly.effectiveAmount;
          else resolvedActiveObligations += remMonthly.effectiveAmount;
        }
      } else if (item.status === 'identical') {
        if (isIncomeLoc) {
          localTotalIncome += locMonto;
          remoteTotalIncome += locMonto;
          resolvedTotalIncome += locMonto;
        } else {
          localTotalObligations += locMonto;
          remoteTotalObligations += locMonto;
          resolvedTotalObligations += locMonto;
        }
        if (locMonthly.isActive) {
          activeItemsCount++;
          if (locMonthly.tipo === 'Ingreso') resolvedActiveIncome += locMonthly.effectiveAmount;
          else resolvedActiveObligations += locMonthly.effectiveAmount;
        }
      } else if (item.status === 'modified') {
        if (isIncomeLoc) localTotalIncome += locMonto;
        else localTotalObligations += locMonto;

        if (isIncomeRem) remoteTotalIncome += remMonto;
        else remoteTotalObligations += remMonto;

        const decision = resolutions[item.id];
        if (!decision) {
          unresolvedModifiedCount++;
          // Si no está resuelto, reflejar local provisionalmente
          if (isIncomeLoc) resolvedTotalIncome += locMonto;
          else resolvedTotalObligations += locMonto;
          if (locMonthly.isActive) {
            activeItemsCount++;
            if (locMonthly.tipo === 'Ingreso') resolvedActiveIncome += locMonthly.effectiveAmount;
            else resolvedActiveObligations += locMonthly.effectiveAmount;
          }
        } else if (decision.type === 'use_local') {
          if (isIncomeLoc) resolvedTotalIncome += locMonto;
          else resolvedTotalObligations += locMonto;
          if (locMonthly.isActive) {
            activeItemsCount++;
            if (locMonthly.tipo === 'Ingreso') resolvedActiveIncome += locMonthly.effectiveAmount;
            else resolvedActiveObligations += locMonthly.effectiveAmount;
          }
        } else if (decision.type === 'use_remote') {
          if (isIncomeRem) resolvedTotalIncome += remMonto;
          else resolvedTotalObligations += remMonto;
          if (remMonthly.isActive) {
            activeItemsCount++;
            if (remMonthly.tipo === 'Ingreso') resolvedActiveIncome += remMonthly.effectiveAmount;
            else resolvedActiveObligations += remMonthly.effectiveAmount;
          }
        } else if (decision.type === 'custom') {
          const customVal = Number(decision.customAmount ?? locMonto);
          const isCustomIncome = (decision.customConcept ?? item.localRaw?.tipo) === 'Ingreso' || isIncomeLoc;
          if (isCustomIncome) resolvedTotalIncome += customVal;
          else resolvedTotalObligations += customVal;

          const base = item.localRaw || item.remoteRaw;
          const customItem = { ...base, monto: customVal };
          const customMonthly = evaluateProjectedItemInMonth(customItem, activeMonth, localProb);
          if (customMonthly.isActive) {
            activeItemsCount++;
            if (customMonthly.tipo === 'Ingreso') resolvedActiveIncome += customMonthly.effectiveAmount;
            else resolvedActiveObligations += customMonthly.effectiveAmount;
          }
        }
      }
    }
  }

  const monthlyCashflow: MonthlyCashflowImpact | undefined = name === 'projections' ? {
    targetMonth: activeMonth,
    localActiveIncome: Math.round(localActiveIncome * 100) / 100,
    remoteActiveIncome: Math.round(remoteActiveIncome * 100) / 100,
    resolvedActiveIncome: Math.round(resolvedActiveIncome * 100) / 100,
    localActiveObligations: Math.round(localActiveObligations * 100) / 100,
    remoteActiveObligations: Math.round(remoteActiveObligations * 100) / 100,
    resolvedActiveObligations: Math.round(resolvedActiveObligations * 100) / 100,
    localNetLiquidity: Math.round((localActiveIncome - localActiveObligations) * 100) / 100,
    remoteNetLiquidity: Math.round((remoteActiveIncome - remoteActiveObligations) * 100) / 100,
    resolvedNetLiquidity: Math.round((resolvedActiveIncome - resolvedActiveObligations) * 100) / 100,
    netLiquidityDeltaVsLocal: Math.round(((resolvedActiveIncome - resolvedActiveObligations) - (localActiveIncome - localActiveObligations)) * 100) / 100,
    activeItemsCount,
  } : undefined;

  return {
    catalogTotalIncomeLocal: Math.round(localTotalIncome * 100) / 100,
    catalogTotalIncomeRemote: Math.round(remoteTotalIncome * 100) / 100,
    catalogTotalIncomeResolved: Math.round(resolvedTotalIncome * 100) / 100,
    catalogTotalObligationsLocal: Math.round(localTotalObligations * 100) / 100,
    catalogTotalObligationsRemote: Math.round(remoteTotalObligations * 100) / 100,
    catalogTotalObligationsResolved: Math.round(resolvedTotalObligations * 100) / 100,
    catalogNetChangeVsLocal: Math.round((resolvedTotalObligations - localTotalObligations) * 100) / 100,

    localTotalIncome: Math.round(localTotalIncome * 100) / 100,
    remoteTotalIncome: Math.round(remoteTotalIncome * 100) / 100,
    resolvedTotalIncome: Math.round(resolvedTotalIncome * 100) / 100,
    localTotalObligations: Math.round(localTotalObligations * 100) / 100,
    remoteTotalObligations: Math.round(remoteTotalObligations * 100) / 100,
    resolvedTotalObligations: Math.round(resolvedTotalObligations * 100) / 100,
    netObligationChangeVsLocal: Math.round((resolvedTotalObligations - localTotalObligations) * 100) / 100,
    netIncomeChangeVsLocal: Math.round((resolvedTotalIncome - localTotalIncome) * 100) / 100,
    totalItemsCount: report.items.length,
    unresolvedModifiedCount,
    monthlyCashflow,
  };
}

/**
 * Ejecuta la FUSIÓN ASISTIDA:
 * 1. Exige que todo registro con diferencias tenga una decisión explícita (use_local, use_remote o custom).
 * 2. Si hay diferencias en escenarios de probabilidad de sueldo, EXIGE decisión explícita sin default implícito.
 * 3. NUNCA sobrescribe automáticamente un importe financiero modificado.
 * 4. Preserva íntegramente los campos no visibles de los snapshots originales.
 * 5. No deduplica falsamente pagos legítimos con igual concepto y mes pero distinto ID.
 */
export function computeAssistedMerge(
  name: SyncName,
  localRawStr: string,
  remoteRawStr: string,
  resolutions: Record<string, ItemResolution>,
  salaryProbabilityResolution?: 'use_local' | 'use_remote',
  targetMonthStr?: string,
): { mergedValue: string; summary: string; totalItems: number; simulation: FinancialImpactSimulation } {
  const report = generateDiffReport(name, localRawStr, remoteRawStr);

  const hasSalaryProbDiff = report.items.some(i => i.id === '__salary_probability_scenarios__');
  const probDecision = resolutions['__salary_probability_scenarios__']?.type || salaryProbabilityResolution;

  // 1. Exigir decisión explícita si los escenarios de probabilidad de sueldo difieren (cero default implícito)
  if (hasSalaryProbDiff && !probDecision) {
    throw new Error(
      `Conciliación asistida incompleta: los escenarios de probabilidad de sueldo difieren y requieren una decisión explícita ('use_local' o 'use_remote').`
    );
  }

  // 2. Verificar que ninguna partida modificada quede sin decisión
  const unresolved = report.items.filter(i => {
    if (i.id === '__salary_probability_scenarios__') {
      return !probDecision;
    }
    return i.status === 'modified' && !resolutions[i.id];
  });
  if (unresolved.length > 0) {
    const names = unresolved.map(u => `"${u.title}"`).join(', ');
    throw new Error(`Conciliación asistida incompleta: hay ${unresolved.length} registro(s) modificado(s) sin decisión explícita (${names}). Elige Local, Nube o edita su valor.`);
  }

  const localParsed = localRawStr ? JSON.parse(localRawStr) : {};
  const remoteParsed = remoteRawStr ? JSON.parse(remoteRawStr) : {};

  // 1. Proyecciones
  if (name === 'projections') {
    const localItems: any[] = Array.isArray(localParsed?.items) ? localParsed.items : [];
    const remoteItems: any[] = Array.isArray(remoteParsed?.items) ? remoteParsed.items : [];

    const localMap = new Map<string, any>();
    const remoteMap = new Map<string, any>();

    for (let i = 0; i < localItems.length; i++) {
      const item = localItems[i];
      const key = item.id ? String(item.id) : `loc-idx-${i}__${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}`;
      localMap.set(key, item);
    }

    for (let i = 0; i < remoteItems.length; i++) {
      const item = remoteItems[i];
      const key = item.id ? String(item.id) : `rem-idx-${i}__${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}`;
      remoteMap.set(key, item);
    }

    const mergedList: any[] = [];
    const processedKeys = new Set<string>();

    for (const item of report.items) {
      if (item.id === '__salary_probability_scenarios__') continue;
      processedKeys.add(item.id);

      const loc = localMap.get(item.id);
      const rem = remoteMap.get(item.id);

      if (item.status === 'local_only' && loc) {
        // Preserva el objeto local original íntegro
        mergedList.push({ ...loc });
      } else if (item.status === 'remote_only' && rem) {
        // Preserva el objeto remoto original íntegro
        mergedList.push({ ...rem });
      } else if (item.status === 'identical' && loc) {
        mergedList.push({ ...loc });
      } else if (item.status === 'modified') {
        const decision = resolutions[item.id];
        if (decision.type === 'use_local' && loc) {
          mergedList.push({ ...loc });
        } else if (decision.type === 'use_remote' && rem) {
          mergedList.push({ ...rem });
        } else if (decision.type === 'custom') {
          const base = loc || rem;
          mergedList.push({
            ...base,
            monto: decision.customAmount !== undefined ? Number(decision.customAmount) : base.monto,
            concepto: decision.customConcept !== undefined ? decision.customConcept : base.concepto,
            categoria: decision.customCategory !== undefined ? decision.customCategory : base.categoria,
            mes: decision.customMonth !== undefined ? decision.customMonth : base.mes,
          });
        }
      }
    }

    // Fusión de escenarios de probabilidad de sueldo según decisión explícita
    let resolvedProb = { ...(localParsed?.probabilidadSueldoPorMes || {}) };
    if (hasSalaryProbDiff) {
      if (probDecision === 'use_remote') {
        resolvedProb = { ...(remoteParsed?.probabilidadSueldoPorMes || {}) };
      } else if (probDecision === 'use_local') {
        resolvedProb = { ...(localParsed?.probabilidadSueldoPorMes || {}) };
      }
    } else {
      resolvedProb = { ...(remoteParsed?.probabilidadSueldoPorMes || {}), ...(localParsed?.probabilidadSueldoPorMes || {}) };
    }

    const resultObj = {
      items: mergedList,
      probabilidadSueldoPorMes: resolvedProb,
    };

    const simulation = simulateReconciliationImpact(name, localRawStr, remoteRawStr, resolutions, targetMonthStr);

    return {
      mergedValue: JSON.stringify(resultObj),
      summary: `${mergedList.length} partidas conciliadas con resolución asistida consciente`,
      totalItems: mergedList.length,
      simulation,
    };
  }

  // 2. Clasificaciones
  if (name === 'classifications') {
    const localMap: Record<string, string> = localParsed && typeof localParsed === 'object' ? localParsed : {};
    const remoteMap: Record<string, string> = remoteParsed && typeof remoteParsed === 'object' ? remoteParsed : {};

    const merged: Record<string, string> = { ...remoteMap, ...localMap };

    for (const item of report.items) {
      if (item.status === 'modified') {
        const decision = resolutions[item.id];
        if (decision.type === 'use_remote') {
          merged[item.id] = remoteMap[item.id];
        } else if (decision.type === 'custom' && decision.customCategory) {
          merged[item.id] = decision.customCategory;
        } else {
          merged[item.id] = localMap[item.id];
        }
      }
    }

    const count = Object.keys(merged).length;
    return {
      mergedValue: JSON.stringify(merged),
      summary: `${count} clasificaciones conciliadas con resolución consciente`,
      totalItems: count,
      simulation: {
        localTotalIncome: 0,
        remoteTotalIncome: 0,
        resolvedTotalIncome: 0,
        localTotalObligations: 0,
        remoteTotalObligations: 0,
        resolvedTotalObligations: 0,
        netObligationChangeVsLocal: 0,
        netIncomeChangeVsLocal: 0,
        totalItemsCount: count,
        unresolvedModifiedCount: 0,
      },
    };
  }

  // 3. Deudas regularizadas (Statements)
  if (name === 'statements') {
    const localMap: Record<string, any> = localParsed && typeof localParsed === 'object' ? localParsed : {};
    const remoteMap: Record<string, any> = remoteParsed && typeof remoteParsed === 'object' ? remoteParsed : {};

    const merged: Record<string, any> = { ...remoteMap, ...localMap };

    for (const item of report.items) {
      if (item.status === 'modified') {
        const decision = resolutions[item.id];
        if (decision.type === 'use_remote') {
          merged[item.id] = { ...remoteMap[item.id] };
        } else if (decision.type === 'custom') {
          merged[item.id] = {
            ...localMap[item.id],
            finalDebt: decision.customAmount !== undefined ? Number(decision.customAmount) : localMap[item.id].finalDebt,
          };
        } else {
          merged[item.id] = { ...localMap[item.id] };
        }
      }
    }

    const count = Object.keys(merged).length;
    return {
      mergedValue: JSON.stringify(merged),
      summary: `${count} regularizaciones conciliadas con resolución consciente`,
      totalItems: count,
      simulation: {
        localTotalIncome: 0,
        remoteTotalIncome: 0,
        resolvedTotalIncome: 0,
        localTotalObligations: 0,
        remoteTotalObligations: 0,
        resolvedTotalObligations: 0,
        netObligationChangeVsLocal: 0,
        netIncomeChangeVsLocal: 0,
        totalItemsCount: count,
        unresolvedModifiedCount: 0,
      },
    };
  }

  // 4. Presupuestos (Budgets)
  const localBudgets = localParsed?.budgets || {};
  const remoteBudgets = remoteParsed?.budgets || {};
  const localModes = localParsed?.budgetModes || {};
  const remoteModes = remoteParsed?.budgetModes || {};

  const mergedBudgets = { ...remoteBudgets, ...localBudgets };
  const mergedModes = { ...remoteModes, ...localModes };

  for (const item of report.items) {
    if (item.status === 'modified') {
      const decision = resolutions[item.id];
      if (decision.type === 'use_remote') {
        mergedBudgets[item.id] = remoteBudgets[item.id];
        mergedModes[item.id] = remoteModes[item.id];
      } else if (decision.type === 'custom') {
        if (decision.customAmount !== undefined) mergedBudgets[item.id] = Number(decision.customAmount);
        if (decision.customCategory) mergedModes[item.id] = decision.customCategory;
      }
    }
  }

  const count = Object.keys(mergedBudgets).length;
  return {
    mergedValue: JSON.stringify({ budgets: mergedBudgets, budgetModes: mergedModes }),
    summary: `${count} presupuestos conciliados con resolución consciente`,
    totalItems: count,
    simulation: {
      localTotalIncome: 0,
      remoteTotalIncome: 0,
      resolvedTotalIncome: 0,
      localTotalObligations: 0,
      remoteTotalObligations: 0,
      resolvedTotalObligations: 0,
      netObligationChangeVsLocal: 0,
      netIncomeChangeVsLocal: 0,
      totalItemsCount: count,
      unresolvedModifiedCount: 0,
    },
  };
}

/**
 * Fusión automática segura: SOLO permitida si modifiedCount === 0.
 * Si existen registros modificados, arroja excepción para forzar la conciliación asistida.
 */
export function computeSmartMerge(
  name: SyncName,
  localRawStr: string,
  remoteRawStr: string,
): { mergedValue: string; summary: string; totalItems: number } {
  const report = generateDiffReport(name, localRawStr, remoteRawStr);

  if (report.modifiedCount > 0) {
    throw new Error(
      `Fusión automática rechazada por seguridad: existen ${report.modifiedCount} partidas modificadas con importes diferentes. Utiliza la Fusión Asistida para elegir o editar el valor de cada una.`
    );
  }

  // Si no hay registros modificados, todos los ítems son o idénticos o exclusivos de un lado.
  // Es demostrablemente seguro unirlos.
  const emptyResolutions: Record<string, ItemResolution> = {};
  const result = computeAssistedMerge(name, localRawStr, remoteRawStr, emptyResolutions);
  return {
    mergedValue: result.mergedValue,
    summary: result.summary,
    totalItems: result.totalItems,
  };
}

/**
 * Prepara el objeto de respaldo completo con todas las versiones y metadatos.
 */
export function buildDownloadableDiffBackup(
  report: DiffReport,
  localRaw: string,
  remoteRaw: string,
  resolutions?: Record<string, ItemResolution>,
) {
  return {
    timestamp: new Date().toISOString(),
    module: report.name,
    displayName: report.displayName,
    metrics: {
      localTotal: report.localTotal,
      remoteTotal: report.remoteTotal,
      localOnlyCount: report.localOnlyCount,
      remoteOnlyCount: report.remoteOnlyCount,
      modifiedCount: report.modifiedCount,
      identicalCount: report.identicalCount,
    },
    resolutionsApplied: resolutions || null,
    diffItems: report.items,
    snapshots: {
      local: localRaw ? JSON.parse(localRaw) : null,
      remote: remoteRaw ? JSON.parse(remoteRaw) : null,
    },
  };
}
