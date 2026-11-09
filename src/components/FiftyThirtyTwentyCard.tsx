import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from './KPICards';
import { AlertTriangle, CheckCircle2, Info, PieChart, ShieldAlert } from 'lucide-react';

export const FiftyThirtyTwentyCard: React.FC = () => {
  const { fiftyThirtyTwenty, totalExpensesPlanned } = useFinance();

  const { necessidades, desejos, investimentos } = fiftyThirtyTwenty;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Gestão das Finanças (50 - 30 - 20)
            </h2>
            <p className="text-xs text-slate-400">
              Distribuição do orçamento planejado: Necessidades (50%), Desejos (30%), Investimentos (20%)
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 self-start sm:self-auto">
          Base: {formatCurrency(totalExpensesPlanned)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Necessidades (50%) */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 transition-all hover:bg-emerald-950/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Necessidades
            </span>
            <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
              {necessidades.percentageOfPlannedExpenses}% de 50%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Moradia, alimentação básica, saúde, transporte e educação
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Planejado:</span>
              <span className="font-semibold font-['JetBrains_Mono']">
                {formatCurrency(necessidades.planned)}
              </span>
            </div>
            <div className="flex justify-between text-white font-medium">
              <span>Realizado:</span>
              <span className="font-bold text-emerald-300 font-['JetBrains_Mono']">
                {formatCurrency(necessidades.actual)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-emerald-500/20 text-slate-400">
              <span>Diferença / Saldo:</span>
              <span className="font-bold text-emerald-400 font-['JetBrains_Mono']">
                +{formatCurrency(necessidades.difference)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((necessidades.percentageOfPlannedExpenses / 50) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* 2. Desejos (30%) - Em alerta no modelo! */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 transition-all hover:bg-rose-950/30 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Desejos & Estilo
            </span>
            <span className="text-xs font-extrabold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
              ⚠️ {desejos.percentageOfPlannedExpenses}% de 30%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Cartão de crédito, lazer, assinaturas, compras e supérfluos
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Planejado:</span>
              <span className="font-semibold font-['JetBrains_Mono']">
                {formatCurrency(desejos.planned)}
              </span>
            </div>
            <div className="flex justify-between text-white font-medium">
              <span>Realizado:</span>
              <span className="font-bold text-rose-400 font-['JetBrains_Mono']">
                {formatCurrency(desejos.actual)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-rose-500/20 text-slate-400">
              <span>Diferença / Estouro:</span>
              <span className="font-bold text-rose-400 font-['JetBrains_Mono']">
                {desejos.difference < 0 ? '-' : '+'}{formatCurrency(Math.abs(desejos.difference))}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((desejos.percentageOfPlannedExpenses / 30) * 100, 100)}%` }}
            />
          </div>

          {desejos.isOverBudget && (
            <div className="mt-2 text-[10px] text-rose-300 bg-rose-500/10 rounded-md p-1.5 flex items-start gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
              <span>Atenção: Os gastos com desejos superaram a recomendação de 30%.</span>
            </div>
          )}
        </div>

        {/* 3. Investimentos | Reserva (20%) */}
        <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-4 transition-all hover:bg-teal-950/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              Investimentos
            </span>
            <span className="text-xs font-extrabold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-md">
              {investimentos.percentageOfPlannedExpenses}% de 20%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Aportes, reserva de emergência e construção de patrimônio
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Planejado:</span>
              <span className="font-semibold font-['JetBrains_Mono']">
                {formatCurrency(investimentos.planned)}
              </span>
            </div>
            <div className="flex justify-between text-white font-medium">
              <span>Realizado:</span>
              <span className="font-bold text-teal-300 font-['JetBrains_Mono']">
                {formatCurrency(investimentos.actual)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-teal-500/20 text-slate-400">
              <span>Diferença a Aportar:</span>
              <span className="font-bold text-teal-400 font-['JetBrains_Mono']">
                {formatCurrency(investimentos.difference)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((investimentos.percentageOfPlannedExpenses / 20) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
