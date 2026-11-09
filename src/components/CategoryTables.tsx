import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from './KPICards';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Edit2,
  PlusCircle,
} from 'lucide-react';

interface CategoryTablesProps {
  onQuickAdd: (categoryName: string, type: 'despesa' | 'receita') => void;
  onEditPlanned: (categoryId: string, currentPlanned: number, categoryName: string) => void;
  onSelectCategoryFilter: (categoryName: string) => void;
}

export const CategoryTables: React.FC<CategoryTablesProps> = ({
  onQuickAdd,
  onEditPlanned,
  onSelectCategoryFilter,
}) => {
  const {
    expenseSummaries,
    incomeSummaries,
    totalExpensesPlanned,
    totalExpensesActual,
    totalIncomesPlanned,
    totalIncomesActual,
    categoryBudgets,
  } = useFinance();

  const getCategoryId = (name: string, type: 'despesa' | 'receita') => {
    return categoryBudgets.find((c) => c.name === name && c.type === type)?.id || '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Tabela de Despesas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden flex flex-col">
        {/* Table Header Banner */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Despesas por Categoria
              </h3>
              <p className="text-[11px] text-slate-400">
                Acompanhamento de tetos orçamentários
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
            {formatCurrency(totalExpensesActual)} / {formatCurrency(totalExpensesPlanned)}
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-right">Planejado</th>
                <th className="py-2.5 px-3 text-right">Real</th>
                <th className="py-2.5 px-3 text-right">Limite / Saldo</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-['JetBrains_Mono']">
              {/* Totais Row */}
              <tr className="bg-slate-950/40 font-bold text-slate-200">
                <td className="py-2.5 px-3 font-['Plus_Jakarta_Sans'] font-extrabold text-white">
                  Totais
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300">
                  {formatCurrency(totalExpensesPlanned)}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-400 font-extrabold">
                  {formatCurrency(totalExpensesActual)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">
                  {formatCurrency(Math.max(totalExpensesPlanned - totalExpensesActual, 0))}
                </td>
                <td className="py-2.5 px-2 text-center">
                  {totalExpensesActual > totalExpensesPlanned ? (
                    <span className="text-amber-400" title="Despesas totais ultrapassaram o planejado">⚠️</span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                  )}
                </td>
                <td className="py-2.5 px-2"></td>
              </tr>

              {/* Categorias individuais */}
              {expenseSummaries.map((cat) => {
                const isOver = cat.actual > cat.planned;
                const remaining = cat.planned - cat.actual;
                const catId = getCategoryId(cat.name, 'despesa');

                return (
                  <tr
                    key={cat.name}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-2.5 px-3 font-['Plus_Jakarta_Sans']">
                      <button
                        onClick={() => onSelectCategoryFilter(cat.name)}
                        className="font-medium text-slate-200 hover:text-emerald-400 transition flex items-center gap-1.5 text-left"
                        title="Filtrar lançamentos desta categoria"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate max-w-[130px]">{cat.name}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(cat.planned)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        isOver ? 'text-rose-400' : 'text-slate-100'
                      }`}
                    >
                      {formatCurrency(cat.actual)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right ${
                        remaining < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'
                      }`}
                    >
                      {remaining < 0
                        ? `-${formatCurrency(Math.abs(remaining))}`
                        : formatCurrency(remaining)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-xs">
                      {isOver ? (
                        <span
                          className="text-amber-400 cursor-help inline-flex items-center justify-center"
                          title="Gastos ultrapassaram o teto planejado!"
                        >
                          ⚠️
                        </span>
                      ) : (
                        <span className="text-emerald-500/70 text-[10px]">OK</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEditPlanned(catId, cat.planned, cat.name)}
                          className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition"
                          title="Editar teto planejado"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onQuickAdd(cat.name, 'despesa')}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                          title="Lançar nova despesa nesta categoria"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Tabela de Receitas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden flex flex-col">
        {/* Table Header Banner */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Receitas por Categoria
              </h3>
              <p className="text-[11px] text-slate-400">
                Acompanhamento de entradas e projeções
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
            {formatCurrency(totalIncomesActual)} / {formatCurrency(totalIncomesPlanned)}
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3 text-right">Planejado</th>
                <th className="py-2.5 px-3 text-right">Real</th>
                <th className="py-2.5 px-3 text-right">Diferença</th>
                <th className="py-2.5 px-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-['JetBrains_Mono']">
              {/* Totais Row */}
              <tr className="bg-slate-950/40 font-bold text-slate-200">
                <td className="py-2.5 px-3 font-['Plus_Jakarta_Sans'] font-extrabold text-white">
                  Totais
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300">
                  {formatCurrency(totalIncomesPlanned)}
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-400 font-extrabold">
                  {formatCurrency(totalIncomesActual)}
                </td>
                <td
                  className={`py-2.5 px-3 text-right font-extrabold ${
                    totalIncomesActual - totalIncomesPlanned >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {totalIncomesActual - totalIncomesPlanned >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(totalIncomesActual - totalIncomesPlanned))}
                </td>
                <td className="py-2.5 px-2"></td>
              </tr>

              {/* Categorias de Receita */}
              {incomeSummaries.map((cat) => {
                const diff = cat.actual - cat.planned;
                const catId = getCategoryId(cat.name, 'receita');

                return (
                  <tr
                    key={cat.name}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-2.5 px-3 font-['Plus_Jakarta_Sans']">
                      <button
                        onClick={() => onSelectCategoryFilter(cat.name)}
                        className="font-medium text-slate-200 hover:text-cyan-400 transition flex items-center gap-1.5 text-left"
                        title="Filtrar lançamentos desta categoria"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate max-w-[150px]">{cat.name}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(cat.planned)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                      {formatCurrency(cat.actual)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold ${
                        diff >= 0 ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {diff >= 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEditPlanned(catId, cat.planned, cat.name)}
                          className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition"
                          title="Editar receita planejada"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onQuickAdd(cat.name, 'receita')}
                          className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                          title="Lançar nova receita nesta categoria"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
