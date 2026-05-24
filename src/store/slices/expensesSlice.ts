import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  date: string;
  currency: string;
  createdAt?: string;
  isRecurring?: boolean;
  recurringPeriod?: "daily" | "weekly" | "monthly" | "yearly";
  tags?: string[];
  notes?: string;
  location?: string;
  source?: "manual" | "budget" | "import"; // Track where expense came from
}

interface ExpensesState {
  expenses: Expense[];
  totalSpent: number;
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  expenses: [],
  totalSpent: 0,
  loading: false,
  error: null,
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.unshift(action.payload);
      state.totalSpent += action.payload.amount;
    },
    updateExpense: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Expense> }>
    ) => {
      const { id, updates } = action.payload;
      const expenseIndex = state.expenses.findIndex(
        (expense) => expense.id === id
      );

      if (expenseIndex !== -1) {
        const oldAmount = state.expenses[expenseIndex].amount;
        state.expenses[expenseIndex] = {
          ...state.expenses[expenseIndex],
          ...updates,
        };

        // Update total if amount changed
        if (updates.amount !== undefined) {
          state.totalSpent = state.totalSpent - oldAmount + updates.amount;
        }
      }
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      const expenseIndex = state.expenses.findIndex(
        (expense) => expense.id === action.payload
      );

      if (expenseIndex !== -1) {
        state.totalSpent -= state.expenses[expenseIndex].amount;
        state.expenses.splice(expenseIndex, 1);
      }
    },
    bulkImportExpenses: (state, action: PayloadAction<Expense[]>) => {
      const newExpenses = action.payload;
      state.expenses = [...newExpenses, ...state.expenses];
      state.totalSpent = state.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearExpenses: (state) => {
      state.expenses = [];
      state.totalSpent = 0;
    },
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
      state.totalSpent = action.payload.reduce((sum, e) => sum + e.amount, 0);
    },
  },
});

export const {
  addExpense,
  updateExpense,
  deleteExpense,
  bulkImportExpenses,
  setLoading,
  setError,
  clearExpenses,
  setExpenses,
} = expensesSlice.actions;

// Selectors - Note: RootState will be imported from store/index.ts in components
export const selectExpenses = (state: { expenses: ExpensesState }) =>
  state.expenses.expenses;
export const selectTotalSpent = (state: { expenses: ExpensesState }) =>
  state.expenses.totalSpent;
export const selectExpensesLoading = (state: { expenses: ExpensesState }) =>
  state.expenses.loading;
export const selectExpensesError = (state: { expenses: ExpensesState }) =>
  state.expenses.error;

// Advanced selectors
export const selectExpensesByCategory = (state: {
  expenses: ExpensesState;
}) => {
  const expenses = state.expenses.expenses;
  return expenses.reduce((acc: Record<string, number>, expense: Expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
};

export const selectExpensesByMonth = (state: { expenses: ExpensesState }) => {
  const expenses = state.expenses.expenses;
  return expenses.reduce((acc: Record<string, number>, expense: Expense) => {
    const monthKey = expense.date.substring(0, 7); // YYYY-MM
    acc[monthKey] = (acc[monthKey] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
};

export const selectRecentExpenses = (
  state: { expenses: ExpensesState },
  limit: number = 10
) => {
  return state.expenses.expenses.slice(0, limit);
};

export default expensesSlice.reducer;
