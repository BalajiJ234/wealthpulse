"use client";

import { useState } from "react";
import {
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Repeat,
  TrendingUp,
} from "lucide-react";

export interface IncomeFormData {
  source: string;
  amount: string;
  currency: string;
  category: string;
  status: "received" | "scheduled";
  eventDate: string;
  recurrence:
    | "one-time"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "annually";
  notes: string;
}

interface MobileIncomeFormProps {
  initialData?: Partial<IncomeFormData>;
  onSubmit: (data: IncomeFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const incomeCategories = [
  { value: "salary", label: "Salary", icon: "💼" },
  { value: "bonus", label: "Bonus", icon: "🎁" },
  { value: "freelance", label: "Freelance", icon: "💻" },
  { value: "investment", label: "Investment", icon: "📈" },
  { value: "refund", label: "Refund", icon: "🔄" },
  { value: "rental", label: "Rental", icon: "🏠" },
  { value: "gift", label: "Gift", icon: "🎀" },
  { value: "other", label: "Other", icon: "📋" },
];

const recurrenceOptions = [
  { value: "one-time", label: "🕐 One-time" },
  { value: "weekly", label: "📅 Weekly" },
  { value: "biweekly", label: "📅 Biweekly" },
  { value: "monthly", label: "🗓️ Monthly" },
  { value: "quarterly", label: "📆 Quarterly" },
  { value: "annually", label: "📆 Annually" },
];

const SUPPORTED_CURRENCIES = [
  { code: "AED", symbol: "AED", flag: "🇦🇪" },
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
];

export default function MobileIncomeForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: MobileIncomeFormProps) {
  const [formData, setFormData] = useState<IncomeFormData>({
    source: initialData?.source || "",
    amount: initialData?.amount || "",
    currency: initialData?.currency || "AED",
    category: initialData?.category || "salary",
    status: initialData?.status || "received",
    eventDate: initialData?.eventDate || new Date().toISOString().split("T")[0],
    recurrence: initialData?.recurrence || "monthly",
    notes: initialData?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount && formData.source) {
      onSubmit(formData);
    }
  };

  return (
    <div className='h-full flex flex-col'>
      <form
        id='income-form'
        onSubmit={handleSubmit}
        className='flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto'>
        {/* Amount & Currency Row */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
              <DollarSign size={16} className='text-green-600' />
              <span>Amount *</span>
            </label>
            <input
              type='number'
              step='0.01'
              min='0'
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder='0.00'
              className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg'
              required
            />
          </div>

          <div>
            <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
              <span>💱</span>
              <span>Currency</span>
            </label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg'>
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Source */}
        <div>
          <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
            <TrendingUp size={16} className='text-green-600' />
            <span>Source *</span>
          </label>
          <input
            type='text'
            value={formData.source}
            onChange={(e) =>
              setFormData({ ...formData, source: e.target.value })
            }
            placeholder='e.g., Monthly Salary, Freelance Project…'
            className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg'
            required
          />
        </div>

        {/* Category & Status */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
              <Tag size={16} className='text-purple-600' />
              <span>Category</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg'>
              {incomeCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
              <span>📊</span>
              <span>Status</span>
            </label>
            <div className='flex rounded-xl border border-gray-300 overflow-hidden'>
              {(["received", "scheduled"] as const).map((s) => (
                <button
                  key={s}
                  type='button'
                  onClick={() => setFormData({ ...formData, status: s })}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                    formData.status === s
                      ? s === "received"
                        ? "bg-green-600 text-white"
                        : "bg-yellow-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}>
                  {s === "received" ? "✅ Received" : "⏳ Scheduled"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date & Recurrence */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
              <Calendar size={16} className='text-red-600' />
              <span>Date *</span>
            </label>
            <input
              type='date'
              value={formData.eventDate}
              onChange={(e) =>
                setFormData({ ...formData, eventDate: e.target.value })
              }
              className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg'
              required
            />
          </div>

          <div>
            <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
              <Repeat size={16} className='text-indigo-600' />
              <span>Recurrence</span>
            </label>
            <select
              value={formData.recurrence}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recurrence: e.target.value as IncomeFormData["recurrence"],
                })
              }
              className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg'>
              {recurrenceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
            <FileText size={16} className='text-gray-600' />
            <span>Notes (Optional)</span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder='Any additional details…'
            rows={3}
            className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg resize-none'
          />
        </div>
      </form>

      {/* Action Buttons - Fixed at bottom */}
      <div className='flex space-x-3 p-4 md:p-6 border-t border-gray-100 bg-white flex-shrink-0'>
        <button
          type='button'
          onClick={onCancel}
          className='flex-1 py-3 md:py-4 px-4 md:px-6 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm md:text-base'>
          Cancel
        </button>
        <button
          type='submit'
          form='income-form'
          disabled={!formData.amount || !formData.source}
          className='flex-1 py-3 md:py-4 px-4 md:px-6 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors text-sm md:text-base'
          onClick={handleSubmit}>
          {isEditing ? "Update Income" : "Add Income"}
        </button>
      </div>
    </div>
  );
}
