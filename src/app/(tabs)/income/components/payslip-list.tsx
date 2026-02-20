'use client'

import { useState } from 'react'
import type { Payslip } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { deletePayslip } from '@/lib/income/queries'
import { Button } from '@/components/ui/button'
import { PayslipForm } from './payslip-form'

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

export function PayslipList({
  initialPayslips,
  userId,
}: {
  initialPayslips: Payslip[]
  userId: string
}) {
  const [payslips, setPayslips] = useState<Payslip[]>(initialPayslips)
  const [showForm, setShowForm] = useState(false)
  const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payslip?')) return
    setDeletingId(id)
    try {
      await deletePayslip(supabase, id, userId)
      setPayslips((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to delete payslip:', err)
      alert('Failed to delete payslip')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = (payslip: Payslip) => {
    setPayslips((prev) => {
      const exists = prev.find((p) => p.id === payslip.id)
      if (exists) {
        return prev
          .map((p) => (p.id === payslip.id ? payslip : p))
          .sort((a, b) => b.date.localeCompare(a.date))
      }
      return [payslip, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    })
    setShowForm(false)
    setEditingPayslip(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payslip history &amp; income tracking
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Payslip</Button>
      </div>

      {/* Payslip List */}
      {payslips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <svg
            className="h-12 w-12 text-muted-foreground mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
          <p className="text-muted-foreground mb-4">No payslips recorded yet</p>
          <Button onClick={() => setShowForm(true)} size="sm">
            Add your first payslip
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {payslips.map((payslip) => (
            <div
              key={payslip.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {formatDate(payslip.date)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      Gross: {formatCurrency(payslip.gross_salary, payslip.currency)}
                    </span>
                    {payslip.source_file_url && (
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        PDF
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(payslip.net_salary, payslip.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">Net</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingPayslip(payslip)
                      setShowForm(true)
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(payslip.id)}
                    disabled={deletingId === payslip.id}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PayslipForm
          userId={userId}
          payslip={editingPayslip}
          onClose={() => {
            setShowForm(false)
            setEditingPayslip(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
