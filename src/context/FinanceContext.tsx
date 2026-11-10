import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  testConnection,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  CategoryBudget,
  CategorySummary,
  ExtractedTransaction,
  FiftyThirtyTwentyStats,
  FinancialHealthAnalysis,
  MonthlyBudget,
  Transaction,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_MONTH,
  INITIAL_MONTHLY_BUDGET,
  INITIAL_TRANSACTIONS,
  HISTORICAL_STATS,
} from '../mockInitialData';

interface FinanceContextType {
  user: User | null;
  authLoading: boolean;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  transactions: Transaction[];
  categoryBudgets: CategoryBudget[];
  monthlyBudget: MonthlyBudget;
  totalExpensesPlanned: number;
  totalExpensesActual: number;
  totalIncomesPlanned: number;
  totalIncomesActual: number;
  saldoMensal: number;
  saldoHoje: number;
  saldoProjetado: number;
  despesasMedia: number;
  receitasMedia: number;
  categorySummaries: CategorySummary[];
  expenseSummaries: CategorySummary[];
  incomeSummaries: CategorySummary[];
  fiftyThirtyTwenty: FiftyThirtyTwentyStats;
  isCloudSynced: boolean;
  isSyncing: boolean;
  isAnalyzingHealth: boolean;
  isExtractingFile: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'userId'>, repeatMonths?: number) => Promise<void>;
  addTransactionsBatch: (items: Omit<Transaction, 'id' | 'userId'>[]) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateCategoryPlanned: (categoryId: string, newPlanned: number) => Promise<void>;
  updateMonthlyBudgetPlan: (expenses: number, incomes: number, notes?: string) => Promise<void>;
  resetToSpreadsheetData: () => Promise<void>;
  exportToCSV: () => void;
  analyzeFinancialHealth: () => Promise<FinancialHealthAnalysis>;
  extractTransactionsFromFile: (file: File) => Promise<ExtractedTransaction[]>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'finanflow_v1_';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(INITIAL_MONTH);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);

  // Core state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}transactions`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local transactions', e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}categories`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local categories', e);
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}budget_${INITIAL_MONTH}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local monthly budget', e);
      }
    }
    return INITIAL_MONTHLY_BUDGET;
  });

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}categories`, JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  useEffect(() => {
    localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}budget_${selectedMonth}`,
      JSON.stringify(monthlyBudget)
    );
  }, [monthlyBudget, selectedMonth]);

  // Auth observer and Firestore listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setIsSyncing(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userDocRef,
            {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Usuário',
              email: currentUser.email || '',
              currency: 'BRL',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('User profile initialization notice:', err);
        }
      } else {
        setIsCloudSynced(false);
        setIsSyncing(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Firestore Sync when user is authenticated
  useEffect(() => {
    if (!user) {
      setIsCloudSynced(false);
      return;
    }

    const txPath = `users/${user.uid}/transactions`;
    const txQuery = query(collection(db, txPath), where('month', '==', selectedMonth));

    const unsubscribeTx = onSnapshot(
      txQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Transaction[] = [];
          snapshot.forEach((d) => {
            loaded.push({ ...(d.data() as Transaction), id: d.id });
          });
          setTransactions(loaded);
          setIsCloudSynced(true);
        } else {
          // If Firestore is empty for this user, seed it with initial spreadsheet records
          seedUserFirestore(user.uid, selectedMonth);
        }
        setIsSyncing(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, txPath);
      }
    );

    return () => unsubscribeTx();
  }, [user, selectedMonth]);

  const seedUserFirestore = async (uid: string, month: string) => {
    try {
      const budgetRef = doc(db, 'users', uid, 'budgets', month);
      await setDoc(budgetRef, {
        userId: uid,
        month,
        plannedExpenses: INITIAL_MONTHLY_BUDGET.plannedExpenses,
        plannedIncomes: INITIAL_MONTHLY_BUDGET.plannedIncomes,
        notes: INITIAL_MONTHLY_BUDGET.notes || '',
        updatedAt: new Date().toISOString(),
      });

      for (const cat of INITIAL_CATEGORIES) {
        const catRef = doc(db, 'users', uid, 'budgets', month, 'categories', cat.id);
        await setDoc(catRef, {
          id: cat.id,
          userId: uid,
          month,
          name: cat.name,
          type: cat.type,
          ruleGroup: cat.ruleGroup,
          plannedAmount: cat.plannedAmount,
          color: cat.color || '#10b981',
          updatedAt: new Date().toISOString(),
        });
      }

      for (const tx of INITIAL_TRANSACTIONS) {
        const txRef = doc(db, 'users', uid, 'transactions', tx.id);
        await setDoc(txRef, {
          id: tx.id,
          userId: uid,
          month,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          ruleGroup: tx.ruleGroup,
          status: tx.status,
          paymentMethod: tx.paymentMethod || 'Outros',
          notes: tx.notes || '',
          isRecurring: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Erro ao sincronizar dados iniciais no Firestore:', err);
    }
  };

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>([
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
    ]);
    transactions.forEach((t) => monthsSet.add(t.month));
    return Array.from(monthsSet).sort();
  }, [transactions]);

  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => t.month === selectedMonth);
  }, [transactions, selectedMonth]);

  // Summaries calculation
  const {
    totalExpensesPlanned,
    totalExpensesActual,
    totalIncomesPlanned,
    totalIncomesActual,
    categorySummaries,
    expenseSummaries,
    incomeSummaries,
    fiftyThirtyTwenty,
    saldoMensal,
    saldoHoje,
    saldoProjetado,
  } = useMemo(() => {
    const activeCats = categoryBudgets.filter(
      (c) => c.month === selectedMonth || !c.month
    );

    const actualsByCategory: Record<string, number> = {};
    activeTransactions.forEach((t) => {
      actualsByCategory[t.category] = (actualsByCategory[t.category] || 0) + t.amount;
    });

    const summaries: CategorySummary[] = activeCats.map((cat) => {
      const actual = actualsByCategory[cat.name] || 0;
      const planned = cat.plannedAmount;
      const difference = cat.type === 'despesa' ? planned - actual : actual - planned;
      const isOverLimit = cat.type === 'despesa' ? actual > planned : false;
      const limit = cat.type === 'despesa' ? planned : planned;

      return {
        name: cat.name,
        type: cat.type,
        ruleGroup: cat.ruleGroup,
        planned,
        actual,
        limit,
        difference,
        isOverLimit,
        color: cat.color || '#10b981',
      };
    });

    const expSummaries = summaries.filter((s) => s.type === 'despesa');
    const incSummaries = summaries.filter((s) => s.type === 'receita');

    const expPlanned = expSummaries.reduce((acc, s) => acc + s.planned, 0);
    const expActual = expSummaries.reduce((acc, s) => acc + s.actual, 0);

    const incPlanned = incSummaries.reduce((acc, s) => acc + s.planned, 0);
    const incActual = incSummaries.reduce((acc, s) => acc + s.actual, 0);

    const basePlan = expPlanned > 0 ? expPlanned : 23251;

    const necActual = activeTransactions
      .filter((t) => t.type === 'despesa' && t.ruleGroup === 'necessidades')
      .reduce((acc, t) => acc + t.amount, 0);

    const desActual = activeTransactions
      .filter((t) => t.type === 'despesa' && t.ruleGroup === 'desejos')
      .reduce((acc, t) => acc + t.amount, 0);

    const invActual = activeTransactions
      .filter((t) => t.type === 'despesa' && t.ruleGroup === 'investimentos')
      .reduce((acc, t) => acc + t.amount, 0);

    const necPlanned = Math.round(basePlan * 0.5);
    const desPlanned = Math.round(basePlan * 0.3);
    const invPlanned = Math.round(basePlan * 0.2);

    const necPct = basePlan > 0 ? Math.round((necActual / basePlan) * 100) : 0;
    const desPct = basePlan > 0 ? Math.round((desActual / basePlan) * 100) : 0;
    const invPct = basePlan > 0 ? Math.round((invActual / basePlan) * 100) : 0;

    const stats503020: FiftyThirtyTwentyStats = {
      necessidades: {
        planned: necPlanned,
        actual: necActual,
        percentageOfPlannedExpenses: necPct,
        targetPercentage: 50,
        difference: necPlanned - necActual,
        isOverBudget: necPct > 50,
      },
      desejos: {
        planned: desPlanned,
        actual: desActual,
        percentageOfPlannedExpenses: desPct,
        targetPercentage: 30,
        difference: desPlanned - desActual,
        isOverBudget: desPct > 30,
      },
      investimentos: {
        planned: invPlanned,
        actual: invActual,
        percentageOfPlannedExpenses: invPct,
        targetPercentage: 20,
        difference: invPlanned - invActual,
        isOverBudget: invActual < invPlanned,
      },
    };

    const saldoM = expPlanned - expActual;
    const sHoje =
      incActual > 0
        ? incActual - expActual + (selectedMonth === INITIAL_MONTH ? 4560 : 0)
        : HISTORICAL_STATS.saldoHoje;
    const sProjetado = saldoM;

    return {
      totalExpensesPlanned: expPlanned,
      totalExpensesActual: expActual,
      totalIncomesPlanned: incPlanned,
      totalIncomesActual: incActual,
      categorySummaries: summaries,
      expenseSummaries: expSummaries,
      incomeSummaries: incSummaries,
      fiftyThirtyTwenty: stats503020,
      saldoMensal: saldoM,
      saldoHoje: sHoje,
      saldoProjetado: sProjetado,
    };
  }, [categoryBudgets, activeTransactions, selectedMonth]);

  // Actions
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Erro no login:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Erro no logout:', err);
    }
  };

  // Add transaction with optional recurrence / repetition across multiple months
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'userId'>,
    repeatMonths: number = 1
  ) => {
    const newTransactions: Transaction[] = [];
    const count = Math.max(1, Math.min(repeatMonths, 36));

    const [baseYear, baseMonth] = data.month.split('-').map(Number);
    const day = data.date.slice(8, 10);

    for (let i = 0; i < count; i++) {
      const targetDateObj = new Date(baseYear, baseMonth - 1 + i, Number(day));
      const targetYear = targetDateObj.getFullYear();
      const targetMonthNum = String(targetDateObj.getMonth() + 1).padStart(2, '0');
      const targetMonth = `${targetYear}-${targetMonthNum}`;
      const targetDate = `${targetMonth}-${String(targetDateObj.getDate()).padStart(2, '0')}`;

      const newId = `tx_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
      const installmentNotes =
        count > 1 ? ` (Parcela ${i + 1}/${count})` : '';

      const txItem: Transaction = {
        ...data,
        id: newId,
        userId: user?.uid || 'local-user',
        month: targetMonth,
        date: targetDate,
        description: `${data.description}${count > 1 && !data.description.includes('/') ? installmentNotes : ''}`,
        isRecurring: data.isRecurring || count > 1,
        recurrenceInterval: data.recurrenceInterval || (count > 1 ? 'mensal' : undefined),
        installmentCurrent: count > 1 ? i + 1 : undefined,
        installmentTotal: count > 1 ? count : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newTransactions.push(txItem);

      if (user) {
        const path = `users/${user.uid}/transactions/${newId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'transactions', newId), txItem);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
    }

    setTransactions((prev) => [...newTransactions, ...prev]);
  };

  // Batch insert multiple transactions (used by AI file extraction)
  const addTransactionsBatch = async (items: Omit<Transaction, 'id' | 'userId'>[]) => {
    const created: Transaction[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const newId = `tx_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
      const newTx: Transaction = {
        ...item,
        id: newId,
        userId: user?.uid || 'local-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      created.push(newTx);

      if (user) {
        const path = `users/${user.uid}/transactions/${newId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'transactions', newId), newTx);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
    }

    setTransactions((prev) => [...created, ...prev]);
  };

  const updateTransaction = async (transaction: Transaction) => {
    const updated = { ...transaction, updatedAt: new Date().toISOString() };
    setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? updated : t)));

    if (user) {
      const path = `users/${user.uid}/transactions/${transaction.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'transactions', transaction.id), updated, {
          merge: true,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (user) {
      const path = `users/${user.uid}/transactions/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const updateCategoryPlanned = async (categoryId: string, newPlanned: number) => {
    setCategoryBudgets((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, plannedAmount: newPlanned } : c))
    );

    if (user) {
      const path = `users/${user.uid}/budgets/${selectedMonth}/categories/${categoryId}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'budgets', selectedMonth, 'categories', categoryId),
          { plannedAmount: newPlanned, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const updateMonthlyBudgetPlan = async (
    expenses: number,
    incomes: number,
    notes?: string
  ) => {
    const updated: MonthlyBudget = {
      userId: user?.uid || 'local-user',
      month: selectedMonth,
      plannedExpenses: expenses,
      plannedIncomes: incomes,
      notes: notes || monthlyBudget.notes,
      updatedAt: new Date().toISOString(),
    };
    setMonthlyBudget(updated);

    if (user) {
      const path = `users/${user.uid}/budgets/${selectedMonth}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'budgets', selectedMonth), updated, {
          merge: true,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const resetToSpreadsheetData = async () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategoryBudgets(INITIAL_CATEGORIES);
    setMonthlyBudget(INITIAL_MONTHLY_BUDGET);
    setSelectedMonth(INITIAL_MONTH);

    if (user) {
      await seedUserFirestore(user.uid, INITIAL_MONTH);
    }
  };

  const exportToCSV = () => {
    const rows = [
      ['Data', 'Tipo', 'Categoria', 'Grupo 50-30-20', 'Descrição', 'Valor (R$)', 'Status', 'Recorrente', 'Forma de Pagamento', 'Observações'],
      ...activeTransactions.map((t) => [
        t.date,
        t.type,
        t.category,
        t.ruleGroup,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        t.status,
        t.isRecurring ? 'Sim' : 'Não',
        t.paymentMethod || '',
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Controle_Financeiro_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gemini AI Financial Health Analysis
  const analyzeFinancialHealth = async (): Promise<FinancialHealthAnalysis> => {
    setIsAnalyzingHealth(true);
    try {
      const categoriesOverLimit = expenseSummaries
        .filter((c) => c.isOverLimit)
        .map((c) => ({
          categoria: c.name,
          planejado: c.planned,
          realizado: c.actual,
          excesso: c.actual - c.planned,
        }));

      const topExpenses = [...activeTransactions]
        .filter((t) => t.type === 'despesa')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .map((t) => ({
          descricao: t.description,
          categoria: t.category,
          valor: t.amount,
          data: t.date,
          recorrente: t.isRecurring || false,
        }));

      const payload = {
        month: selectedMonth,
        totalExpensesPlanned,
        totalExpensesActual,
        totalIncomesPlanned,
        totalIncomesActual,
        saldoMensal,
        saldoHoje,
        saldoProjetado,
        fiftyThirtyTwenty,
        categoriesOverLimit,
        topExpenses,
      };

      const response = await fetch('/api/gemini/analyze-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Erro ao consultar o Gemini');
      }

      const result: FinancialHealthAnalysis = await response.json();
      return result;
    } finally {
      setIsAnalyzingHealth(false);
    }
  };

  // Gemini File Extraction (CSV, XLS, PDF, Boletos, Extratos)
  const extractTransactionsFromFile = async (file: File): Promise<ExtractedTransaction[]> => {
    setIsExtractingFile(true);
    try {
      const isText =
        file.type === 'text/csv' ||
        file.type === 'text/plain' ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.ofx');

      let textContent = '';
      let fileContentBase64 = '';

      if (isText) {
        textContent = await file.text();
      } else {
        // Binary / PDF / Image
        const arrayBuf = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileContentBase64 = btoa(binary);
      }

      const categoriesList = categoryBudgets.map((c) => c.name);

      const response = await fetch('/api/gemini/extract-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileContentBase64,
          textContent,
          mimeType: file.type || 'application/pdf',
          currentCategories: categoriesList,
          selectedMonth,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Erro ao processar arquivo com Gemini');
      }

      const extracted: ExtractedTransaction[] = await response.json();
      return extracted;
    } finally {
      setIsExtractingFile(false);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        authLoading,
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        transactions: activeTransactions,
        categoryBudgets,
        monthlyBudget,
        totalExpensesPlanned,
        totalExpensesActual,
        totalIncomesPlanned,
        totalIncomesActual,
        saldoMensal,
        saldoHoje,
        saldoProjetado,
        despesasMedia: HISTORICAL_STATS.despesasMedia,
        receitasMedia: HISTORICAL_STATS.receitasMedia,
        categorySummaries,
        expenseSummaries,
        incomeSummaries,
        fiftyThirtyTwenty,
        isCloudSynced,
        isSyncing,
        isAnalyzingHealth,
        isExtractingFile,
        login: handleLogin,
        logout: handleLogout,
        addTransaction,
        addTransactionsBatch,
        updateTransaction,
        deleteTransaction,
        updateCategoryPlanned,
        updateMonthlyBudgetPlan,
        resetToSpreadsheetData,
        exportToCSV,
        analyzeFinancialHealth,
        extractTransactionsFromFile,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser utilizado dentro de FinanceProvider');
  }
  return context;
};
