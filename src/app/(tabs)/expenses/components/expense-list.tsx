'use client'

import { useState, useMemo } from 'react'
import type { ExpenseCategory } from '@/lib/types/database'
import type { ExpenseWithCategory } from '@/lib/expenses/types'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { deleteExpense } from '@/lib/expenses/queries'
import { Button } from '@/components/ui/button'
import { ExpenseForm } from './expense-form'

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Simple color palette for category badges
const CATEGORY_COLORS = [
  'bg-blue-500/15 text-blue-400',
  'bg-emerald-500/15 text-emerald-400',
  'bg-amber-500/15 text-amber-400',
  'bg-purple-500/15 text-purple-400',
  'bg-rose-500/15 text-rose-400',
  'bg-cyan-500/15 text-cyan-400',
  'bg-orange-500/15 text-orange-400',
  'bg-pink-500/15 text-pink-400',
  'bg-teal-500/15 text-teal-400',
  'bg-indigo-500/15 text-indigo-400',
]

function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

export function ExpenseList({
  initialExpenses,
  categories,
  userId,
}: {
  initialExpenses: ExpenseWithCategory[]
  categories: ExpenseCategory[]
  userId: string
}) {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>(initialExpenses)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)

  const supabase = createClient()

  // Build a category color map
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((cat, i) => map.set(cat.id, getCategoryColor(i)))
    return map
  }, [categories])

  const filteredExpenses = useMemo(() => {
    if (!filterCategoryId) return expenses
    return expenses.filter((e) => e.category_id === filterCategoryId)
  }, [expenses, filterCategoryId])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    setDeletingId(id)
    try {
      await deleteExpense(supabase, id, userId)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Failed to delete expense:', err)
      alert('Failed to delete expense')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = (expense: ExpenseWithCategory) => {
    setExpenses((prev) => {
      const exists = prev.find((e) => e.id === expense.id)
      if (exists) {
        return prev
          .map((e) => (e.id === expense.id ? expense : e))
          .sort((a, b) => b.date.localeCompare(a.date))
      }
      return [expense, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    })
    setShowForm(false)
    setEditingExpense(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Transactions &amp; spending categories
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Expense</Button>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterCategoryId(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategoryId === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {categories
            .filter((c) => c.is_active)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategoryId(cat.id === filterCategoryId ? null : cat.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterCategoryId === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      )}

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <svg
            className="h-12 w-12 text-muted-foreground mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
          <p className="text-muted-foreground mb-4">
            {expenses.length === 0
              ? 'No expenses recorded yet'
              : 'No expenses match the selected filter'}
          </p>
          {expenses.length === 0 && (
            <Button onClick={() => setShowForm(true)} size="sm">
              Add your first expense
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(expense.date)}
                    </span>
                    {expense.expense_categories && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          categoryColorMap.get(expense.expense_categories.id) ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {expense.expense_categories.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-foreground whitespace-nowrap">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingExpense(expense)
                      setShowForm(true)
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ExpenseForm
          userId={userId}
          categories={categories}
          expense={editingExpense}
          onClose={() => {
            setShowForm(false)
            setEditingExpense(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
