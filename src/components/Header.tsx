import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Calendar,
  Cloud,
  CloudOff,
  Download,
  Plus,
  RefreshCw,
  LogOut,
  LogIn,
  Sliders,
  TrendingUp,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  onOpenBudgetModal: () => void;
  onOpenHealthModal: () => void;
  onOpenFileUpload: () => void;
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

export const Header: React.FC<HeaderProps> = ({
  onOpenNewTransaction,
  onOpenBudgetModal,
  onOpenHealthModal,
  onOpenFileUpload,
}) => {
  const {
    user,
    authLoading,
    login,
    logout,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    isCloudSynced,
    isSyncing,
    isAnalyzingHealth,
    resetToSpreadsheetData,
    exportToCSV,
  } = useFinance();

  const formatMonthName = (monthStr: string) => {
    const [year, m] = monthStr.split('-');
    const monthName = MONTH_NAMES_PT[m] || m;
    return `${monthName} de ${year}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Logo & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                    FinanFlow
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Controle 50-30-20
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Painel Financeiro Automatizado
                </p>
              </div>
            </div>

            {/* Mobile Actions: Install button on mobile */}
            <div className="flex lg:hidden items-center gap-2">
              <PWAInstallButton />
            </div>
          </div>

          {/* Month Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Month Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {formatMonthName(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Gemini Health Diagnostic Button (REQUESTED BY USER) */}
            <button
              onClick={onOpenHealthModal}
              disabled={isAnalyzingHealth}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:from-emerald-900/80 hover:to-teal-900/80 hover:border-emerald-500/50 transition shadow-sm"
              title="Obter análise da saúde financeira com Gemini AI"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isAnalyzingHealth ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingHealth ? 'Analisando...' : 'Diagnóstico IA'}</span>
            </button>

            {/* File Upload Button (CSV, XLS, PDF, Boletos) (REQUESTED BY USER) */}
            <button
              onClick={onOpenFileUpload}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition"
              title="Importar extratos bancários, faturas de cartão ou boletos (CSV, XLS, PDF)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Importar</span>
            </button>

            {/* Cloud Sync indicator */}
            <div
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition ${
                user && isCloudSynced
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
              title={
                user
                  ? isCloudSynced
                    ? 'Sincronizado em tempo real com Firebase Firestore'
                    : 'Conectando ao Firestore...'
                  : 'Dados salvos localmente. Conecte com o Google para sincronizar em nuvem.'
              }
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : user && isCloudSynced ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden xl:inline">
                {user ? (isCloudSynced ? 'Nuvem Conectada' : 'Sincronizando...') : 'Modo Local'}
              </span>
            </div>

            {/* PWA Install Button (Desktop) */}
            <div className="hidden lg:block">
              <PWAInstallButton />
            </div>

            {/* Adjust Budgets */}
            <button
              onClick={onOpenBudgetModal}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Ajustar limites de orçamento"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Metas</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Exportar dados para Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
            </button>

            {/* Reset to initial sheet */}
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar os dados originais da planilha de Novembro de 2026?')) {
                  resetToSpreadsheetData();
                }
              }}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Restaurar dados originais da planilha modelo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* User Auth with Google */}
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2 py-1">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuário'}
                      className="w-6 h-6 rounded-full border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-[10px] font-bold flex items-center justify-center text-white">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-300 max-w-[80px] truncate hidden xl:inline">
                    {user.displayName?.split(' ')[0] || 'Usuário'}
                  </span>
                  <button
                    onClick={logout}
                    className="p-1 text-slate-400 hover:text-red-400 transition"
                    title="Sair da conta"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition"
                  title="Entrar com o Google para salvar no Firebase"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Entrar</span>
                </button>
              )
            )}

            {/* Add Transaction Primary Button */}
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Novo</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
