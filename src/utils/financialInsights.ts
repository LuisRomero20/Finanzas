import type { Transaction } from '../store/financeStore';
import {
  getEffectiveCategory,
  isDebtTransaction,
  isCreditCardPayment,
  isCreditCardLine,
} from './categoryClassification';

export interface FinancialInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  badge?: string;
  actionText?: string;
}

export interface MonthDiagnostic {
  savingsRate: number;
  totalIncome: number;
  totalExpense: number;
  totalDebts: number;
  totalSavings: number;
  liquidBalance: number;
  explicitSavings: number;
  accountingSurplus: number;
  debtToIncomeRatio: number;
  cardSpent: number;
  cardPaid: number;
  netCardFlow: number;
  topCategory: { category: string; amount: number; percentage: number } | null;
  discretionaryRatio: number;
  insights: FinancialInsight[];
}

const formatPEN = (val: number): string =>
  `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateFinancialInsights(
  transactions: Transaction[] = [],
  selectedMonth: string = 'Setiembre',
  allMonths: string[] = [],
  budgetLimits: Record<string, number> = {},
  liquidBalance?: number
): MonthDiagnostic {
  const safeTxList = Array.isArray(transactions) ? transactions : [];
  const isAllMonths = selectedMonth === 'Todos';

  // Filtrar transacciones del periodo evaluado (mes específico o global anual)
  const currentMonthTx = isAllMonths
    ? safeTxList
    : safeTxList.filter((t) => {
        const mes = t.Mes || (t as any).mes;
        return mes === selectedMonth;
      });

  // 1. Ingresos Netos Reales: Excluye líneas/cupos asignados de tarjetas de crédito
  const totalIncome = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return tipo === 'Ingreso' && !isCreditCardLine(t);
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  // 2. Obligaciones y Deudas Fijas Activas (BCP, Yape, iPhone 16 y préstamos)
  const totalDebts = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return (tipo === 'Egreso' || tipo === 'Gasto') && isDebtTransaction(t);
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  // 3. Egresos Operativos Reales: Consumos corrientes de vida.
  // Excluye préstamos/deudas, pagos a tarjetas y asignaciones de línea de crédito.
  const totalExpense = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return (
        (tipo === 'Egreso' || tipo === 'Gasto') &&
        !isDebtTransaction(t) &&
        !isCreditCardPayment(t) &&
        !isCreditCardLine(t)
      );
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  // 4. Saldo Líquido Disponible y Ahorro Explícito en el Maestro
  const effectiveLiquidBalance = typeof liquidBalance === 'number'
    ? liquidBalance
    : (() => {
        const ingLiq = currentMonthTx
          .filter((t) => {
            const ent = t.Entidad || (t as any).entidad || '';
            const tipo = t.Tipo || (t as any).tipo;
            return (ent === 'Interbank' || ent === 'BCP') && tipo === 'Ingreso' && !isCreditCardLine(t);
          })
          .reduce((s, t) => s + (Number(t.Monto || (t as any).monto) || 0), 0);
        const egreLiq = currentMonthTx
          .filter((t) => {
            const ent = t.Entidad || (t as any).entidad || '';
            const tipo = t.Tipo || (t as any).tipo;
            return (ent === 'Interbank' || ent === 'BCP') && (tipo === 'Egreso' || tipo === 'Gasto') && !isCreditCardLine(t);
          })
          .reduce((s, t) => s + (Number(t.Monto || (t as any).monto) || 0), 0);
        return ingLiq - egreLiq;
      })();

  // Ahorro explícito formal en el maestro (movimientos con categoría 'Ahorro' o afines)
  const explicitSavings = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      const cat = (t.Categoria || (t as any).categoria || '').toLowerCase();
      const conc = (t.Concepto || (t as any).concepto || '').toLowerCase();
      if (tipo === 'Ingreso') return false; // descartar bonificaciones o intereses ganados
      return (
        (tipo === 'Egreso' || tipo === 'Transferencia' || (t as any).tipo === 'Ahorro') &&
        (cat.includes('ahorro') || cat.includes('inversi') || conc.includes('ahorro'))
      );
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  // ── REGLA FUNDAMENTAL DE AHORRO ──
  // Si en lo líquido hay saldo disponible (>0) o hay una categoría de ahorro en el maestro,
  // considerarlo tipo de ahorro. Sino, NO considerar nada como ahorro (0.0%).
  let totalSavings = 0;
  if (explicitSavings > 0) {
    totalSavings = explicitSavings;
  } else if (effectiveLiquidBalance > 0) {
    totalSavings = effectiveLiquidBalance;
  } else {
    totalSavings = 0;
  }

  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  const debtToIncomeRatio = totalIncome > 0 ? (totalDebts / totalIncome) * 100 : 0;
  const accountingSurplus = totalIncome - totalExpense - totalDebts;

  // 5. Análisis de Pasivos y Tarjetas de Crédito
  const CREDIT_CARD_ENTITIES = new Set(['BBVA Bfree', 'Interbank Amex', 'Ripley']);
  const cardSpent = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      const entidad = t.Entidad || (t as any).entidad || '';
      return (
        (tipo === 'Egreso' || tipo === 'Gasto') &&
        CREDIT_CARD_ENTITIES.has(entidad) &&
        !isCreditCardPayment(t) &&
        !isCreditCardLine(t) &&
        !isDebtTransaction(t)
      );
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  const cardPaid = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return (tipo === 'Egreso' || tipo === 'Gasto') && isCreditCardPayment(t);
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  const netCardFlow = cardPaid - cardSpent;

  // 6. Agrupación y Concentración de Gastos Operativos Reales
  const categoryTotals: Record<string, number> = {};
  let discretionarySum = 0;

  const DISCRETIONARY_CATEGORY_IDS = new Set([
    'comida',
    'ropa',
    'salidas',
    'entretenimiento',
    'ocio',
    'conciertos',
    'viajes',
    'bazar',
    'regalos',
  ]);

  currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return (
        (tipo === 'Egreso' || tipo === 'Gasto') &&
        !isDebtTransaction(t) &&
        !isCreditCardPayment(t) &&
        !isCreditCardLine(t)
      );
    })
    .forEach((t) => {
      const cat = getEffectiveCategory(t);
      const catLabel = cat ? cat.fullLabel : (t.Categoria || (t as any).categoria || '📦 Otros Gastos');
      const amount = Number(t.Monto || (t as any).monto) || 0;
      categoryTotals[catLabel] = (categoryTotals[catLabel] || 0) + amount;

      if (cat && DISCRETIONARY_CATEGORY_IDS.has(cat.id)) {
        discretionarySum += amount;
      }
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory =
    sortedCategories.length > 0 && totalExpense > 0
      ? {
          category: sortedCategories[0][0],
          amount: sortedCategories[0][1],
          percentage: (sortedCategories[0][1] / totalExpense) * 100,
        }
      : null;

  const discretionaryRatio = totalExpense > 0 ? (discretionarySum / totalExpense) * 100 : 0;

  const insights: FinancialInsight[] = [];

  // ── Insight 1: Diagnóstico de Ahorro Real & Consejo por Saldo Líquido (> 1k) ──
  if (totalIncome > 0) {
    if (explicitSavings > 0) {
      insights.push({
        id: 'savings-explicit',
        type: 'success',
        title: '🏦 Ahorro Formal Registrado',
        description: `Destinaste ${formatPEN(explicitSavings)} a cuentas o fondos de ahorro (${savingsRate.toFixed(1)}% de tus ingresos netos).`,
        badge: formatPEN(explicitSavings),
      });
    } else if (effectiveLiquidBalance >= 1000) {
      const suggestedMin = Math.round(effectiveLiquidBalance * 0.25);
      const suggestedMax = Math.round(effectiveLiquidBalance * 0.50);
      insights.push({
        id: 'savings-liquid-advice-over-1k',
        type: 'success',
        title: '💰 Oportunidad de Ahorro: Saldo Líquido > S/ 1,000',
        description: `Tu saldo líquido disponible en cuenta es de ${formatPEN(effectiveLiquidBalance)}. Dado que actualmente el ahorro no está mapeado en tus registros, tienes un margen favorable para ahorrar: te aconsejamos separar entre ${formatPEN(suggestedMin)} y ${formatPEN(suggestedMax)} hacia una cuenta de ahorros o fondo de reserva antes del cierre de mes.`,
        badge: 'Liquidez > 1k',
      });
    } else if (effectiveLiquidBalance > 0) {
      insights.push({
        id: 'savings-liquid-under-1k',
        type: 'info',
        title: `💧 Saldo Líquido en Cuenta (${formatPEN(effectiveLiquidBalance)})`,
        description: `Tu saldo líquido disponible es de ${formatPEN(effectiveLiquidBalance)}. Al ser inferior a S/ 1,000 y no tener ahorro mapeado, se aconseja mantener este remanente como colchón de contingencia para gastos imprevistos del mes antes de separar ahorro.`,
        badge: 'Colchón de Reserva',
      });
    } else {
      insights.push({
        id: 'savings-zero',
        type: 'warning',
        title: '⚠️ Sin Margen de Ahorro Líquido',
        description: 'No se registran movimientos en categoría de ahorro ni quedó saldo líquido disponible en cuenta. Todo el flujo fue absorbido por egresos, deudas o pagos.',
        badge: '0.0%',
      });
    }
  }

  // ── Insight 2: Diagnóstico de Tarjetas de Crédito y Pasivos ──
  if (cardPaid > 0 || cardSpent > 0) {
    if (netCardFlow >= 0) {
      insights.push({
        id: 'card-payoff-positive',
        type: 'success',
        title: '💳 Desapalancamiento Positivo de Tarjetas',
        description: `Abonaste ${formatPEN(cardPaid)} a tus tarjetas mientras que consumiste ${formatPEN(cardSpent)} (+${formatPEN(netCardFlow)} a favor). Estás reduciendo activamente tu saldo rotativo en plásticos.`,
        badge: `+S/ ${Math.round(netCardFlow)}`,
      });
    } else {
      insights.push({
        id: 'card-balance-alert',
        type: 'warning',
        title: '💳 Consumo de Tarjetas Supera Pagos',
        description: `Tus consumos con tarjeta (${formatPEN(cardSpent)}) superaron los pagos realizados (${formatPEN(cardPaid)}) en ${formatPEN(Math.abs(netCardFlow))}. Planifica los abonos antes del corte para evitar intereses.`,
        badge: 'Atención Pasivos',
      });
    }
  }

  // ── Insight 3: Diagnóstico de Deudas Fijas Activas (BCP, Yape, iPhone 16) ──
  if (totalDebts > 0) {
    const debtConcepts = Array.from(
      new Set(
        currentMonthTx
          .filter((t) => (t.Tipo === 'Egreso' || (t as any).tipo === 'Egreso') && isDebtTransaction(t))
          .map((t) => (t.Concepto || (t as any).concepto || '').trim())
      )
    ).filter(Boolean);

    if (debtToIncomeRatio <= 30) {
      insights.push({
        id: 'debt-healthy',
        type: 'info',
        title: `🛡️ Deudas Fijas Bajo Control (${debtToIncomeRatio.toFixed(1)}% DTI)`,
        description: `Destinas el ${debtToIncomeRatio.toFixed(1)}% de tus ingresos a préstamos activos (${formatPEN(totalDebts)}${debtConcepts.length > 0 ? ` en ${debtConcepts.join(', ')}` : ''}). Nivel de endeudamiento seguro y saludable (<30%).`,
        badge: 'Saludable',
      });
    } else {
      insights.push({
        id: 'debt-elevated',
        type: 'warning',
        title: `⚠️ Carga de Deudas Elevada (${debtToIncomeRatio.toFixed(1)}% DTI)`,
        description: `Tus cuotas de préstamos fijos absorben el ${debtToIncomeRatio.toFixed(1)}% de tus ingresos netos (${formatPEN(totalDebts)}). Se recomienda prudencia antes de tomar nuevas obligaciones.`,
        badge: 'Alerta DTI',
      });
    }
  }

  // ── Insight 4: Concentración en Categoría Operativa Principal Real ──
  if (topCategory && topCategory.percentage >= 20) {
    insights.push({
      id: 'top-category-concentration',
      type: 'info',
      title: `📊 Concentración en ${topCategory.category}`,
      description: `Esta categoría concentra el ${topCategory.percentage.toFixed(1)}% de tus egresos operativos corrientes (${formatPEN(topCategory.amount)}).`,
      badge: `${topCategory.percentage.toFixed(0)}% del gasto`,
    });
  }

  // ── Insight 5: Comparativa de Consumos Operativos vs Mes Anterior ──
  const currentMonthIdx = allMonths.indexOf(selectedMonth);
  if (currentMonthIdx > 0 && !isAllMonths) {
    const prevMonthName = allMonths[currentMonthIdx - 1];
    const prevMonthTx = safeTxList.filter((t) => {
      const mes = t.Mes || (t as any).mes;
      const tipo = t.Tipo || (t as any).tipo;
      return (
        (tipo === 'Egreso' || tipo === 'Gasto') &&
        mes === prevMonthName &&
        !isDebtTransaction(t) &&
        !isCreditCardPayment(t) &&
        !isCreditCardLine(t)
      );
    });
    const prevMonthExpense = prevMonthTx.reduce(
      (acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0),
      0
    );

    if (prevMonthExpense > 0 && totalExpense > 0) {
      const diffPct = ((totalExpense - prevMonthExpense) / prevMonthExpense) * 100;
      if (diffPct > 15) {
        insights.push({
          id: 'expense-spike',
          type: 'warning',
          title: `📈 Incremento de Gasto Operativo vs ${prevMonthName}`,
          description: `Tus consumos corrientes subieron un ${diffPct.toFixed(1)}% respecto a ${prevMonthName} (+${formatPEN(totalExpense - prevMonthExpense)}).`,
          badge: `+${diffPct.toFixed(0)}%`,
        });
      } else if (diffPct < -10) {
        insights.push({
          id: 'expense-reduction',
          type: 'success',
          title: `📉 Reducción de Gastos vs ${prevMonthName}`,
          description: `Has gastado un ${Math.abs(diffPct).toFixed(1)}% menos en consumos corrientes que el mes pasado (-${formatPEN(prevMonthExpense - totalExpense)}). ¡Gran disciplina!`,
          badge: `${diffPct.toFixed(0)}%`,
        });
      }
    }
  }

  // ── Insight 6: Estilo de Vida y Gastos Discrecionales ──
  if (discretionaryRatio >= 45 && totalExpense > 0) {
    insights.push({
      id: 'lifestyle-ratio',
      type: 'tip',
      title: `💡 Estilo de Vida: ${discretionaryRatio.toFixed(0)}% de tus Consumos`,
      description: `El ${discretionaryRatio.toFixed(1)}% de tus egresos corrientes (${formatPEN(discretionarySum)}) se destina a comidas fuera, salidas, ocio o ropa. Buen espacio de optimización si deseas elevar tu ahorro.`,
      badge: 'Oportunidad',
    });
  }

  // ── Insight 7: Diagnóstico de Presupuestos Excedidos ──
  const exceededBudgets = Object.entries(budgetLimits)
    .filter(([cat, limit]) => (categoryTotals[cat] || 0) > limit && limit > 0)
    .map(([cat, limit]) => ({
      cat,
      spent: categoryTotals[cat] || 0,
      limit,
      over: (categoryTotals[cat] || 0) - limit,
    }));

  if (exceededBudgets.length > 0) {
    insights.push({
      id: 'budgets-exceeded',
      type: 'warning',
      title: `⚡ ${exceededBudgets.length} Presupuesto${exceededBudgets.length > 1 ? 's' : ''} Excedido${exceededBudgets.length > 1 ? 's' : ''}`,
      description: `Has sobrepasado el límite en: ${exceededBudgets.map((b) => `${b.cat} (+S/ ${b.over.toFixed(0)})`).join(', ')}.`,
      badge: 'Alerta Semáforo',
    });
  }

  // ── Insight 8: Tip Estratégico de Tarjetas & Ciclos de Corte ──
  const now = new Date();
  const currentDay = now.getDate();
  if (currentDay >= 1 && currentDay <= 3) {
    insights.push({
      id: 'card-cycle-tip-ripley',
      type: 'tip',
      title: '💳 Estrategia Ripley (Corte Día 03 · Pago Día 01)',
      description: 'El corte de Ripley es el 03 de cada mes. Si compras a partir del día 04, tendrás hasta 55 días de financiamiento sin intereses.',
      badge: 'Optimización',
    });
  } else if (currentDay >= 4 && currentDay <= 10) {
    insights.push({
      id: 'card-cycle-tip-bbva',
      type: 'tip',
      title: '💳 Estrategia BBVA (Corte Día 10 · Pago Día 05)',
      description: 'El corte de BBVA Bfree es el día 10. Realiza compras a partir del día 11 para patear el pago casi 2 meses después.',
      badge: 'Financiamiento 0%',
    });
  } else if (currentDay >= 16 && currentDay <= 21) {
    insights.push({
      id: 'card-cycle-tip-ibk',
      type: 'tip',
      title: '💳 Estrategia Interbank Amex (Corte Día 21 · Pago Día 15)',
      description: 'El corte de Interbank Amex es el día 21. Realiza compras grandes a partir del día 22 para posponer el pago hasta el siguiente ciclo.',
      badge: 'Financiamiento 0%',
    });
  }

  return {
    savingsRate,
    totalIncome,
    totalExpense,
    totalDebts,
    totalSavings,
    liquidBalance: effectiveLiquidBalance,
    explicitSavings,
    accountingSurplus,
    debtToIncomeRatio,
    cardSpent,
    cardPaid,
    netCardFlow,
    topCategory,
    discretionaryRatio,
    insights,
  };
}
