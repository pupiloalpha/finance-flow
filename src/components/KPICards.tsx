import React from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export const KPICards: React.FC = () => {
  const {
    totalExpensesPlanned,
    totalExpensesActual,
    totalIncomesPlanned,
    totalIncomesActual,
    saldoMensal,
    saldoHoje,
    saldoProjetado,
    despesasMedia,
    receitasMedia,
  } = useFinance();

  const expensePct =
    totalExpensesPlanned > 0
      ? Math.round((totalExpensesActual / totalExpensesPlanned) * 100)
      : 0;

  const incomePct =
    totalIncomesPlanned > 0
      ? Math.round((totalIncomesActual / totalIncomesPlanned) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Saldo Mensal & Hoje/Projetado */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl transition-all hover:border-slate-700">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Saldo Mensal
              </span>
              <p className="text-[11px] text-slate-500">Balanço líquido do período</p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              saldoMensal >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {saldoMensal >= 0 ? '+ Positivo' : 'Atenção'}
          </span>
        </div>

        {/* Main metric */}
        <div className="mb-4">
          <div className="text-3xl font-black text-white font-['JetBrains_Mono'] tracking-tight">
            {formatCurrency(saldoMensal)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Margem disponível em relação ao orçamento planejado
          </p>
        </div>

        {/* Breakdown sub-metrics: Hoje & Projetado (as in the spreadsheet) */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50">
            <span className="text-[11px] text-slate-400 font-medium block">Hoje</span>
            <span className="text-sm font-bold text-emerald-400 font-['JetBrains_Mono']">
              {formatCurrency(saldoHoje)}
            </span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50">
            <span className="text-[11px] text-slate-400 font-medium block">Projetado</span>
            <span className="text-sm font-bold text-cyan-400 font-['JetBrains_Mono']">
              {formatCurrency(saldoProjetado)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Despesas: Planejado, Real, Média */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl transition-all hover:border-slate-700">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Despesas Totais
              </span>
              <p className="text-[11px] text-slate-500">Execução orçamentária</p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            {expensePct}% do teto
          </span>
        </div>

        {/* Main metric */}
        <div className="mb-4">
          <div className="text-3xl font-black text-rose-400 font-['JetBrains_Mono'] tracking-tight">
            {formatCurrency(totalExpensesActual)}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                expensePct > 100 ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(expensePct, 100)}%` }}
            />
          </div>
        </div>

        {/* Planejado & Média metrics */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50">
            <span className="text-[11px] text-slate-400 font-medium block">Planejado</span>
            <span className="text-sm font-semibold text-slate-200 font-['JetBrains_Mono']">
              {formatCurrency(totalExpensesPlanned)}
            </span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50">
            <span className="text-[11px] text-slate-400 font-medium block">Média Histórica</span>
            <span className="text-sm font-semibold text-slate-400 font-['JetBrains_Mono']">
              {formatCurrency(despesasMedia)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Receitas: Planejado, Real, Média */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-xl transition-all hover:border-slate-700">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Receitas Totais
              </span>
              <p className="text-[11px] text-slate-500">Entradas e resgates</p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
            Real vs Previsto
          </span>
        </div>

        {/* Main metric */}
        <div className="mb-4">
          <div className="text-3xl font-black text-cyan-300 font-['JetBrains_Mono'] tracking-tight">
            {formatCurrency(totalIncomesActual)}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(incomePct, 100)}%` }}
            />
          </div>
        </div>

        {/* Planejado & Média metrics */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50">
            <span className="text-[11px] text-slate-400 font-medium block">Planejado</span>
            <span className="text-sm font-semibold text-slate-200 font-['JetBrains_Mono']">
              {formatCurrency(totalIncomesPlanned)}
            </span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/50">
            <span className="text-[11px] text-slate-400 font-medium block">Média Histórica</span>
            <span className="text-sm font-semibold text-slate-400 font-['JetBrains_Mono']">
              {formatCurrency(receitasMedia)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
