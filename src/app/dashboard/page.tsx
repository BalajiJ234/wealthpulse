"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DashboardSummary, FinancialHealth } from "@/lib/api";
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Wallet, CreditCard, Calendar, Shield, Activity
} from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-600 bg-green-50 border-green-200",
  B: "text-blue-600 bg-blue-50 border-blue-200",
  C: "text-yellow-600 bg-yellow-50 border-yellow-200",
  D: "text-red-600 bg-red-50 border-red-200",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getDashboardSummary(), api.getFinancialHealth()])
      .then(([s, h]) => { setSummary(s); setHealth(h); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading dashboard…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}. Make sure wealth-pulse-api is running on port 3001.</div>;
  if (!summary || !health) return null;

  const gradeClass = GRADE_COLORS[health.grade] ?? "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{summary.month}</p>
        </div>
        <span className={`text-4xl font-bold px-5 py-3 rounded-xl border ${gradeClass}`}>
          {health.score} <span className="text-lg font-semibold ml-1">{health.grade}</span>
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Income", value: summary.totalIncome, icon: TrendingUp, color: "text-green-600" },
          { label: "Expenses", value: summary.totalExpenses, icon: TrendingDown, color: "text-red-500" },
          { label: "Debt Payments", value: summary.totalDebtPayments, icon: CreditCard, color: "text-orange-500" },
          { label: "Net Surplus", value: summary.netSurplus, icon: Wallet, color: summary.netSurplus >= 0 ? "text-green-600" : "text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>AED {fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Health Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> Health Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Debt-to-Income", value: `${health.metrics.dti}%`, warn: health.metrics.dti > 30 },
            { label: "Savings Rate", value: `${health.metrics.savingsRate}%`, warn: health.metrics.savingsRate < 10 },
            { label: "Emergency Fund", value: `${health.metrics.emergencyFundMonths} mo`, warn: health.metrics.emergencyFundMonths < 3 },
            { label: "Active Debts", value: String(health.metrics.activeDebtCount), warn: health.metrics.activeDebtCount > 3 },
          ].map(({ label, value, warn }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-lg font-bold ${warn ? "text-red-500" : "text-green-600"}`}>{value}</p>
              {warn ? <AlertCircle className="w-3 h-3 text-red-400 mx-auto mt-1" /> : <CheckCircle2 className="w-3 h-3 text-green-400 mx-auto mt-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Debt + Commitments summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-800">Active Debts</h2>
          </div>
          <p className="text-2xl font-bold text-orange-600">AED {fmt(summary.totalActiveDebt)}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.activeDebtCount} active debt(s)</p>
          <Link href="/debts" className="text-xs text-blue-600 hover:underline mt-3 inline-block">Manage debts →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-gray-800">Upcoming Commitments</h2>
          </div>
          <p className="text-2xl font-bold text-purple-600">AED {fmt(summary.upcomingCommitmentsTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.upcomingCommitmentsCount} upcoming</p>
          <Link href="/commitments" className="text-xs text-blue-600 hover:underline mt-3 inline-block">View commitments →</Link>
        </div>
      </div>

      {/* Emergency Fund */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-teal-500" />
          <h2 className="text-sm font-semibold text-gray-800">Emergency Fund</h2>
        </div>
        <p className="text-2xl font-bold text-teal-600">AED {fmt(summary.emergencyFundBalance)}</p>
        {summary.emergencyFundMonths && (
          <p className="text-xs text-gray-500 mt-1">{summary.emergencyFundMonths} months coverage</p>
        )}
        {!summary.emergencyFundMonths && (
          <p className="text-xs text-yellow-500 mt-1">Set monthly essentials to see months coverage</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/transactions", label: "Transactions" },
          { href: "/debts", label: "Debt Tracker" },
          { href: "/commitments", label: "Commitments" },
          { href: "/iphone-decision", label: "iPhone Decision" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="block text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium py-3 px-4 rounded-lg border border-blue-200 transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
