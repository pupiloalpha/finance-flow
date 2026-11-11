import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from './KPICards';
import { DriveBackupFile, AppBackupPayload } from '../utils/googleDriveBackup';
import {
  X,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Check,
  Calendar,
  ShieldAlert,
  Cloud,
  HardDrive,
  Download,
  UploadCloud,
  RefreshCw,
  FileJson,
  Clock,
  ExternalLink,
  LogIn,
  Database,
  ArrowRight,
} from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'delete' | 'drive' | 'file';
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

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'delete',
}) => {
  const {
    user,
    transactions,
    selectedMonth,
    clearMonthTransactions,
    clearAllTransactions,
    resetToSpreadsheetData,
    createDriveBackup,
    listDriveBackups,
    restoreFromDriveBackup,
    deleteDriveBackup,
    restoreFromJSONPayload,
    downloadLocalBackupJSON,
    login,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'delete' | 'drive' | 'file'>(initialTab);
  const [confirmAction, setConfirmAction] = useState<
    | null
    | { type: 'clear-all' }
    | { type: 'clear-month' }
    | { type: 'reset-template' }
    | { type: 'restore-drive'; file: DriveBackupFile }
    | { type: 'delete-drive'; file: DriveBackupFile }
    | { type: 'restore-file'; payload: AppBackupPayload; fileName: string }
  >(null);

  // Status and feedback
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Google Drive state
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveLoadError, setDriveLoadError] = useState<string | null>(null);

  // Local file upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'drive' && user) {
      loadDriveBackups();
    }
  }, [isOpen, activeTab, user]);

  if (!isOpen) return null;

  const [year, monthNum] = selectedMonth.split('-');
  const monthLabel = `${MONTH_NAMES_PT[monthNum] || monthNum} de ${year}`;
  const monthTransactions = transactions.filter((t) => t.month === selectedMonth);
  const monthTotalAmount = monthTransactions.reduce((acc, t) => acc + t.amount, 0);

  const showFeedback = (text: string, isError = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Google Drive actions
  const loadDriveBackups = async () => {
    setIsLoadingDrive(true);
    setDriveLoadError(null);
    try {
      const list = await listDriveBackups();
      setDriveBackups(list);
    } catch (err: any) {
      console.warn('Erro ao carregar backups do Google Drive:', err);
      setDriveLoadError(err?.message || 'Falha ao carregar backups do Google Drive.');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleCreateDriveBackup = async () => {
    setIsProcessing(true);
    try {
      const file = await createDriveBackup();
      showFeedback(`Backup "${file.name}" salvo com sucesso no Google Drive!`);
      await loadDriveBackups();
    } catch (err: any) {
      console.error('Erro ao criar backup no Google Drive:', err);
      showFeedback(err?.message || 'Erro ao salvar backup no Google Drive.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRestoreDrive = async (file: DriveBackupFile) => {
    setIsProcessing(true);
    try {
      const count = await restoreFromDriveBackup(file.id);
      setConfirmAction(null);
      showFeedback(`Restauração concluída! ${count} lançamentos recuperados do Google Drive.`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Erro na restauração do Google Drive:', err);
      showFeedback(err?.message || 'Falha ao restaurar backup do Google Drive.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDeleteDrive = async (file: DriveBackupFile) => {
    setIsProcessing(true);
    try {
      await deleteDriveBackup(file.id);
      setConfirmAction(null);
      showFeedback(`Backup "${file.name}" excluído do Google Drive.`);
      await loadDriveBackups();
    } catch (err: any) {
      console.error('Erro ao excluir do Drive:', err);
      showFeedback(err?.message || 'Falha ao excluir backup do Google Drive.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Local File actions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || !Array.isArray(json.transactions)) {
          showFeedback('O arquivo selecionado não contém um backup válido do Minhas Contas.', true);
          return;
        }
        setConfirmAction({
          type: 'restore-file',
          payload: json,
          fileName: file.name,
        });
      } catch {
        showFeedback('Arquivo JSON corrompido ou ilegível.', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestoreFile = async (payload: AppBackupPayload) => {
    setIsProcessing(true);
    try {
      const count = await restoreFromJSONPayload(payload);
      setConfirmAction(null);
      showFeedback(`Restauração concluída! ${count} lançamentos importados com sucesso.`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Erro ao restaurar do arquivo:', err);
      showFeedback(err?.message || 'Erro ao restaurar arquivo de backup.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete & Reset actions
  const handleConfirmClearAll = async () => {
    setIsProcessing(true);
    try {
      const count = transactions.length;
      await clearAllTransactions();
      setConfirmAction(null);
      showFeedback(`Todos os ${count} registros do aplicativo foram apagados com sucesso.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao zerar dados:', err);
      showFeedback('Erro ao apagar todos os registros.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmClearMonth = async () => {
    setIsProcessing(true);
    try {
      await clearMonthTransactions(selectedMonth);
      setConfirmAction(null);
      showFeedback(`Todos os ${monthTransactions.length} lançamentos de ${monthLabel} foram apagados.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao apagar mês:', err);
      showFeedback('Erro ao apagar registros do mês.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmResetTemplate = async () => {
    setIsProcessing(true);
    try {
      await resetToSpreadsheetData();
      setConfirmAction(null);
      showFeedback('Dados modelo originais de Novembro de 2026 restaurados.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao restaurar modelo:', err);
      showFeedback('Erro ao restaurar dados modelo.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm p-2.5 sm:p-4">
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden transition-colors">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-600 text-white shadow-md shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  Gerenciador de Registros & Backup
                  <span className="text-[10px] bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Google Drive • Nuvem • Local
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Faça backups, restaure histórico ou apague lançamentos com segurança
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setConfirmAction(null);
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          {!confirmAction && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 shrink-0 bg-white dark:bg-slate-900 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('delete')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'delete'
                    ? 'border-rose-500 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Apagar & Zerar Registros</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('drive')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'drive'
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Backup no Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'file'
                    ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileJson className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Arquivo Local (.JSON)</span>
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="p-5 overflow-y-auto overscroll-contain flex-1 space-y-4">
            
            {/* Feedback Alert */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-semibold animate-in fade-in ${
                  statusMessage.isError
                    ? 'bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {statusMessage.isError ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Current Summary Banner */}
            {!confirmAction && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
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
                    {transactions.length} lançamentos
                  </span>
                </div>
              </div>
            )}

            {/* TAB 1: DELETE & CLEAR OPTIONS */}
            {!confirmAction && activeTab === 'delete' && (
              <div className="space-y-3.5">
                
                {/* Option 1: Clear ALL Transactions (High Priority / User Request) */}
                <div className="p-4 rounded-xl border-2 border-rose-300 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-900 dark:text-rose-200">
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Apagar Todos os Lançamentos (Zerar Tudo)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Exclui permanentemente todos os <strong>{transactions.length} lançamentos</strong> de todos os meses. Recomendado antes de iniciar novos lançamentos ou após fazer backup.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={transactions.length === 0}
                    onClick={() => setConfirmAction({ type: 'clear-all' })}
                    className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-md active:scale-95"
                  >
                    Zerar Tudo ({transactions.length})
                  </button>
                </div>

                {/* Option 2: Clear Current Month */}
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
                      <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Apagar Apenas o Mês Selecionado ({monthLabel})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Exclui apenas os {monthTransactions.length} lançamentos de {monthLabel}. Outros meses permanecem salvos.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={monthTransactions.length === 0}
                    onClick={() => setConfirmAction({ type: 'clear-month' })}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-xs active:scale-95"
                  >
                    Apagar Mês ({monthTransactions.length})
                  </button>
                </div>

                {/* Option 3: Reset to Spreadsheet Template */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <RotateCcw className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Restaurar Dados Modelo da Planilha</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Recarrega os lançamentos e categorias de demonstração originais da planilha de Novembro de 2026.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmAction({ type: 'reset-template' })}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95"
                  >
                    Restaurar Modelo
                  </button>
                </div>

              </div>
            )}

            {/* TAB 2: GOOGLE DRIVE BACKUP & RESTORE */}
            {!confirmAction && activeTab === 'drive' && (
              <div className="space-y-4">
                
                {/* Account & Backup Trigger Card */}
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Backup em Nuvem no Google Drive
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {user
                            ? `Conectado como ${user.email || user.displayName}`
                            : 'Conecte sua conta Google para salvar cópias de segurança'}
                        </p>
                      </div>
                    </div>

                    {user ? (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleCreateDriveBackup}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{isProcessing ? 'Enviando ao Drive...' : 'Criar Backup no Google Drive'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={login}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95 shrink-0"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Entrar com o Google</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Backups List in Drive */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Backups Encontrados no seu Google Drive ({driveBackups.length})</span>
                    </span>

                    <button
                      type="button"
                      disabled={isLoadingDrive}
                      onClick={loadDriveBackups}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                      <span>Atualizar lista</span>
                    </button>
                  </div>

                  {isLoadingDrive ? (
                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Buscando backups no seu Google Drive...</span>
                    </div>
                  ) : driveLoadError ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/40 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                      <span>{driveLoadError}</span>
                      <button
                        onClick={loadDriveBackups}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline cursor-pointer shrink-0"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : driveBackups.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Nenhum backup encontrado no Google Drive ainda.
                      </p>
                      <p className="text-[11px]">
                        Clique no botão acima para salvar seu primeiro ponto de restauração seguro em nuvem.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 max-h-56 overflow-y-auto">
                      {driveBackups.map((bkp) => {
                        const dateFormatted = bkp.createdTime
                          ? new Date(bkp.createdTime).toLocaleString('pt-BR')
                          : 'Data desconhecida';

                        return (
                          <div
                            key={bkp.id}
                            className="p-3 flex items-center justify-between gap-2 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block truncate">
                                {bkp.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Salvo em: {dateFormatted}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setConfirmAction({ type: 'restore-drive', file: bkp })}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer shadow-xs"
                              >
                                Restaurar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmAction({ type: 'delete-drive', file: bkp })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                title="Excluir este backup do Google Drive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: LOCAL FILE BACKUP & RESTORE */}
            {!confirmAction && activeTab === 'file' && (
              <div className="space-y-4">
                
                {/* Download Local JSON */}
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900 dark:text-indigo-300">
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Exportar Backup Completo (.JSON)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      Salva um arquivo com todos os {transactions.length} lançamentos e limites orçamentários no seu dispositivo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadLocalBackupJSON}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Arquivo JSON</span>
                  </button>
                </div>

                {/* Upload and Restore JSON */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                      <UploadCloud className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Restaurar a Partir de Arquivo de Backup</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Selecione um arquivo de backup (.json) previamente salvo para restaurar todos os lançamentos e configurações.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-white/50 dark:bg-slate-900/50"
                  >
                    <FileJson className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Clique para escolher o arquivo de backup (.JSON)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      O arquivo será verificado antes de aplicar as alterações
                    </span>
                  </button>
                </div>

              </div>
            )}

            {/* MANDATORY EXPLICIT CONFIRMATION DIALOGS FOR DESTRUCTIVE ACTIONS */}
            {confirmAction && (
              <div className="p-4 rounded-xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 space-y-4 animate-in fade-in">
                
                {/* Clear All Confirmation */}
                {confirmAction.type === 'clear-all' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                          Confirmar Exclusão de TODOS os {transactions.length} Lançamentos?
                        </h4>
                        <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                          Esta operação apagará definitivamente todos os registros de receitas e despesas de todos os meses, tanto no armazenamento local quanto no Firebase. Essa ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-rose-200 dark:border-rose-900/40">
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmClearAll}
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isProcessing ? 'Apagando tudo...' : `Sim, apagar todos os ${transactions.length} lançamentos`}
                      </button>
                    </div>
                  </>
                )}

                {/* Clear Month Confirmation */}
                {confirmAction.type === 'clear-month' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Apagar {monthTransactions.length} lançamentos de {monthLabel}?
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          Apenas os registros financeiros deste mês selecionado serão excluídos. Os demais meses permanecerão salvos.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-rose-200 dark:border-rose-900/40">
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmClearMonth}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isProcessing ? 'Apagando...' : `Sim, apagar lançamentos de ${monthLabel}`}
                      </button>
                    </div>
                  </>
                )}

                {/* Reset Template Confirmation */}
                {confirmAction.type === 'reset-template' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <RotateCcw className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Restaurar Dados Modelo de Demonstração?
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          Os dados atuais serão substituídos pelos lançamentos e metas de demonstração originais da planilha de 2026.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmResetTemplate}
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isProcessing ? 'Restaurando...' : 'Confirmar Restauração do Modelo'}
                      </button>
                    </div>
                  </>
                )}

                {/* Restore from Google Drive Confirmation */}
                {confirmAction.type === 'restore-drive' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Restaurar Backup do Google Drive?
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          Arquivo: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{confirmAction.file.name}</strong>
                          <br />
                          Os dados atuais do app serão substituídos pelo conteúdo deste ponto de backup salvo no Google Drive.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleConfirmRestoreDrive(confirmAction.file)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isProcessing ? 'Restaurando...' : 'Confirmar e Restaurar Dados'}
                      </button>
                    </div>
                  </>
                )}

                {/* Delete from Google Drive Confirmation */}
                {confirmAction.type === 'delete-drive' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                          Excluir Arquivo de Backup do Google Drive?
                        </h4>
                        <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                          O arquivo <strong className="font-mono">{confirmAction.file.name}</strong> será excluído permanentemente da sua lixeira/armazenamento do Google Drive.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-rose-200 dark:border-rose-900/40">
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleConfirmDeleteDrive(confirmAction.file)}
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isProcessing ? 'Excluindo...' : 'Sim, excluir do Google Drive'}
                      </button>
                    </div>
                  </>
                )}

                {/* Restore from File Confirmation */}
                {confirmAction.type === 'restore-file' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Restaurar Backup do Arquivo "{confirmAction.fileName}"?
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          O arquivo contém <strong>{confirmAction.payload.transactions.length} lançamentos</strong>
                          {confirmAction.payload.createdAt && ` criados em ${new Date(confirmAction.payload.createdAt).toLocaleString('pt-BR')}`}.
                          <br />
                          Deseja carregar esses dados no aplicativo agora?
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleConfirmRestoreFile(confirmAction.payload)}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isProcessing ? 'Importando...' : `Confirmar Restauração (${confirmAction.payload.transactions.length} itens)`}
                      </button>
                    </div>
                  </>
                )}

              </div>
            )}

          </div>

          {/* Footer */}
          {!confirmAction && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Segurança: Suas transações são salvas com criptografia e permissão explícita.
              </span>
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
    </div>
  );
};
