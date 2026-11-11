import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ExtractedTransaction, RuleGroup, TransactionType } from '../types';
import { formatCurrency } from './KPICards';
import { parseTabularData } from '../utils/tabularParser';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Check,
  Sparkles,
  AlertCircle,
  ClipboardPaste,
  Info,
  HelpCircle,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'paste' | 'file';
}

const EXAMPLE_TABULAR_DATA = `Data\tDescrição\tValor\tCategoria\tTipo
10/11/2026\tSupermercado Pão de Açúcar\t389,50\tAlimentação\tDespesa
12/11/2026\tSalário Mensal\t5800,00\tSalário\tReceita
14/11/2026\tPosto Ipiranga Gasolina\t180,00\tTransporte\tDespesa
15/11/2026\tFarmácia Drogasil\t94,20\tSaúde\tDespesa
18/11/2026\tRestaurante Outback\t165,00\tLazer\tDespesa
20/11/2026\tConta de Energia Enel\t210,40\tMoradia\tDespesa`;

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'paste',
}) => {
  const {
    extractTransactionsFromFile,
    addTransactionsBatch,
    selectedMonth,
    categoryBudgets,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'paste' | 'file'>(initialMode);
  
  // Tab 1: Paste tabular data state
  const [pasteText, setPasteText] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  // Tab 2: File upload state
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Common extracted/parsed items state
  const [extractedList, setExtractedList] = useState<ExtractedTransaction[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingCategoryNames = categoryBudgets.map((c) => c.name);

  // Handle parsing pasted tabular text
  const handleParsePastedData = () => {
    setErrorMsg(null);
    setWarningMsg(null);

    if (!pasteText.trim()) {
      setErrorMsg('Cole os dados tabulados da sua planilha no campo de texto antes de continuar.');
      return;
    }

    try {
      const result = parseTabularData(pasteText, selectedMonth, existingCategoryNames);
      if (result.transactions.length === 0) {
        setErrorMsg(
          'Não foi possível identificar lançamentos no texto colado. Verifique se os dados contêm pelo menos Data, Descrição e Valor separados por tabulação ou ponto e vírgula.'
        );
        return;
      }

      setExtractedList(result.transactions);
      setSelectedIndices(new Set(result.transactions.map((_, i) => i)));

      if (result.warnings.length > 0) {
        setWarningMsg(
          `Identificados ${result.transactions.length} lançamentos. ${result.warnings.length} linha(s) ignorada(s) por falta de valor.`
        );
      }
    } catch (err) {
      console.error('Erro ao processar dados tabulados:', err);
      setErrorMsg('Falha ao processar os dados colados. Verifique se o formato está correto.');
    }
  };

  // Paste from system clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPasteText(text);
          setErrorMsg(null);
        } else {
          setErrorMsg('A área de transferência está vazia.');
        }
      } else {
        setErrorMsg('Utilize Ctrl + V (ou Cmd + V) no campo de texto para colar seus dados.');
      }
    } catch {
      setErrorMsg('Permissão negada para acessar a área de transferência. Use Ctrl + V no campo.');
    }
  };

  // Load sample data
  const handleLoadSample = () => {
    setPasteText(EXAMPLE_TABULAR_DATA);
    setErrorMsg(null);
    setWarningMsg(null);
  };

  // Handle file upload
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setExtractedList([]);
    setSelectedIndices(new Set());
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const items = await extractTransactionsFromFile(file);
      if (!items || items.length === 0) {
        setErrorMsg('Nenhuma transação identificada no arquivo fornecido. Certifique-se de que o arquivo contém dados legíveis.');
      } else {
        setExtractedList(items);
        setSelectedIndices(new Set(items.map((_, i) => i)));
      }
    } catch (err) {
      console.error('Erro na extração de arquivo:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Falha ao processar o arquivo. Verifique se o formato é suportado (CSV, XLS, PDF, imagem).'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Selection toggles
  const toggleSelectIndex = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === extractedList.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(extractedList.map((_, i) => i)));
    }
  };

  // In-line edits in review list
  const handleUpdateItem = (index: number, field: keyof ExtractedTransaction, value: any) => {
    setExtractedList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Confirm import
  const handleConfirmImport = async () => {
    const toImport = extractedList.filter((_, i) => selectedIndices.has(i));
    if (toImport.length === 0) {
      alert('Selecione pelo menos uma transação para importar.');
      return;
    }

    const payload = toImport.map((t) => ({
      month: t.date.slice(0, 7) || selectedMonth,
      date: t.date,
      description: t.description,
      amount: Number(t.amount) || 0,
      type: t.type,
      category: t.category,
      ruleGroup: t.ruleGroup,
      status: 'concluido' as const,
      paymentMethod: t.paymentMethod || 'Outros',
      notes: activeTab === 'paste' ? 'Importado via Copiar e Colar (Tabulado)' : `Importado de ${file?.name || 'arquivo'}`,
    }));

    await addTransactionsBatch(payload);
    onClose();
  };

  const selectedItems = extractedList.filter((_, i) => selectedIndices.has(i));
  const totalDespesas = selectedItems.filter((t) => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
  const totalReceitas = selectedItems.filter((t) => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-md p-2.5 sm:p-4">
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden transition-colors">
          
          {/* Header - Always accessible at top */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-md shrink-0">
                <ClipboardPaste className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  Importar & Colar Lançamentos
                  <span className="text-[10px] bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Excel • Sheets • Arquivos
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cole dados tabulados ou envie extratos em PDF, CSV ou imagens
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Navigation Tabs (When not in preview mode) */}
          {extractedList.length === 0 && (
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 shrink-0 bg-white dark:bg-slate-900 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab('paste');
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'paste'
                    ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Copiar & Colar Planilha (Tabulado)</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('file');
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'file'
                    ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Enviar Arquivo (PDF, CSV, OFX)</span>
              </button>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">

        {/* Content Area */}
        {extractedList.length === 0 ? (
          activeTab === 'paste' ? (
            /* TAB 1: PASTE TABULAR DATA */
            <div className="mt-4 space-y-4">
              
              {/* Instructions Card (Guia do Formato dos Dados) */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-50/60 dark:bg-cyan-950/20 p-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2 font-bold text-cyan-800 dark:text-cyan-300">
                    <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Instruções de Formato dos Dados Tabulados</span>
                  </div>
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-[11px] text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    {showInstructions ? 'Ocultar detalhes' : 'Ver formato'}
                  </button>
                </div>

                {showInstructions && (
                  <div className="mt-2.5 space-y-2 text-[11px] leading-relaxed">
                    <p>
                      Selecione e copie as células diretamente da sua planilha do <strong>Excel</strong>, <strong>Google Sheets</strong> ou da tabela do seu <strong>Internet Banking</strong> (<kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">Ctrl + C</kbd>) e cole no campo abaixo (<kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">Ctrl + V</kbd>).
                    </p>

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto">
                      <div className="text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800 font-sans font-semibold">
                        Ordem recomendada das colunas (separadas por Tabulação):
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                        Data [Tab] Descrição [Tab] Valor [Tab] Categoria (opcional) [Tab] Tipo (opcional)
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 font-sans">
                        Exemplo: 10/11/2026 [Tab] Supermercado Pão de Açúcar [Tab] 389,50 [Tab] Alimentação [Tab] Despesa
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <strong>• Datas aceitas:</strong> <code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">DD/MM/AAAA</code>, <code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">DD/MM/AA</code>, <code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">AAAA-MM-DD</code> ou <code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">DD/MM</code>.
                      </div>
                      <div>
                        <strong>• Valores aceitos:</strong> <code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">150,00</code>, <code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">R$ 150,00</code> ou valores negativos (<code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">-150,00</code>).
                      </div>
                      <div>
                        <strong>• Separadores:</strong> Tabulação (Tab padrão do Excel), ponto e vírgula (<code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">;</code>) ou barra vertical (<code className="text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-1 rounded">|</code>).
                      </div>
                      <div>
                        <strong>• Cabeçalho:</strong> A primeira linha com títulos (Data, Descrição, Valor) é detectada e ignorada automaticamente.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Textarea Area */}
              <div>
                <div className="flex items-center justify-between pb-1.5 text-xs">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Área para colar os dados tabulados</span>
                    {pasteText.trim() && (
                      <span className="text-[10px] text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.2 rounded-full font-mono">
                        {pasteText.trim().split('\n').length} linha(s) detectada(s)
                      </span>
                    )}
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Carregar Exemplo
                    </button>
                    {pasteText && (
                      <button
                        type="button"
                        onClick={() => {
                          setPasteText('');
                          setErrorMsg(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Limpar</span>
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  rows={8}
                  placeholder={`Cole aqui as linhas copiadas da sua planilha (Ctrl + V)...&#10;&#10;Exemplo:&#10;10/11/2026\tSupermercado Pão de Açúcar\t389,50\tAlimentação&#10;12/11/2026\tSalário Mensal\t5800,00\tSalário&#10;15/11/2026\tPosto Ipiranga Gasolina\t180,00\tTransporte`}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-y"
                />
              </div>

              {/* Error / Warning Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-xs"
                >
                  <ClipboardPaste className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Colar da Área de Transferência</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!pasteText.trim()}
                    onClick={handleParsePastedData}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-xs font-bold text-white hover:from-cyan-500 hover:to-teal-500 shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Processar Dados Tabulados</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: UPLOAD FILE WITH GEMINI OCR */
            <div className="mt-4 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/30'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,.pdf,.txt,.ofx,image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 shadow-md">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {file ? file.name : 'Clique ou arraste seu arquivo aqui'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formatos suportados: CSV, XLS/XLSX, PDF, OFX e Imagens (PNG/JPG)
                  </p>
                </div>

                {file && (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1 rounded-full">
                    Arquivo selecionado ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!file || isProcessing}
                  onClick={handleProcessFile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-xs font-bold text-white hover:from-cyan-500 hover:to-teal-500 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Extraindo Lançamentos...' : 'Processar com Gemini'}</span>
                </button>
              </div>
            </div>
          )
        ) : (
          /* PREVIEW AND EDIT CONFIRMATION LIST */
          <div className="mt-4 space-y-4">
            
            {/* Header summary of parsed items */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedIndices.size === extractedList.length && extractedList.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="selectAll" className="font-bold text-slate-900 dark:text-white cursor-pointer">
                  Selecionar todos ({selectedIndices.size} de {extractedList.length} itens)
                </label>
              </div>

              <div className="flex items-center gap-3 font-['JetBrains_Mono'] text-[11px]">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  Despesas: {formatCurrency(totalDespesas)}
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  Receitas: {formatCurrency(totalReceitas)}
                </span>
              </div>
            </div>

            {warningMsg && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                {warningMsg}
              </div>
            )}

            {/* Extracted items interactive editor table */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
              {extractedList.map((tx, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isDespesa = tx.type === 'despesa';

                return (
                  <div
                    key={idx}
                    className={`p-3 transition ${
                      isSelected ? 'bg-white dark:bg-slate-900/90' : 'bg-slate-50/50 dark:bg-slate-950/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectIndex(idx)}
                          className="w-4 h-4 mt-1 accent-emerald-500 rounded cursor-pointer shrink-0"
                        />
                        
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Row 1: Description and Type Toggle */}
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={tx.description}
                              onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                              className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-cyan-500 focus:bg-slate-50 dark:focus:bg-slate-800 px-1 py-0.5 rounded transition flex-1 min-w-[150px]"
                            />

                            {/* Type switch button */}
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(idx, 'type', isDespesa ? 'receita' : 'despesa')}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                                isDespesa
                                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                                  : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30'
                              }`}
                            >
                              {isDespesa ? 'Despesa' : 'Receita'}
                            </button>

                            {/* Category selector */}
                            <select
                              value={tx.category}
                              onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg cursor-pointer"
                            >
                              {existingCategoryNames.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              {!existingCategoryNames.includes(tx.category) && (
                                <option value={tx.category}>{tx.category}</option>
                              )}
                            </select>

                            {/* 50-30-20 Rule selector */}
                            <select
                              value={tx.ruleGroup}
                              onChange={(e) => handleUpdateItem(idx, 'ruleGroup', e.target.value as RuleGroup)}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg cursor-pointer capitalize"
                            >
                              <option value="necessidades">50% Necessidades</option>
                              <option value="desejos">30% Desejos</option>
                              <option value="investimentos">20% Investimentos</option>
                              <option value="receitas">Receitas</option>
                            </select>
                          </div>

                          {/* Row 2: Date & Payment Method */}
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-['JetBrains_Mono']">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <input
                                type="date"
                                value={tx.date}
                                onChange={(e) => handleUpdateItem(idx, 'date', e.target.value)}
                                className="bg-transparent text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                              />
                            </div>
                            <span>•</span>
                            <input
                              type="text"
                              value={tx.paymentMethod || 'Pix'}
                              onChange={(e) => handleUpdateItem(idx, 'paymentMethod', e.target.value)}
                              placeholder="Forma de pagamento"
                              className="bg-transparent text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white max-w-[120px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Amount input */}
                      <div className="flex items-center gap-1 shrink-0 font-['JetBrains_Mono']">
                        <span className={isDespesa ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-cyan-600 dark:text-cyan-400 font-bold'}>
                          {isDespesa ? '-' : '+'} R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={tx.amount}
                          onChange={(e) => handleUpdateItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                          className={`w-24 text-right font-bold text-xs p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 ${
                            isDespesa ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setExtractedList([]);
                  setSelectedIndices(new Set());
                }}
                className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ← Voltar e colar outros dados
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedIndices.size === 0}
                  onClick={handleConfirmImport}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Inserir {selectedIndices.size} Lançamentos</span>
                </button>
              </div>
            </div>

          </div>
        )}

          </div>
        </div>
      </div>
    </div>
  );
};
