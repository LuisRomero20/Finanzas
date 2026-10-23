import React, { useState } from 'react';
import { ShieldAlert, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { TARGET_PROJECT_REF } from '../lib/supabase';

export const DevGuardrailBanner: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  // Solo mostrar en entornos locales de desarrollo (localhost o dev server)
  const isDev =
    Boolean(import.meta.env.DEV) ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

  if (!isDev) return null;

  return (
    <aside
      className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 text-xs shadow-sm overflow-hidden"
      aria-label="Advertencia de entorno local de desarrollo"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
            <ShieldAlert size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold tracking-tight text-amber-900 dark:text-amber-100">
                MODO DESARROLLO LOCAL ({window.location.hostname}:5173)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950">
                BD PRODUCCIÓN EN VIVO
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                {TARGET_PROJECT_REF}
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 truncate mt-0.5">
              Conectado a la base de datos real. <strong>No registres transacciones ficticias</strong> en esta sesión local para no alterar tus 2,246 registros históricos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer shrink-0 self-end sm:self-center"
        >
          <span>{showDetails ? 'Ocultar guía' : 'Instrucciones seguras'}</span>
          {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {showDetails && (
        <div className="px-4 py-3 bg-amber-500/15 dark:bg-amber-950/60 border-t border-amber-500/20 text-[11px] space-y-2">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                ¿Cómo probar de forma segura en localhost sin contaminar tus finanzas?
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-amber-800 dark:text-amber-300">
                <li>
                  <strong>Inspección de Diferencias:</strong> Utiliza el comparador de sincronización en modo solo-lectura (no aplica cambios en la base de datos).
                </li>
                <li>
                  <strong>Herramientas de Red:</strong> En Edge (F12 → Network) verifica que no haya códigos 406. Todas las consultas opcionales devuelven código 200 con valor null.
                </li>
                <li>
                  <strong>Pruebas de Registro:</strong> Para validar mutaciones y eliminaciones, utiliza los tests automatizados (`npm test`), los cuales operan 100% aislados con mocks en memoria.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
