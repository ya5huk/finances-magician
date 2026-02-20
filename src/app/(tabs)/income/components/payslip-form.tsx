'use client'

import { useState } from 'react'
import type { Payslip } from '@/lib/types/database'
import type { PayslipFormData } from '@/lib/income/types'
import type { ParsedPayslip } from '@/lib/ai/types'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { createPayslip, updatePayslip } from '@/lib/income/queries'
import { Button } from '@/components/ui/button'

interface PayslipFormProps {
  userId: string
  payslip: Payslip | null
  onClose: () => void
  onSaved: (payslip: Payslip) => void
}

const INITIAL_FORM: PayslipFormData = {
  date: new Date().toISOString().slice(0, 10),
  gross_salary: 0,
  net_salary: 0,
  tax: 0,
  bituach_leumi: 0,
  health_tax: 0,
  pension_employee: 0,
  pension_employer: 0,
  hishtalmut_employee: 0,
  hishtalmut_employer: 0,
  overtime: 0,
  bonus: 0,
  vacation_days_balance: 0,
  sick_days_balance: 0,
  currency: DEFAULT_CURRENCY,
  source_file_url: null,
  notes: null,
}

function payslipToForm(p: Payslip): PayslipFormData {
  return {
    date: p.date,
    gross_salary: p.gross_salary,
    net_salary: p.net_salary,
    tax: p.tax,
    bituach_leumi: p.bituach_leumi,
    health_tax: p.health_tax,
    pension_employee: p.pension_employee,
    pension_employer: p.pension_employer,
    hishtalmut_employee: p.hishtalmut_employee,
    hishtalmut_employer: p.hishtalmut_employer,
    overtime: p.overtime,
    bonus: p.bonus,
    vacation_days_balance: p.vacation_days_balance,
    sick_days_balance: p.sick_days_balance,
    currency: p.currency,
    source_file_url: p.source_file_url,
    notes: p.notes,
  }
}

export function PayslipForm({ userId, payslip, onClose, onSaved }: PayslipFormProps) {
  const [form, setForm] = useState<PayslipFormData>(
    payslip ? payslipToForm(payslip) : INITIAL_FORM
  )
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const isEditing = !!payslip

  const handleChange = (field: keyof PayslipFormData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleNumberChange = (field: keyof PayslipFormData, raw: string) => {
    const num = parseFloat(raw)
    handleChange(field, isNaN(num) ? 0 : num)
  }

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Step 1: Upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', 'payslip')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const errData = await uploadRes.json()
        throw new Error(errData.error || 'Upload failed')
      }

      const uploadData = await uploadRes.json()
      setUploading(false)
      setParsing(true)

      // Step 2: Parse
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: uploadData.id }),
      })

      if (!parseRes.ok) {
        const errData = await parseRes.json()
        throw new Error(errData.error || 'Parse failed')
      }

      const parseData = await parseRes.json()
      const parsed = parseData.data as ParsedPayslip

      // Pre-fill form with parsed data
      setForm((prev) => ({
        ...prev,
        date: parsed.date || prev.date,
        gross_salary: parsed.gross_salary || prev.gross_salary,
        net_salary: parsed.net_salary || prev.net_salary,
        tax: parsed.tax || prev.tax,
        bituach_leumi: parsed.bituach_leumi || prev.bituach_leumi,
        health_tax: parsed.health_tax || prev.health_tax,
        pension_employee: parsed.pension_employee || prev.pension_employee,
        pension_employer: parsed.pension_employer || prev.pension_employer,
        hishtalmut_employee: parsed.hishtalmut_employee || prev.hishtalmut_employee,
        hishtalmut_employer: parsed.hishtalmut_employer || prev.hishtalmut_employer,
        overtime: parsed.overtime || prev.overtime,
        bonus: parsed.bonus || prev.bonus,
        vacation_days_balance: parsed.vacation_days_balance || prev.vacation_days_balance,
        sick_days_balance: parsed.sick_days_balance || prev.sick_days_balance,
        currency: parsed.currency || prev.currency,
        source_file_url: uploadData.file_url,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF')
    } finally {
      setUploading(false)
      setParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let saved: Payslip
      if (isEditing) {
        saved = await updatePayslip(supabase, payslip.id, userId, form)
      } else {
        saved = await createPayslip(supabase, userId, form)
      }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payslip')
    } finally {
      setSaving(false)
    }
  }

  const numericFields: { key: keyof PayslipFormData; label: string; section: string }[] = [
    { key: 'gross_salary', label: 'Gross Salary', section: 'Income' },
    { key: 'net_salary', label: 'Net Salary', section: 'Income' },
    { key: 'overtime', label: 'Overtime', section: 'Income' },
    { key: 'bonus', label: 'Bonus', section: 'Income' },
    { key: 'tax', label: 'Tax', section: 'Deductions' },
    { key: 'bituach_leumi', label: 'Bituach Leumi', section: 'Deductions' },
    { key: 'health_tax', label: 'Health Tax', section: 'Deductions' },
    { key: 'pension_employee', label: 'Pension (Employee)', section: 'Deductions' },
    { key: 'pension_employer', label: 'Pension (Employer)', section: 'Deductions' },
    { key: 'hishtalmut_employee', label: 'Hishtalmut (Employee)', section: 'Deductions' },
    { key: 'hishtalmut_employer', label: 'Hishtalmut (Employer)', section: 'Deductions' },
    { key: 'vacation_days_balance', label: 'Vacation Days Balance', section: 'Balances' },
    { key: 'sick_days_balance', label: 'Sick Days Balance', section: 'Balances' },
  ]

  const sections = ['Income', 'Deductions', 'Balances'] as const

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 pt-8 pb-8">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Payslip' : 'Add Payslip'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Upload PDF */}
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleUploadPdf}
                disabled={uploading || parsing}
              />
              <div className="flex flex-col items-center gap-2">
                <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="m9 15 3-3 3 3" />
                </svg>
                {uploading ? (
                  <p className="text-sm text-muted-foreground">Uploading PDF...</p>
                ) : parsing ? (
                  <p className="text-sm text-primary">AI is parsing your payslip...</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">Upload PDF</span> to auto-fill fields
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Date & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Numeric Fields by Section */}
          {sections.map((section) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {numericFields
                  .filter((f) => f.section === section)
                  .map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form[field.key] as number}
                        onChange={(e) => handleNumberChange(field.key, e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => handleChange('notes', e.target.value || null)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Optional notes..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEditing ? 'Update' : 'Save'} Payslip
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
