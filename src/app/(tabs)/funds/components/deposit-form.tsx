'use client'

import { useState, useEffect } from 'react'
import type { FundType } from '@/lib/types/database'
import { DEFAULT_CURRENCY, CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { createDeposit } from '@/lib/funds/queries'
import { calculateProjectedDepositValue } from '@/lib/funds/calculations'
import { Input, CurrencyInput } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface DepositFormProps {
  fundTypes: FundType[]
  onSuccess: () => void
  onCancel: () => void
}

export function DepositForm({ fundTypes, onSuccess, onCancel }: DepositFormProps) {
  const [fundTypeId, setFundTypeId] = useState('')
  const [bank, setBank] = useState('')
  const [principal, setPrincipal] = useState('')
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY)
  const [interestRate, setInterestRate] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [maturityDate, setMaturityDate] = useState('')
  const [notes, setNotes] = useState('')
  const [projectedValue, setProjectedValue] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-calculate projected value
  useEffect(() => {
    const p = parseFloat(principal)
    const r = parseFloat(interestRate)
    if (p > 0 && r > 0 && startDate && maturityDate) {
      const projected = calculateProjectedDepositValue(p, r, startDate, maturityDate)
      setProjectedValue(projected)
    } else {
      setProjectedValue(null)
    }
  }, [principal, interestRate, startDate, maturityDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fundTypeId) {
      setError('Please select a fund type')
      return
    }
    if (!bank.trim()) {
      setError('Please enter a bank name')
      return
    }
    if (!principal || parseFloat(principal) <= 0) {
      setError('Please enter a valid principal amount')
      return
    }
    if (!interestRate || parseFloat(interestRate) < 0) {
      setError('Please enter a valid interest rate')
      return
    }
    if (!maturityDate) {
      setError('Please enter a maturity date')
      return
    }

    setLoading(true)
    try {
      await createDeposit({
        fund_type_id: fundTypeId,
        bank: bank.trim(),
        principal: parseFloat(principal),
        currency,
        interest_rate: parseFloat(interestRate),
        start_date: startDate,
        maturity_date: maturityDate,
        notes,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deposit')
    } finally {
      setLoading(false)
    }
  }

  const symbol = CURRENCY_SYMBOLS[currency] ?? currency

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Fund Type"
        placeholder="Select fund type..."
        options={fundTypes.filter((ft) => ft.is_active).map((ft) => ({
          value: ft.id,
          label: ft.name,
        }))}
        value={fundTypeId}
        onChange={setFundTypeId}
      />

      <Input
        label="Bank"
        value={bank}
        onChange={(e) => setBank(e.target.value)}
        placeholder="e.g. Bank Hapoalim"
      />

      <CurrencyInput
        label="Principal"
        value={principal}
        onChange={(e) => setPrincipal(e.target.value)}
        currency={currency}
        onCurrencyChange={setCurrency}
        placeholder="0.00"
      />

      <Input
        label="Annual Interest Rate (%)"
        type="number"
        step="0.01"
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
        placeholder="e.g. 4.5"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Maturity Date"
          type="date"
          value={maturityDate}
          onChange={(e) => setMaturityDate(e.target.value)}
        />
      </div>

      {projectedValue !== null && (
        <div className="rounded-lg bg-accent/10 border border-accent/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">Projected Value at Maturity</p>
          <p className="text-lg font-semibold text-accent">
            {symbol}{projectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      )}

      <Input
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes..."
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Add Deposit
        </Button>
      </div>
    </form>
  )
}
