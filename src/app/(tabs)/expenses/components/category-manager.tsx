'use client'

import { useState } from 'react'
import type { ExpenseCategory } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '@/lib/expenses/queries'
import { Button } from '@/components/ui/button'

export function CategoryManager({
  initialCategories,
  userId,
}: {
  initialCategories: ExpenseCategory[]
  userId: string
}) {
  const [categories, setCategories] = useState<ExpenseCategory[]>(initialCategories)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    setError(null)

    try {
      const created = await createExpenseCategory(supabase, userId, { name: newName.trim() })
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      )
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return
    setError(null)

    try {
      const updated = await updateExpenseCategory(supabase, id, userId, {
        name: editingName.trim(),
      })
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null)
      setEditingName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category')
    }
  }

  const handleToggleActive = async (cat: ExpenseCategory) => {
    setError(null)

    try {
      const updated = await updateExpenseCategory(supabase, cat.id, userId, {
        is_active: !cat.is_active,
      })
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle category')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Expenses in this category will become uncategorized.')) return
    setDeletingId(id)
    setError(null)

    try {
      await deleteExpenseCategory(supabase, id, userId)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Expense Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your spending categories
        </p>
      </div>

      {/* Add New Category */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button onClick={handleAdd} loading={adding} size="sm">
          Add
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {/* Category List */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No categories yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    cat.is_active
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-background text-transparent'
                  }`}
                  title={cat.is_active ? 'Deactivate' : 'Activate'}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>

                {editingId === cat.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleUpdate(cat.id)
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null)
                      }
                    }}
                    onBlur={() => handleUpdate(cat.id)}
                  />
                ) : (
                  <span
                    className={`text-sm font-medium truncate ${
                      cat.is_active ? 'text-foreground' : 'text-muted-foreground line-through'
                    }`}
                  >
                    {cat.name}
                  </span>
                )}
              </div>

              <div className="flex gap-1 shrink-0 ml-2">
                <button
                  onClick={() => {
                    setEditingId(cat.id)
                    setEditingName(cat.name)
                  }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Edit"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
