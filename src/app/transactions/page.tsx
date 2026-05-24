"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  Repeat,
  Clock,
  Upload,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table,
  Search,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addIncome,
  updateIncome,
  deleteIncome,
  bulkImportIncome,
  selectIncomes,
  type Income,
  type IncomeCategory,
  type IncomeRecurrence,
} from "@/store/slices/incomeSlice";
import {
  addExpense,
  updateExpense,
  deleteExpense,
  bulkImportExpenses,
  selectExpenses,
  type Expense,
} from "@/store/slices/expensesSlice";
import { useSettings } from "@/contexts/SettingsContext";
import {
  formatAmount,
  getCurrencyByCode,
  SUPPORTED_CURRENCIES,
} from "@/utils/currency";
import ResponsiveModal, { useMobileModal } from "@/components/ui/MobileModal";
import BulkImport from "@/components/BulkImport";
import MobileExpenseForm, {
  type ExpenseFormData,
} from "@/components/forms/MobileExpenseForm";
import MobileIncomeForm, {
  type IncomeFormData,
} from "@/components/forms/MobileIncomeForm";

// Income categories
const incomeCategories: {
  value: IncomeCategory;
  label: string;
  color: string;
}[] = [
  { value: "salary", label: "Salary", color: "bg-green-100 text-green-800" },
  { value: "bonus", label: "Bonus", color: "bg-yellow-100 text-yellow-800" },
  {
    value: "freelance",
    label: "Freelance",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "investment",
    label: "Investment",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "refund", label: "Refund", color: "bg-pink-100 text-pink-800" },
  { value: "rental", label: "Rental", color: "bg-indigo-100 text-indigo-800" },
  { value: "gift", label: "Gift", color: "bg-rose-100 text-rose-800" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-800" },
];

const recurrenceOptions: { value: IncomeRecurrence; label: string }[] = [
  { value: "one-time", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

// Expense categories
const expenseCategories = [
  {
    value: "food",
    label: "Food & Dining",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "groceries",
    label: "Groceries",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "transportation",
    label: "Transportation",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "utilities",
    label: "Utilities",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "rent",
    label: "Rent/Mortgage",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    color: "bg-pink-100 text-pink-800",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    color: "bg-red-100 text-red-800",
  },
  {
    value: "shopping",
    label: "Shopping",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    value: "education",
    label: "Education",
    color: "bg-teal-100 text-teal-800",
  },
  { value: "family", label: "Family", color: "bg-rose-100 text-rose-800" },
  { value: "travel", label: "Travel", color: "bg-cyan-100 text-cyan-800" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-800" },
];

type ActiveTab = "expenses" | "income";
type SortField = "date" | "amount" | "description" | "category";
type SortDirection = "asc" | "desc";

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const expenses = useAppSelector(selectExpenses);
  const incomes = useAppSelector(selectIncomes);
  const { settings } = useSettings();
  const [isClient, setIsClient] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("expenses");

  // View state
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const addModal = useMobileModal();
  const editModal = useMobileModal();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "received" | "scheduled"
  >("all");

  useEffect(() => {
    setIsClient(true);
    document.title = "Transactions - WealthPulse";
  }, []);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Calculate totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    );
  });

  const thisMonthExpenseTotal = thisMonthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const thisMonthIncome = incomes.filter((income) => {
    const incomeDate = new Date(income.eventDate);
    return (
      incomeDate.getMonth() === currentMonth &&
      incomeDate.getFullYear() === currentYear
    );
  });

  const thisMonthIncomeTotal = thisMonthIncome.reduce(
    (sum, income) => sum + income.amount,
    0,
  );

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, searchQuery, sortField, sortDirection]);

  // Filter and sort income
  const filteredAndSortedIncome = useMemo(() => {
    let filtered = [...incomes];

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.source.toLowerCase().includes(query) ||
          i.category.toLowerCase().includes(query),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison =
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "description":
          comparison = a.source.localeCompare(b.source);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [incomes, filterStatus, searchQuery, sortField, sortDirection]);

  // Paginate
  const currentItems =
    activeTab === "expenses"
      ? filteredAndSortedExpenses
      : filteredAndSortedIncome;
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown size={14} className='ml-1 text-gray-400' />;
    return sortDirection === "asc" ? (
      <ChevronUp size={14} className='ml-1 text-blue-600' />
    ) : (
      <ChevronDown size={14} className='ml-1 text-blue-600' />
    );
  };

  // Expense handlers
  const handleAddExpense = (formData: ExpenseFormData) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount) || 0,
      description: formData.description || "",
      category: formData.category || "Other",
      date: formData.date || new Date().toISOString().split("T")[0],
      currency: formData.currency || settings.currency,
      isRecurring: formData.isRecurring || false,
      notes: formData.notes || undefined,
      recurringPeriod: formData.isRecurring
        ? formData.recurringFrequency
        : undefined,
      createdAt: new Date().toISOString(),
    };
    dispatch(addExpense(newExpense));
    addModal.closeModal();
  };

  const handleEditExpense = (formData: ExpenseFormData) => {
    if (editingExpense) {
      dispatch(
        updateExpense({
          id: editingExpense.id,
          updates: {
            amount: parseFloat(formData.amount) || 0,
            description: formData.description,
            category: formData.category,
            date: formData.date,
            currency: formData.currency,
            isRecurring: formData.isRecurring || false,
            notes: formData.notes || undefined,
            recurringPeriod: formData.isRecurring
              ? formData.recurringFrequency
              : undefined,
          },
        }),
      );
      setEditingExpense(null);
      editModal.closeModal();
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      dispatch(deleteExpense(id));
    }
  };

  // Income handlers
  const handleAddIncome = (formData: IncomeFormData) => {
    const newIncome: Income = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount) || 0,
      source: formData.source || "",
      category: formData.category as IncomeCategory,
      currency: formData.currency || settings.currency,
      status: formData.status || "received",
      eventDate: formData.eventDate || new Date().toISOString().split("T")[0],
      recurrence: formData.recurrence as IncomeRecurrence,
      tags: [],
      notes: formData.notes || undefined,
      linkedGoalIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(addIncome(newIncome));
    addModal.closeModal();
  };

  const handleEditIncome = (formData: IncomeFormData) => {
    if (editingIncome) {
      dispatch(
        updateIncome({
          id: editingIncome.id,
          updates: {
            amount: parseFloat(formData.amount) || 0,
            source: formData.source,
            category: formData.category as IncomeCategory,
            currency: formData.currency,
            status: formData.status,
            eventDate: formData.eventDate,
            recurrence: formData.recurrence as IncomeRecurrence,
            notes: formData.notes || undefined,
            updatedAt: new Date().toISOString(),
          },
        }),
      );
      setEditingIncome(null);
      editModal.closeModal();
    }
  };

  const handleDeleteIncome = (id: string) => {
    if (confirm("Are you sure you want to delete this income entry?")) {
      dispatch(deleteIncome(id));
    }
  };

  const handleBulkImport = (data: unknown[]) => {
    if (activeTab === "income") {
      dispatch(bulkImportIncome(data as Income[]));
    } else if (activeTab === "expenses") {
      dispatch(bulkImportExpenses(data as Expense[]));
    }
    setShowBulkImport(false);
  };

  const startEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditingIncome(null);
    editModal.openModal();
  };

  const startEditIncome = (income: Income) => {
    setEditingIncome(income);
    setEditingExpense(null);
    editModal.openModal();
  };

  const getCategoryColor = (category: string, type: "expense" | "income") => {
    if (type === "income") {
      return (
        incomeCategories.find((c) => c.value === category)?.color ||
        "bg-gray-100 text-gray-800"
      );
    }
    return (
      expenseCategories.find((c) => c.value === category)?.color ||
      "bg-gray-100 text-gray-800"
    );
  };

  const currency = getCurrencyByCode(settings.currency);

  if (!isClient) {
    return <div className='container mx-auto px-4 py-8'>Loading...</div>;
  }

  return (
    <div className='container mx-auto px-4 py-4 md:py-8 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2'>
            <DollarSign className='text-blue-600' size={32} />
            Transactions
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            Track all your income and expenses in one place
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          {(activeTab === "income" || activeTab === "expenses") && (
            <button
              onClick={() => setShowBulkImport(true)}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
              <Upload size={20} />
              <span className='hidden sm:inline'>Import</span>
            </button>
          )}
          <button
            onClick={addModal.openModal}
            className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${
              activeTab === "expenses"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}>
            <Plus size={20} />
            <span>Add {activeTab === "expenses" ? "Expense" : "Income"}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='bg-gradient-to-br from-green-500 to-green-600 text-white p-4 md:p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100 text-xs md:text-sm'>
                This Month Income
              </p>
              <p className='text-xl md:text-2xl font-bold mt-1'>
                {formatAmount(thisMonthIncomeTotal, currency)}
              </p>
            </div>
            <TrendingUp size={28} className='text-green-200' />
          </div>
        </div>

        <div className='bg-gradient-to-br from-red-500 to-red-600 text-white p-4 md:p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-red-100 text-xs md:text-sm'>
                This Month Expenses
              </p>
              <p className='text-xl md:text-2xl font-bold mt-1'>
                {formatAmount(thisMonthExpenseTotal, currency)}
              </p>
            </div>
            <TrendingDown size={28} className='text-red-200' />
          </div>
        </div>

        <div
          className={`${
            thisMonthIncomeTotal - thisMonthExpenseTotal >= 0
              ? "bg-gradient-to-br from-blue-500 to-blue-600"
              : "bg-gradient-to-br from-orange-500 to-orange-600"
          } text-white p-4 md:p-6 rounded-lg shadow-md`}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100 text-xs md:text-sm'>Net Balance</p>
              <p className='text-xl md:text-2xl font-bold mt-1'>
                {formatAmount(
                  thisMonthIncomeTotal - thisMonthExpenseTotal,
                  currency,
                )}
              </p>
            </div>
            <DollarSign size={28} className='text-blue-200' />
          </div>
        </div>

        <div className='bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100 text-xs md:text-sm'>
                Total Entries
              </p>
              <p className='text-xl md:text-2xl font-bold mt-1'>
                {expenses.length + incomes.length}
              </p>
            </div>
            <Calendar size={28} className='text-purple-200' />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex border-b border-gray-200 dark:border-gray-700'>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "expenses"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}>
          <TrendingDown size={20} />
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "income"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}>
          <TrendingUp size={20} />
          Income ({incomes.length})
        </button>
      </div>

      {/* Filters & Controls */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm'>
        <div className='flex items-center gap-4 w-full md:w-auto'>
          {/* Search */}
          <div className='relative flex-1 md:w-64'>
            <Search
              size={18}
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
            />
            <input
              type='text'
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>

          {/* Status filter for income */}
          {activeTab === "income" && (
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "received" | "scheduled",
                )
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'>
              <option value='all'>All Status</option>
              <option value='received'>Received</option>
              <option value='scheduled'>Scheduled</option>
            </select>
          )}
        </div>

        <div className='flex items-center gap-4'>
          {/* View toggle */}
          <div className='flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden'>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
              title='Table view'>
              <Table size={20} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 ${
                viewMode === "card"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
              title='Card view'>
              <LayoutGrid size={20} />
            </button>
          </div>

          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-900'>
                <tr>
                  <th
                    onClick={() => handleSort("date")}
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'>
                    <div className='flex items-center'>
                      Date <SortIcon field='date' />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("description")}
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'>
                    <div className='flex items-center'>
                      Description <SortIcon field='description' />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("category")}
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'>
                    <div className='flex items-center'>
                      Category <SortIcon field='category' />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("amount")}
                    className='px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'>
                    <div className='flex items-center justify-end'>
                      Amount <SortIcon field='amount' />
                    </div>
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                {activeTab === "expenses" &&
                  (paginatedItems as Expense[]).map((expense) => (
                    <tr
                      key={expense.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                      <td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 dark:text-white'>
                        <div className='flex items-center gap-2'>
                          {expense.description}
                          {expense.isRecurring && (
                            <Repeat size={14} className='text-blue-500' />
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                            expense.category,
                            "expense",
                          )}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600 dark:text-red-400'>
                        -{formatAmount(expense.amount, currency)}
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap text-right text-sm font-medium'>
                        <button
                          onClick={() => startEditExpense(expense)}
                          className='text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-3'>
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className='text-red-600 hover:text-red-900 dark:text-red-400'>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                {activeTab === "income" &&
                  (paginatedItems as Income[]).map((income) => (
                    <tr
                      key={income.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                      <td className='px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                        {new Date(income.eventDate).toLocaleDateString()}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 dark:text-white'>
                        <div className='flex items-center gap-2'>
                          {income.source}
                          {income.recurrence !== "one-time" && (
                            <Repeat size={14} className='text-green-500' />
                          )}
                          {income.status === "scheduled" && (
                            <Clock size={14} className='text-orange-500' />
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                            income.category,
                            "income",
                          )}`}>
                          {income.category}
                        </span>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400'>
                        +
                        {formatAmount(
                          income.amount,
                          getCurrencyByCode(
                            income.currency || settings.currency,
                          ),
                        )}{" "}
                        {income.currency || settings.currency}
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap text-right text-sm font-medium'>
                        <button
                          onClick={() => startEditIncome(income)}
                          className='text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-3'>
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(income.id)}
                          className='text-red-600 hover:text-red-900 dark:text-red-400'>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {paginatedItems.length === 0 && (
            <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
              <DollarSign size={48} className='mx-auto mb-4 text-gray-300' />
              <p>No {activeTab} found.</p>
              <p className='text-sm mt-1'>
                Add your first {activeTab === "expenses" ? "expense" : "income"}{" "}
                to get started!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {activeTab === "expenses" &&
            (paginatedItems as Expense[]).map((expense) => (
              <div
                key={expense.id}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow'>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <h3 className='font-medium text-gray-900 dark:text-white'>
                      {expense.description}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className='text-lg font-bold text-red-600 dark:text-red-400'>
                    -{formatAmount(expense.amount, currency)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                      expense.category,
                      "expense",
                    )}`}>
                    {expense.category}
                  </span>
                  <div className='flex items-center gap-2'>
                    {expense.isRecurring && (
                      <Repeat size={14} className='text-blue-500' />
                    )}
                    <button
                      onClick={() => startEditExpense(expense)}
                      className='text-blue-600 hover:text-blue-800'>
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className='text-red-600 hover:text-red-800'>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {activeTab === "income" &&
            (paginatedItems as Income[]).map((income) => (
              <div
                key={income.id}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow'>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <h3 className='font-medium text-gray-900 dark:text-white'>
                      {income.source}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {new Date(income.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className='text-lg font-bold text-green-600 dark:text-green-400'>
                    +
                    {formatAmount(
                      income.amount,
                      getCurrencyByCode(income.currency || settings.currency),
                    )}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                        income.category,
                        "income",
                      )}`}>
                      {income.category}
                    </span>
                    {income.status === "scheduled" && (
                      <span className='px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800'>
                        Scheduled
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    {income.recurrence !== "one-time" && (
                      <Repeat size={14} className='text-green-500' />
                    )}
                    <button
                      onClick={() => startEditIncome(income)}
                      className='text-blue-600 hover:text-blue-800'>
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(income.id)}
                      className='text-red-600 hover:text-red-800'>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {paginatedItems.length === 0 && (
            <div className='col-span-full p-8 text-center text-gray-500 dark:text-gray-400'>
              <DollarSign size={48} className='mx-auto mb-4 text-gray-300' />
              <p>No {activeTab} found.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm'>
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, currentItems.length)} of{" "}
            {currentItems.length}
          </span>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className='px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600'>
              «
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className='px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600'>
              ‹
            </button>
            <span className='px-3 py-1 text-sm'>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className='px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600'>
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className='px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600'>
              »
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <ResponsiveModal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        title={`Add ${activeTab === "expenses" ? "Expense" : "Income"}`}>
        {activeTab === "expenses" ? (
          <MobileExpenseForm
            onSubmit={handleAddExpense}
            onCancel={addModal.closeModal}
          />
        ) : (
          <MobileIncomeForm
            onSubmit={handleAddIncome}
            onCancel={addModal.closeModal}
          />
        )}
      </ResponsiveModal>

      {/* Edit Modal */}
      <ResponsiveModal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        title={`Edit ${editingExpense ? "Expense" : "Income"}`}>
        {editingExpense ? (
          <MobileExpenseForm
            onSubmit={handleEditExpense}
            onCancel={editModal.closeModal}
            isEditing={true}
            initialData={{
              amount: String(editingExpense.amount),
              currency: editingExpense.currency,
              category: editingExpense.category,
              description: editingExpense.description,
              date: editingExpense.date,
              isRecurring: editingExpense.isRecurring,
              recurringFrequency:
                (editingExpense.recurringPeriod as
                  | "daily"
                  | "weekly"
                  | "monthly"
                  | "yearly") || "monthly",
              notes: editingExpense.notes || "",
            }}
          />
        ) : editingIncome ? (
          <MobileIncomeForm
            onSubmit={handleEditIncome}
            onCancel={editModal.closeModal}
            isEditing={true}
            initialData={{
              source: editingIncome.source,
              amount: String(editingIncome.amount),
              currency: editingIncome.currency,
              category: editingIncome.category,
              status: editingIncome.status as "received" | "scheduled",
              eventDate: editingIncome.eventDate,
              recurrence:
                (editingIncome.recurrence as IncomeFormData["recurrence"]) ||
                "monthly",
              notes: editingIncome.notes || "",
            }}
          />
        ) : null}
      </ResponsiveModal>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImport
          feature={activeTab === "expenses" ? "expenses" : "income"}
          onImport={handleBulkImport}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </div>
  );
}

// Expense Form Component
interface ExpenseFormProps {
  onSubmit: (data: Partial<Expense>) => void;
  onCancel: () => void;
  currency: ReturnType<typeof getCurrencyByCode>;
  initialData?: Expense;
}

function ExpenseForm({
  onSubmit,
  onCancel,
  currency,
  initialData,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    amount: initialData?.amount || 0,
    category: initialData?.category || "other",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    isRecurring: initialData?.isRecurring || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Description
        </label>
        <input
          type='text'
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Amount ({currency.symbol})
        </label>
        <input
          type='number'
          step='0.01'
          min='0'
          value={formData.amount}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount: parseFloat(e.target.value) || 0,
            })
          }
          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'>
          {expenseCategories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Date
        </label>
        <input
          type='date'
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
          required
        />
      </div>
      <div className='flex items-center gap-2'>
        <input
          type='checkbox'
          id='isRecurring'
          checked={formData.isRecurring}
          onChange={(e) =>
            setFormData({ ...formData, isRecurring: e.target.checked })
          }
          className='w-4 h-4 text-blue-600 rounded'
        />
        <label
          htmlFor='isRecurring'
          className='text-sm text-gray-700 dark:text-gray-300'>
          This is a recurring expense
        </label>
      </div>
      <div className='flex gap-3 pt-4'>
        <button
          type='button'
          onClick={onCancel}
          className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700'>
          Cancel
        </button>
        <button
          type='submit'
          className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'>
          Save Expense
        </button>
      </div>
    </form>
  );
}

// Income Form Component
interface IncomeFormProps {
  onSubmit: (data: Partial<Income>) => void;
  onCancel: () => void;
  currency: ReturnType<typeof getCurrencyByCode>;
  settings: { currency: string };
  initialData?: Income;
}

function IncomeForm({
  onSubmit,
  onCancel,
  settings,
  initialData,
}: IncomeFormProps) {
  const [formData, setFormData] = useState({
    source: initialData?.source || "",
    amount: initialData?.amount || 0,
    category: initialData?.category || "salary",
    currency: initialData?.currency || settings.currency,
    status: initialData?.status || "received",
    eventDate: initialData?.eventDate || new Date().toISOString().split("T")[0],
    recurrence: initialData?.recurrence || "one-time",
    notes: initialData?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Source
        </label>
        <input
          type='text'
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          placeholder='e.g., Salary from Company XYZ'
          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
          required
        />
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Amount
          </label>
          <input
            type='number'
            step='0.01'
            min='0'
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: parseFloat(e.target.value) || 0,
              })
            }
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'>
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value as IncomeCategory,
              })
            }
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'>
            {incomeCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "received" | "scheduled",
              })
            }
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'>
            <option value='received'>Received</option>
            <option value='scheduled'>Scheduled</option>
          </select>
        </div>
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Date
          </label>
          <input
            type='date'
            value={formData.eventDate}
            onChange={(e) =>
              setFormData({ ...formData, eventDate: e.target.value })
            }
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Recurrence
          </label>
          <select
            value={formData.recurrence}
            onChange={(e) =>
              setFormData({
                ...formData,
                recurrence: e.target.value as IncomeRecurrence,
              })
            }
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'>
            {recurrenceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
        />
      </div>
      <div className='flex gap-3 pt-4'>
        <button
          type='button'
          onClick={onCancel}
          className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700'>
          Cancel
        </button>
        <button
          type='submit'
          className='flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'>
          Save Income
        </button>
      </div>
    </form>
  );
}
