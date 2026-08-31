import React, { useState } from 'react';
import { Target, Plus, PiggyBank, ArrowUpRight, ArrowDownRight, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { useSavingsGoalsStore, type SavingsGoal } from '../store/savingsGoalsStore';

interface Props {
  monthlySavingsCapacity?: number;
}

export const SavingsGoalsWidget: React.FC<Props> = ({ monthlySavingsCapacity = 600 }) => {
  const { goals, addGoal, depositToGoal, withdrawFromGoal, deleteGoal } = useSavingsGoalsStore();
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [activeDepositGoal, setActiveDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Form states
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    addGoal({
      title,
      emoji,
      targetAmount: Number(targetAmount),
      currentAmount: Number(initialAmount) || 0,
    });

    setTitle('');
    setTargetAmount('');
    setInitialAmount('');
    setIsNewGoalModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepositGoal || !depositAmount) return;
    depositToGoal(activeDepositGoal.id, Number(depositAmount));
    setDepositAmount('');
    setActiveDepositGoal(null);
  };

  return (
    <div className="bg-white dark:bg-[#0D1518] rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <PiggyBank size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              Metas de Ahorro & Reservas
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 uppercase tracking-wider">
                {overallProgress.toFixed(0)}% Alcanzado
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alcancías y fondos acumulativos para metas financieras
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewGoalModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const monthsToFinish =
            monthlySavingsCapacity > 0 ? Math.ceil(remaining / (monthlySavingsCapacity / goals.length)) : 0;

          return (
            <div
              key={goal.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 space-y-3.5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{goal.emoji}</span>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[150px]">
                    {goal.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => deleteGoal(goal.id)}
                  className="text-slate-300 hover:text-rose-500 transition cursor-pointer p-1"
                  title="Eliminar Meta"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Montos y Progreso */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    S/ {goal.currentAmount.toLocaleString('es-PE')}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    de S/ {goal.targetAmount.toLocaleString('es-PE')}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="h-2.5 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Estado y Tiempo Estimado */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {progress.toFixed(0)}% completado
                </span>
                {remaining > 0 && monthsToFinish > 0 && (
                  <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                    <Clock size={11} /> ~{monthsToFinish} meses
                  </span>
                )}
                {remaining === 0 && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 size={11} /> ¡Meta lograda!
                  </span>
                )}
              </div>

              {/* Botón de Abonar */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveDepositGoal(goal)}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200/70 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight size={13} />
                  <span>+ Abonar</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Crear Nueva Meta */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGoal}
            className="bg-white dark:bg-[#0D1518] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <h4 className="font-black text-slate-900 dark:text-white text-base">Crear Nueva Meta de Ahorro</h4>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Nombre de la Meta</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Fondo de Emergencia, Laptop..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Emoji</label>
                <select
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  <option value="🛡️">🛡️ Seguro</option>
                  <option value="💻">💻 Tech</option>
                  <option value="✈️">✈️ Viaje</option>
                  <option value="🚗">🚗 Auto</option>
                  <option value="🏠">🏠 Hogar</option>
                  <option value="🎓">🎓 Estudio</option>
                  <option value="🎯">🎯 Meta</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Meta (S/)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Monto Inicial (Opcional)</label>
              <input
                type="number"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewGoalModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                Guardar Meta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Abonar a Meta */}
      {activeDepositGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleDepositSubmit}
            className="bg-white dark:bg-[#0D1518] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeDepositGoal.emoji}</span>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Abonar a {activeDepositGoal.title}</h4>
                <p className="text-xs text-slate-400">Saldo actual: S/ {activeDepositGoal.currentAmount}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Monto a Abonar (S/)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                autoFocus
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="200"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-black text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDepositGoal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                Confirmar Abono
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
