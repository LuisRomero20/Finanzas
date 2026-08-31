import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowUpRight, ArrowDownRight, Command } from 'lucide-react';
import { useFinanceStore } from '../store/financeStore';
import type { Transaction } from '../utils/masterData';
import { CONCEPTO_A_CATEGORIA } from '../utils/categoryClassification';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
}

export const UniversalSearchModal: React.FC<Props> = ({ isOpen, onClose, onSelectTab }) => {
  const { transactions, setMonth } = useFinanceStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Manejar Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();
  const safeList: Transaction[] = Array.isArray(transactions) ? transactions : [];

  // Filtrar transacciones
  const filteredTransactions = normalizedQuery
    ? safeList
        .filter((t) => {
          const concepto = (t.Concepto || (t as any).concepto || '').toLowerCase();
          const entidad = (t.Entidad || (t as any).entidad || (t as any).medio || '').toLowerCase();
          const categoria = (t.Categoria || (t as any).categoria || '').toLowerCase();
          const mes = (t.Mes || (t as any).mes || '').toLowerCase();
          const montoStr = (t.Monto || (t as any).monto || '').toString();
          const mappedCat = (CONCEPTO_A_CATEGORIA[t.Concepto || (t as any).concepto] || '').toLowerCase();

          return (
            concepto.includes(normalizedQuery) ||
            entidad.includes(normalizedQuery) ||
            categoria.includes(normalizedQuery) ||
            mes.includes(normalizedQuery) ||
            montoStr.includes(normalizedQuery) ||
            mappedCat.includes(normalizedQuery)
          );
        })
        .slice(0, 15) // Top 15 resultados rápidos
    : [];

  const handleSelectTransaction = (t: Transaction) => {
    const mes = t.Mes || (t as any).mes;
    if (mes) {
      setMonth(mes);
    }
    onSelectTab('Finanzas General');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-12 sm:pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0D1518] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Barra de Búsqueda Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
          <Search size={20} className="text-emerald-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por concepto (ej. Makis, Sueldo), monto (120), tarjeta o mes..."
            className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 no-scrollbar">
          {query === '' ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Command size={32} className="mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="text-xs font-semibold">
                Escribe para buscar entre los más de <strong>700 movimientos históricos</strong>
              </p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 flex-wrap">
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900">🍔 Makis</span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900">💳 Interbank</span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900">💰 Sueldo</span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900">S/ 150</span>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No se encontraron transacciones que coincidan con "<strong>{query}</strong>".
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const concepto = t.Concepto || (t as any).concepto;
              const cat = CONCEPTO_A_CATEGORIA[concepto] || t.Categoria || (t as any).categoria || 'Gastos';
              const tipo = t.Tipo || (t as any).tipo;
              const isIncome = tipo === 'Ingreso';
              const entidad = t.Entidad || (t as any).entidad || (t as any).medio || '';
              const mes = t.Mes || (t as any).mes;
              const monto = Number(t.Monto || (t as any).monto) || 0;
              const fecha = t.Fecha || (t as any).fecha || 'Sin fecha';

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTransaction(t)}
                  className="w-full p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:border-emerald-500/40 transition flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {concepto}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="truncate">{cat}</span>
                        <span>·</span>
                        <span className="truncate">{entidad}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-500 dark:text-slate-300">{mes}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs sm:text-sm font-black ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}S/ {monto.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">{fecha}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>Selecciona un resultado para ir al mes correspondiente</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-600 dark:text-slate-300 hover:underline"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
