import React, { useState } from 'react';
import { X, CreditCard, Calendar, DollarSign, Palette, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCreditCardStore } from '../store/creditCardStore';
import { useAppStore } from '../store';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardAdded?: (cardName: string) => void;
}

const COLOR_OPTIONS: Array<{
  id: 'blue' | 'sky' | 'purple' | 'emerald' | 'amber' | 'rose';
  name: string;
  bgClass: string;
  borderClass: string;
}> = [
  { id: 'blue', name: 'Azul Real (Amex)', bgClass: 'bg-blue-600', borderClass: 'border-blue-400' },
  { id: 'sky', name: 'Celeste (BBVA)', bgClass: 'bg-sky-600', borderClass: 'border-sky-400' },
  { id: 'purple', name: 'Púrpura (Ripley)', bgClass: 'bg-purple-600', borderClass: 'border-purple-400' },
  { id: 'emerald', name: 'Esmeralda', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400' },
  { id: 'amber', name: 'Ámbar / Oro', bgClass: 'bg-amber-600', borderClass: 'border-amber-400' },
  { id: 'rose', name: 'Rosa / Ruby', bgClass: 'bg-rose-600', borderClass: 'border-rose-400' },
];

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onCardAdded }) => {
  const { addCard, cards } = useCreditCardStore();
  const { agregarNotificacion } = useAppStore();

  const [name, setName] = useState('');
  const [cycleStartDay, setCycleStartDay] = useState<number>(10);
  const [paymentDay, setPaymentDay] = useState<number>(5);
  const [lineaCredito, setLineaCredito] = useState<number>(3000);
  const [colorTheme, setColorTheme] = useState<'blue' | 'sky' | 'purple' | 'emerald' | 'amber' | 'rose'>('emerald');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Ingresa un nombre para la tarjeta.');
      return;
    }

    // Verificar si ya existe una tarjeta con este nombre
    const exists = cards.some(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase() || c.entity.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Ya existe una tarjeta registrada con el nombre "${cleanName}".`);
      return;
    }

    if (cycleStartDay < 1 || cycleStartDay > 31) {
      setErrorMsg('El día de corte debe estar entre 1 y 31.');
      return;
    }

    if (paymentDay < 1 || paymentDay > 31) {
      setErrorMsg('El día de pago debe estar entre 1 y 31.');
      return;
    }

    const created = addCard({
      name: cleanName,
      cycleStartDay: Number(cycleStartDay),
      paymentDay: Number(paymentDay),
      lineaCredito: Number(lineaCredito) || 0,
      colorTheme,
    });

    agregarNotificacion(`💳 Tarjeta "${created.name}" agregada con éxito (Corte: día ${created.cycleStartDay} · Pago: día ${created.paymentDay}).`, 'success');
    if (onCardAdded) onCardAdded(created.name);

    // Resetear formulario y cerrar
    setName('');
    setCycleStartDay(10);
    setPaymentDay(5);
    setLineaCredito(3000);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#11191D] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Agregar Nueva Tarjeta
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configura ciclos de facturación, pago y línea asignada.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nombre de la tarjeta */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Tarjeta / Entidad
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. BCP Visa Signature, Scotiabank Smart..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Ciclos: Día de corte y Día de pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-emerald-500" />
                <span>Día de Corte</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={cycleStartDay}
                onChange={(e) => setCycleStartDay(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Día que cierra el ciclo</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-emerald-500" />
                <span>Día Límite de Pago</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentDay}
                onChange={(e) => setPaymentDay(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Día de vencimiento</span>
            </div>
          </div>

          {/* Línea de crédito */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-500" />
              <span>Línea de Crédito (S/)</span>
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={lineaCredito}
              onChange={(e) => setLineaCredito(parseFloat(e.target.value) || 0)}
              placeholder="3000"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Selector de tema de color */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Palette size={12} className="text-emerald-500" />
              <span>Estilo y Color de la Tarjeta</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColorTheme(opt.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                    colorTheme === opt.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${opt.bgClass} shrink-0`} />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {opt.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer botones */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Guardar Tarjeta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
