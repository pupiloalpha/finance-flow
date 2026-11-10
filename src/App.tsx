import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { ShieldCheck, FileSpreadsheet } from 'lucide-react';

function Dashboard() {
  const { analyzeFinancialHealth, isAnalyzingHealth, transactions } = useFinance();

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] transition-colors duration-200">
      <Header
        onOpenNewTransaction={() => handleOpenNewTransaction()}
        onOpenBudgetModal={handleOpenBulkBudgetModal}
        onOpenHealthModal={handleTriggerAIHealth}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Welcome / Info Banner with Monthly Status Badges */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs dark:shadow-lg transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Planilha Automatizada de Controle Financeiro
                <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  PWA & Nuvem
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Controle inteligente com metodologia 50-30-20, suporte a despesas fixas recorrentes, importação de extratos e diagnóstico financeiro com Gemini IA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Metodologia 50/30/20 Ativa</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shadow-xs">
              <span className="font-bold text-slate-900 dark:text-white">{transactions.length}</span>
              <span>lançamentos ativos</span>
            </div>
          </div>
        </div>

        {/* 1. Main KPI Cards (Saldo Mensal, Despesas, Receitas) */}
        <KPICards />

        {/* 2. 50-30-20 Financial Rule Card */}
        <FiftyThirtyTwentyCard />

        {/* 3. Visual Charts (Comparativo de Despesas & Evolução Mensal) */}
        <ExpenseCharts />

        {/* 4. Detailed Category Tables (Despesas & Receitas with alerts) */}
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
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span>Minhas Contas — Seus dados financeiros protegidos e criptografados</span>
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
        onSwitchToImport={() => {
          setIsTransactionModalOpen(false);
          setIsFileUploadOpen(true);
        }}
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
    <ThemeProvider>
      <FinanceProvider>
        <Dashboard />
      </FinanceProvider>
    </ThemeProvider>
  );
}

