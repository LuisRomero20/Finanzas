import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, X, Save, RotateCcw, Sliders, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCreditLineStore } from '../store/creditLineStore';
import { useCreditCardStore } from '../store/creditCardStore';
import { useAppStore } from '../store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEntity?: string;
}

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const CreditLineConfigModal: React.FC<Props> = ({ isOpen, onClose, initialEntity }) => {
  const { lines, labels, setCreditLine, setAccountLabel, resetDefaults } = useCreditLineStore();
  const { cards } = useCreditCardStore();
  const { agregarNotificacion } = useAppStore();

  const [activeTab, setActiveTab] = useState<'tarjetas' | 'cuentas'>('tarjetas');
  const [tempLines, setTempLines] = useState<Record<string, number>>({});
  const [tempLabels, setTempLabels] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sincronizar estado temporal al abrir sin sobrescribir datos guardados
  useEffect(() => {
    if (isOpen) {
      setTempLines({ ...lines });
      setTempLabels({ ...labels });
      setValidationError(null);

      // Si initialEntity es una cuenta de banco, abrir la pestaña de cuentas
      if (initialEntity && /^(Interbank|BCP)$/i.test(initialEntity)) {
        setActiveTab('cuentas');
      } else {
        setActiveTab('tarjetas');
      }
    }
  }, [isOpen, lines, labels, initialEntity]);

  if (!isOpen) return null;

  // Tarjetas de crédito reconocidas
  const creditCardEntities = cards.length > 0
    ? cards.map(c => c.entity)
    : ['BBVA Bfree', 'Interbank Amex', 'Ripley'];

  // Cuentas de liquidez / débito
  const bankAccountEntities = ['Interbank', 'BCP'];

  const handleSave = () => {
    // Validar que los importes sean números finitos y no negativos
    for (const [ent, amount] of Object.entries(tempLines)) {
      if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
        setValidationError(`El límite para ${ent} debe ser un monto válido mayor o igual a cero.`);
        return;
      }
    }

    Object.entries(tempLines).forEach(([ent, amount]) => {
      setCreditLine(ent, Math.max(0, amount));
    });
    Object.entries(tempLabels).forEach(([ent, label]) => {
      setAccountLabel(ent, label.trim());
    });

    agregarNotificacion('Líneas de crédito y etiquetas actualizadas correctamente.', 'success');
    onClose();
  };

  const handleReset = () => {
    resetDefaults();
    agregarNotificacion('Líneas de crédito restablecidas a valores de fábrica.', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0D1518] rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh]">
        
        {/* Cabecera Compacta */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Sliders size={19} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Líneas de Crédito & Cuentas
              </h3>
              <p className="text-[11px] text-slate-400">
                Ajusta los límites autorizados y etiquetas identificadoras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector de Pestañas: Tarjetas vs Cuentas */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('tarjetas')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                activeTab === 'tarjetas'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard size={14} />
              <span>Tarjetas de Crédito</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cuentas')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                activeTab === 'cuentas'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet size={14} />
              <span>Cuentas Bancarias</span>
            </button>
          </div>
        </div>

        {/* Mensaje de validación si existe */}
        {validationError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle size={15} className="shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Cuerpo Desplazable del Formulario */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          
          {/* TAB 1: TARJETAS DE CRÉDITO */}
          {activeTab === 'tarjetas' && (
            <div className="space-y-4">
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                <span>
                  Los botones rápidos modifican únicamente el borrador. Haz clic en «Guardar Cambios» para confirmar.
                </span>
              </div>

              {creditCardEntities.map((ent) => {
                const matchingCard = cards.find(c => c.entity === ent);
                const currentLine = tempLines[ent] ?? lines[ent] ?? (matchingCard?.creditLine || 1000);
                const currentLabel = tempLabels[ent] ?? labels[ent] ?? '';
                const isHighlight = initialEntity === ent;
                const referenceLine = matchingCard?.referenceCreditLine ?? matchingCard?.creditLine;

                return (
                  <div
                    key={ent}
                    className={`p-4 rounded-2xl border transition ${
                      isHighlight
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <CreditCard size={18} className="text-blue-500 shrink-0" />
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">{ent}</span>
                          {referenceLine !== undefined && (
                            <span className="text-[10px] text-slate-400">
                              Línea Referencial: <strong>{fmt.format(referenceLine)}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={currentLabel}
                        onChange={(e) => setTempLabels({ ...tempLabels, [ent]: e.target.value })}
                        placeholder="Alias (ej. Tarjeta Personal)"
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none max-w-[200px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Línea Autorizada:</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                            S/
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={currentLine === 0 ? '' : currentLine}
                            onChange={(e) => {
                              setValidationError(null);
                              setTempLines({
                                ...tempLines,
                                [ent]: Math.max(0, Number(e.target.value) || 0),
                              });
                            }}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                          />
                        </div>
                      </div>

                      {/* Presets Rápidos — modifican solo el borrador */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Rápidos:</span>
                        {[700, 1000, 2000, 3000, 5000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setValidationError(null);
                              setTempLines({ ...tempLines, [ent]: preset });
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer min-h-[30px] ${
                              currentLine === preset
                                ? 'bg-blue-600 text-white border-blue-600'
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
          )}

          {/* TAB 2: CUENTAS BANCARIAS */}
          {activeTab === 'cuentas' && (
            <div className="space-y-4">
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Wallet size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Las cuentas bancarias representan dinero líquido en débito. Aquí puedes asignarles nombres amigables o alias.
                </span>
              </div>

              {bankAccountEntities.map((ent) => {
                const currentLabel = tempLabels[ent] ?? labels[ent] ?? '';
                const isHighlight = initialEntity === ent;

                return (
                  <div
                    key={ent}
                    className={`p-4 rounded-2xl border transition ${
                      isHighlight
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Wallet size={18} className="text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">{ent}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Cuenta de Débito / Ahorros
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">
                        Nombre o Alias para Reportes:
                      </label>
                      <input
                        type="text"
                        value={currentLabel}
                        onChange={(e) => setTempLabels({ ...tempLabels, [ent]: e.target.value })}
                        placeholder={ent === 'Interbank' ? 'Cuenta Sueldo Principal' : 'Ahorros BCP'}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Accesible con Safe Area de iOS */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer min-h-[44px]"
          >
            <RotateCcw size={14} />
            <span>Restablecer</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition cursor-pointer min-h-[44px]"
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
