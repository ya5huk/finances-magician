'use client'

import { useState } from 'react'
import type { Dividend } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { formatCurrency } from '@/lib/portfolio/calculations'
import { createClient } from '@/lib/supabase/client'
import { createDividend, deleteDividend } from '@/lib/portfolio/queries'
import { useSupabase } from '@/providers/supabase-provider'
import type { DividendFormInput } from '@/lib/portfolio/types'

interface DividendListProps {
  dividends: Dividend[]
  onDividendChanged: () => void
}

const defaultDividendForm: DividendFormInput = {
  ticker: '',
  amount: 0,
  currency: 'USD',
  date: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function DividendList({ dividends, onDividendChanged }: DividendListProps) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<DividendFormInput>({ ...defaultDividendForm })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useSupabase()

  const totalDividendIncome = dividends.reduce((sum, d) => sum + d.amount, 0)

  function updateField<K extends keyof DividendFormInput>(
    key: K,
    value: DividendFormInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (!form.ticker.trim()) {
      setError('Ticker is required')
      return
    }
    if (form.amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      await createDividend(supabase, user.id, form)
      setForm({ ...defaultDividendForm })
      setShowForm(false)
      onDividendChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add dividend')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(dividendId: string) {
    if (!user) return
    if (!confirm('Delete this dividend?')) return

    setDeletingId(dividendId)
    try {
      const supabase = createClient()
      await deleteDividend(supabase, dividendId, user.id)
      onDividendChanged()
    } catch (err) {
      console.error('Failed to delete dividend:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const sorted = [...dividends].sort(
    (a, b) => b.date.localeCompare(a.date)
  )

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total Dividend Income</p>
          <p className="text-lg font-bold text-accent">
            {formatCurrency(totalDividendIncome, 'USD')}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          variant={showForm ? 'ghost' : 'primary'}
        >
          {showForm ? 'Cancel' : '+ Add Dividend'}
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              label="Ticker"
              placeholder="AAPL"
              value={form.ticker}
              onChange={(e) => updateField('ticker', e.target.value)}
              size="sm"
            />
            <Input
              label="Amount"
              type="number"
              step="any"
              min="0"
              placeholder="25.00"
              value={form.amount || ''}
              onChange={(e) =>
                updateField('amount', parseFloat(e.target.value) || 0)
              }
              size="sm"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => updateField('currency', e.target.value as Currency)}
                className="h-8 px-3 text-xs bg-card text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {CURRENCY_SYMBOLS[c]} {c}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              size="sm"
            />
          </div>
          <Input
            label="Notes"
            placeholder="Optional notes..."
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            size="sm"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" loading={loading} size="sm">
            Add Dividend
          </Button>
        </form>
      )}

      {/* Dividend list */}
      {dividends.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No dividends recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Ticker</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((div) => (
                  <tr
                    key={div.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(div.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {div.ticker}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-accent font-medium">
                      {formatCurrency(div.amount, div.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-48">
                      {div.notes || '--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(div.id)}
                        disabled={deletingId === div.id}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 cursor-pointer"
                        title="Delete dividend"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
