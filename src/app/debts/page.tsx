"use client";
import { useEffect, useState } from "react";
import { api, Debt } from "@/lib/api";
import { Plus, CreditCard, TrendingDown, Trash2, DollarSign } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

const emptyForm = {
  debtName: "", lenderName: "", totalAmount: "", remainingBalance: "",
  monthlyPayment: "", interestRate: "0", currency: "AED", dueDate: "",
  debtType: "loan", notes: "", status: "ACTIVE",
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAmt, setPaymentAmt] = useState("");

  const load = () => {
    setLoading(true);
    api.getDebts().then(setDebts).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.debtName || !form.totalAmount || !form.remainingBalance || !form.monthlyPayment) return;
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
      setForm(emptyForm);
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this debt?")) return;
    await api.deleteDebt(id);
    load();
  };

  const handlePayment = async (id: string) => {
    if (!paymentAmt || Number(paymentAmt) <= 0) return;
    await api.recordDebtPayment(id, Number(paymentAmt));
    setPaymentId(null);
    setPaymentAmt("");
    load();
  };

  const totalOwed = debts.filter(d => d.status === "ACTIVE").reduce((s, d) => s + d.remainingBalance, 0);
  const totalMonthly = debts.filter(d => d.status === "ACTIVE").reduce((s, d) => s + d.monthlyPayment, 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Debt Tracker</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Debt
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Total Owed</span></div>
          <p className="text-2xl font-bold text-orange-600">AED {fmt(totalOwed)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Monthly Payments</span></div>
          <p className="text-2xl font-bold text-red-600">AED {fmt(totalMonthly)}</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-800">New Debt</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "debtName", label: "Debt Name", required: true },
              { key: "lenderName", label: "Lender" },
              { key: "totalAmount", label: "Total Amount", type: "number", required: true },
              { key: "remainingBalance", label: "Remaining Balance", type: "number", required: true },
              { key: "monthlyPayment", label: "Monthly Payment", type: "number", required: true },
              { key: "interestRate", label: "Interest Rate %", type: "number" },
              { key: "dueDate", label: "Due Date", type: "date" },
            ].map(({ key, label, type = "text", required }) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-1">{label}{required && " *"}</label>
                <input
                  type={type}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>AED</option><option>INR</option><option>USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select value={form.debtType} onChange={(e) => setForm(f => ({ ...f, debtType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="loan">Loan</option>
                <option value="credit_card">Credit Card</option>
                <option value="personal">Personal</option>
                <option value="emi">EMI</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving} className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save Debt"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : debts.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No debts recorded. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {debts.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{d.debtName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] ?? ""}`}>{d.status}</span>
                    {d.debtType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.debtType}</span>}
                  </div>
                  {d.lenderName && <p className="text-xs text-gray-500 mt-0.5">{d.lenderName}</p>}
                  <div className="flex gap-6 mt-2 text-sm">
                    <span><span className="text-gray-400 text-xs">Remaining:</span> <strong className="text-orange-600">{d.currency} {fmt(d.remainingBalance)}</strong></span>
                    <span><span className="text-gray-400 text-xs">Monthly:</span> <strong>{d.currency} {fmt(d.monthlyPayment)}</strong></span>
                    {d.interestRate > 0 && <span className="text-xs text-gray-500">{d.interestRate}% p.a.</span>}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((d.totalAmount - d.remainingBalance) / d.totalAmount) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{fmt(((d.totalAmount - d.remainingBalance) / d.totalAmount) * 100)}% paid</p>
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button onClick={() => { setPaymentId(d.id); setPaymentAmt(""); }} className="text-xs flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100">
                    <DollarSign className="w-3 h-3" /> Pay
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {paymentId === d.id && (
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100">
                  <input type="number" placeholder="Payment amount" value={paymentAmt} onChange={(e) => setPaymentAmt(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48" />
                  <button onClick={() => handlePayment(d.id)} className="bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-700">Record</button>
                  <button onClick={() => setPaymentId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
