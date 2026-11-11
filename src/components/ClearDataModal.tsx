import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from './KPICards';
import {
  X,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
};

export const ClearDataModal: React.FC<ClearDataModalProps> = ({ isOpen, onClose }) => {
  const {
    transactions,
    selectedMonth,
    clearMonthTransactions,
    clearAllTransactions,
    resetToSpreadsheetData,
  } = useFinance();

  const [confirmStep, setConfirmStep] = useState<'none' | 'month' | 'all' | 'reset'>('none');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const [year, monthNum] = selectedMonth.split('-');
  const monthLabel = `${MONTH_NAMES_PT[monthNum] || monthNum} de ${year}`;

  const monthTransactions = transactions.filter((t) => t.month === selectedMonth);
  const monthTotalAmount = monthTransactions.reduce((acc, t) => acc + t.amount, 0);

  const handleClearMonth = async () => {
    setIsDeleting(true);
    try {
      await clearMonthTransactions(selectedMonth);
      setSuccessMessage(`Todos os ${monthTransactions.length} lançamentos de ${monthLabel} foram apagados.`);
      setConfirmStep('none');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar registros do mês.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      const count = transactions.length;
      await clearAllTransactions();
      setSuccessMessage(`Todos os ${count} lançamentos do aplicativo foram apagados com sucesso.`);
      setConfirmStep('none');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar todos os registros.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetData = async () => {
    setIsDeleting(true);
    try {
      await resetToSpreadsheetData();
      setSuccessMessage('Dados modelo originais da planilha de 2026 restaurados com sucesso.');
      setConfirmStep('none');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Erro ao restaurar dados modelo.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-800 dark:text-slate-100 my-8 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gerenciar & Apagar Registros
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Limpeza de lançamentos ou restauração de dados
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setConfirmStep('none');
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Current status summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Lançamentos em {monthLabel}:
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {monthTransactions.length} itens ({formatCurrency(monthTotalAmount)})
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Total geral no aplicativo:
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {transactions.length} itens
            </span>
          </div>
        </div>

        {/* Main options list */}
        {confirmStep === 'none' && !successMessage && (
          <div className="mt-5 space-y-3">
            
            {/* Option 1: Clear Current Month */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800 dark:text-rose-300">
                  <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Apagar Lançamentos de {monthLabel}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Exclui apenas os {monthTransactions.length} lançamentos deste mês. Metas e outros meses continuam salvos.
                </p>
              </div>

              <button
                type="button"
                disabled={monthTransactions.length === 0}
                onClick={() => setConfirmStep('month')}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-xs active:scale-95"
              >
                Apagar Mês ({monthTransactions.length})
              </button>
            </div>

            {/* Option 2: Clear All Transactions (Complete Reset) */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Zerar Todos os Lançamentos do App</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Apaga todos os {transactions.length} lançamentos de todos os meses. Deixa a lista 100% vazia para iniciar do zero.
                </p>
              </div>

              <button
                type="button"
                disabled={transactions.length === 0}
                onClick={() => setConfirmStep('all')}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-xs active:scale-95"
              >
                Zerar Tudo ({transactions.length})
              </button>
            </div>

            {/* Option 3: Reset to sample spreadsheet data */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Restaurar Dados Modelo da Planilha</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Recarrega os lançamentos e categorias de demonstração originais de Novembro de 2026.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfirmStep('reset')}
                className="shrink-0 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer shadow-xs active:scale-95"
              >
                Restaurar Modelo
              </button>
            </div>

          </div>
        )}

        {/* Confirmation Step: Month */}
        {confirmStep === 'month' && !successMessage && (
          <div className="mt-5 p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Confirmar exclusão de {monthTransactions.length} lançamentos de {monthLabel}?
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                  Esta ação removerá permanentemente todos os registros de despesas e receitas cadastrados para este mês. Essa operação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200 dark:border-rose-900/40">
              <button
                type="button"
                onClick={() => setConfirmStep('none')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleClearMonth}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isDeleting ? 'Apagando...' : `Sim, apagar ${monthTransactions.length} lançamentos`}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Step: All Transactions */}
        {confirmStep === 'all' && !successMessage && (
          <div className="mt-5 p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Tem certeza que deseja zerar TODOS os {transactions.length} lançamentos?
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Todos os lançamentos financeiros de todos os meses serão excluídos permanentemente, deixando sua base limpa para novos registros.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200 dark:border-amber-900/40">
              <button
                type="button"
                onClick={() => setConfirmStep('none')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleClearAll}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isDeleting ? 'Apagando...' : 'Sim, zerar todos os registros'}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Step: Reset Template */}
        {confirmStep === 'reset' && !successMessage && (
          <div className="mt-5 p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Restaurar dados modelo de Novembro de 2026?
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Os dados atuais serão substituídos pelos lançamentos e categorias de demonstração originais da planilha.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmStep('none')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleResetData}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isDeleting ? 'Restaurando...' : 'Confirmar Restauração'}
              </button>
            </div>
          </div>
        )}

        {/* Footer cancel button */}
        {confirmStep === 'none' && !successMessage && (
          <div className="flex justify-end pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
