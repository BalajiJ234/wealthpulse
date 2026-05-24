import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type IncomeCategory =
  | 'salary'
  | 'bonus'
  | 'freelance'
  | 'investment'
  | 'refund'
  | 'rental'
  | 'gift'
  | 'other'

export type IncomeStatus = 'received' | 'scheduled'

export type IncomeRecurrence = 'one-time' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export interface Income {
  id: string
  amount: number
  source: string
  category: IncomeCategory
  currency: string
  status: IncomeStatus
  /** ISO date string representing when the income is (or will be) received */
  eventDate: string
  /** Optional next expected occurrence for recurring income */
  nextExpectedDate?: string
  recurrence?: IncomeRecurrence
  tags?: string[]
  notes?: string
  linkedGoalIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface IncomeState {
  incomes: Income[]
  totalReceived: number
  totalScheduled: number
  loading: boolean
  error: string | null
}

const initialState: IncomeState = {
  incomes: [],
  totalReceived: 0,
  totalScheduled: 0,
  loading: false,
  error: null,
}

const recalculateTotals = (state: IncomeState) => {
  state.totalReceived = state.incomes.reduce((sum, income) => {
    return income.status === 'received' ? sum + income.amount : sum
  }, 0)

  state.totalScheduled = state.incomes.reduce((sum, income) => {
    return income.status === 'scheduled' ? sum + income.amount : sum
  }, 0)
}

const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {
    addIncome: (state, action: PayloadAction<Income>) => {
      const income: Income = {
        ...action.payload,
        linkedGoalIds: action.payload.linkedGoalIds ?? [],
      }
      state.incomes.unshift(income)
      recalculateTotals(state)
    },
    updateIncome: (state, action: PayloadAction<{ id: string; updates: Partial<Income> }>) => {
      const { id, updates } = action.payload
      const index = state.incomes.findIndex(income => income.id === id)

      if (index !== -1) {
        const existing = state.incomes[index]
        const updated: Income = {
          ...existing,
          ...updates,
          linkedGoalIds: updates.linkedGoalIds ?? existing.linkedGoalIds ?? [],
          updatedAt: updates.updatedAt ?? new Date().toISOString(),
        }
        state.incomes[index] = updated
        recalculateTotals(state)
      }
    },
    deleteIncome: (state, action: PayloadAction<string>) => {
      const index = state.incomes.findIndex(income => income.id === action.payload)
      if (index !== -1) {
        state.incomes.splice(index, 1)
        recalculateTotals(state)
      }
    },
    bulkImportIncome: (state, action: PayloadAction<Income[]>) => {
      const sanitized = action.payload.map(income => ({
        ...income,
        linkedGoalIds: income.linkedGoalIds ?? [],
      }))
      state.incomes = [...sanitized, ...state.incomes]
      recalculateTotals(state)
    },
    setIncomeLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setIncomeError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearIncome: state => {
      state.incomes = []
      state.totalReceived = 0
      state.totalScheduled = 0
      state.loading = false
      state.error = null
    },
    setIncomes: (state, action: PayloadAction<Income[]>) => {
      const sanitized = action.payload.map(income => ({
        ...income,
        linkedGoalIds: income.linkedGoalIds ?? [],
      }))
      state.incomes = sanitized
      recalculateTotals(state)
    },
  },
})

export const {
  addIncome,
  updateIncome,
  deleteIncome,
  bulkImportIncome,
  setIncomeLoading,
  setIncomeError,
  clearIncome,
  setIncomes,
} = incomeSlice.actions

// Selectors
export const selectIncomeState = (state: { income: IncomeState }) => state.income
export const selectIncomes = (state: { income: IncomeState }) => state.income.incomes
export const selectIncomeTotals = (state: { income: IncomeState }) => ({
  totalReceived: state.income.totalReceived,
  totalScheduled: state.income.totalScheduled,
})
export const selectIncomeLoading = (state: { income: IncomeState }) => state.income.loading
export const selectIncomeError = (state: { income: IncomeState }) => state.income.error

export const selectIncomeByCategory = (state: { income: IncomeState }) => {
  return state.income.incomes.reduce((acc: Record<IncomeCategory, number>, income) => {
    acc[income.category] = (acc[income.category] || 0) + income.amount
    return acc
  }, {} as Record<IncomeCategory, number>)
}

export const selectUpcomingIncome = (state: { income: IncomeState }, limit: number = 5) => {
  const today = new Date().toISOString().split('T')[0]
  return state.income.incomes
    .filter(income => income.status === 'scheduled' && income.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, limit)
}

export default incomeSlice.reducer
