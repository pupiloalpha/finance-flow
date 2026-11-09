import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from './KPICards';
import { X, Check, Sliders, AlertCircle } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategoryId?: string | null;
  targetCategoryName?: string | null;
  initialPlanned?: number | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  targetCategoryId,
  targetCategoryName,
  initialPlanned,
}) => {
  const { categoryBudgets, updateCategoryPlanned, updateMonthlyBudgetPlan, monthlyBudget, selectedMonth } = useFinance();

  // If a specific category was clicked, allow quick single edit
  const [singleValue, setSingleValue] = useState<string>('');
  
  // Or bulk edit all categories
  const [categoryPlans, setCategoryPlans] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialPlanned !== undefined && initialPlanned !== null) {
      setSingleValue(initialPlanned.toString());
    }
    const map: Record<string, number> = {};
    categoryBudgets.forEach((c) => {
      map[c.id] = c.plannedAmount;
    });
    setCategoryPlans(map);
  }, [categoryBudgets, initialPlanned, isOpen]);

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategoryId) return;
    const val = parseFloat(singleValue.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      await updateCategoryPlanned(targetCategoryId, val);
      onClose();
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const [id, val] of Object.entries(categoryPlans)) {
      await updateCategoryPlanned(id, val);
    }
    // Calculate total planned expenses from updated categories
    const expTotal = categoryBudgets
      .filter((c) => c.type === 'despesa')
      .reduce((acc, c) => acc + (categoryPlans[c.id] !== undefined ? categoryPlans[c.id] : c.plannedAmount), 0);

    const incTotal = categoryBudgets
      .filter((c) => c.type === 'receita')
      .reduce((acc, c) => acc + (categoryPlans[c.id] !== undefined ? categoryPlans[c.id] : c.plannedAmount), 0);

    await updateMonthlyBudgetPlan(expTotal, incTotal);
    onClose();
  };

  // Single category quick edit mode
  if (targetCategoryId && targetCategoryName) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Editar Teto de {targetCategoryName}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSingleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Novo valor planejado para o mês ({selectedMonth}):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-['JetBrains_Mono']">
                  R$
                </span>
                <input
                  type="number"
                  step="1"
                  required
                  value={singleValue}
                  onChange={(e) => setSingleValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-['JetBrains_Mono'] text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                Salvar Teto
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Bulk edit mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Planejamento de Metas & Tetos Orçamentários ({selectedMonth})
            </h3>
            <p className="text-xs text-slate-400">
              Defina os limites de gastos por categoria para automatizar os alertas ⚠️ e o cálculo 50-30-20.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleBulkSubmit} className="mt-4 space-y-5">
          {/* Despesas list */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
              Tetos de Despesas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categoryBudgets
                .filter((c) => c.type === 'despesa')
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {cat.ruleGroup}
                      </span>
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 font-['JetBrains_Mono']">
                        R$
                      </span>
                      <input
                        type="number"
                        step="1"
                        value={categoryPlans[cat.id] ?? cat.plannedAmount}
                        onChange={(e) =>
                          setCategoryPlans({
                            ...categoryPlans,
                            [cat.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-6 pr-2 py-1 text-right rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-['JetBrains_Mono'] font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Receitas list */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              Previsão de Receitas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categoryBudgets
                .filter((c) => c.type === 'receita')
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-white">
                      {cat.name}
                    </span>
                    <div className="w-28 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 font-['JetBrains_Mono']">
                        R$
                      </span>
                      <input
                        type="number"
                        step="1"
                        value={categoryPlans[cat.id] ?? cat.plannedAmount}
                        onChange={(e) =>
                          setCategoryPlans({
                            ...categoryPlans,
                            [cat.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-6 pr-2 py-1 text-right rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-['JetBrains_Mono'] font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Metas Orçamentárias</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
