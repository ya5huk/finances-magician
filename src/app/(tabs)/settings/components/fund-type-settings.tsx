'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/providers/supabase-provider'
import { FUND_CATEGORIES, type FundCategory } from '@/lib/constants'
import type { FundType } from '@/lib/types/database'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const categoryLabels: Record<FundCategory, string> = {
  pension: 'Pension',
  education_fund: 'Education Fund',
  deposit: 'Deposit',
  custom: 'Custom',
}

export function FundTypeSettings() {
  const { user } = useSupabase()
  const supabase = createClient()

  const [fundTypes, setFundTypes] = useState<FundType[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<FundCategory>('custom')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadFundTypes = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('fund_types')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (data) setFundTypes(data)
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    loadFundTypes()
  }, [loadFundTypes])

  async function handleAdd() {
    if (!user || !newName.trim()) return

    setAdding(true)

    const { error } = await supabase.from('fund_types').insert({
      user_id: user.id,
      name: newName.trim(),
      category: newCategory,
      is_active: true,
    })

    setAdding(false)

    if (!error) {
      setNewName('')
      setNewCategory('custom')
      loadFundTypes()
    }
  }

  async function handleToggleActive(fundType: FundType) {
    await supabase
      .from('fund_types')
      .update({ is_active: !fundType.is_active })
      .eq('id', fundType.id)

    loadFundTypes()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)

    // Check if fund type is in use
    const { count } = await supabase
      .from('fund_entries')
      .select('*', { count: 'exact', head: true })
      .eq('fund_type_id', id)

    if (count && count > 0) {
      alert('Cannot delete: this fund type has entries. Deactivate it instead.')
      setDeletingId(null)
      return
    }

    await supabase.from('fund_types').delete().eq('id', id)
    setDeletingId(null)
    loadFundTypes()
  }

  const categoryOptions = FUND_CATEGORIES.map((c) => ({
    value: c,
    label: categoryLabels[c],
  }))

  return (
    <Card padding="lg">
      <CardHeader
        title="Fund Types"
        subtitle="Manage your pension, education, and custom fund types"
      />

      {/* Add new fund type */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Fund type name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
        />
        <Select
          options={categoryOptions}
          value={newCategory}
          onChange={(val) => setNewCategory(val as FundCategory)}
          className="sm:w-44"
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

      {/* Fund types list */}
      <div className="mt-5 space-y-2">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading fund types...
          </div>
        ) : fundTypes.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No fund types yet. Add your first one above.
          </div>
        ) : (
          fundTypes.map((ft) => (
            <div
              key={ft.id}
              className={`
                flex items-center gap-3 px-4 py-3
                bg-card border border-border rounded-xl
                transition-opacity duration-150
                ${!ft.is_active ? 'opacity-50' : ''}
              `}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {ft.name}
                </p>
                <Badge variant="outline" size="sm" className="mt-1">
                  {categoryLabels[ft.category as FundCategory] ?? ft.category}
                </Badge>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle active */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(ft)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors duration-200 cursor-pointer
                    ${ft.is_active ? 'bg-accent' : 'bg-muted'}
                  `}
                  aria-label={ft.is_active ? 'Deactivate' : 'Activate'}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 rounded-full bg-white
                      transition-transform duration-200
                      ${ft.is_active ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(ft.id)}
                  loading={deletingId === ft.id}
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
