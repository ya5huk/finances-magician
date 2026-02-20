'use client'

import { useState } from 'react'
import type { PhysicalAsset } from '@/lib/types/database'
import { DEFAULT_CURRENCY, type Currency } from '@/lib/constants'
import { createAsset } from '@/lib/assets/queries'
import { createAssetValueSnapshot } from '@/lib/assets/queries'
import { Input, CurrencyInput } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AssetFormProps {
  /** If provided, form is for adding a value snapshot to this asset. Otherwise, creates a new asset. */
  existingAsset?: PhysicalAsset
  onSuccess: () => void
  onCancel: () => void
}

export function AssetForm({ existingAsset, onSuccess, onCancel }: AssetFormProps) {
  const isSnapshot = !!existingAsset

  const [name, setName] = useState(existingAsset?.name ?? '')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState<Currency>(
    (existingAsset?.currency as Currency) ?? DEFAULT_CURRENCY,
  )
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isSnapshot && !name.trim()) {
      setError('Please enter an asset name')
      return
    }
    if (!value || parseFloat(value) <= 0) {
      setError('Please enter a valid value')
      return
    }

    setLoading(true)
    try {
      if (isSnapshot && existingAsset) {
        await createAssetValueSnapshot({
          asset_id: existingAsset.id,
          value: parseFloat(value),
          currency,
          date,
          notes,
        })
      } else {
        await createAsset({
          name: name.trim(),
          current_value: parseFloat(value),
          currency,
          notes,
        })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isSnapshot && (
        <Input
          label="Asset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Apartment, Car, Jewelry"
        />
      )}

      {isSnapshot && (
        <p className="text-sm text-muted-foreground">
          Adding value snapshot for <span className="font-medium text-foreground">{existingAsset.name}</span>
        </p>
      )}

      <CurrencyInput
        label={isSnapshot ? 'Current Value' : 'Value'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        currency={currency}
        onCurrencyChange={setCurrency}
        placeholder="0.00"
      />

      {isSnapshot && (
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
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
          {isSnapshot ? 'Add Snapshot' : 'Add Asset'}
        </Button>
      </div>
    </form>
  )
}
