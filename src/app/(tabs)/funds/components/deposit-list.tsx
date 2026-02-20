'use client'

import { useState } from 'react'
import type { Deposit, FundType } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DepositForm } from './deposit-form'
import { deleteDeposit } from '@/lib/funds/queries'

interface DepositListProps {
  deposits: Deposit[]
  fundTypes: FundType[]
  onDataChanged: () => void
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getMaturityProgress(startDate: string, maturityDate: string): number {
  const start = new Date(startDate).getTime()
  const maturity = new Date(maturityDate).getTime()
  const now = Date.now()

  if (now >= maturity) return 100
  if (now <= start) return 0

  return Math.round(((now - start) / (maturity - start)) * 100)
}

function getDaysUntilMaturity(maturityDate: string): number {
  const now = Date.now()
  const maturity = new Date(maturityDate).getTime()
  return Math.ceil((maturity - now) / (1000 * 60 * 60 * 24))
}

export function DepositList({ deposits, fundTypes, onDataChanged }: DepositListProps) {
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fundTypeMap = Object.fromEntries(fundTypes.map((ft) => [ft.id, ft]))

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deposit?')) return
    setDeleting(id)
    try {
      await deleteDeposit(id)
      onDataChanged()
    } catch {
      alert('Failed to delete deposit')
    } finally {
      setDeleting(null)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    onDataChanged()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Deposits</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          + Add Deposit
        </Button>
      </div>

      {deposits.length === 0 ? (
        <Card>
          <p className="text-center py-6 text-sm text-muted-foreground">
            No deposits yet. Add your first deposit to track its maturity.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {deposits.map((deposit) => {
            const progress = getMaturityProgress(deposit.start_date, deposit.maturity_date)
            const daysLeft = getDaysUntilMaturity(deposit.maturity_date)
            const isMaturingSoon = daysLeft > 0 && daysLeft <= 30
            const isMatured = daysLeft <= 0
            const fundType = fundTypeMap[deposit.fund_type_id]

            return (
              <Card
                key={deposit.id}
                padding="md"
                className={isMaturingSoon ? 'border-yellow-500/50' : isMatured ? 'border-accent/50' : ''}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {deposit.bank}
                      </p>
                      {fundType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {fundType.name}
                        </span>
                      )}
                      {isMaturingSoon && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium">
                          Maturing Soon
                        </span>
                      )}
                      {isMatured && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                          Matured
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                      <div>
                        <span className="text-xs text-muted-foreground">Principal: </span>
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(deposit.principal, deposit.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Rate: </span>
                        <span className="text-xs font-medium text-foreground">
                          {deposit.interest_rate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Projected: </span>
                        <span className="text-xs font-medium text-accent">
                          {formatCurrency(deposit.projected_value, deposit.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(deposit.start_date).toLocaleDateString()} - {new Date(deposit.maturity_date).toLocaleDateString()}
                      </span>
                      {!isMatured && (
                        <span className="text-xs text-muted-foreground">
                          {daysLeft} days left
                        </span>
                      )}
                    </div>

                    {/* Maturity timeline bar */}
                    <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isMatured
                            ? 'bg-accent'
                            : isMaturingSoon
                              ? 'bg-yellow-500'
                              : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(deposit.id)}
                    loading={deleting === deposit.id}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4">
            <Card padding="lg">
              <CardHeader
                title="Add Deposit"
                action={
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                }
              />
              <div className="mt-4">
                <DepositForm
                  fundTypes={fundTypes}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
