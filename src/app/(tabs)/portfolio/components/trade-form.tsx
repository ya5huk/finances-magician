'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import type { TradeFormInput } from '@/lib/portfolio/types'
import { createClient } from '@/lib/supabase/client'
import { createTrade } from '@/lib/portfolio/queries'
import { useSupabase } from '@/providers/supabase-provider'

interface TradeFormProps {
  onTradeAdded: () => void
}

const defaultForm: TradeFormInput = {
  ticker: '',
  exchange: '',
  trade_type: 'buy',
  quantity: 0,
  price_per_share: 0,
  currency: 'USD',
  exchange_rate_at_trade: 1,
  fees: 0,
  broker: '',
  trade_date: new Date().toISOString().split('T')[0],
  notes: '',
}

export default function TradeForm({ onTradeAdded }: TradeFormProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<TradeFormInput>({ ...defaultForm })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useSupabase()

  function updateField<K extends keyof TradeFormInput>(
    key: K,
    value: TradeFormInput[K]
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
    if (form.quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }
    if (form.price_per_share <= 0) {
      setError('Price per share must be greater than 0')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      await createTrade(supabase, user.id, form)
      setForm({ ...defaultForm })
      setOpen(false)
      onTradeAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add trade')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="md">
        + Add Trade
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Add Trade</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trade type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField('trade_type', 'buy')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                form.trade_type === 'buy'
                  ? 'bg-accent text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => updateField('trade_type', 'sell')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                form.trade_type === 'sell'
                  ? 'bg-destructive text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Ticker & Exchange */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ticker"
              placeholder="AAPL"
              value={form.ticker}
              onChange={(e) => updateField('ticker', e.target.value)}
            />
            <Input
              label="Exchange"
              placeholder="NASDAQ"
              value={form.exchange}
              onChange={(e) => updateField('exchange', e.target.value)}
            />
          </div>

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              step="any"
              min="0"
              placeholder="10"
              value={form.quantity || ''}
              onChange={(e) =>
                updateField('quantity', parseFloat(e.target.value) || 0)
              }
            />
            <Input
              label="Price per share"
              type="number"
              step="any"
              min="0"
              placeholder="150.00"
              value={form.price_per_share || ''}
              onChange={(e) =>
                updateField(
                  'price_per_share',
                  parseFloat(e.target.value) || 0
                )
              }
            />
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Currency</label>
            <div className="flex gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateField('currency', c as Currency)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    form.currency === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {CURRENCY_SYMBOLS[c]} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Fees & Exchange Rate */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fees"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={form.fees || ''}
              onChange={(e) =>
                updateField('fees', parseFloat(e.target.value) || 0)
              }
            />
            <Input
              label="Exchange Rate"
              type="number"
              step="any"
              min="0"
              placeholder="1.00"
              value={form.exchange_rate_at_trade || ''}
              onChange={(e) =>
                updateField(
                  'exchange_rate_at_trade',
                  parseFloat(e.target.value) || 1
                )
              }
            />
          </div>

          {/* Broker & Date */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Broker"
              placeholder="Interactive Brokers"
              value={form.broker}
              onChange={(e) => updateField('broker', e.target.value)}
            />
            <Input
              label="Trade Date"
              type="date"
              value={form.trade_date}
              onChange={(e) => updateField('trade_date', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full bg-card text-foreground placeholder:text-muted-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Total preview */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-medium text-foreground">
              {CURRENCY_SYMBOLS[form.currency as Currency] || '$'}
              {((form.quantity || 0) * (form.price_per_share || 0) + (form.fees || 0)).toFixed(2)}
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {form.trade_type === 'buy' ? 'Add Buy' : 'Add Sell'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
