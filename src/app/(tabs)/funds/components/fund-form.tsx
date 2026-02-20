'use client'

import { useState } from 'react'
import type { FundType } from '@/lib/types/database'
import { CURRENCIES, FUND_ENTRY_TYPES, DEFAULT_CURRENCY, type Currency, type FundEntryType } from '@/lib/constants'
import { createFundEntry } from '@/lib/funds/queries'
import { Input, CurrencyInput } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface FundFormProps {
  fundTypes: FundType[]
  defaultFundTypeId?: string
  onSuccess: () => void
  onCancel: () => void
}

const entryTypeLabels: Record<FundEntryType, string> = {
  contribution: 'Contribution',
  withdrawal: 'Withdrawal',
  value_snapshot: 'Value Snapshot',
}

export function FundForm({ fundTypes, defaultFundTypeId, onSuccess, onCancel }: FundFormProps) {
  const [fundTypeId, setFundTypeId] = useState(defaultFundTypeId ?? '')
  const [entryType, setEntryType] = useState<FundEntryType>('contribution')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sourceDescription, setSourceDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fundTypeId) {
      setError('Please select a fund type')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      await createFundEntry({
        fund_type_id: fundTypeId,
        entry_type: entryType,
        amount: parseFloat(amount),
        currency,
        date,
        source_description: sourceDescription,
        notes,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry')
    } finally {
      setLoading(false)
    }
  }

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

      <Select
        label="Entry Type"
        options={FUND_ENTRY_TYPES.map((t) => ({
          value: t,
          label: entryTypeLabels[t],
        }))}
        value={entryType}
        onChange={(v) => setEntryType(v as FundEntryType)}
      />

      <CurrencyInput
        label="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        currency={currency}
        onCurrencyChange={setCurrency}
        placeholder="0.00"
      />

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Input
        label="Source / Description"
        value={sourceDescription}
        onChange={(e) => setSourceDescription(e.target.value)}
        placeholder="e.g. Employer match, Manual deposit"
      />

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
          Add Entry
        </Button>
      </div>
    </form>
  )
}
