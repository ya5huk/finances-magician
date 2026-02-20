'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import type { CashflowResult } from '@/lib/dashboard/cashflow'
import { formatCurrency } from '@/lib/portfolio/calculations'
import { createClient } from '@/lib/supabase/client'

interface CashBalanceCardProps {
  data: CashflowResult
  currency: Currency
  onCorrectionSubmitted: () => void
}

export function CashBalanceCard({
  data,
  currency,
  onCorrectionSubmitted,
}: CashBalanceCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [correctionAmount, setCorrectionAmount] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correctionAmount) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('cashflow_corrections').insert({
        user_id: user.id,
        corrected_balance: parseFloat(correctionAmount),
        currency,
        date: new Date().toISOString().split('T')[0],
        reason: correctionReason || null,
      })

      setCorrectionAmount('')
      setCorrectionReason('')
      setShowForm(false)
      onCorrectionSubmitted()
    } finally {
      setSubmitting(false)
    }
  }

  const isPositive = data.balance >= 0

  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-muted-foreground">
            Cash Balance
          </p>
          <p
            className={`text-2xl font-semibold ${
              isPositive ? 'text-foreground' : 'text-destructive'
            }`}
          >
            {formatCurrency(data.balance, currency)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Correct'}
        </Button>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Income</span>
          <span className="text-foreground font-medium">
            +{formatCurrency(data.breakdown.income, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expenses</span>
          <span className="text-destructive font-medium">
            -{formatCurrency(data.breakdown.expenses, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Investments</span>
          <span className="text-foreground font-medium">
            -{formatCurrency(data.breakdown.investments, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dividends</span>
          <span className="text-foreground font-medium">
            +{formatCurrency(data.breakdown.dividends, currency)}
          </span>
        </div>
      </div>

      {/* Inline correction form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 pt-2 border-t border-border"
        >
          <Input
            type="number"
            step="0.01"
            placeholder={`Actual balance (${CURRENCY_SYMBOLS[currency]})`}
            value={correctionAmount}
            onChange={(e) => setCorrectionAmount(e.target.value)}
            size="sm"
          />
          <Input
            type="text"
            placeholder="Reason (optional)"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            size="sm"
          />
          <Button type="submit" size="sm" loading={submitting}>
            Save Correction
          </Button>
        </form>
      )}
    </Card>
  )
}
