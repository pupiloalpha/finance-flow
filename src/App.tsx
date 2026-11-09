import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FiftyThirtyTwentyCard } from './components/FiftyThirtyTwentyCard';
import { ExpenseCharts } from './components/ExpenseCharts';
import { CategoryTables } from './components/CategoryTables';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { AIHealthModal } from './components/AIHealthModal';
import { FileUploadModal } from './components/FileUploadModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FinancialHealthAnalysis, Transaction, TransactionType } from './types';
import { ShieldCheck, Sparkles, FileSpreadsheet, UploadCloud } from 'lucide-react';

function Dashboard() {
  const { analyzeFinancialHealth, isAnalyzingHealth } = useFinance();

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialCategory, setInitialCategory] = useState<string | undefined>(undefined);
  const [initialType, setInitialType] = useState<TransactionType>('despesa');

  // Budget modal states
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [targetCategoryName, setTargetCategoryName] = useState<string | null>(null);
  const [targetInitialPlanned, setTargetInitialPlanned] = useState<number | null>(null);

  // Filter state for category table clicks
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Gemini AI Health modal states
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [healthAnalysis, setHealthAnalysis] = useState<FinancialHealthAnalysis | null>(null);

  // File Upload modal states
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);

  const handleOpenNewTransaction = (category?: string, type: TransactionType = 'despesa') => {
    setEditingTransaction(null);
    setInitialCategory(category);
    setInitialType(type);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setInitialCategory(tx.category);
    setInitialType(tx.type);
    setIsTransactionModalOpen(true);
  };

  const handleEditPlanned = (categoryId: string, currentPlanned: number, categoryName: string) => {
    setTargetCategoryId(categoryId);
    setTargetCategoryName(categoryName);
    setTargetInitialPlanned(currentPlanned);
    setIsBudgetModalOpen(true);
  };

  const handleOpenBulkBudgetModal = () => {
    setTargetCategoryId(null);
    setTargetCategoryName(null);
    setTargetInitialPlanned(null);
    setIsBudgetModalOpen(true);
  };

  const handleTriggerAIHealth = async () => {
    setIsHealthModalOpen(true);
    if (!healthAnalysis) {
      try {
        const res = await analyzeFinancialHealth();
        setHealthAnalysis(res);
      } catch (err) {
        console.error('Falha na análise do Gemini:', err);
      }
    }
  };

  const handleForceReanalyze = async () => {
    try {
      const res = await analyzeFinancialHealth();
      setHealthAnalysis(res);
    } catch (err) {
      console.error('Falha na análise do Gemini:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      <Header
        onOpenNewTransaction={() => handleOpenNewTransaction()}
        onOpenBudgetModal={handleOpenBulkBudgetModal}
        onOpenHealthModal={handleTriggerAIHealth}
        onOpenFileUpload={() => setIsFileUploadOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Welcome / Info Banner with Quick AI & File Upload Triggers */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-teal-950/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Planilha Automatizada de Controle Financeiro
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  PWA & Nuvem
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Controle inteligente com metodologia 50-30-20, suporte a despesas fixas recorrentes, importação inteligente de extratos via Gemini e diagnóstico de saúde financeira.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleTriggerAIHealth}
              disabled={isAnalyzingHealth}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnóstico com Gemini</span>
            </button>

            <button
              onClick={() => setIsFileUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Importar Extrato</span>
            </button>
          </div>
        </div>

        {/* 1. Main KPI Cards (Saldo Mensal, Despesas, Receitas) */}
        <KPICards />

        {/* 2. 50-30-20 Financial Rule Card */}
        <FiftyThirtyTwentyCard />

        {/* 3. Visual Charts (Comparativo de Despesas & Evolução Mensal) */}
        <ExpenseCharts />

        {/* 4. Detailed Category Tables (Despesas & Receitas with ⚠️ alerts) */}
        <CategoryTables
          onQuickAdd={(catName, type) => handleOpenNewTransaction(catName, type)}
          onEditPlanned={handleEditPlanned}
          onSelectCategoryFilter={(catName) => setSelectedCategoryFilter(catName)}
        />

        {/* 5. Complete Itemized Transaction List */}
        <TransactionList
          onEditTransaction={handleEditTransaction}
          onOpenNewTransaction={() => handleOpenNewTransaction()}
          onOpenFileUpload={() => setIsFileUploadOpen(true)}
          selectedCategoryFilter={selectedCategoryFilter}
          onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>FinanFlow — Seus dados financeiros protegidos e criptografados</span>
          </div>
          <p>© 2026 Controle Financeiro Pessoal • Integrado ao Firebase & Gemini AI</p>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        editingTransaction={editingTransaction}
        initialCategory={initialCategory}
        initialType={initialType}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        targetCategoryId={targetCategoryId}
        targetCategoryName={targetCategoryName}
        initialPlanned={targetInitialPlanned}
      />

      <AIHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        analysis={healthAnalysis}
        isLoading={isAnalyzingHealth}
        onReanalyze={handleForceReanalyze}
      />

      <FileUploadModal
        isOpen={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <Dashboard />
    </FinanceProvider>
  );
}
