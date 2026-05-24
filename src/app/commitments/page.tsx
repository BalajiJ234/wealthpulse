"use client";
import { useEffect, useState } from "react";
import { api, Commitment } from "@/lib/api";
import { Plus, Calendar, Trash2, CheckCircle2 } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-gray-100 text-gray-600 border-gray-200",
};
const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-700",
};

const emptyForm = {
  title: "", amount: "", currency: "AED", dueDate: "",
  category: "", priority: "MEDIUM", recurringType: "NONE",
  status: "UPCOMING", notes: "",
};

export default function CommitmentsPage() {
  const [items, setItems] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("UPCOMING");

  const load = () => {
    setLoading(true);
    api.getCommitments().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      setForm(emptyForm);
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const handleMarkPaid = async (id: string) => {
    await api.updateCommitment(id, { status: "PAID" });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this commitment?")) return;
    await api.deleteCommitment(id);
    load();
  };

  const filtered = items.filter(i => filter === "ALL" ? true : i.status === filter);
  const upcomingTotal = items.filter(i => i.status === "UPCOMING").reduce((s, i) => s + i.convertedAmount, 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commitments</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
        <Calendar className="w-5 h-5 text-purple-500" />
        <div>
          <p className="text-xs text-gray-500">Upcoming total</p>
          <p className="text-xl font-bold text-purple-600">AED {fmt(upcomingTotal)}</p>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {items.filter(i => i.status === "UPCOMING").length} upcoming, {items.filter(i => i.status === "MISSED").length} missed
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-800">New Commitment</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Amount *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>AED</option><option>INR</option><option>USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Due Date *</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Recurring</label>
              <select value={form.recurringType} onChange={(e) => setForm(f => ({ ...f, recurringType: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="NONE">None</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Category</label>
              <input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Rent, Insurance" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving} className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["UPCOMING", "PAID", "MISSED", "ALL"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{f}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No commitments in this view.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{c.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[c.priority] ?? ""}`}>{c.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? ""}`}>{c.status}</span>
                </div>
                <div className="flex gap-4 mt-1 text-sm">
                  <span className="font-semibold text-gray-800">{c.currency} {fmt(c.amount)}</span>
                  <span className="text-gray-400 text-xs">Due {c.dueDate}</span>
                  {c.category && <span className="text-gray-400 text-xs">{c.category}</span>}
                  {c.recurringType !== "NONE" && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded">{c.recurringType}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {c.status === "UPCOMING" && (
                  <button onClick={() => handleMarkPaid(c.id)} className="text-xs flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </button>
                )}
                <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
