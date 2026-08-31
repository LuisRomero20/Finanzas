import React, { useState, useRef } from 'react';
import { useFinanceStore, type Transaction } from '../store/financeStore';
import { useBudgetStore } from '../store/budgetStore';
import { useAppStore } from '../store';
import * as XLSX from 'xlsx';
import {
  X,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { transactions, setAllTransactions } = useFinanceStore();
  const { budgets, setAllBudgets } = useBudgetStore();
  const { agregarNotificacion } = useAppStore();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [pendingImportData, setPendingImportData] = useState<{ transactions: Transaction[]; budgets?: Record<string, number> } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Exportar a JSON
  const handleExportJSON = () => {
    try {
      const backupData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        totalTransactions: transactions.length,
        transactions,
        budgets,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finper_respaldo_${todayStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      agregarNotificacion('💾 Respaldo JSON descargado con éxito.', 'success');
    } catch (e: any) {
      setErrorMsg(`Error al exportar JSON: ${e.message}`);
    }
  };

  // 2. Exportar a Excel
  const handleExportExcel = () => {
    try {
      const exportRows = transactions.map(t => ({
        ID: t.id,
        Tipo: t.Tipo,
        Fecha: t.Fecha,
        Mes: t.Mes,
        Categoria: t.Categoria,
        Concepto: t.Concepto,
        Monto: t.Monto,
        Entidad: t.Entidad,
        Estado: t.estado || 'confirmado',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

      // Auto-fit column widths
      const colWidths = [
        { wch: 12 }, // ID
        { wch: 10 }, // Tipo
        { wch: 12 }, // Fecha
        { wch: 12 }, // Mes
        { wch: 16 }, // Categoria
        { wch: 28 }, // Concepto
        { wch: 12 }, // Monto
        { wch: 18 }, // Entidad
        { wch: 14 }, // Estado
      ];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `finper_maestro_${todayStr}.xlsx`);
      agregarNotificacion('📊 Excel generado y descargado con éxito.', 'success');
    } catch (e: any) {
      setErrorMsg(`Error al exportar Excel: ${e.message}`);
    }
  };

  // 3. Cargar archivo JSON para restaurar
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setImportStatus('Leyendo archivo de respaldo...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        let list: Transaction[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.transactions)) {
          list = data.transactions;
        }

        if (list.length === 0) {
          setErrorMsg('El archivo no contiene transacciones válidas.');
          setPendingImportData(null);
          return;
        }

        setPreviewCount(list.length);
        setPendingImportData({
          transactions: list,
          budgets: data.budgets,
        });
        setImportStatus(`Archivo válido. Contiene ${list.length} registros listos para restaurar.`);
      } catch (err: any) {
        setErrorMsg(`Formato de archivo inválido: ${err.message}`);
        setPendingImportData(null);
      }
    };
    reader.readAsText(file);
  };

  // 4. Confirmar restauración
  const handleConfirmRestore = () => {
    if (!pendingImportData) return;

    setAllTransactions(pendingImportData.transactions);
    if (pendingImportData.budgets) {
      setAllBudgets(pendingImportData.budgets);
    }

    agregarNotificacion(`✅ Se restauraron ${pendingImportData.transactions.length} transacciones correctamente.`, 'success');
    setPendingImportData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#11191D] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="bg-[#0F2A1D] dark:bg-[#07130D] text-white px-6 py-4 flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Database className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">Centro de Respaldos & Exportación</h2>
              <p className="text-xs text-emerald-200/80">Descarga copias de seguridad o restaura tu historial en 1 clic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Opción 1: Exportar */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Download size={14} className="text-emerald-600" />
              <span>1. Descargar Copia de Seguridad ({transactions.length} registros)</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportExcel}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <p className="font-bold text-xs text-emerald-950 dark:text-emerald-300">Descargar Excel</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Formato .xlsx editable</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                  <FileCode size={20} />
                </div>
                <div>
                  <p className="font-bold text-xs text-blue-950 dark:text-blue-300">Descargar JSON</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Copia completa de sistema</p>
                </div>
              </button>
            </div>
          </div>

          {/* Opción 2: Restaurar */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Upload size={14} className="text-indigo-600" />
              <span>2. Restaurar Copia de Seguridad</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!pendingImportData ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <Upload size={20} className="text-slate-400 mb-0.5" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Seleccionar archivo de respaldo .json
                </span>
                <span className="text-[10px] text-slate-400">
                  Sobrescribe los datos en memoria con el archivo cargado
                </span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
                  <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Respaldo listo para aplicar ({previewCount} registros)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Confirmar y Restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingImportData(null);
                      setPreviewCount(null);
                    }}
                    className="px-3 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0c1417] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Datos procesados de forma 100% segura en tu navegador</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
