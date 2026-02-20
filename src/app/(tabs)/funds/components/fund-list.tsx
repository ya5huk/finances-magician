'use client'

import { useState } from 'react'
import type { FundType, FundEntry } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import {
  calculateTotalContributions,
  getLatestSnapshotValue,
  calculateGainLoss,
  groupEntriesByFund,
} from '@/lib/funds/calculations'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FundForm } from './fund-form'

interface FundListProps {
  fundTypes: FundType[]
  entries: FundEntry[]
  onEntryCreated: () => void
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const categoryLabels: Record<string, string> = {
  pension: 'Pension',
  education_fund: 'Education Fund',
  deposit: 'Deposit',
  custom: 'Custom',
}

export function FundList({ fundTypes, entries, onEntryCreated }: FundListProps) {
  const [showForm, setShowForm] = useState(false)
  const [selectedFundTypeId, setSelectedFundTypeId] = useState<string | null>(null)

  const entriesByFund = groupEntriesByFund(entries)

  // Group fund types by category
  const fundsByCategory = fundTypes.reduce(
    (groups, ft) => {
      if (!groups[ft.category]) groups[ft.category] = []
      groups[ft.category].push(ft)
      return groups
    },
    {} as Record<string, FundType[]>,
  )

  const handleAddEntry = (fundTypeId: string) => {
    setSelectedFundTypeId(fundTypeId)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedFundTypeId(null)
  }

  const handleFormSuccess = () => {
    handleFormClose()
    onEntryCreated()
  }

  if (fundTypes.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No fund types configured. Go to Fund Settings to create one.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(fundsByCategory).map(([category, types]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {categoryLabels[category] ?? category}
          </h3>
          <div className="space-y-2">
            {types.map((fundType) => {
              const fundEntries = entriesByFund[fundType.id] ?? []
              const totalContributed = calculateTotalContributions(fundEntries)
              const latestValue = getLatestSnapshotValue(fundEntries)
              const gainLoss = calculateGainLoss(fundEntries)
              // Use the most common currency in entries, or ILS as default
              const currency = fundEntries.length > 0 ? fundEntries[0].currency : 'ILS'

              return (
                <Card key={fundType.id} padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {fundType.name}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {categoryLabels[fundType.category] ?? fundType.category}
                        </span>
                        {!fundType.is_active && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5">
                        <div>
                          <span className="text-xs text-muted-foreground">Contributed: </span>
                          <span className="text-xs font-medium text-foreground">
                            {formatCurrency(totalContributed, currency)}
                          </span>
                        </div>
                        {latestValue !== null && (
                          <div>
                            <span className="text-xs text-muted-foreground">Current: </span>
                            <span className="text-xs font-medium text-foreground">
                              {formatCurrency(latestValue, currency)}
                            </span>
                          </div>
                        )}
                        {gainLoss !== null && (
                          <div>
                            <span className="text-xs text-muted-foreground">Gain/Loss: </span>
                            <span
                              className={`text-xs font-medium ${
                                gainLoss >= 0 ? 'text-accent' : 'text-destructive'
                              }`}
                            >
                              {gainLoss >= 0 ? '+' : ''}
                              {formatCurrency(gainLoss, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddEntry(fundType.id)}
                    >
                      + Add Entry
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4">
            <Card padding="lg">
              <CardHeader
                title="Add Fund Entry"
                action={
                  <button
                    onClick={handleFormClose}
                    className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                }
              />
              <div className="mt-4">
                <FundForm
                  fundTypes={fundTypes}
                  defaultFundTypeId={selectedFundTypeId ?? undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormClose}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
