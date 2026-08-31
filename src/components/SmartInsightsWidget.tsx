import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, PieChart } from 'lucide-react';
import type { FinancialInsight, MonthDiagnostic } from '../utils/financialInsights';

interface Props {
  diagnostic: MonthDiagnostic;
  selectedMonth: string;
}

export const SmartInsightsWidget: React.FC<Props> = ({ diagnostic, selectedMonth }) => {
  const { insights, savingsRate, discretionaryRatio, netSavings } = diagnostic;

  const getInsightIcon = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-emerald-500 shrink-0" size={18} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500 shrink-0" size={18} />;
      case 'tip':
        return <Lightbulb className="text-purple-500 shrink-0" size={18} />;
      default:
        return <Sparkles className="text-blue-500 shrink-0" size={18} />;
    }
  };

  const getInsightBg = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-900/50';
      case 'warning':
        return 'bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/50';
      case 'tip':
        return 'bg-purple-50/70 border-purple-200/80 dark:bg-purple-950/30 dark:border-purple-900/50';
      default:
        return 'bg-blue-50/70 border-blue-200/80 dark:bg-blue-950/30 dark:border-blue-900/50';
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D1518] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      
      {/* Encabezado del Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              FinPer AI Insights
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 uppercase tracking-wider">
                Diagnóstico {selectedMonth}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Análisis cuantitativo de salud financiera, ahorro y anomalías
            </p>
          </div>
        </div>

        {/* Mini Métricas Rápidas */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-center shrink-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Tasa de Ahorro</p>
            <p className={`text-sm font-black ${savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-center shrink-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Gasto Estilo de Vida</p>
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
              {discretionaryRatio.toFixed(1)}%
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-center shrink-0">
            <p className="text-[10px] uppercase font-bold text-slate-400">Margen Libre</p>
            <p className={`text-sm font-black ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              S/ {netSavings.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Insights */}
      {insights.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No hay suficientes transacciones registradas en este mes para generar diagnósticos.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`p-4 rounded-2xl border transition-all hover:shadow-md flex items-start gap-3.5 ${getInsightBg(ins.type)}`}
            >
              <div className="mt-0.5">{getInsightIcon(ins.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {ins.title}
                  </h4>
                  {ins.badge && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                      {ins.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ins.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
