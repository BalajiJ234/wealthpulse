"use client";

import { useState, useEffect } from "react";
import {
  PiggyBank,
  Target,
  Calendar,
  CreditCard,
  ShoppingCart,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addGoal,
  updateGoal,
  deleteGoal as removeGoal,
  type Goal as ReduxGoal,
} from "@/store/slices/goalsSlice";
import { selectIncomes } from "@/store/slices/incomeSlice";
import { selectExpenses } from "@/store/slices/expensesSlice";
import type { RootState } from "@/store/index";
import { api, Commitment, Debt, PurchaseDecisionResult } from "@/lib/api";
import BulkImport from "@/components/BulkImport";

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Budget Tab (Simplified) ───────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  "Housing",
  "Food",
  "Transport",
  "Utilities",
  "Health",
  "Education",
  "Entertainment",
  "Other",
];

function BudgetTab() {
  const incomes = useAppSelector(selectIncomes);
  const expenses = useAppSelector(selectExpenses);
  const [limits, setLimits] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("wp_budget_limits") || "{}");
    } catch {
      return {};
    }
  });
  const [editCat, setEditCat] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const monthKey = new Date().toISOString().slice(0, 7);
  const totalIncome = incomes
    .filter((i) => i.eventDate?.startsWith(monthKey))
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const spendByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    if (!e.date?.startsWith(monthKey)) return;
    const cat = e.category || "Other";
    spendByCategory[cat] = (spendByCategory[cat] || 0) + (e.amount ?? 0);
  });

  const allCats = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...Object.keys(spendByCategory)]),
  );
  const totalSpent = Object.values(spendByCategory).reduce((s, v) => s + v, 0);

  const saveLimit = (cat: string, val: string) => {
    const updated = { ...limits, [cat]: Number(val) || 0 };
    setLimits(updated);
    localStorage.setItem("wp_budget_limits", JSON.stringify(updated));
    setEditCat(null);
  };

  return (
    <div className='space-y-5'>
      {/* Summary */}
      <div className='grid grid-cols-3 gap-3'>
        <div className='bg-green-50 border border-green-200 rounded-xl p-3 text-center'>
          <p className='text-xs text-gray-500'>Monthly Income</p>
          <p className='text-lg font-bold text-green-700'>
            AED {fmt(totalIncome)}
          </p>
        </div>
        <div className='bg-red-50 border border-red-200 rounded-xl p-3 text-center'>
          <p className='text-xs text-gray-500'>Total Spent</p>
          <p className='text-lg font-bold text-red-600'>
            AED {fmt(totalSpent)}
          </p>
        </div>
        <div
          className={`border rounded-xl p-3 text-center ${totalIncome - totalSpent >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <p className='text-xs text-gray-500'>Remaining</p>
          <p
            className={`text-lg font-bold ${totalIncome - totalSpent >= 0 ? "text-blue-700" : "text-orange-600"}`}>
            AED {fmt(totalIncome - totalSpent)}
          </p>
        </div>
      </div>

      <p className='text-xs text-gray-400'>
        Click the pencil icon to set a monthly limit per category.
      </p>

      {/* Category rows */}
      <div className='space-y-2'>
        {allCats.map((cat) => {
          const spent = spendByCategory[cat] || 0;
          const limit = limits[cat] || 0;
          const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
          const over = limit > 0 && spent > limit;
          return (
            <div
              key={cat}
              className='bg-white border border-gray-200 rounded-xl p-3 shadow-sm'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-sm font-medium text-gray-800'>{cat}</span>
                <div className='flex items-center gap-3'>
                  <span
                    className={`text-sm font-semibold ${over ? "text-red-600" : "text-gray-700"}`}>
                    AED {fmt(spent)}
                    {limit > 0 ? ` / ${fmt(limit)}` : ""}
                  </span>
                  <button
                    onClick={() => {
                      setEditCat(cat);
                      setEditVal(String(limits[cat] || ""));
                    }}
                    className='text-gray-400 hover:text-blue-600'>
                    <Edit3 className='w-3.5 h-3.5' />
                  </button>
                </div>
              </div>
              {editCat === cat && (
                <div className='flex items-center gap-2 mt-1'>
                  <input
                    type='number'
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    placeholder='Monthly limit (AED)'
                    className='border border-gray-300 rounded-lg px-2 py-1 text-xs w-40'
                  />
                  <button
                    onClick={() => saveLimit(cat, editVal)}
                    className='text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700'>
                    Save
                  </button>
                  <button
                    onClick={() => setEditCat(null)}
                    className='text-xs text-gray-500'>
                    Cancel
                  </button>
                </div>
              )}
              {limit > 0 && (
                <div className='w-full bg-gray-100 rounded-full h-1.5 mt-1'>
                  <div
                    className={`h-1.5 rounded-full transition-all ${over ? "bg-red-400" : "bg-blue-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Goals Tab (Simple) ────────────────────────────────────────────────────
const emptyGoalForm = {
  title: "",
  targetAmount: "",
  currentAmount: "0",
  currency: "AED",
  targetDate: "",
};

function GoalsTab() {
  const dispatch = useAppDispatch();
  const goals = useAppSelector((s: RootState) => s.goals?.goals ?? []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyGoalForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);

  const emergencyFundExists = goals.some((g) =>
    g.title.toLowerCase().includes("emergency"),
  );

  const setupEmergencyFund = () => {
    setEditId(null);
    setForm({
      title: "Emergency Fund",
      targetAmount: "30000",
      currentAmount: "0",
      currency: "AED",
      targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
    });
    setShowForm(true);
  };

  const handleBulkImport = (data: unknown[]) => {
    (data as ReduxGoal[]).forEach((g) =>
      dispatch(addGoal({ ...g, id: Date.now().toString() + Math.random() })),
    );
    setShowBulkImport(false);
  };

  const handleSave = () => {
    if (!form.title || !form.targetAmount) return;
    if (editId) {
      dispatch(
        updateGoal({
          id: editId,
          updates: {
            title: form.title,
            targetAmount: Number(form.targetAmount),
            currentAmount: Number(form.currentAmount),
            currency: form.currency,
            targetDate: form.targetDate || undefined,
          },
        }),
      );
      setEditId(null);
    } else {
      dispatch(
        addGoal({
          id: Date.now().toString(),
          title: form.title,
          targetAmount: Number(form.targetAmount),
          currentAmount: Number(form.currentAmount) || 0,
          currency: form.currency,
          targetDate: form.targetDate || undefined,
          category: "other",
          priority: "medium",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );
    }
    setForm(emptyGoalForm);
    setShowForm(false);
  };

  const startEdit = (g: ReduxGoal) => {
    setEditId(g.id);
    setForm({
      title: g.title,
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount),
      currency: g.currency,
      targetDate: g.targetDate || "",
    });
    setShowForm(true);
  };

  const saveProgress = (id: string) => {
    dispatch(
      updateGoal({ id, updates: { currentAmount: Number(progressVal) } }),
    );
    setProgressId(null);
    setProgressVal("");
  };

  return (
    <div className='space-y-5'>
      {/* Emergency Fund quick-setup banner */}
      {!emergencyFundExists && (
        <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4'>
          <ShieldCheck className='w-8 h-8 text-amber-500 shrink-0' />
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-semibold text-amber-800'>Set up your Emergency Fund</p>
            <p className='text-xs text-amber-600 mt-0.5'>
              Financial experts recommend 3–6 months of expenses saved. Tap to create a goal.
            </p>
          </div>
          <button
            onClick={setupEmergencyFund}
            className='shrink-0 text-xs bg-amber-500 text-white font-medium px-3 py-2 rounded-lg hover:bg-amber-600'>
            Quick Setup
          </button>
        </div>
      )}

      <div className='flex justify-end gap-2'>
        <button
          onClick={() => setShowBulkImport(true)}
          className='flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50'>
          <Upload className='w-4 h-4' /> Bulk Import
        </button>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm(emptyGoalForm);
          }}
          className='flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700'>
          <Plus className='w-4 h-4' /> Add Goal
        </button>
      </div>

      {showBulkImport && (
        <BulkImport feature='goals' onImport={handleBulkImport} onClose={() => setShowBulkImport(false)} />
      )}

      {showForm && (
        <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3'>
          <h3 className='text-sm font-semibold text-gray-800'>
            {editId ? "Edit Goal" : "New Goal"}
          </h3>
          <div className='grid grid-cols-2 gap-3'>
            <div className='col-span-2'>
              <label className='block text-xs text-gray-600 mb-1'>
                Goal Name *
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
                placeholder='e.g. Emergency Fund'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Target Amount *
              </label>
              <input
                type='number'
                value={form.targetAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetAmount: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Saved So Far
              </label>
              <input
                type='number'
                value={form.currentAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentAmount: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'>
                <option>AED</option>
                <option>INR</option>
                <option>USD</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Target Date
              </label>
              <input
                type='date'
                value={form.targetDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetDate: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
              />
            </div>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={handleSave}
              className='bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700'>
              Save
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
              className='text-sm text-gray-500 hover:text-gray-700'>
              Cancel
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <p className='text-center text-gray-400 text-sm py-8'>
          No goals yet. Add your first savings goal!
        </p>
      ) : (
        <div className='space-y-3'>
          {goals.map((g) => {
            const pct =
              g.targetAmount > 0
                ? Math.min(100, (g.currentAmount / g.targetAmount) * 100)
                : 0;
            return (
              <div
                key={g.id}
                className='bg-white border border-gray-200 rounded-xl p-4 shadow-sm'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='font-semibold text-gray-900'>{g.title}</p>
                    <p className='text-sm text-gray-600 mt-0.5'>
                      {g.currency} {fmt(g.currentAmount)} of{" "}
                      {fmt(g.targetAmount)}
                      {g.targetDate && (
                        <span className='text-xs text-gray-400 ml-2'>
                          → {g.targetDate}
                        </span>
                      )}
                    </p>
                    <div className='w-full bg-gray-100 rounded-full h-2 mt-2'>
                      <div
                        className='bg-blue-500 h-2 rounded-full transition-all'
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className='text-xs text-gray-400 mt-1'>
                      {pct.toFixed(0)}% complete
                    </p>
                  </div>
                  <div className='flex gap-2 ml-3'>
                    <button
                      onClick={() => {
                        setProgressId(g.id);
                        setProgressVal(String(g.currentAmount));
                      }}
                      className='text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100'>
                      Update
                    </button>
                    <button
                      onClick={() => startEdit(g)}
                      className='text-gray-400 hover:text-blue-600'>
                      <Edit3 className='w-3.5 h-3.5' />
                    </button>
                    <button
                      onClick={() => dispatch(removeGoal(g.id))}
                      className='text-red-400 hover:text-red-600'>
                      <Trash2 className='w-3.5 h-3.5' />
                    </button>
                  </div>
                </div>
                {progressId === g.id && (
                  <div className='flex items-center gap-2 mt-3 pt-3 border-t border-gray-100'>
                    <input
                      type='number'
                      value={progressVal}
                      onChange={(e) => setProgressVal(e.target.value)}
                      placeholder='Current saved amount'
                      className='border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48'
                    />
                    <button
                      onClick={() => saveProgress(g.id)}
                      className='bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700'>
                      Save
                    </button>
                    <button
                      onClick={() => setProgressId(null)}
                      className='text-xs text-gray-500'>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Commitments Tab ────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
};
const COMMIT_STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-700",
};
const emptyCommitForm = {
  title: "",
  amount: "",
  currency: "AED",
  dueDate: "",
  category: "",
  priority: "MEDIUM",
  recurringType: "NONE",
  status: "UPCOMING",
  notes: "",
};

function CommitmentsTab() {
  const [items, setItems] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCommitForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("UPCOMING");
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleBulkImport = async (data: unknown[]) => {
    for (const item of data as Commitment[]) {
      try { await api.createCommitment(item); } catch {}
    }
    setShowBulkImport(false);
    load();
  };

  const load = () => {
    setLoading(true);
    api
      .getCommitments()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.amount || !form.dueDate) return;
    setSaving(true);
    try {
      await api.createCommitment({
        title: form.title,
        amount: Number(form.amount),
        currency: form.currency,
        exchangeRate: 1,
        convertedAmount: Number(form.amount),
        dueDate: form.dueDate,
        category: form.category || undefined,
        priority: form.priority as Commitment["priority"],
        recurringType: form.recurringType,
        status: form.status as Commitment["status"],
        notes: form.notes || undefined,
      });
      setForm(emptyCommitForm);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((i) =>
    filter === "ALL" ? true : i.status === filter,
  );
  const upcomingTotal = items
    .filter((i) => i.status === "UPCOMING")
    .reduce((s, i) => s + i.convertedAmount, 0);

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <div className='bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center gap-3'>
          <Calendar className='w-5 h-5 text-purple-500' />
          <div>
            <p className='text-xs text-gray-500'>Upcoming total</p>
            <p className='text-lg font-bold text-purple-600'>
              AED {fmt(upcomingTotal)}
            </p>
          </div>
          <span className='ml-4 text-xs text-gray-400'>
            {items.filter((i) => i.status === "UPCOMING").length} upcoming ·{" "}
            {items.filter((i) => i.status === "MISSED").length} missed
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className='flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700'>
          <Plus className='w-4 h-4' /> Add
        </button>
        <button
          onClick={() => setShowBulkImport(true)}
          className='flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50'>
          <Upload className='w-4 h-4' /> Bulk Import
        </button>
      </div>

      {showBulkImport && (
        <BulkImport feature='commitments' onImport={handleBulkImport} onClose={() => setShowBulkImport(false)} />
      )}

      {showForm && (
        <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4'>
          <h3 className='text-sm font-semibold text-gray-800'>
            New Commitment
          </h3>
          <div className='grid grid-cols-2 gap-3'>
            <div className='col-span-2'>
              <label className='block text-xs text-gray-600 mb-1'>
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Amount *
              </label>
              <input
                type='number'
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'>
                <option>AED</option>
                <option>INR</option>
                <option>USD</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Due Date *
              </label>
              <input
                type='date'
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'>
                <option value='HIGH'>High</option>
                <option value='MEDIUM'>Medium</option>
                <option value='LOW'>Low</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Recurring
              </label>
              <select
                value={form.recurringType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recurringType: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'>
                <option value='NONE'>None</option>
                <option value='MONTHLY'>Monthly</option>
                <option value='YEARLY'>Yearly</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
                placeholder='e.g. Rent, Insurance'
              />
            </div>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={handleCreate}
              disabled={saving}
              className='bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50'>
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className='text-sm text-gray-500 hover:text-gray-700'>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className='flex gap-2'>
        {["UPCOMING", "PAID", "MISSED", "ALL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className='text-center text-gray-500 text-sm'>Loading…</p>
      ) : error ? (
        <p className='text-red-500 text-sm'>{error}</p>
      ) : filtered.length === 0 ? (
        <p className='text-center text-gray-400 text-sm py-8'>
          No commitments in this view.
        </p>
      ) : (
        <div className='space-y-3'>
          {filtered.map((c) => (
            <div
              key={c.id}
              className='bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-semibold text-gray-900'>{c.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[c.priority] ?? ""}`}>
                    {c.priority}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMMIT_STATUS_COLORS[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                </div>
                <div className='flex gap-4 mt-1 text-sm'>
                  <span className='font-semibold text-gray-800'>
                    {c.currency} {fmt(c.amount)}
                  </span>
                  <span className='text-gray-400 text-xs'>Due {c.dueDate}</span>
                  {c.category && (
                    <span className='text-gray-400 text-xs'>{c.category}</span>
                  )}
                  {c.recurringType !== "NONE" && (
                    <span className='text-xs bg-blue-50 text-blue-600 px-1.5 rounded'>
                      {c.recurringType}
                    </span>
                  )}
                </div>
              </div>
              <div className='flex gap-2 shrink-0'>
                {c.status === "UPCOMING" && (
                  <button
                    onClick={async () => {
                      await api.updateCommitment(c.id, { status: "PAID" });
                      load();
                    }}
                    className='text-xs flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100'>
                    <CheckCircle2 className='w-3 h-3' /> Paid
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!confirm("Delete?")) return;
                    await api.deleteCommitment(c.id);
                    load();
                  }}
                  className='text-xs text-red-400 hover:text-red-600'>
                  <Trash2 className='w-3 h-3' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Debt Strategy Tab ──────────────────────────────────────────────────────
const DEBT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};
const emptyDebtForm = {
  debtName: "",
  lenderName: "",
  totalAmount: "",
  remainingBalance: "",
  monthlyPayment: "",
  interestRate: "0",
  currency: "AED",
  dueDate: "",
  debtType: "loan",
  notes: "",
  status: "ACTIVE",
};

function DebtStrategyTab() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDebtForm);
  const [saving, setSaving] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAmt, setPaymentAmt] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleBulkImport = async (data: unknown[]) => {
    for (const item of data as Debt[]) {
      try { await api.createDebt(item); } catch {}
    }
    setShowBulkImport(false);
    load();
  };

  const load = () => {
    setLoading(true);
    api
      .getDebts()
      .then(setDebts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (
      !form.debtName ||
      !form.totalAmount ||
      !form.remainingBalance ||
      !form.monthlyPayment
    )
      return;
    setSaving(true);
    try {
      await api.createDebt({
        debtName: form.debtName,
        lenderName: form.lenderName || undefined,
        totalAmount: Number(form.totalAmount),
        currency: form.currency,
        exchangeRate: 1,
        convertedTotalAmount: Number(form.totalAmount),
        remainingBalance: Number(form.remainingBalance),
        monthlyPayment: Number(form.monthlyPayment),
        interestRate: Number(form.interestRate),
        dueDate: form.dueDate || undefined,
        debtType: form.debtType || undefined,
        status: form.status as Debt["status"],
        notes: form.notes || undefined,
      });
      setForm(emptyDebtForm);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const totalOwed = debts
    .filter((d) => d.status === "ACTIVE")
    .reduce((s, d) => s + d.remainingBalance, 0);
  const totalMonthly = debts
    .filter((d) => d.status === "ACTIVE")
    .reduce((s, d) => s + d.monthlyPayment, 0);

  return (
    <div className='space-y-5'>
      <div className='grid grid-cols-2 gap-3'>
        <div className='bg-white border border-gray-200 rounded-xl p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-1'>
            <CreditCard className='w-4 h-4 text-orange-500' />
            <span className='text-xs text-gray-500'>Total Owed</span>
          </div>
          <p className='text-xl font-bold text-orange-600'>
            AED {fmt(totalOwed)}
          </p>
        </div>
        <div className='bg-white border border-gray-200 rounded-xl p-3 shadow-sm'>
          <div className='flex items-center gap-2 mb-1'>
            <TrendingDown className='w-4 h-4 text-red-500' />
            <span className='text-xs text-gray-500'>Monthly Payments</span>
          </div>
          <p className='text-xl font-bold text-red-600'>
            AED {fmt(totalMonthly)}
          </p>
        </div>
      </div>

      <div className='flex justify-end gap-2'>
        <button
          onClick={() => setShowBulkImport(true)}
          className='flex items-center gap-1.5 border border-gray-300 text-gray-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50'>
          <Upload className='w-4 h-4' /> Bulk Import
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className='flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700'>
          <Plus className='w-4 h-4' /> Add Debt
        </button>
      </div>

      {showBulkImport && (
        <BulkImport feature='debts' onImport={handleBulkImport} onClose={() => setShowBulkImport(false)} />
      )}

      {showForm && (
        <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4'>
          <h3 className='text-sm font-semibold text-gray-800'>New Debt</h3>
          <div className='grid grid-cols-2 gap-3'>
            {[
              { key: "debtName", label: "Debt Name", required: true },
              { key: "lenderName", label: "Lender" },
              {
                key: "totalAmount",
                label: "Total Amount",
                type: "number",
                required: true,
              },
              {
                key: "remainingBalance",
                label: "Remaining Balance",
                type: "number",
                required: true,
              },
              {
                key: "monthlyPayment",
                label: "Monthly Payment",
                type: "number",
                required: true,
              },
              { key: "interestRate", label: "Interest Rate %", type: "number" },
              { key: "dueDate", label: "Due Date", type: "date" },
            ].map(({ key, label, type = "text", required }) => (
              <div key={key}>
                <label className='block text-xs text-gray-600 mb-1'>
                  {label}
                  {required && " *"}
                </label>
                <input
                  type={type}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
                />
              </div>
            ))}
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'>
                <option>AED</option>
                <option>INR</option>
                <option>USD</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-600 mb-1'>Type</label>
              <select
                value={form.debtType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, debtType: e.target.value }))
                }
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'>
                <option value='loan'>Loan</option>
                <option value='credit_card'>Credit Card</option>
                <option value='personal'>Personal</option>
                <option value='emi'>EMI</option>
              </select>
            </div>
          </div>
          <div>
            <label className='block text-xs text-gray-600 mb-1'>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
            />
          </div>
          <div className='flex gap-3'>
            <button
              onClick={handleCreate}
              disabled={saving}
              className='bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50'>
              {saving ? "Saving…" : "Save Debt"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className='text-sm text-gray-500 hover:text-gray-700'>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className='text-center text-gray-500 text-sm'>Loading…</p>
      ) : error ? (
        <p className='text-red-500 text-sm'>{error}</p>
      ) : debts.length === 0 ? (
        <p className='text-center text-gray-400 text-sm py-8'>
          No debts recorded. Add one above.
        </p>
      ) : (
        <div className='space-y-3'>
          {debts.map((d) => (
            <div
              key={d.id}
              className='bg-white border border-gray-200 rounded-xl p-4 shadow-sm'>
              <div className='flex items-start justify-between'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='font-semibold text-gray-900'>
                      {d.debtName}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEBT_STATUS_COLORS[d.status] ?? ""}`}>
                      {d.status}
                    </span>
                    {d.debtType && (
                      <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full'>
                        {d.debtType}
                      </span>
                    )}
                  </div>
                  {d.lenderName && (
                    <p className='text-xs text-gray-500 mt-0.5'>
                      {d.lenderName}
                    </p>
                  )}
                  <div className='flex gap-6 mt-2 text-sm'>
                    <span>
                      <span className='text-gray-400 text-xs'>Remaining:</span>{" "}
                      <strong className='text-orange-600'>
                        {d.currency} {fmt(d.remainingBalance)}
                      </strong>
                    </span>
                    <span>
                      <span className='text-gray-400 text-xs'>Monthly:</span>{" "}
                      <strong>
                        {d.currency} {fmt(d.monthlyPayment)}
                      </strong>
                    </span>
                    {d.interestRate > 0 && (
                      <span className='text-xs text-gray-500'>
                        {d.interestRate}% p.a.
                      </span>
                    )}
                  </div>
                  <div className='mt-2 w-full bg-gray-100 rounded-full h-1.5'>
                    <div
                      className='bg-orange-400 h-1.5 rounded-full'
                      style={{
                        width: `${Math.min(100, ((d.totalAmount - d.remainingBalance) / d.totalAmount) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className='text-xs text-gray-400 mt-1'>
                    {fmt(
                      ((d.totalAmount - d.remainingBalance) / d.totalAmount) *
                        100,
                    )}
                    % paid
                  </p>
                </div>
                <div className='flex gap-2 ml-3 shrink-0'>
                  <button
                    onClick={() => {
                      setPaymentId(d.id);
                      setPaymentAmt("");
                    }}
                    className='text-xs flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100'>
                    <DollarSign className='w-3 h-3' /> Pay
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this debt?")) return;
                      await api.deleteDebt(d.id);
                      load();
                    }}
                    className='text-xs flex items-center gap-1 text-red-500 hover:text-red-700'>
                    <Trash2 className='w-3 h-3' />
                  </button>
                </div>
              </div>
              {paymentId === d.id && (
                <div className='mt-3 flex items-center gap-2 pt-3 border-t border-gray-100'>
                  <input
                    type='number'
                    placeholder='Payment amount'
                    value={paymentAmt}
                    onChange={(e) => setPaymentAmt(e.target.value)}
                    className='border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48'
                  />
                  <button
                    onClick={async () => {
                      if (!paymentAmt || Number(paymentAmt) <= 0) return;
                      await api.recordDebtPayment(d.id, Number(paymentAmt));
                      setPaymentId(null);
                      setPaymentAmt("");
                      load();
                    }}
                    className='bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700'>
                    Record
                  </button>
                  <button
                    onClick={() => setPaymentId(null)}
                    className='text-xs text-gray-500'>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Purchase Decision Tab ──────────────────────────────────────────────────
const DECISION_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2; bg: string }
> = {
  SAFE_TO_BUY: {
    label: "Safe to Buy! ✓",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
  WAIT_3_MONTHS: {
    label: "Wait 3 Months",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  WAIT_6_MONTHS: {
    label: "Wait 6 Months",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    icon: Clock,
  },
  BUY_LOWER_MODEL: {
    label: "Consider a Cheaper Option",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: AlertTriangle,
  },
  AVOID_FOR_NOW: {
    label: "Avoid for Now",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};

function PurchaseDecisionTab() {
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("5000");
  const [emiMonths, setEmiMonths] = useState("12");
  const [result, setResult] = useState<PurchaseDecisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.getPurchaseDecision(
        itemName,
        Number(price),
        Number(emiMonths),
      );
      setResult(r);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? DECISION_CONFIG[result.decision] : null;

  return (
    <div className='max-w-xl space-y-5'>
      <p className='text-sm text-gray-500'>
        Enter what you want to buy, its price, and your preferred payment plan.
        The engine analyses your financial health and recommends.
      </p>
      <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4'>
        <div>
          <label className='block text-xs text-gray-600 mb-1'>
            What are you buying? (optional)
          </label>
          <input
            type='text'
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
            placeholder='e.g. MacBook Pro, Car, Vacation…'
          />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              Item Price (AED)
            </label>
            <input
              type='number'
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
            />
          </div>
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              EMI Months (0 = one-time)
            </label>
            <input
              type='number'
              value={emiMonths}
              onChange={(e) => setEmiMonths(e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
              min='0'
              max='48'
            />
          </div>
        </div>
        {Number(emiMonths) > 0 && Number(price) > 0 && (
          <p className='text-xs text-gray-500'>
            Monthly EMI: AED {(Number(price) / Number(emiMonths)).toFixed(0)}
          </p>
        )}
        <button
          onClick={handleCheck}
          disabled={loading || !price}
          className='w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50'>
          {loading ? "Analysing…" : "Check Decision"}
        </button>
      </div>

      {error && <p className='text-red-500 text-sm'>{error}</p>}

      {result && cfg && (
        <div className={`rounded-xl border p-5 space-y-4 ${cfg.bg}`}>
          <div className='flex items-center gap-3'>
            <cfg.icon className={`w-7 h-7 ${cfg.color}`} />
            <div>
              {itemName && (
                <p className='text-xs text-gray-500 font-medium mb-0.5'>
                  {itemName}
                </p>
              )}
              <p className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className='text-xs text-gray-500'>Score: {result.score}/100</p>
            </div>
          </div>
          <ul className='space-y-1'>
            {result.reasons.map((r, i) => (
              <li
                key={i}
                className='flex items-start gap-2 text-sm text-gray-700'>
                <span className='mt-0.5 text-gray-400'>•</span> {r}
              </li>
            ))}
          </ul>
          <p className='text-xs text-gray-400 pt-2 border-t border-gray-200'>
            AED {result.input.itemPrice} over {result.input.emiMonths} months
            {result.input.emiMonths > 0 &&
              ` (AED ${result.input.monthlyEmi.toFixed(0)}/mo)`}
          </p>
        </div>
      )}

      <div className='bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1'>
        <p className='font-medium text-gray-600'>Decision Criteria:</p>
        <p>• Emergency fund ≥ 3 months expenses</p>
        <p>• Debt-to-income ratio ≤ 30%</p>
        <p>• Item EMI ≤ 10–15% of monthly income</p>
        <p>• Monthly surplus stays positive after purchase</p>
      </div>
    </div>
  );
}

// ─── Tab definitions ────────────────────────────────────────────────────────
type TabId = "budget" | "goals" | "commitments" | "debts" | "purchase";

const TABS: { id: TabId; label: string; icon: typeof PiggyBank }[] = [
  { id: "budget", label: "Budget", icon: PiggyBank },
  { id: "goals", label: "Goals", icon: Target },
  { id: "commitments", label: "Commitments", icon: Calendar },
  { id: "debts", label: "Debt Strategy", icon: CreditCard },
  { id: "purchase", label: "Purchase Decision", icon: ShoppingCart },
];

// ─── Main Planning Page ─────────────────────────────────────────────────────
export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState<TabId>("budget");
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className='max-w-4xl mx-auto px-4 py-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
          <PiggyBank className='text-blue-600 w-7 h-7' /> Planning
        </h1>
        <p className='text-sm text-gray-500 mt-1'>
          Budget, goals, commitments, debts, and purchase decisions in one
          place.
        </p>
      </div>

      {/* Desktop tab bar */}
      <div className='hidden sm:flex gap-1 bg-gray-100 rounded-xl p-1'>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-lg transition-colors ${activeTab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
            <t.icon className='w-4 h-4' />
            <span className='hidden md:inline'>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile tab selector */}
      <div className='sm:hidden'>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className='w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm'>
          <span className='flex items-center gap-2 text-sm font-medium text-blue-700'>
            <active.icon className='w-4 h-4' /> {active.label}
          </span>
          {mobileOpen ? (
            <ChevronUp className='w-4 h-4 text-gray-500' />
          ) : (
            <ChevronDown className='w-4 h-4 text-gray-500' />
          )}
        </button>
        {mobileOpen && (
          <div className='mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden'>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${activeTab === t.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                <t.icon className='w-4 h-4' /> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "budget" && <BudgetTab />}
        {activeTab === "goals" && <GoalsTab />}
        {activeTab === "commitments" && <CommitmentsTab />}
        {activeTab === "debts" && <DebtStrategyTab />}
        {activeTab === "purchase" && <PurchaseDecisionTab />}
      </div>
    </div>
  );
}
