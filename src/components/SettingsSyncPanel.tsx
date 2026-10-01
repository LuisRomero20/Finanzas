import { useState } from 'react';
import { useSettingsSync, resolveSettings, syncPersonalSettings, downloadSyncBackup } from '../services/personalSettingsSync';

export function SettingsSyncPanel() {
  const { entries } = useSettingsSync();
  const [expanded, setExpanded] = useState(false);
  const needsAttention = Object.values(entries).some(e => e.status === 'conflict' || e.status === 'error');
  const syncing = Object.values(entries).some(e => e.status === 'syncing');
  const labels = { budgets: 'Presupuestos', projections: 'Proyecciones', statements: 'Deudas regularizadas de tarjetas', classifications: 'Clasificación de movimientos' } as const;
  const stateLabels = { waiting: 'Pendiente de compartir', syncing: 'Sincronizando…', synced: 'Sincronizado', conflict: 'Versiones distintas', error: 'Pendiente de reintento' };
  return <section className="mb-3 rounded-xl border border-emerald-800/30 bg-white dark:bg-[#11191D] text-xs" aria-label="Sincronización de ajustes financieros">
    <button onClick={() => setExpanded(!expanded)} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left" aria-expanded={expanded || needsAttention}>
      <span className="font-bold">{needsAttention ? 'Revisar sincronización' : syncing ? 'Sincronizando ajustes…' : 'Ajustes financieros · Nube'}</span>
      <span>{expanded || needsAttention ? '−' : '+'}</span>
    </button>
    {(expanded || needsAttention) && <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 p-3">
      <p>Primera conexión: en tu computadora elige «Compartir este dispositivo». Después, en el celular elige «Usar nube» si aparecen versiones distintas. Los siguientes cambios se sincronizan automáticamente.</p>
      {(Object.keys(labels) as Array<keyof typeof labels>).map(name => <div key={name} className="space-y-2">
        <div className="flex justify-between gap-2"><strong>{labels[name]}</strong><span role="status">{stateLabels[entries[name].status]}</span></div>
        {entries[name].message && <p className="text-amber-700 dark:text-amber-300">{entries[name].message}</p>}
        {entries[name].localSummary && <p>Este dispositivo: {entries[name].localSummary}<br />Nube: {entries[name].remoteSummary}</p>}
        <div className="flex flex-wrap gap-2">
          <button disabled={syncing} className="min-h-11 rounded-lg bg-emerald-700 px-3 text-white disabled:opacity-50" onClick={() => void resolveSettings(name, 'local')}>Compartir este dispositivo</button>
          <button disabled={syncing} className="min-h-11 rounded-lg border border-slate-400 px-3 disabled:opacity-50" onClick={() => void resolveSettings(name, 'remote')}>Usar nube</button>
        </div>
      </div>)}
      <div className="flex flex-wrap gap-3">
        <button className="min-h-11 underline" onClick={() => void syncPersonalSettings()}>Reintentar sincronización</button>
        <button className="min-h-11 underline" onClick={downloadSyncBackup}>Descargar copias de respaldo</button>
      </div>
    </div>}
  </section>;
}
