import type { Transaction } from '../utils/masterData';
import { CONCEPTO_A_CATEGORIA } from './categoryClassification';

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
  netSavings: number;
  topCategory: { category: string; amount: number; percentage: number } | null;
  discretionaryRatio: number;
  insights: FinancialInsight[];
}

export function generateFinancialInsights(
  transactions: Transaction[] = [],
  selectedMonth: string = 'Setiembre',
  allMonths: string[] = [],
  budgetLimits: Record<string, number> = {}
): MonthDiagnostic {
  const safeTxList = Array.isArray(transactions) ? transactions : [];

  // Filtrar transacciones del mes actual
  const currentMonthTx = safeTxList.filter((t) => {
    const mes = t.Mes || (t as any).mes;
    return mes === selectedMonth;
  });

  const totalIncome = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      return tipo === 'Ingreso';
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  const totalExpense = currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      const cat = t.Categoria || (t as any).categoria;
      return (tipo === 'Egreso' || tipo === 'Gasto') && cat !== 'Deuda';
    })
    .reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Agrupar gastos por categoría de 21
  const categoryTotals: Record<string, number> = {};
  let discretionarySum = 0;

  const DISCRETIONARY_CATEGORIES = new Set([
    '🍔 Comida & Restaurantes',
    '🛍️ Ropa, Calzado & Moda',
    '🎉 Salidas, Eventos & Ocio',
    '☕ Antojos, Snacks & Café',
    '📺 Suscripciones & Streaming',
    '🎮 Gaming & Tecnología',
    '✈️ Viajes & Vacaciones',
  ]);

  currentMonthTx
    .filter((t) => {
      const tipo = t.Tipo || (t as any).tipo;
      const cat = t.Categoria || (t as any).categoria;
      return (tipo === 'Egreso' || tipo === 'Gasto') && cat !== 'Deuda';
    })
    .forEach((t) => {
      const concepto = t.Concepto || (t as any).concepto || '';
      const categoria = t.Categoria || (t as any).categoria || '';
      const cat = CONCEPTO_A_CATEGORIA[concepto] || categoria || '📦 Otros Gastos';
      const amount = Number(t.Monto || (t as any).monto) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;

      if (DISCRETIONARY_CATEGORIES.has(cat)) {
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

  // 1. Diagnóstico de Ratio de Ahorro
  if (totalIncome > 0) {
    if (savingsRate >= 30) {
      insights.push({
        id: 'savings-excellent',
        type: 'success',
        title: '🌟 Capacidad de Ahorro Excelente',
        description: `Estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos (S/ ${netSavings.toLocaleString('es-PE', { minimumFractionDigits: 2 })}). Superas la regla de oro del 20%.`,
        badge: 'Top 10%',
      });
    } else if (savingsRate >= 15) {
      insights.push({
        id: 'savings-good',
        type: 'info',
        title: '👍 Salud Financiera Saludable',
        description: `Ahorro neto del ${savingsRate.toFixed(1)}% (S/ ${netSavings.toLocaleString('es-PE', { minimumFractionDigits: 2 })}). Mantienes un margen positivo estable.`,
        badge: 'Estable',
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: 'savings-tight',
        type: 'warning',
        title: '⚠️ Margen de Ahorro Ajustado',
        description: `Tu ratio de ahorro es del ${savingsRate.toFixed(1)}%. Se recomienda reducir gastos discrecionales para construir un fondo de emergencia más robusto.`,
        badge: 'Atención',
      });
    } else {
      insights.push({
        id: 'savings-deficit',
        type: 'warning',
        title: '🚨 Déficit Mensual Detectado',
        description: `Tus egresos superan los ingresos en S/ ${Math.abs(netSavings).toLocaleString('es-PE', { minimumFractionDigits: 2 })}. Revisa tus gastos en tarjetas para evitar endeudamiento.`,
        badge: 'Crítico',
      });
    }
  }

  // 2. Diagnóstico de Categoría Principal
  if (topCategory && topCategory.percentage > 35) {
    insights.push({
      id: 'top-category-concentration',
      type: 'info',
      title: `📊 Concentración en ${topCategory.category}`,
      description: `Esta categoría representa el ${topCategory.percentage.toFixed(1)}% del total de egresos (S/ ${topCategory.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}).`,
      badge: `${topCategory.percentage.toFixed(0)}% del total`,
    });
  }

  // 3. Comparativa con el mes anterior
  const currentMonthIdx = allMonths.indexOf(selectedMonth);
  if (currentMonthIdx > 0) {
    const prevMonthName = allMonths[currentMonthIdx - 1];
    const prevMonthTx = safeTxList.filter((t) => {
      const mes = t.Mes || (t as any).mes;
      const tipo = t.Tipo || (t as any).tipo;
      return (tipo === 'Egreso' || tipo === 'Gasto') && mes === prevMonthName;
    });
    const prevMonthExpense = prevMonthTx.reduce((acc, t) => acc + (Number(t.Monto || (t as any).monto) || 0), 0);

    if (prevMonthExpense > 0 && totalExpense > 0) {
      const diffPct = ((totalExpense - prevMonthExpense) / prevMonthExpense) * 100;
      if (diffPct > 20) {
        insights.push({
          id: 'expense-spike',
          type: 'warning',
          title: `📈 Incremento de Gasto vs ${prevMonthName}`,
          description: `Tus egresos subieron un ${diffPct.toFixed(1)}% comparado con el mes anterior (+S/ ${(totalExpense - prevMonthExpense).toFixed(2)}).`,
          badge: `+${diffPct.toFixed(0)}%`,
        });
      } else if (diffPct < -10) {
        insights.push({
          id: 'expense-reduction',
          type: 'success',
          title: `📉 Reducción de Gastos vs ${prevMonthName}`,
          description: `Has gastado un ${Math.abs(diffPct).toFixed(1)}% menos que el mes pasado (-S/ ${(prevMonthExpense - totalExpense).toFixed(2)}). ¡Gran disciplina!`,
          badge: `${diffPct.toFixed(0)}%`,
        });
      }
    }
  }

  // 4. Diagnóstico de Presupuestos Excedidos
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
      title: `⚡ ${exceededBudgets.length} Presupuestos Excedidos`,
      description: `Has sobrepasado el límite en: ${exceededBudgets.map((b) => `${b.cat} (+S/ ${b.over.toFixed(0)})`).join(', ')}.`,
      badge: 'Alerta Semáforo',
    });
  }

  // 5. Tip Inteligente de Tarjetas & Ciclos de Facturación
  const now = new Date();
  const currentDay = now.getDate();
  if (currentDay >= 1 && currentDay <= 4) {
    insights.push({
      id: 'card-cycle-tip-bbva',
      type: 'tip',
      title: '💳 Estrategia BBVA & Ripley (Corte Día 04)',
      description: 'El corte de BBVA y Ripley es el 04 de cada mes. Si compras a partir del día 05, tendrás hasta 50 días de financiamiento sin intereses.',
      badge: 'Optimización',
    });
  } else if (currentDay >= 11 && currentDay <= 15) {
    insights.push({
      id: 'card-cycle-tip-ibk',
      type: 'tip',
      title: '💳 Estrategia Interbank (Corte Día 15)',
      description: 'El corte de Interbank es el día 15. Realiza compras grandes a partir del día 16 para posponer el pago hasta el siguiente mes.',
      badge: 'Financiamiento 0%',
    });
  }

  return {
    savingsRate,
    totalIncome,
    totalExpense,
    netSavings,
    topCategory,
    discretionaryRatio,
    insights,
  };
}
