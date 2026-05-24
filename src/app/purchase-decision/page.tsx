"use client";
import { useState } from "react";
import { api, PurchaseDecisionResult } from "@/lib/api";
import {
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";

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

export default function PurchaseDecisionPage() {
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
      const r = await api.getPurchaseDecision(itemName, Number(price), Number(emiMonths));
      setResult(r);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? DECISION_CONFIG[result.decision] : null;

  return (
    <main className='max-w-xl mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center gap-3'>
        <ShoppingCart className='w-6 h-6 text-gray-700' />
        <h1 className='text-2xl font-bold text-gray-900'>
          Purchase Decision
        </h1>
      </div>
      <p className='text-sm text-gray-500'>
        Enter what you want to buy, its price, and your preferred payment plan.
        The engine analyses your current financial health and gives a recommendation.
      </p>

      <div className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4'>
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
              placeholder='e.g. 5000'
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
        <div className={`rounded-xl border p-6 space-y-4 ${cfg.bg}`}>
          <div className='flex items-center gap-3'>
            <cfg.icon className={`w-7 h-7 ${cfg.color}`} />
            <div>
              {itemName && (
                <p className='text-xs text-gray-500 font-medium mb-0.5'>{itemName}</p>
              )}
              <p className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className='text-xs text-gray-500'>
                Decision score: {result.score}/100
              </p>
            </div>
          </div>
          <div className='space-y-2'>
            <p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
              Reasons
            </p>
            <ul className='space-y-1'>
              {result.reasons.map((r, i) => (
                <li
                  key={i}
                  className='flex items-start gap-2 text-sm text-gray-700'>
                  <span className='mt-0.5 text-gray-400'>•</span> {r}
                </li>
              ))}
            </ul>
          </div>
          <div className='pt-3 border-t border-gray-200 text-xs text-gray-500'>
            Input: AED {result.input.itemPrice} over {result.input.emiMonths}{" "}
            months
            {result.input.emiMonths > 0 &&
              ` (AED ${result.input.monthlyEmi.toFixed(0)}/mo)`}
          </div>
        </div>
      )}

      <div className='bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-500 space-y-1'>
        <p className='font-medium text-gray-600'>Decision Criteria:</p>
        <p>• Emergency fund ≥ 3 months essential expenses</p>
        <p>• Debt-to-income ratio ≤ 30% (20% if active debt exists)</p>
        <p>• Item EMI ≤ 10–15% of monthly income</p>
        <p>• Monthly surplus stays positive after purchase</p>
        <p>• Emergency fund does not drop below 3 months after purchase</p>
      </div>
    </main>
  );
}
