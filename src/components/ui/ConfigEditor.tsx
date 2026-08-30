import React from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';

type Props = {
  entities: string[];
  overrides: Record<string, number>;
  labels: Record<string, string>;
  onChangeOverride: (ent: string, value: string) => void;
  onChangeLabel: (ent: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export const ConfigEditor: React.FC<Props> = ({ entities, overrides, labels, onChangeOverride, onChangeLabel, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#11191D] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-3xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="bg-[#0F2A1D] dark:bg-[#07130D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <SlidersHorizontal className="text-emerald-400" size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Configuración de Cuentas & Líneas</h2>
              <p className="text-xs text-emerald-200/70">Personaliza las líneas de crédito asignadas y etiquetas por entidad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities.map(ent => (
              <div key={ent} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{ent}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Entidad</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Línea de Crédito (S/)</label>
                    <input 
                      inputMode="numeric" 
                      pattern="[0-9.,]*" 
                      type="text" 
                      value={String(overrides[ent] ?? 0)} 
                      onChange={(e) => onChangeOverride(ent, e.target.value)} 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">Etiqueta Personalizada</label>
                    <input 
                      type="text" 
                      value={labels[ent] ?? ''} 
                      onChange={(e) => onChangeLabel(ent, e.target.value)} 
                      placeholder="Ej. Débito Principal, Tarjeta Viajes..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={onSave} 
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Guardar Cambios</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfigEditor;
