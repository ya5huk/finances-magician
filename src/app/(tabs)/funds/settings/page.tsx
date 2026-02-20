'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FundType } from '@/lib/types/database'
import { FUND_CATEGORIES, type FundCategory } from '@/lib/constants'
import {
  listFundTypes,
  createFundType,
  updateFundType,
  deleteFundType,
} from '@/lib/funds/queries'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const categoryLabels: Record<FundCategory, string> = {
  pension: 'Pension',
  education_fund: 'Education Fund',
  deposit: 'Deposit',
  custom: 'Custom',
}

export default function FundSettingsPage() {
  const [fundTypes, setFundTypes] = useState<FundType[]>([])
  const [loading, setLoading] = useState(true)

  // New fund type form
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<FundCategory>('custom')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState<FundCategory>('custom')
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const data = await listFundTypes()
      setFundTypes(data)
    } catch (err) {
      console.error('Failed to load fund types:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!newName.trim()) {
      setFormError('Please enter a name')
      return
    }

    setCreating(true)
    try {
      await createFundType({
        name: newName.trim(),
        category: newCategory,
        is_active: true,
      })
      setNewName('')
      setNewCategory('custom')
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create fund type')
    } finally {
      setCreating(false)
    }
  }

  const handleStartEdit = (ft: FundType) => {
    setEditingId(ft.id)
    setEditName(ft.name)
    setEditCategory(ft.category)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await updateFundType(id, {
        name: editName.trim(),
        category: editCategory,
      })
      setEditingId(null)
      await loadData()
    } catch {
      alert('Failed to update fund type')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (ft: FundType) => {
    try {
      await updateFundType(ft.id, { is_active: !ft.is_active })
      await loadData()
    } catch {
      alert('Failed to update fund type')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This may affect associated entries.')) return
    setDeleting(id)
    try {
      await deleteFundType(id)
      await loadData()
    } catch {
      alert('Failed to delete fund type. It may have associated entries.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/funds"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fund Settings</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your fund types and categories
          </p>
        </div>
      </div>

      {/* Create New Fund Type */}
      <Card padding="lg">
        <CardHeader title="Create New Fund Type" subtitle="Add a new type to organize your funds" />
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Meitav Pension"
            />
            <Select
              label="Category"
              options={FUND_CATEGORIES.map((c) => ({
                value: c,
                label: categoryLabels[c],
              }))}
              value={newCategory}
              onChange={(v) => setNewCategory(v as FundCategory)}
            />
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <Button type="submit" loading={creating}>
            Create Fund Type
          </Button>
        </form>
      </Card>

      {/* Existing Fund Types */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Existing Fund Types</h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : fundTypes.length === 0 ? (
          <Card>
            <p className="text-center py-6 text-sm text-muted-foreground">
              No fund types yet. Create one above to get started.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {fundTypes.map((ft) => (
              <Card key={ft.id} padding="md">
                {editingId === ft.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Select
                        label="Category"
                        options={FUND_CATEGORIES.map((c) => ({
                          value: c,
                          label: categoryLabels[c],
                        }))}
                        value={editCategory}
                        onChange={(v) => setEditCategory(v as FundCategory)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(ft.id)}
                        loading={saving}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {ft.name}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {categoryLabels[ft.category]}
                          </span>
                          {!ft.is_active && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(ft)}
                      >
                        {ft.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(ft)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ft.id)}
                        loading={deleting === ft.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
