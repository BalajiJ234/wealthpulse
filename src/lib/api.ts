/**
 * Typed API client for wealth-pulse-api.
 * Base URL is read from NEXT_PUBLIC_API_URL env var (defaults to localhost:3001).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────────────
export type TransactionType = 'INCOME' | 'EXPENSE' | 'DEBT_PAYMENT' | 'SAVING' | 'TRANSFER';
export type DebtStatus = 'ACTIVE' | 'PAID' | 'OVERDUE';
export type CommitmentPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type CommitmentStatus = 'UPCOMING' | 'PAID' | 'MISSED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  convertedAmount: number;
  baseCurrency: string;
  category: string;
  paymentMethod?: string;
  transactionDate: string;
  isRecurring: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  debtName: string;
  lenderName?: string;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  convertedTotalAmount: number;
  remainingBalance: number;
  monthlyPayment: number;
  interestRate: number;
  dueDate?: string;
  debtType?: string;
  status: DebtStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commitment {
  id: string;
  userId: string;
  title: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  convertedAmount: number;
  dueDate: string;
  category?: string;
  priority: CommitmentPriority;
  recurringType: string;
  status: CommitmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  totalDebtPayments: number;
  totalSavings: number;
  netSurplus: number;
  totalActiveDebt: number;
  activeDebtCount: number;
  upcomingCommitmentsTotal: number;
  upcomingCommitmentsCount: number;
  emergencyFundBalance: number;
  emergencyFundMonths: string | null;
}

export interface FinancialHealth {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  month: string;
  metrics: {
    dti: number;
    savingsRate: number;
    emergencyFundMonths: number;
    netSurplus: number;
    activeDebtCount: number;
  };
  trend: { month: string; surplus: number }[];
}

export type IPhoneDecision = 'SAFE_TO_BUY' | 'WAIT_3_MONTHS' | 'WAIT_6_MONTHS' | 'BUY_LOWER_MODEL' | 'AVOID_FOR_NOW';

export interface IPhoneDecisionResult {
  decision: IPhoneDecision;
  reasons: string[];
  score: number;
  input: { iphonePrice: number; emiMonths: number; monthlyEmi: number };
}

export interface MonthlySnapshot {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  totalDebtPayments: number;
  totalSavings: number;
  netSurplus: number;
}

// ─── API methods ───────────────────────────────────────────────────────────
export const api = {
  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/api/dashboard/summary'),
  getFinancialHealth: () => request<FinancialHealth>('/api/dashboard/financial-health'),
  getIPhoneDecision: (price: number, emiMonths: number) =>
    request<IPhoneDecisionResult>(`/api/dashboard/iphone-decision?iphonePrice=${price}&emiMonths=${emiMonths}`),
  getFutureImpact: (purchaseAmount: number, emiMonths: number, projectionMonths = 24) =>
    request<{ projection: { months: number; savings: number; surplus: number }[]; baseSurplus: number }>(
      `/api/dashboard/future-impact?purchaseAmount=${purchaseAmount}&emiMonths=${emiMonths}&projectionMonths=${projectionMonths}`
    ),
  getMonthlySnapshots: (months = 6) =>
    request<MonthlySnapshot[]>(`/api/dashboard/monthly-snapshot?months=${months}`),

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Transaction[]>(`/api/transactions${qs}`);
  },
  createTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
  bulkCreateTransactions: (transactions: unknown[]) =>
    request('/api/transactions/bulk', { method: 'POST', body: JSON.stringify({ transactions }) }),
  getMonthlySummary: (month?: string) => {
    const qs = month ? `?month=${month}` : '';
    return request(`/api/transactions/monthly-summary${qs}`);
  },

  // Debts
  getDebts: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<Debt[]>(`/api/debts${qs}`);
  },
  createDebt: (data: Omit<Debt, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    request<Debt>('/api/debts', { method: 'POST', body: JSON.stringify(data) }),
  updateDebt: (id: string, data: Partial<Debt>) =>
    request<Debt>(`/api/debts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDebt: (id: string) => request<void>(`/api/debts/${id}`, { method: 'DELETE' }),
  recordDebtPayment: (id: string, paymentAmount: number) =>
    request<Debt>(`/api/debts/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paymentAmount }) }),

  // Commitments
  getCommitments: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Commitment[]>(`/api/commitments${qs}`);
  },
  createCommitment: (data: Omit<Commitment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    request<Commitment>('/api/commitments', { method: 'POST', body: JSON.stringify(data) }),
  updateCommitment: (id: string, data: Partial<Commitment>) =>
    request<Commitment>(`/api/commitments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCommitment: (id: string) => request<void>(`/api/commitments/${id}`, { method: 'DELETE' }),
};
