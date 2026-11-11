import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { formatCurrency } from './KPICards';
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  CreditCard,
  Plus,
  Receipt,
  CheckCircle,
  Clock,
  Repeat,
  UploadCloud,
  ClipboardPaste,
} from 'lucide-react';

interface TransactionListProps {
  onEditTransaction: (tx: Transaction) => void;
  onOpenNewTransaction: () => void;
  onOpenFileUpload?: () => void;
  onOpenClearDataModal?: () => void;
  selectedCategoryFilter: string | null;
  onClearCategoryFilter: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onEditTransaction,
  onOpenNewTransaction,
  onOpenFileUpload,
  onOpenClearDataModal,
  selectedCategoryFilter,
  onClearCategoryFilter,
}) => {
  const { transactions, deleteTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'despesa' | 'receita'>('todos');
  const [ruleFilter, setRuleFilter] = useState<string>('todos');

  // Filter logic
  const filtered = transactions.filter((t) => {
    if (selectedCategoryFilter && t.category !== selectedCategoryFilter) {
      return false;
    }
    if (typeFilter !== 'todos' && t.type !== typeFilter) {
      return false;
    }
    if (ruleFilter !== 'todos' && t.ruleGroup !== ruleFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchPay = (t.paymentMethod || '').toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      return matchDesc || matchCat || matchPay || matchNotes;
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs dark:shadow-xl transition-colors">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Extrato de Lançamentos & Contas
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Histórico detalhado de entradas e saídas do mês com suporte a despesas fixas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {onOpenFileUpload && (
            <button
              onClick={onOpenFileUpload}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 px-3.5 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300 transition cursor-pointer shadow-xs active:scale-95"
              title="Copiar e colar dados tabulados do Excel/Google Sheets ou importar arquivos CSV e PDF"
            >
              <ClipboardPaste className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Importar ou Colar Planilha</span>
            </button>
          )}

          {onOpenClearDataModal && (
            <button
              onClick={onOpenClearDataModal}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 transition cursor-pointer shadow-xs active:scale-95"
              title="Apagar registros do mês ou zerar todos os lançamentos"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Apagar Registros</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição, categoria, pagamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setTypeFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'todos'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('despesa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'despesa'
                ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setTypeFilter('receita')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'receita'
                ? 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300'
            }`}
          >
            Receitas
          </button>
        </div>

        {/* 50-30-20 Group Select */}
        <select
          value={ruleFilter}
          onChange={(e) => setRuleFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer shrink-0"
        >
          <option value="todos">Todos os Grupos</option>
          <option value="necessidades">Necessidades (50%)</option>
          <option value="desejos">Desejos (30%)</option>
          <option value="investimentos">Investimentos (20%)</option>
        </select>
      </div>

      {/* Active Category Filter Tag if set */}
      {selectedCategoryFilter && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
          <span>Filtrando por categoria: <strong>{selectedCategoryFilter}</strong></span>
          <button
            onClick={onClearCategoryFilter}
            className="text-[11px] underline hover:text-emerald-950 dark:hover:text-white ml-auto cursor-pointer"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Transaction Records */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Nenhum lançamento encontrado para os filtros selecionados.
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar lançamento manual
            </button>
            {onOpenFileUpload && (
              <button
                onClick={onOpenFileUpload}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold cursor-pointer"
              >
                <ClipboardPaste className="w-4 h-4" />
                Importar ou colar planilha
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          {filtered.map((tx) => {
            const isDespesa = tx.type === 'despesa';

            return (
              <div
                key={tx.id}
                className="p-3.5 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left info */}
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      isDespesa
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20'
                        : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/20'
                    }`}
                  >
                    {isDespesa ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {tx.description}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isDespesa
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'
                            : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20'
                        }`}
                      >
                        {tx.category}
                      </span>
                      {tx.ruleGroup && tx.ruleGroup !== 'receitas' && (
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded-full capitalize">
                          {tx.ruleGroup}
                        </span>
                      )}
                      {/* Recurrent / Fixed Badge */}
                      {tx.isRecurring && (
                        <span
                          className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/25 px-2 py-0.5 rounded-full flex items-center gap-1"
                          title="Lançamento fixo / recorrente"
                        >
                          <Repeat className="w-2.5 h-2.5" />
                          {tx.installmentCurrent && tx.installmentTotal
                            ? `${tx.installmentCurrent}/${tx.installmentTotal}`
                            : 'Fixo'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-['JetBrains_Mono']">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {tx.date}
                      </span>
                      {tx.paymentMethod && (
                        <span>• {tx.paymentMethod}</span>
                      )}
                      {tx.status === 'concluido' ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
                          <CheckCircle className="w-3 h-3" /> Pago / Recebido
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {tx.notes && (
                        <span className="italic text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                          "{tx.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Value & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center font-['JetBrains_Mono']">
                  <span
                    className={`text-base font-extrabold ${
                      isDespesa ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-300'
                    }`}
                  >
                    {isDespesa ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Editar lançamento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja excluir "${tx.description}"?`)) {
                          deleteTransaction(tx.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

