import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  CreditCard,
  TrendingDown,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  extractTextFromPDF,
  extractTextFromExcel,
  parseStatementText,
  reconcileStatement,
  type StatementData,
  type ReconciliationReport,
} from '../utils/statementParser';
import { masterTransactions } from '../utils/masterData';
import { useCardStatementStore } from '../store/cardStatementStore';
import { useFinanceStore } from '../store/financeStore';
import { useAppStore } from '../store';
import { Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCard?: string;
  onDebtUpdated?: (cardEntity: string, finalDebt: number) => void;
}

const AVAILABLE_CARDS = [
  { id: 'Interbank Amex', name: 'Interbank Amex', color: 'from-blue-600 to-blue-800' },
  { id: 'BBVA Bfree', name: 'BBVA Bfree', color: 'from-sky-600 to-sky-800' },
  { id: 'Ripley', name: 'Ripley', color: 'from-purple-600 to-purple-800' },
];

const fmt = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const StatementImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialCard,
  onDebtUpdated,
}) => {
  const { saveVerifiedStatement } = useCardStatementStore();
  const { addTransaction } = useFinanceStore();
  const { agregarNotificacion } = useAppStore();

  // Estados del wizard
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [selectedCard, setSelectedCard] = useState<string>(initialCard || 'Interbank Amex');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('76220504');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de conciliación
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'stmt_only' | 'app_only'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [adjustedDebt, setAdjustedDebt] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedMissingIndexes, setSelectedMissingIndexes] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleProcessDocument = async () => {
    if (!file) {
      setErrorMsg('Por favor selecciona o arrastra un archivo de estado de cuenta.');
      return;
    }

    setStep('analyzing');
    setErrorMsg(null);

    try {
      let rawText = '';
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name);

      if (isPdf) {
        rawText = await extractTextFromPDF(file, password.trim() || undefined);
      } else if (isExcel) {
        const { text } = await extractTextFromExcel(file);
        rawText = text;
      } else {
        // Archivo de texto plano
        rawText = await file.text();
      }

      // Parsear datos del texto
      const parsedData = parseStatementText(rawText, file.name);

      // Auto-seleccionar tarjeta si el banco fue detectado y el usuario no lo forzó
      let targetCard = selectedCard;
      if (parsedData.entidadDetectada && !initialCard) {
        targetCard = parsedData.entidadDetectada;
        setSelectedCard(parsedData.entidadDetectada);
      }

      // Conciliar con transacciones del sistema
      const reconciliation = reconcileStatement(parsedData, masterTransactions, targetCard);

      setReport(reconciliation);
      setAdjustedDebt(reconciliation.deudaFinalEstadoCuenta);
      setStep('review');
    } catch (err: any) {
      console.error('Error al procesar estado de cuenta:', err);
      setStep('upload');
      if (err.message === 'PASSWORD_REQUIRED' || err.message?.includes('password')) {
        setErrorMsg('El PDF está protegido con contraseña. Verifica que la contraseña ingresada sea la correcta (DNI).');
      } else {
        setErrorMsg(`No se pudo leer el archivo: ${err.message || 'Error de formato desconocido'}`);
      }
    }
  };

  const handleConfirmFinalDebt = () => {
    if (!report || adjustedDebt === null) return;
    setIsUpdating(true);

    const now = new Date();
    const cycleKey = `${report.cardEntity}_${report.statementData.fechaVencimiento || report.statementData.fechaCorte || now.toISOString().slice(0, 10)}`;

    saveVerifiedStatement({
      id: `stmt-${Date.now()}`,
      cardEntity: report.cardEntity,
      cycleKey,
      finalDebt: adjustedDebt,
      minPayment: report.statementData.pagoMinimo,
      dueDate: report.statementData.fechaVencimiento,
      cutoffDate: report.statementData.fechaCorte,
      periodStart: report.statementData.periodoInicio,
      periodEnd: report.statementData.periodoFin,
      fileName: report.statementData.nombreArchivo,
      matchedCount: report.matches.filter(m => m.status === 'matched').length,
      totalStatementItems: report.statementData.movimientos.length,
      totalAppItems: report.appTransactions.length,
      totalStatementCargos: report.totalStatementCargos,
      totalAppCargos: report.totalAppCargos,
      diferenciaGastos: report.diferenciaGastos,
      verifiedAt: now.toISOString(),
    });

    if (onDebtUpdated) {
      onDebtUpdated(report.cardEntity, adjustedDebt);
    }

    setTimeout(() => {
      setIsUpdating(false);
      onClose();
    }, 600);
  };

  // Filtrar movimientos según pestaña activa y búsqueda
  const filteredMatches = report?.matches.filter(m => {
    if (activeTab === 'matched' && m.status !== 'matched') return false;
    if (activeTab === 'stmt_only' && m.status !== 'statement_only') return false;
    if (activeTab === 'app_only' && m.status !== 'app_only') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchStmt = m.statementMovement.concepto.toLowerCase().includes(q) ||
        m.statementMovement.monto.toString().includes(q);
      const matchApp = m.appTransaction?.Concepto.toLowerCase().includes(q) ||
        m.appTransaction?.Monto.toString().includes(q);
      return matchStmt || matchApp;
    }
    return true;
  }) || [];

  const handleToggleSelectMissing = (index: number) => {
    setSelectedMissingIndexes(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAllMissing = () => {
    if (!report) return;
    const stmtOnlyIndices = report.matches
      .map((m, idx) => m.status === 'statement_only' ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (selectedMissingIndexes.size === stmtOnlyIndices.length) {
      setSelectedMissingIndexes(new Set());
    } else {
      setSelectedMissingIndexes(new Set(stmtOnlyIndices));
    }
  };

  const handleImportMissingTransactions = () => {
    if (!report || selectedMissingIndexes.size === 0) return;

    let importedCount = 0;
    const updatedMatches = [...report.matches];

    selectedMissingIndexes.forEach(idx => {
      const matchItem = updatedMatches[idx];
      if (matchItem && matchItem.status === 'statement_only') {
        const stmt = matchItem.statementMovement;
        const newTx = addTransaction({
          Tipo: 'Egreso',
          Fecha: stmt.fecha || new Date().toISOString().slice(0, 10),
          Categoria: 'Gasto',
          Concepto: stmt.concepto,
          Monto: stmt.monto,
          Entidad: report.cardEntity,
        });

        matchItem.status = 'matched';
        matchItem.appTransaction = newTx;
        importedCount++;
      }
    });

    setReport({
      ...report,
      matches: updatedMatches,
    });

    setSelectedMissingIndexes(new Set());
    agregarNotificacion(`✅ Se importaron ${importedCount} gastos a FinPer y se reconciliaron con éxito.`, 'success');
  };

  const matchedCount = report?.matches.filter(m => m.status === 'matched').length || 0;
  const stmtOnlyCount = report?.matches.filter(m => m.status === 'statement_only').length || 0;
  const appOnlyCount = report?.matches.filter(m => m.status === 'app_only').length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#11191D] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="bg-[#0F2A1D] dark:bg-[#07130D] text-white px-6 py-4 flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <FileText className="text-emerald-400" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Importar Estado de Cuenta Oficial</h2>
              <p className="text-xs text-emerald-200/80">
                Lectura inteligente, conciliación de consumos y actualización directa de la deuda oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: UPLOAD & CONFIGURATION */}
          {step === 'upload' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Tarjeta Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  1. Selecciona la Tarjeta de Crédito
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AVAILABLE_CARDS.map(card => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedCard(card.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        selectedCard === card.id
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white shrink-0 shadow-sm`}>
                        <CreditCard size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{card.name}</p>
                        <p className="text-xs text-slate-400">Banco / Entidad</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subida de Archivo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  2. Carga tu Estado de Cuenta (PDF, Excel o CSV)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : file
                      ? 'border-green-400 dark:border-green-600 bg-green-50/20 dark:bg-green-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.xls,.csv,.txt"
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full mb-3">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar de archivo
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full mb-3 shadow-inner">
                        <UploadCloud size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Arrastra tu archivo PDF o Excel aquí, o haz clic para explorar
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Formatos soportados: PDF protegido, Excel (.xlsx, .xls) o CSV
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contraseña del PDF */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock size={14} className="text-slate-500" />
                    Contraseña del PDF (Si está encriptado)
                  </label>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Clave DNI</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ej. 76220504"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <HelpCircle size={12} />
                  Los bancos peruanos suelen proteger los estados de cuenta con los 8 dígitos del DNI.
                </p>
              </div>

              {/* Error Box */}
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-3 text-sm animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error al procesar documento</p>
                    <p className="text-xs mt-0.5 text-red-600 dark:text-red-400">{errorMsg}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ANALYZING SPINNER */}
          {step === 'analyzing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Leyendo y Desencriptando Documento...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Extrayendo fecha de corte, deuda total a pagar y comparando consumos contra el registro de FinPer.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & RECONCILIATION */}
          {step === 'review' && report && (
            <div className="space-y-6">
              
              {/* Header Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Deuda Final Estado de Cuenta */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Deuda Final del Banco</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-3xl font-black text-blue-900 dark:text-blue-200 tracking-tight">
                      {fmt.format(report.deudaFinalEstadoCuenta)}
                    </p>
                  </div>
                  <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-1">
                    {report.statementData.pagoMinimo ? `Pago mínimo: ${fmt.format(report.statementData.pagoMinimo)}` : 'Saldo total a pagar extraído del PDF'}
                  </p>
                </div>

                {/* 2. Total Conciliado en FinPer */}
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Consumos en FinPer (Ciclo)</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white mt-2 tracking-tight">
                    {fmt.format(report.totalMatchedFinPer > 0 ? report.totalMatchedFinPer : report.totalAppCargos)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {matchedCount} consumos de tarjeta conciliados
                  </p>
                </div>

                {/* 3. Discrepancia / Diferencia */}
                <div className={`rounded-2xl p-5 border shadow-sm ${
                  Math.abs(report.diferenciaGastos) < 1
                    ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                }`}>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {Math.abs(report.diferenciaGastos) < 1 ? 'Conciliación Exacta' : 'Diferencia / Ajuste'}
                  </p>
                  <p className="text-3xl font-black mt-2 tracking-tight">
                    {report.diferenciaGastos >= 0 ? '+' : ''}{fmt.format(report.diferenciaGastos)}
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    {Math.abs(report.diferenciaGastos) < 1
                      ? 'Todos los gastos cuadran exactamente'
                      : 'Comisión / Seguro de desgravamen del banco'}
                  </p>
                </div>
              </div>

              {/* Fechas Extraídas */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Tarjeta detectada:</span>
                  <span className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded font-medium text-blue-700 dark:text-blue-300">
                    {report.cardEntity}
                  </span>
                </div>
                {report.statementData.fechaCorte && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Clock size={13} className="text-slate-400" />
                    <span>Corte: <strong>{report.statementData.fechaCorte}</strong></span>
                  </div>
                )}
                {report.statementData.fechaVencimiento && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Clock size={13} className="text-red-500" />
                    <span>Vencimiento: <strong className="text-red-600 dark:text-red-400">{report.statementData.fechaVencimiento}</strong></span>
                  </div>
                )}
                <div className="text-slate-400">
                  Archivo: <span className="font-medium text-slate-600 dark:text-slate-300">{report.statementData.nombreArchivo}</span>
                </div>
              </div>

              {/* Tabla de Comparación y Filtros */}
              <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                
                {/* Tabs & Search Header */}
                <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        activeTab === 'all'
                          ? 'bg-slate-800 dark:bg-slate-700 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      Todos ({report.matches.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('matched')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        activeTab === 'matched'
                          ? 'bg-green-600 text-white'
                          : 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/40'
                      }`}
                    >
                      <span>🟢 Coincidentes</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">{matchedCount}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('stmt_only')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        activeTab === 'stmt_only'
                          ? 'bg-amber-600 text-white'
                          : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      }`}
                    >
                      <span>🟡 Solo en Estado Cuenta</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">{stmtOnlyCount}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('app_only')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        activeTab === 'app_only'
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                      }`}
                    >
                      <span>🔵 Solo en FinPer</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">{appOnlyCount}</span>
                    </button>
                  </div>

                  {/* Buscador y Botón de Importación */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedMissingIndexes.size > 0 && (
                      <button
                        type="button"
                        onClick={handleImportMissingTransactions}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs transition animate-in fade-in"
                      >
                        <Plus size={13} />
                        <span>Importar ({selectedMissingIndexes.size}) a FinPer</span>
                      </button>
                    )}

                    {stmtOnlyCount > 0 && activeTab === 'stmt_only' && (
                      <button
                        type="button"
                        onClick={handleSelectAllMissing}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition"
                      >
                        {selectedMissingIndexes.size === stmtOnlyCount ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </button>
                    )}

                    <div className="relative shrink-0">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar movimiento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de Movimientos Comparados */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-64 overflow-y-auto">
                  {filteredMatches.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No hay movimientos que coincidan con los filtros aplicados.
                    </div>
                  ) : (
                    filteredMatches.map((m, idx) => {
                      const realIndex = report.matches.indexOf(m);
                      const isStmtOnly = m.status === 'statement_only';
                      const isChecked = selectedMissingIndexes.has(realIndex);

                      return (
                        <div key={idx} className="p-3 hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox para importar si es de statement_only */}
                            {isStmtOnly && (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectMissing(realIndex)}
                                className="accent-emerald-600 w-4 h-4 rounded cursor-pointer shrink-0"
                                title="Seleccionar para importar a FinPer"
                              />
                            )}

                            {/* Badge de Estado */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              m.status === 'matched'
                                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : m.status === 'statement_only'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}>
                              {m.status === 'matched' ? 'Coincide' : m.status === 'statement_only' ? 'Banco' : 'FinPer'}
                            </span>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {m.status === 'app_only' ? m.appTransaction?.Concepto : m.statementMovement.concepto}
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                {m.status === 'app_only' ? m.appTransaction?.Fecha : m.statementMovement.fecha}
                                {m.status === 'matched' && m.appTransaction && (
                                  <span className="text-slate-500 dark:text-slate-400 ml-2">
                                    ↔ Registrado como: <strong className="text-slate-700 dark:text-slate-300">{m.appTransaction.Concepto}</strong> ({m.appTransaction.Fecha})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                              {fmt.format(m.status === 'app_only' ? (m.appTransaction?.Monto || 0) : m.statementMovement.monto)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Ajuste manual o confirmación de Deuda Final */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/70 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Modificar Deuda Final Oficial de la Tarjeta
                  </p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-0.5">
                    Al confirmar, se actualizará el saldo oficial a pagar de <strong>{report.cardEntity}</strong> con el monto del estado de cuenta.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white dark:bg-slate-800 border border-blue-300 dark:border-slate-600 rounded-xl px-3 py-1.5 shadow-inner">
                    <span className="text-xs font-bold text-slate-400 mr-1.5">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustedDebt ?? ''}
                      onChange={(e) => setAdjustedDebt(parseFloat(e.target.value) || 0)}
                      className="w-24 text-sm font-bold text-blue-950 dark:text-white bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-[#0c1417] border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          {step === 'review' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
              >
                ← Cargar otro archivo
              </button>

              <button
                type="button"
                onClick={handleConfirmFinalDebt}
                disabled={isUpdating}
                className="bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Guardando Deuda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Actualizar Deuda Final ({fmt.format(adjustedDebt || 0)})</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleProcessDocument}
                disabled={!file || step === 'analyzing'}
                className="bg-[#0F2A1D] dark:bg-emerald-700 hover:bg-black dark:hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <span>Analizar y Comparar</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
