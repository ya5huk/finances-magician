'use client'

import { useState } from 'react'
import type { Loan } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { calculateTotalLoanBalance } from '@/lib/funds/calculations'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoanForm } from './loan-form'
import { deleteLoan } from '@/lib/funds/queries'

interface LoanListProps {
  loans: Loan[]
  onDataChanged: () => void
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function LoanList({ loans, onDataChanged }: LoanListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editLoan, setEditLoan] = useState<Loan | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const totalDebt = calculateTotalLoanBalance(loans)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return
    setDeleting(id)
    try {
      await deleteLoan(id)
      onDataChanged()
    } catch {
      alert('Failed to delete loan')
    } finally {
      setDeleting(null)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditLoan(null)
    onDataChanged()
  }

  const handleEdit = (loan: Loan) => {
    setEditLoan(loan)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Loans</h2>
          {loans.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Total debt: <span className="font-medium text-destructive">
                {formatCurrency(totalDebt, loans[0]?.currency ?? 'ILS')}
              </span>
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => { setEditLoan(null); setShowForm(true) }}>
          + Add Loan
        </Button>
      </div>

      {loans.length === 0 ? (
        <Card>
          <p className="text-center py-6 text-sm text-muted-foreground">
            No loans recorded. Add a loan to track your debt.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {loans.map((loan) => {
            const paidPercentage = loan.principal > 0
              ? Math.round(((loan.principal - loan.remaining_balance) / loan.principal) * 100)
              : 0

            return (
              <Card key={loan.id} padding="md">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{loan.name}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                      <div>
                        <span className="text-xs text-muted-foreground">Principal: </span>
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(loan.principal, loan.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Remaining: </span>
                        <span className="text-xs font-medium text-destructive">
                          {formatCurrency(loan.remaining_balance, loan.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Rate: </span>
                        <span className="text-xs font-medium text-foreground">
                          {loan.interest_rate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Monthly: </span>
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(loan.monthly_payment, loan.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Started: {new Date(loan.start_date).toLocaleDateString()}
                        {loan.end_date && ` - Ends: ${new Date(loan.end_date).toLocaleDateString()}`}
                      </span>
                    </div>

                    {/* Repayment progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${paidPercentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {paidPercentage}% paid
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(loan)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(loan.id)}
                      loading={deleting === loan.id}
                    >
                      Delete
                    </Button>
                  </div>
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
                title={editLoan ? 'Edit Loan' : 'Add Loan'}
                action={
                  <button
                    onClick={() => { setShowForm(false); setEditLoan(null) }}
                    className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                }
              />
              <div className="mt-4">
                <LoanForm
                  editLoan={editLoan ?? undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={() => { setShowForm(false); setEditLoan(null) }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
