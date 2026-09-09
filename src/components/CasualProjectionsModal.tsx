import React, { useState } from 'react';
import { usePendingPaymentsStore } from '../store/pendingPaymentsStore';
import { useFinanceStore, getMonthNameFromDate } from '../store/financeStore';
import { useAppStore } from '../store';
import { CATEGORIAS_PERSONALES } from '../utils/categoryClassification';
import {
  Sparkles,
  X,
  Plus,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface CasualProjectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSuccess?: (concepto: string, monto: number) => void;
}

const CASUAL_PRESETS = [
  { concepto: 'Futbol', monto: 10, categoria: 'Gustos & Ocio', entidad: 'Interbank', icon: '⚽' },
  { concepto: 'Bus', monto: 10, categoria: 'Transporte & Movilidad', entidad: 'Interbank', icon: '🚌' },
  { concepto: 'Taxi', monto: 40, categoria: 'Transporte & Movilidad', entidad: 'Interbank Amex', icon: '🚕' },
  { concepto: 'Broaster', monto: 15, categoria: 'Comida & Restaurantes', entidad: 'Interbank', icon: '🍗' },
  { concepto: 'Gaseosa', monto: 5, categoria: 'Supermercado & Alimentos', entidad: 'Interbank', icon: '🥤' },
  { concepto: 'Vodka', monto: 40, categoria: 'Gustos & Ocio', entidad: 'Ripley', icon: '🍸' },
  { concepto: 'Pastilla Madre', monto: 120, categoria: 'Salud & Farmacia', entidad: 'Ripley', icon: '💊' },
  { concepto: 'Luz', monto: 112, categoria: 'Servicios Básicos & Facturas', entidad: 'BBVA Bfree', icon: '💡' },
  { concepto: 'Corte de Cabello', monto: 20, categoria: 'Cuidado Personal & Aseo', entidad: 'Interbank', icon: '✂️' },
  { concepto: 'Café', monto: 16, categoria: 'Comida & Restaurantes', entidad: 'Interbank', icon: '☕' },
];

const ENTIDADES_DISPONIBLES = [
  'Interbank',
  'Ripley',
  'BBVA Bfree',
  'Interbank Amex',
  'BCP',
  'Scotiabank',
  'Efectivo',
];

export const CasualProjectionsModal: React.FC<CasualProjectionsModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onSuccess,
}) => {
  const { selectedMonth } = useFinanceStore();
  const { addPendingItem } = usePendingPaymentsStore();
  const { agregarNotificacion } = useAppStore();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState<string>(defaultDate || todayStr);
  const [concepto, setConcepto] = useState<string>('');
  const [monto, setMonto] = useState<number | string>('');
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_PERSONALES[0].nombre);
  const [entidad, setEntidad] = useState<string>('Interbank');
  const [keepOpen, setKeepOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof CASUAL_PRESETS[0]) => {
    setConcepto(preset.concepto);
    setMonto(preset.monto);
    setCategoria(preset.categoria);
    setEntidad(preset.entidad);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || Number(monto) <= 0) return;

    // Mantener el nombre del concepto limpio sin añadir sufijos como - Proy
    const finalConcept = concepto.trim().replace(/\s*-\s*proy/gi, '').trim();

    const numMonto = Number(monto);
    const mesCalculado = getMonthNameFromDate(fecha);

    addPendingItem({
      tipo: 'Egreso',
      fecha,
      concepto: finalConcept,
      categoria,
      entidad,
      monto: numMonto,
      origen: 'Proyección',
      mes: mesCalculado,
      mesStr: fecha.slice(0, 7),
    });

    agregarNotificacion(
      `✨ Proyección casual "${finalConcept}" (S/ ${numMonto.toFixed(2)}) agregada a Pagos Pendientes.`,
      'success'
    );

    if (onSuccess) {
      onSuccess(finalConcept, numMonto);
    }

    if (!keepOpen) {
      onClose();
    } else {
      setConcepto('');
      setMonto('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0F171B] border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-white relative my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-md text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Proyectar Gastos Casuales
                </h3>
                <span className="text-[10px] font-bold uppercase bg-amber-950/90 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full">
                  Mes Actual
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Programa gastos previstos en la bandeja de pendientes para el mes actual.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets Rápidos */}
        <div className="mt-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
            Gastos Comunes Frecuentes:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
            {CASUAL_PRESETS.map((preset) => (
              <button
                key={preset.concepto}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/60 rounded-xl text-xs transition text-left group"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{preset.icon}</span>
                  <span className="font-semibold text-white group-hover:text-amber-300 transition truncate">
                    {preset.concepto}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-amber-400 shrink-0 ml-1">
                  S/ {preset.monto}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Formulario de Registro */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Concepto */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Tag size={13} className="text-amber-400" />
                <span>Concepto</span>
              </label>
              <input
                type="text"
                required
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Futbol, Broaster, Taxi"
                className="w-full px-3 py-2 bg-[#070C0E] border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-white font-medium outline-none transition"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-400" />
                <span>Monto (S/)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#070C0E] border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white font-black outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-cyan-400" />
                <span>Fecha Prog.</span>
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#070C0E] border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white outline-none"
              />
            </div>

            {/* Entidad */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Building2 size={13} className="text-purple-400" />
                <span>Entidad</span>
              </label>
              <select
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#070C0E] border border-slate-700 focus:border-purple-500 rounded-xl text-xs text-white outline-none font-semibold"
              >
                {ENTIDADES_DISPONIBLES.map((ent) => (
                  <option key={ent} value={ent}>{ent}</option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#070C0E] border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
              >
                {CATEGORIAS_PERSONALES.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>
                    {cat.emoji} {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opciones */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 select-none">
              <input
                type="checkbox"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-slate-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span>Seguir agregando más</span>
            </label>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-950/40 border border-amber-400/40 transition"
            >
              <Plus size={15} />
              <span>Guardar Proyección</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
