'use client'

import { useState } from 'react'
import type { ExpenseCategory } from '@/lib/types/database'
import type { ExpenseFormData, ExpenseWithCategory } from '@/lib/expenses/types'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { createExpense, updateExpense, listExpenses } from '@/lib/expenses/queries'
import { Button } from '@/components/ui/button'

interface ExpenseFormProps {
  userId: string
  categories: ExpenseCategory[]
  expense: ExpenseWithCategory | null
  onClose: () => void
  onSaved: (expense: ExpenseWithCategory) => void
}

const INITIAL_FORM: ExpenseFormData = {
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: 0,
  currency: DEFAULT_CURRENCY,
  category_id: null,
  source_file_url: null,
  notes: null,
}

function expenseToForm(e: ExpenseWithCategory): ExpenseFormData {
  return {
    date: e.date,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
    category_id: e.category_id,
    source_file_url: e.source_file_url,
    notes: e.notes,
  }
}

export function ExpenseForm({ userId, categories, expense, onClose, onSaved }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>(
    expense ? expenseToForm(expense) : INITIAL_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const isEditing = !!expense

  const handleChange = (field: keyof ExpenseFormData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) {
      setError('Description is required')
      return
    }
    if (form.amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        await updateExpense(supabase, expense.id, userId, form)
      } else {
        await createExpense(supabase, userId, form)
      }

      // Re-fetch to get the category join data
      const allExpenses = await listExpenses(supabase, userId)
      const savedExpense = isEditing
        ? allExpenses.find((ex) => ex.id === expense.id)
        : allExpenses[0] // Most recent since sorted by date desc

      if (savedExpense) {
        onSaved(savedExpense)
      } else {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  const activeCategories = categories.filter((c) => c.is_active)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 pt-8 pb-8">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., Grocery shopping"
              required
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount || ''}
                onChange={(e) => {
                  const num = parseFloat(e.target.value)
                  handleChange('amount', isNaN(num) ? 0 : num)
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
            <select
              value={form.category_id ?? ''}
              onChange={(e) => handleChange('category_id', e.target.value || null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No category</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => handleChange('notes', e.target.value || null)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Optional notes..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEditing ? 'Update' : 'Save'} Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
