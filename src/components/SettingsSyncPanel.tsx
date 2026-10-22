import { useState, useEffect } from 'react';
import { useSettingsSync, resolveSettings, syncPersonalSettings, downloadSyncBackup } from '../services/personalSettingsSync';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../services/authService';
import type { User } from '@supabase/supabase-js';
import { ShieldCheck, Lock } from 'lucide-react';

interface SettingsSyncPanelProps {
  onOpenAuth?: () => void;
  currentUser?: User | null;
}

export function SettingsSyncPanel({ onOpenAuth, currentUser: propUser }: SettingsSyncPanelProps) {
  const { entries } = useSettingsSync();
  const [expanded, setExpanded] = useState(false);
  const [internalUser, setInternalUser] = useState<User | null>(propUser ?? null);

  useEffect(() => {
    if (propUser !== undefined) {
      setInternalUser(propUser);
      return;
    }
    getCurrentUser().then(u => setInternalUser(u));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setInternalUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [propUser]);

  const activeUser = propUser !== undefined ? propUser : internalUser;

  // Si no está autenticado, mostrar banner amigable de inicio de sesión en lugar de errores
  if (!activeUser) {
    return (
      <section className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/40 p-4 text-xs shadow-lg backdrop-blur-sm animate-in fade-in duration-200" aria-label="Aviso de autenticación">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Tu información financiera ahora está protegida</h4>
              <p className="text-slate-300 text-xs mt-0.5">
                Inicia sesión con tu cuenta para acceder a tus 2,246 registros y sincronizar tus dispositivos de forma segura.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer shrink-0"
          >
            <Lock size={14} />
            <span>Iniciar Sesión</span>
          </button>
        </div>
      </section>
    );
  }

  const needsAttention = Object.values(entries).some(e => e.status === 'conflict' || e.status === 'error');
  const syncing = Object.values(entries).some(e => e.status === 'syncing');
  const labels = { budgets: 'Presupuestos', projections: 'Proyecciones', statements: 'Deudas regularizadas de tarjetas', classifications: 'Clasificación de movimientos' } as const;
  const stateLabels = { waiting: 'Pendiente de compartir', syncing: 'Sincronizando…', synced: 'Sincronizado', conflict: 'Versiones distintas', error: 'Pendiente de reintento' };

  return <section className="mb-3 rounded-xl border border-emerald-800/30 bg-white dark:bg-[#11191D] text-xs shadow-sm" aria-label="Sincronización de ajustes financieros">
    <button onClick={() => setExpanded(!expanded)} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left cursor-pointer" aria-expanded={expanded || needsAttention}>
      <div className="flex items-center gap-2 min-w-0">
        <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
        <span className="font-bold truncate">{needsAttention ? 'Revisar sincronización' : syncing ? 'Sincronizando ajustes…' : 'Ajustes financieros · Nube'}</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono hidden sm:inline truncate">({activeUser.email})</span>
      </div>
      <span>{expanded || needsAttention ? '−' : '+'}</span>
    </button>
    {(expanded || needsAttention) && <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 p-3">
      <p>Primera conexión: en tu computadora elige «Compartir este dispositivo». Después, en el celular elige «Usar nube» si aparecen versiones distintas. Los siguientes cambios se sincronizan automáticamente.</p>
      {(Object.keys(labels) as Array<keyof typeof labels>).map(name => <div key={name} className="space-y-2">
        <div className="flex justify-between gap-2"><strong>{labels[name]}</strong><span role="status">{stateLabels[entries[name].status]}</span></div>
        {entries[name].message && <p className="text-amber-700 dark:text-amber-300">{entries[name].message}</p>}
        {entries[name].localSummary && <p>Este dispositivo: {entries[name].localSummary}<br />Nube: {entries[name].remoteSummary}</p>}
        <div className="flex flex-wrap gap-2">
          <button disabled={syncing} className="min-h-11 rounded-lg bg-emerald-700 px-3 text-white disabled:opacity-50 cursor-pointer" onClick={() => void resolveSettings(name, 'local')}>Compartir este dispositivo</button>
          <button disabled={syncing} className="min-h-11 rounded-lg border border-slate-400 px-3 disabled:opacity-50 cursor-pointer" onClick={() => void resolveSettings(name, 'remote')}>Usar nube</button>
        </div>
      </div>)}
      <div className="flex flex-wrap gap-3">
        <button className="min-h-11 underline cursor-pointer" onClick={() => void syncPersonalSettings()}>Reintentar sincronización</button>
        <button className="min-h-11 underline cursor-pointer" onClick={downloadSyncBackup}>Descargar copias de respaldo</button>
      </div>
    </div>}
  </section>;
}
