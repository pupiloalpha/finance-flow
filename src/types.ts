export type TransactionType = 'despesa' | 'receita';

export type RuleGroup = 'necessidades' | 'desejos' | 'investimentos' | 'receitas';

export type TransactionStatus = 'concluido' | 'pendente';

export interface Transaction {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  ruleGroup: RuleGroup;
  status: TransactionStatus;
  paymentMethod?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceInterval?: 'mensal' | 'semanal' | 'anual';
  installmentCurrent?: number;
  installmentTotal?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  name: string;
  type: TransactionType;
  ruleGroup: RuleGroup;
  plannedAmount: number;
  color?: string;
}

export interface MonthlyBudget {
  userId: string;
  month: string; // YYYY-MM
  plannedExpenses: number;
  plannedIncomes: number;
  notes?: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategorySummary {
  name: string;
  type: TransactionType;
  ruleGroup: RuleGroup;
  planned: number;
  actual: number;
  limit: number;
  difference: number;
  isOverLimit: boolean;
  color: string;
}

export interface FiftyThirtyTwentyStats {
  necessidades: {
    planned: number;
    actual: number;
    percentageOfPlannedExpenses: number;
    targetPercentage: number;
    difference: number;
    isOverBudget: boolean;
  };
  desejos: {
    planned: number;
    actual: number;
    percentageOfPlannedExpenses: number;
    targetPercentage: number;
    difference: number;
    isOverBudget: boolean;
  };
  investimentos: {
    planned: number;
    actual: number;
    percentageOfPlannedExpenses: number;
    targetPercentage: number;
    difference: number;
    isOverBudget: boolean;
  };
}

export interface FinancialHealthAnalysis {
  score: number;
  scoreLabel: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  summary: string;
  diagnostico503020: {
    necessidadesObs: string;
    desejosObs: string;
    investimentosObs: string;
  };
  criticas: string[];
  pontosFortes: string[];
  recomendacoes: {
    titulo: string;
    descricao: string;
    impactoEstimado: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }[];
  planoAcao: string[];
}

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  ruleGroup: RuleGroup;
  paymentMethod: string;
  confidence?: string;
}
