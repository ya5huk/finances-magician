'use client'

import { useState } from 'react'
import type { Loan } from '@/lib/types/database'
import { DEFAULT_CURRENCY, type Currency } from '@/lib/constants'
import { createLoan, updateLoan } from '@/lib/funds/queries'
import { Input, CurrencyInput } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LoanFormProps {
  editLoan?: Loan
  onSuccess: () => void
  onCancel: () => void
}

export function LoanForm({ editLoan, onSuccess, onCancel }: LoanFormProps) {
  const [name, setName] = useState(editLoan?.name ?? '')
  const [principal, setPrincipal] = useState(editLoan?.principal.toString() ?? '')
  const [remainingBalance, setRemainingBalance] = useState(
    editLoan?.remaining_balance.toString() ?? '',
  )
  const [currency, setCurrency] = useState<Currency>(
    (editLoan?.currency as Currency) ?? DEFAULT_CURRENCY,
  )
  const [interestRate, setInterestRate] = useState(
    editLoan?.interest_rate.toString() ?? '',
  )
  const [monthlyPayment, setMonthlyPayment] = useState(
    editLoan?.monthly_payment.toString() ?? '',
  )
  const [startDate, setStartDate] = useState(
    editLoan?.start_date ?? new Date().toISOString().split('T')[0],
  )
  const [endDate, setEndDate] = useState(editLoan?.end_date ?? '')
  const [notes, setNotes] = useState(editLoan?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter a loan name')
      return
    }
    if (!principal || parseFloat(principal) <= 0) {
      setError('Please enter a valid principal amount')
      return
    }
    if (!remainingBalance || parseFloat(remainingBalance) < 0) {
      setError('Please enter a valid remaining balance')
      return
    }

    setLoading(true)
    try {
      const formData = {
        name: name.trim(),
        principal: parseFloat(principal),
        remaining_balance: parseFloat(remainingBalance),
        currency,
        interest_rate: parseFloat(interestRate) || 0,
        monthly_payment: parseFloat(monthlyPayment) || 0,
        start_date: startDate,
        end_date: endDate,
        notes,
      }

      if (editLoan) {
        await updateLoan(editLoan.id, formData)
      } else {
        await createLoan(formData)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save loan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Loan Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Mortgage, Car Loan"
      />

      <CurrencyInput
        label="Principal"
        value={principal}
        onChange={(e) => setPrincipal(e.target.value)}
        currency={currency}
        onCurrencyChange={setCurrency}
        placeholder="0.00"
      />

      <CurrencyInput
        label="Remaining Balance"
        value={remainingBalance}
        onChange={(e) => setRemainingBalance(e.target.value)}
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
        placeholder="e.g. 3.5"
      />

      <CurrencyInput
        label="Monthly Payment"
        value={monthlyPayment}
        onChange={(e) => setMonthlyPayment(e.target.value)}
        currency={currency}
        onCurrencyChange={setCurrency}
        placeholder="0.00"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

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
          {editLoan ? 'Update Loan' : 'Add Loan'}
        </Button>
      </div>
    </form>
  )
}
