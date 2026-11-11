import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RuleGroup, Transaction, TransactionStatus, TransactionType } from '../types';
import { X, Check, Repeat, Calendar, ClipboardPaste } from 'lucide-react';
import { cleanAmount } from '../utils/tabularParser';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  initialCategory?: string;
  initialType?: TransactionType;
  onSwitchToImport?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
  initialCategory,
  initialType = 'despesa',
  onSwitchToImport,
}) => {
  const { addTransaction, updateTransaction, categoryBudgets, selectedMonth } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState('');
  const [ruleGroup, setRuleGroup] = useState<RuleGroup>('necessidades');
  const [date, setDate] = useState(`${selectedMonth}-01`);
  const [status, setStatus] = useState<TransactionStatus>('concluido');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [notes, setNotes] = useState('');

  // Recurrence / Fixed transaction state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'mensal' | 'semanal' | 'anual'>('mensal');
  const [repeatMonths, setRepeatMonths] = useState<number>(1);

  const availableCategories = categoryBudgets
    .filter((c) => c.type === type)
    .map((c) => c.name);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setRuleGroup(editingTransaction.ruleGroup);
      setDate(editingTransaction.date);
      setStatus(editingTransaction.status);
      setPaymentMethod(editingTransaction.paymentMethod || 'Pix');
      setNotes(editingTransaction.notes || '');
      setIsRecurring(editingTransaction.isRecurring || false);
      setRecurrenceInterval(editingTransaction.recurrenceInterval || 'mensal');
      setRepeatMonths(1);
    } else {
      setType(initialType);
      setDescription('');
      setAmount('');
      const defaultCat =
        initialCategory ||
        (availableCategories[0] ||
          (initialType === 'despesa' ? 'Alimentação' : 'Pagamento'));
      setCategory(defaultCat);
      setRuleGroup(initialType === 'receita' ? 'receitas' : 'necessidades');

      const today = new Date().toISOString().slice(0, 10);
      setDate(today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`);
      setStatus('concluido');
      setPaymentMethod('Pix');
      setNotes('');
      setIsRecurring(false);
      setRecurrenceInterval('mensal');
      setRepeatMonths(1);
    }
  }, [editingTransaction, initialCategory, initialType, isOpen, selectedMonth]);

  const handleCategoryChange = (catName: string) => {
    setCategory(catName);
    const found = categoryBudgets.find((c) => c.name === catName && c.type === type);
    if (found) {
      setRuleGroup(found.ruleGroup);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCats = categoryBudgets.filter((c) => c.type === newType).map((c) => c.name);
    const defaultCat = newCats[0] || (newType === 'despesa' ? 'Alimentação' : 'Pagamento');
    setCategory(defaultCat);
    setRuleGroup(newType === 'receita' ? 'receitas' : 'necessidades');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { amount: numAmount } = cleanAmount(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor informe uma descrição válida e um valor maior que zero.');
      return;
    }

    const payload = {
      month: date.slice(0, 7),
      date,
      description: description.trim(),
      amount: numAmount,
      type,
      category: category.trim(),
      ruleGroup: type === 'receita' ? 'receitas' : ruleGroup,
      status,
      paymentMethod,
      notes: notes.trim(),
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
    };

    if (editingTransaction) {
      await updateTransaction({
        ...editingTransaction,
        ...payload,
      });
    } else {
      await addTransaction(payload, isRecurring ? repeatMonths : 1);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/80 backdrop-blur-sm p-2.5 sm:p-4">
      <div className="min-h-full flex items-start sm:items-center justify-center py-2 sm:py-6">
        <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden transition-colors">
          
          {/* Header - Always accessible at top */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              {isRecurring && (
                <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Repeat className="w-3 h-3" /> Fixo / Recorrente
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form with internal scroll */}
          <form id="transactionForm" onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto overscroll-contain flex-1 space-y-4">
            
            {!editingTransaction && onSwitchToImport && (
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <ClipboardPaste className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Deseja inserir vários lançamentos copiados do Excel ou Sheets?</span>
                </span>
                <button
                  type="button"
                  onClick={onSwitchToImport}
                  className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 hover:underline shrink-0 cursor-pointer"
                >
                  Colar tabela →
                </button>
              </div>
            )}

            {/* Type Switcher */}
            <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Tipo de Operação
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleTypeChange('despesa')}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  type === 'despesa'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Despesa (Saída)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('receita')}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  type === 'receita'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Receita (Entrada)
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-['JetBrains_Mono']">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-['JetBrains_Mono'] text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Descrição / Identificação *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel Residencial, Netflix, Salário Mensal, Internet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & 50-30-20 Rule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {type === 'despesa' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Classificação (50-30-20)
                </label>
                <select
                  value={ruleGroup}
                  onChange={(e) => setRuleGroup(e.target.value as RuleGroup)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="necessidades" className="bg-white dark:bg-slate-900">Necessidades (50%)</option>
                  <option value="desejos" className="bg-white dark:bg-slate-900">Desejos & Estilo (30%)</option>
                  <option value="investimentos" className="bg-white dark:bg-slate-900">Investimentos & Reserva (20%)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Classificação
                </label>
                <div className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  Receita / Entrada
                </div>
              </div>
            )}
          </div>

          {/* Recurrence & Fixed Option */}
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-950/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Lançamento Fixo / Recorrente
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Repete este lançamento em múltiplos meses (ex: aluguel, salário, assinaturas)
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                id="isRecurringCheck"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                    Frequência
                  </label>
                  <select
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-400"
                  >
                    <option value="mensal">Mensal (Todo mês)</option>
                    <option value="semanal">Semanal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                {!editingTransaction && (
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                      Repetir por quantos meses?
                    </label>
                    <select
                      value={repeatMonths}
                      onChange={(e) => setRepeatMonths(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-400"
                    >
                      <option value={1}>Apenas neste mês</option>
                      <option value={3}>3 meses (Próximo trimestre)</option>
                      <option value={6}>6 meses (Próximo semestre)</option>
                      <option value={12}>12 meses (Ano completo)</option>
                      <option value={24}>24 meses (2 anos)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Débito Automático">Débito Automático</option>
                <option value="Transferência Bancária">Transferência / TED</option>
                <option value="Dinheiro">Dinheiro em Espécie</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Status da Transação
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="concluido">Concluído (Liquidado)</option>
                <option value="pendente">Pendente (Agendado / A pagar)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Parcela 2/6, comprovante guardado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </form>

        {/* Footer - Always accessible at bottom */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="transactionForm"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/20 dark:shadow-emerald-950/50 transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              {editingTransaction
                ? 'Salvar Alterações'
                : repeatMonths > 1 && isRecurring
                ? `Criar em ${repeatMonths} Meses`
                : 'Adicionar Lançamento'}
            </span>
          </button>
        </div>

      </div>
    </div>
  </div>
  );
};
