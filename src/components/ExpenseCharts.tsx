import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from './KPICards';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

export const ExpenseCharts: React.FC = () => {
  const { expenseSummaries, selectedMonth } = useFinance();
  const [activeTab, setActiveTab] = useState<'comparativo' | 'evolucao'>('comparativo');

  // Find max value to normalize horizontal bars
  const maxValue = Math.max(
    ...expenseSummaries.map((c) => Math.max(c.planned, c.actual)),
    1000
  );

  // Sample monthly trend data around 2026-11
  const monthlyTrend = [
    { month: 'Jul/26', receitas: 30000, despesas: 21500, saldo: 8500 },
    { month: 'Ago/26', receitas: 29000, despesas: 22800, saldo: 6200 },
    { month: 'Set/26', receitas: 31500, despesas: 24100, saldo: 7400 },
    { month: 'Out/26', receitas: 33000, despesas: 22500, saldo: 10500 },
    { month: 'Nov/26', receitas: 32251, despesas: 18651, saldo: 13600, current: true },
    { month: 'Dez/26', receitas: 35000, despesas: 23251, saldo: 11749 },
  ];

  const maxTrend = Math.max(...monthlyTrend.map((m) => Math.max(m.receitas, m.despesas)));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {activeTab === 'comparativo'
                ? 'Comparativo de Categorias de Despesas'
                : 'Evolução do Saldo Mensal'}
            </h2>
            <p className="text-xs text-slate-400">
              {activeTab === 'comparativo'
                ? 'Planejado vs. Realizado por categoria de gasto'
                : 'Trajetória financeira ao longo dos meses'}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('comparativo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'comparativo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categorias
          </button>
          <button
            onClick={() => setActiveTab('evolucao')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'evolucao'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evolução Mensal
          </button>
        </div>
      </div>

      {/* Tab 1: Comparativo categorias de despesas */}
      {activeTab === 'comparativo' && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block" />
              <span>Planejado (Teto)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span>Realizado (Dentro da meta)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
              <span>Estouro de Orçamento ⚠️</span>
            </div>
          </div>

          <div className="space-y-3">
            {expenseSummaries.map((cat) => {
              const plannedPct = Math.round((cat.planned / maxValue) * 100);
              const actualPct = Math.round((cat.actual / maxValue) * 100);
              const isOver = cat.actual > cat.planned;

              return (
                <div
                  key={cat.name}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-white">{cat.name}</span>
                      {isOver && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Acima do teto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-['JetBrains_Mono']">
                      <span className="text-slate-400">
                        Plan: {formatCurrency(cat.planned)}
                      </span>
                      <span
                        className={`font-bold ${
                          isOver ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        Real: {formatCurrency(cat.actual)}
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar visualization */}
                  <div className="space-y-1">
                    {/* Planned Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12 text-right">Plan</span>
                      <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-600 rounded-full transition-all duration-500"
                          style={{ width: `${plannedPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Actual Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12 text-right">Real</span>
                      <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${actualPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Evolução do Saldo Mensal */}
      {activeTab === 'evolucao' && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
            <span>Histórico de Receitas vs Despesas e Saldo</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span>Despesas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span>Saldo Livre</span>
              </div>
            </div>
          </div>

          {/* Bar / Column Chart */}
          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-64 items-end pt-8 pb-4 border-b border-slate-800">
            {monthlyTrend.map((item) => {
              const recHeight = Math.round((item.receitas / maxTrend) * 100);
              const despHeight = Math.round((item.despesas / maxTrend) * 100);
              const saldoHeight = Math.round((item.saldo / maxTrend) * 100);

              return (
                <div
                  key={item.month}
                  className={`flex flex-col items-center h-full justify-end group ${
                    item.current ? 'bg-emerald-950/20 rounded-xl p-1 border border-emerald-500/20' : ''
                  }`}
                >
                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Receitas */}
                    <div
                      className="w-1/3 bg-cyan-500/80 rounded-t group-hover:bg-cyan-400 transition"
                      style={{ height: `${recHeight}%` }}
                      title={`Receitas: ${formatCurrency(item.receitas)}`}
                    />
                    {/* Despesas */}
                    <div
                      className="w-1/3 bg-rose-500/80 rounded-t group-hover:bg-rose-400 transition"
                      style={{ height: `${despHeight}%` }}
                      title={`Despesas: ${formatCurrency(item.despesas)}`}
                    />
                    {/* Saldo */}
                    <div
                      className="w-1/3 bg-emerald-500 rounded-t group-hover:bg-emerald-400 transition"
                      style={{ height: `${saldoHeight}%` }}
                      title={`Saldo Líquido: ${formatCurrency(item.saldo)}`}
                    />
                  </div>

                  <div className="mt-2 text-center">
                    <span
                      className={`text-[11px] font-bold block ${
                        item.current ? 'text-emerald-400 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {item.month}
                    </span>
                    <span className="text-[10px] text-slate-500 font-['JetBrains_Mono']">
                      {formatCurrency(item.saldo)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
