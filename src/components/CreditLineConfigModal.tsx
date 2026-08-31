import React, { useState } from 'react';
import { CreditCard, X, Save, RotateCcw, Check, Sparkles, Sliders } from 'lucide-react';
import { useCreditLineStore } from '../store/creditLineStore';
import { useAppStore } from '../store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEntity?: string;
}

export const CreditLineConfigModal: React.FC<Props> = ({ isOpen, onClose, initialEntity }) => {
  const { lines, labels, setCreditLine, setAccountLabel, resetDefaults } = useCreditLineStore();
  const { agregarNotificacion } = useAppStore();

  const [tempLines, setTempLines] = useState<Record<string, number>>({});
  const [tempLabels, setTempLabels] = useState<Record<string, string>>({});

  // Sincronizar estado temporal al abrir
  React.useEffect(() => {
    if (isOpen) {
      setTempLines({ ...lines });
      setTempLabels({ ...labels });
    }
  }, [isOpen, lines, labels]);

  if (!isOpen) return null;

  const cardEntities = ['BBVA Bfree', 'Interbank Amex', 'Ripley', 'Interbank', 'BCP'];

  const handleSave = () => {
    Object.entries(tempLines).forEach(([ent, amount]) => {
      setCreditLine(ent, amount);
    });
    Object.entries(tempLabels).forEach(([ent, label]) => {
      setAccountLabel(ent, label);
    });

    agregarNotificacion({
      tipo: 'success',
      mensaje: 'Líneas de crédito y etiquetas actualizadas correctamente.',
    });
    onClose();
  };

  const handleReset = () => {
    resetDefaults();
    agregarNotificacion({
      tipo: 'info',
      mensaje: 'Líneas de crédito restablecidas a valores de fábrica.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0D1518] rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Configurar Líneas de Crédito
              </h3>
              <p className="text-xs text-slate-400">
                Ajusta manualmente los límites autorizados de cada tarjeta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario de Líneas */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {cardEntities.map((ent) => {
            const currentLine = tempLines[ent] ?? lines[ent] ?? 0;
            const currentLabel = tempLabels[ent] ?? labels[ent] ?? '';
            const isHighlight = initialEntity === ent;

            return (
              <div
                key={ent}
                className={`p-4 rounded-2xl border transition ${
                  isHighlight
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-500" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{ent}</span>
                  </div>

                  <input
                    type="text"
                    value={currentLabel}
                    onChange={(e) => setTempLabels({ ...tempLabels, [ent]: e.target.value })}
                    placeholder="Etiqueta (ej. Tarjeta Crédito)"
                    className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none max-w-[180px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Línea Autorizada (S/):</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        S/
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={currentLine === 0 ? '' : currentLine}
                        onChange={(e) =>
                          setTempLines({
                            ...tempLines,
                            [ent]: Math.max(0, Number(e.target.value)),
                          })
                        }
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Presets Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Rápidos:</span>
                    {[2000, 3000, 5000, 8000, 10000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTempLines({ ...tempLines, [ent]: preset })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                          currentLine === preset
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        S/ {preset.toLocaleString('es-PE')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Restablecer</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition cursor-pointer"
            >
              <Save size={14} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
