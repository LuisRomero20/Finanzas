import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calcularCuota, addMonthsKeepingDay } from '../../utils/debtUtils';

interface Deuda {
  id: string;
  acreedor: string;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  meses_pagados: number;
  fecha_inicio: string;
  tipo_tasa: 'nominal' | 'efectiva';
  moneda: string;
  estado: 'activa' | 'pagada' | 'proximo_vencer';
}

const diaPorAcreedor: Record<string, number> = {
  'iPhone 16': 30,
  'Prestamo Yape': 28,
  'Yape Crédito': 28,
  'Prestamo BCP': 15,
};

export const DebtCard: React.FC<{ deuda: Deuda }> = ({ deuda }) => {
  const [open, setOpen] = useState(false);
  const eliminarDeuda = useAppStore(state => state.eliminarDeuda);

  const cuota = calcularCuota(deuda);
  const schedule = useMemo(() => {
    const pagosSet = new Set<string>((deuda.pagos || []).map(p => {
      try { const d = new Date(p); return `${d.getFullYear()}-${d.getMonth()+1}`; } catch { return p; }
    }));

    const items: Array<{ name: string; fecha: string; monto: number; paid: boolean }> = [];
    for (let k = 1; k <= deuda.plazo_meses; k++) {
      const mesesDesdeInicio = k - 1;
      const dayOverride = diaPorAcreedor[deuda.acreedor] || undefined;
      const fecha = addMonthsKeepingDay(deuda.fecha_inicio, mesesDesdeInicio, dayOverride);
      const key = `${fecha.getFullYear()}-${fecha.getMonth()+1}`;
      const paid = pagosSet.has(key) || k <= (deuda.meses_pagados || 0);
      items.push({ name: `${fecha.toLocaleString('es-PE', { month: 'short' })} ${fecha.getFullYear()}`, fecha: fecha.toISOString().slice(0,10), monto: Number(cuota.toFixed(2)), paid });
    }
    // Special case: for Yape Crédito if there are payments from previous year, show only this year's recorded payments in the detail list
    if (deuda.acreedor && deuda.acreedor.toLowerCase().includes('yape') && (deuda as any).pagos_anio_anterior && (deuda as any).pagos_anio_anterior > 0) {
      // Return only the schedule entries that match explicit recorded pagos (deuda.pagos)
      const pagosKeys = new Set((deuda.pagos || []).map(p => { try { const d = new Date(p); return `${d.getFullYear()}-${d.getMonth()+1}` } catch { return p } }));
      return items.filter(i => {
        try { const d = new Date(i.fecha); const key = `${d.getFullYear()}-${d.getMonth()+1}`; return pagosKeys.has(key); } catch { return false }
      });
    }
    return items;
  }, [deuda, cuota]);

  const chartData = schedule.map((s, idx) => ({ name: s.name, monto: s.monto, paid: s.paid, idx }));

  return (
    <div className="bg-white dark:bg-[#11191D] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{deuda.acreedor}</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">S/ {deuda.monto.toFixed(2)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cuota estimada: <strong className="text-emerald-700 dark:text-emerald-400">S/ {cuota.toFixed(2)}</strong> · {deuda.meses_pagados}/{deuda.plazo_meses} cuotas
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={async () => { if (confirm(`¿Eliminar deuda ${deuda.acreedor}?`)) { await eliminarDeuda(deuda.id); } }} 
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Eliminar
          </button>
          <div className="w-40 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" hide />
                <Tooltip 
                  formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Cuota']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.paid ? '#94a3b8' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={() => setOpen(s => !s)} 
          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          {open ? '▲ Ocultar cronograma' : '▼ Ver cronograma de cuotas'}
        </button>
        {open && (
          <div className="mt-3 text-xs">
            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto">
              {schedule.filter((s) => {
                if (deuda.acreedor && deuda.acreedor.toLowerCase().includes('yape')) {
                  try {
                    const d = new Date(s.fecha);
                    const m = d.getMonth() + 1;
                    if (!s.paid && m >= 4 && m <= 6) return false;
                  } catch {}
                }
                return true;
              }).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{new Date(s.fecha).toLocaleDateString('es-PE')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">S/ {s.monto.toFixed(2)}</div>
                    <div className={`text-[11px] font-bold ${s.paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {s.paid ? '✓ Pagada' : '⏳ Pendiente'}
                    </div>
                  </div>
                </div>
              ))}
              {deuda.acreedor === 'Yape Crédito' && (deuda as any).pagos_anio_anterior > 0 ? (
                <div className="mt-1 text-[11px] text-slate-400 italic">Además, se pagaron {(deuda as any).pagos_anio_anterior} cuotas el año anterior.</div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtCard;
