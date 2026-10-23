export type SyncName = 'budgets' | 'projections' | 'statements' | 'classifications';

export type DiffItemStatus = 'local_only' | 'remote_only' | 'modified' | 'identical';

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
  canSmartMerge: boolean;
  smartMergeSummary: string;
}

const DISPLAY_NAMES: Record<SyncName, string> = {
  projections: 'Proyecciones e Ingresos Fijos',
  classifications: 'Clasificación de Movimientos',
  statements: 'Deudas regularizadas de Tarjetas',
  budgets: 'Presupuestos por Categoría',
};

/**
 * Normaliza textos para comparaciones seguras de cadenas.
 */
function normStr(v: unknown): string {
  return String(v ?? '').trim().toLowerCase();
}

/**
 * Genera un reporte comparativo exhaustivo entre la versión local y remota de una configuración.
 * Permite examinar elemento por elemento qué registros son exclusivos de este dispositivo,
 * cuáles existen solo en la nube y cuáles tienen modificaciones de campos.
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

    // Indexar por ID o firma única
    for (const item of localItems) {
      const key = item.id || `${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}`;
      localMap.set(key, item);
    }

    for (const item of remoteItems) {
      const key = item.id || `${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}`;
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

  // Ordenar ítems: primero modificados, luego exclusivos de local, luego exclusivos de nube, luego idénticos
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

  const canSmartMerge = true;
  let smartMergeSummary = '';

  if (modifiedCount === 0 && (localOnlyCount > 0 || remoteOnlyCount > 0)) {
    smartMergeSummary = `Fusión segura disponible: une ${localOnlyCount} registros de esta PC con ${remoteOnlyCount} de la nube sin colisiones ni duplicados.`;
  } else if (modifiedCount > 0) {
    smartMergeSummary = `Fusión con diferencias de contenido: se conservan todos los registros únicos y para los ${modifiedCount} modificados se prioriza la versión local con respaldo completo previo.`;
  } else {
    smartMergeSummary = 'Las versiones son coincidentes o no presentan conflictos divergentes.';
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
    canSmartMerge,
    smartMergeSummary,
  };
}

/**
 * Realiza una fusión inteligente sin duplicación entre datos locales y remotos.
 * Preserva registros únicos de ambos extremos sin sobrescribir ciegamente.
 */
export function computeSmartMerge(
  name: SyncName,
  localRawStr: string,
  remoteRawStr: string,
): { mergedValue: string; summary: string; totalItems: number } {
  const localParsed = localRawStr ? JSON.parse(localRawStr) : {};
  const remoteParsed = remoteRawStr ? JSON.parse(remoteRawStr) : {};

  // 1. Proyecciones
  if (name === 'projections') {
    const localItems: any[] = Array.isArray(localParsed?.items) ? localParsed.items : [];
    const remoteItems: any[] = Array.isArray(remoteParsed?.items) ? remoteParsed.items : [];

    const mergedMap = new Map<string, any>();
    const seenSignatures = new Set<string>();

    // Primero incorporar ítems locales
    for (const item of localItems) {
      const sig = `${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}__${normStr(item.tipo)}`;
      const key = item.id || sig;
      mergedMap.set(key, item);
      seenSignatures.add(sig);
    }

    // Incorporar ítems remotos no duplicados
    for (const item of remoteItems) {
      const sig = `${normStr(item.concepto)}__${normStr(item.mes || item.fecha)}__${normStr(item.tipo)}`;
      const key = item.id || sig;
      if (!mergedMap.has(key) && !seenSignatures.has(sig)) {
        mergedMap.set(key, item);
        seenSignatures.add(sig);
      }
    }

    // Fusión de escenarios de probabilidad de sueldo
    const mergedProb = {
      ...(remoteParsed?.probabilidadSueldoPorMes || {}),
      ...(localParsed?.probabilidadSueldoPorMes || {}),
    };

    const mergedList = Array.from(mergedMap.values());
    const resultObj = {
      items: mergedList,
      probabilidadSueldoPorMes: mergedProb,
    };

    return {
      mergedValue: JSON.stringify(resultObj),
      summary: `${mergedList.length} partidas totales combinadas (${localItems.length} locales + ${mergedList.length - localItems.length} rescatadas de la nube)`,
      totalItems: mergedList.length,
    };
  }

  // 2. Clasificaciones
  if (name === 'classifications') {
    const localMap: Record<string, string> = localParsed && typeof localParsed === 'object' ? localParsed : {};
    const remoteMap: Record<string, string> = remoteParsed && typeof remoteParsed === 'object' ? remoteParsed : {};

    // Combinar sin perder ninguna regla
    const merged: Record<string, string> = {
      ...remoteMap,
      ...localMap, // Local prevalece en caso de discrepancia en la misma regla
    };

    const count = Object.keys(merged).length;
    return {
      mergedValue: JSON.stringify(merged),
      summary: `${count} clasificaciones totales consolidadas`,
      totalItems: count,
    };
  }

  // 3. Deudas regularizadas (Statements)
  if (name === 'statements') {
    const localMap: Record<string, any> = localParsed && typeof localParsed === 'object' ? localParsed : {};
    const remoteMap: Record<string, any> = remoteParsed && typeof remoteParsed === 'object' ? remoteParsed : {};

    const merged = {
      ...remoteMap,
      ...localMap,
    };

    const count = Object.keys(merged).length;
    return {
      mergedValue: JSON.stringify(merged),
      summary: `${count} regularizaciones consolidadas`,
      totalItems: count,
    };
  }

  // 4. Presupuestos (Budgets)
  const localBudgets = localParsed?.budgets || {};
  const remoteBudgets = remoteParsed?.budgets || {};
  const localModes = localParsed?.budgetModes || {};
  const remoteModes = remoteParsed?.budgetModes || {};

  const mergedBudgets = {
    ...remoteBudgets,
    ...localBudgets,
  };

  const mergedModes = {
    ...remoteModes,
    ...localModes,
  };

  const count = Object.keys(mergedBudgets).length;
  return {
    mergedValue: JSON.stringify({ budgets: mergedBudgets, budgetModes: mergedModes }),
    summary: `${count} presupuestos por categoría consolidados`,
    totalItems: count,
  };
}

/**
 * Prepara un objeto descargable de respaldo completo para exportación JSON antes de cualquier resolución.
 */
export function buildDownloadableDiffBackup(report: DiffReport, localRaw: string, remoteRaw: string) {
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
    diffItems: report.items,
    snapshots: {
      local: localRaw ? JSON.parse(localRaw) : null,
      remote: remoteRaw ? JSON.parse(remoteRaw) : null,
    },
  };
}
