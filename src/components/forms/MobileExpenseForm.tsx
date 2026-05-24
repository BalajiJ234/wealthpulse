"use client";

import { useState } from "react";
import {
  Calendar,
  DollarSign,
  Tag,
  Type,
  Clock,
  FileText,
  Sparkles,
} from "lucide-react";

export interface ExpenseFormData {
  amount: string;
  currency: string;
  category: string;
  isRecurring?: boolean;
  description: string;
  date: string;
  recurringFrequency: "daily" | "weekly" | "monthly" | "yearly";
  notes: string;
}

interface MobileExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const expenseTypes = [
  {
    value: "recurring",
    name: "Recurring Payment",
    icon: "🔄",
    description: "Subscriptions, bills, etc.",
  },
  {
    value: "essential",
    name: "Monthly Essential",
    icon: "🏠",
    description: "Groceries, utilities, etc.",
  },
  {
    value: "one-time",
    name: "One-Time Purchase",
    icon: "🛍️",
    description: "Regular shopping, entertainment, etc.",
  },
  {
    value: "luxury",
    name: "Luxury / Optional",
    icon: "💎",
    description: "Premium items, treats, etc.",
  },
  {
    value: "emergency",
    name: "Emergency Expense",
    icon: "🚨",
    description: "Unexpected urgent costs",
  },
];

const expenseCategories = [
  { name: "Food & Dining", icon: "🍽️" },
  { name: "Transportation", icon: "🚗" },
  { name: "Shopping", icon: "🛒" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Bills & Utilities", icon: "📱" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Education", icon: "📚" },
  { name: "Travel", icon: "✈️" },
  { name: "Investment", icon: "📈" },
  { name: "Other", icon: "📋" },
];

const SUPPORTED_CURRENCIES = [
  { code: "AED", symbol: "AED", flag: "🇦🇪" },
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
];

export default function MobileExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: MobileExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: initialData?.amount || "",
    currency: initialData?.currency || "AED",
    category: initialData?.category || "Food & Dining",
    isRecurring: initialData?.isRecurring || false,
    description: initialData?.description || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    recurringFrequency: initialData?.recurringFrequency || "monthly",
    notes: initialData?.notes || "",
  });

  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount && formData.description) {
      onSubmit(formData);
    }
  };

  const getAISuggestion = async () => {
    if (!formData.description) return;

    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          amount: parseFloat(formData.amount) || 0,
        }),
      });

      const data = await response.json();
      if (data.category) {
        setFormData({ ...formData, category: data.category });
      }
    } catch (error) {
      console.error("AI suggestion failed:", error);
    }
    setAiLoading(false);
  };

  return (
    <div className='h-full flex flex-col'>
      <form
        id='expense-form'
        onSubmit={handleSubmit}
        className='flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto'>
        {/* Amount & Currency Row */}
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
                <DollarSign size={16} className='text-green-600' />
                <span>Amount *</span>
              </label>
              <input
                type='number'
                step='0.01'
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder='0.00'
                className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg'
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
                className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg'>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.flag} {currency.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
            <FileText size={16} className='text-blue-600' />
            <span>Description *</span>
          </label>
          <input
            type='text'
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder='What did you spend on?'
            className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg'
          />
        </div>

        {/* Category with AI Suggestion */}
        <div>
          <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
            <Tag size={16} className='text-purple-600' />
            <span>Category *</span>
          </label>
          <div className='space-y-3'>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg'>
              {expenseCategories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            {formData.description && (
              <button
                type='button'
                onClick={getAISuggestion}
                disabled={aiLoading}
                className='flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium disabled:opacity-50 transition-all hover:shadow-lg'>
                <Sparkles size={16} />
                <span>
                  {aiLoading
                    ? "Getting AI Suggestion..."
                    : "✨ Try AI Suggestion"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Recurring Expense Toggle */}
        <div>
          <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
            <Type size={16} className='text-indigo-600' />
            <span>Expense Type</span>
          </label>
          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              id='isRecurring'
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
              className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
            />
            <label htmlFor='isRecurring' className='text-lg'>
              {formData.isRecurring
                ? "🔄 Recurring Expense"
                : "💰 One-time Expense"}
            </label>
          </div>
          <p className='text-sm text-gray-500 mt-2'>
            {formData.isRecurring
              ? "This expense repeats regularly (subscriptions, bills, etc.)"
              : "This is a one-time purchase or payment"}
          </p>
        </div>

        {/* Recurring Frequency */}
        {formData.isRecurring && (
          <div>
            <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
              <Clock size={16} className='text-orange-600' />
              <span>Frequency *</span>
            </label>
            <select
              value={formData.recurringFrequency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recurringFrequency: e.target.value as
                    | "daily"
                    | "weekly"
                    | "monthly"
                    | "yearly",
                })
              }
              className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg'>
              <option value='daily'>📅 Daily</option>
              <option value='weekly'>📅 Weekly</option>
              <option value='monthly'>🗓️ Monthly</option>
              <option value='yearly'>📆 Yearly</option>
            </select>
          </div>
        )}

        {/* Date */}
        <div>
          <label className='flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3'>
            <Calendar size={16} className='text-red-600' />
            <span>Date *</span>
          </label>
          <input
            type='date'
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg'
          />
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
            placeholder='Any additional details...'
            rows={3}
            className='w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg resize-none'
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
          form='expense-form'
          disabled={!formData.amount || !formData.description}
          className='flex-1 py-3 md:py-4 px-4 md:px-6 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-sm md:text-base'
          onClick={handleSubmit}>
          {isEditing ? "Update Expense" : "Add Expense"}
        </button>
      </div>
    </div>
  );
}
