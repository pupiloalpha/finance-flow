import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ExtractedTransaction } from '../types';
import { formatCurrency } from './KPICards';
import {
  X,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Check,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose }) => {
  const { extractTransactionsFromFile, addTransactionsBatch, selectedMonth } = useFinance();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedList, setExtractedList] = useState<ExtractedTransaction[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

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
        // Select all by default
        setSelectedIndices(new Set(items.map((_, i) => i)));
      }
    } catch (err) {
      console.error('Erro na extração:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Falha ao processar o arquivo. Verifique se o formato é suportado (CSV, XLS, PDF, imagem).'
      );
    } finally {
      setIsProcessing(false);
    }
  };

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
      amount: t.amount,
      type: t.type,
      category: t.category,
      ruleGroup: t.ruleGroup,
      status: 'concluido' as const,
      paymentMethod: t.paymentMethod || 'Outros',
      notes: `Importado via Gemini de ${file?.name || 'arquivo'}`,
    }));

    await addTransactionsBatch(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Importar Extratos & Faturas com IA
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                  OCR & Leitura Gemini
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Envie arquivos CSV, XLS, PDF, OFX ou fotos de faturas e boletos para extração automática
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        {extractedList.length === 0 ? (
          <div className="mt-5 space-y-4">
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
                  ? 'border-cyan-400 bg-cyan-950/30'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
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

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 shadow-md">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {file ? file.name : 'Clique ou arraste seu arquivo aqui'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos suportados: CSV, XLS/XLSX, PDF, OFX e Imagens (PNG/JPG)
                </p>
              </div>

              {file && (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  Arquivo selecionado ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!file || isProcessing}
                onClick={handleProcessFile}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-bold text-white hover:from-cyan-500 hover:to-blue-500 shadow-md transition disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Extraindo Lançamentos...' : 'Processar com Gemini'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview and confirmation list */
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedIndices.size === extractedList.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="selectAll" className="font-semibold text-white cursor-pointer">
                  Selecionar todos ({selectedIndices.size}/{extractedList.length})
                </label>
              </div>

              <span className="text-xs font-bold text-emerald-400 font-['JetBrains_Mono']">
                Total:{' '}
                {formatCurrency(
                  extractedList
                    .filter((_, i) => selectedIndices.has(i))
                    .reduce((acc, t) => acc + t.amount, 0)
                )}
              </span>
            </div>

            {/* Extracted items table */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950">
              {extractedList.map((tx, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isDespesa = tx.type === 'despesa';

                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectIndex(idx)}
                    className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition ${
                      isSelected ? 'bg-slate-900/90' : 'bg-slate-950/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectIndex(idx)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {tx.description}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                              isDespesa
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {tx.category}
                          </span>
                          <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full capitalize">
                            {tx.ruleGroup}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-['JetBrains_Mono'] mt-0.5">
                          {tx.date} • {tx.paymentMethod}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`font-bold font-['JetBrains_Mono'] shrink-0 ${
                        isDespesa ? 'text-rose-400' : 'text-cyan-300'
                      }`}
                    >
                      {isDespesa ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setExtractedList([]);
                  setSelectedIndices(new Set());
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Voltar e escolher outro arquivo
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Importar {selectedIndices.size} Lançamentos</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
