import { useState, type ReactNode } from 'react';
import type { EffectiveProjectedRow } from '../store/projectionStore';

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
export function MobileProjectionList({ rows, actions, onCycle }: {
  rows: EffectiveProjectedRow[];
  actions: (row: EffectiveProjectedRow) => ReactNode;
  onCycle: (row: EffectiveProjectedRow) => void;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / 5));
  const current = Math.min(page, pages - 1);
  return <div className="sm:hidden">
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {rows.slice(current * 5, current * 5 + 5).map(row => <details key={row.id} className="group px-3">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold break-words">{row.concepto}</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{row.fecha.slice(8)}/{row.fecha.slice(5, 7)} · {row.entidad}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-sm font-black ${row.tipo === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-300' : ''}`}>{fmt.format(row.monto)}</p>
            <span className="text-[10px] text-slate-500">{row.tipo} · <span className="group-open:hidden">Ver detalle ▾</span><span className="hidden group-open:inline">Cerrar ▴</span></span>
          </div>
        </summary>
        <div className="space-y-2 pb-3 text-xs">
          <p>{row.categoria}{row.esTemporal ? ' · Temporal' : ''}{row.esModificado ? ' · Ajustado este mes' : ''}</p>
          {row.fechaPagoTarjeta && <p className="text-indigo-600 dark:text-indigo-300">Pago de tarjeta: {row.fechaPagoTarjeta}</p>}
          {row.esPagoLiquidacionTarjeta && <button className="min-h-11 underline" onClick={() => onCycle(row)}>Ver consumos del ciclo ({row.detalleConsumosCiclo?.length || 0})</button>}
          <div className="flex flex-wrap gap-2 [&>button]:min-h-11 [&>button]:rounded-lg [&>button]:border [&>button]:border-slate-400/40 [&>button]:px-3">{actions(row)}</div>
        </div>
      </details>)}
      {!rows.length && <p className="p-4 text-sm">No hay partidas proyectadas para este mes.</p>}
    </div>
    <nav aria-label="Páginas de movimientos proyectados" className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 px-3 text-xs">
      <button className="min-h-11 disabled:opacity-30" disabled={current === 0} onClick={() => setPage(current - 1)}>← Anterior</button>
      <span>{current + 1} / {pages} · {rows.length} partidas</span>
      <button className="min-h-11 disabled:opacity-30" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Siguiente →</button>
    </nav>
  </div>;
}
