'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/providers/supabase-provider'
import type { ExpenseCategory } from '@/lib/types/database'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CategorySettings() {
  const { user } = useSupabase()
  const supabase = createClient()

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (data) setCategories(data)
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  async function handleAdd() {
    if (!user || !newName.trim()) return

    setAdding(true)

    const { error } = await supabase.from('expense_categories').insert({
      user_id: user.id,
      name: newName.trim(),
      is_active: true,
    })

    setAdding(false)

    if (!error) {
      setNewName('')
      loadCategories()
    }
  }

  async function handleToggleActive(category: ExpenseCategory) {
    await supabase
      .from('expense_categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    loadCategories()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)

    // Check if category is in use
    const { count } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      alert('Cannot delete: this category has expenses. Deactivate it instead.')
      setDeletingId(null)
      return
    }

    await supabase.from('expense_categories').delete().eq('id', id)
    setDeletingId(null)
    loadCategories()
  }

  return (
    <Card padding="lg">
      <CardHeader
        title="Expense Categories"
        subtitle="Organize your expenses with custom categories"
      />

      {/* Add new category */}
      <div className="mt-6 flex gap-3">
        <Input
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
        />
        <Button
          onClick={handleAdd}
          loading={adding}
          disabled={!newName.trim()}
          size="md"
        >
          Add
        </Button>
      </div>

      {/* Categories list */}
      <div className="mt-5 space-y-2">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No expense categories yet. Add your first one above.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className={`
                flex items-center gap-3 px-4 py-3
                bg-card border border-border rounded-xl
                transition-opacity duration-150
                ${!cat.is_active ? 'opacity-50' : ''}
              `}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {cat.name}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle active */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(cat)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors duration-200 cursor-pointer
                    ${cat.is_active ? 'bg-accent' : 'bg-muted'}
                  `}
                  aria-label={cat.is_active ? 'Deactivate' : 'Activate'}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 rounded-full bg-white
                      transition-transform duration-200
                      ${cat.is_active ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cat.id)}
                  loading={deletingId === cat.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
