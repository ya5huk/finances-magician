'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Payslip } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'

interface IncomeChartProps {
  payslips: Payslip[]
}

type ViewMode = 'monthly' | 'yearly'

export function IncomeChart({ payslips }: IncomeChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')

  const years = useMemo(() => {
    const set = new Set(payslips.map((p) => new Date(p.date + 'T00:00:00').getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [payslips])

  const [selectedYear, setSelectedYear] = useState<number>(years[0] ?? new Date().getFullYear())

  const chartData = useMemo(() => {
    if (viewMode === 'monthly') {
      const months = Array.from({ length: 12 }, (_, i) => {
        const monthStr = String(i + 1).padStart(2, '0')
        const label = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })
        return { month: label, gross: 0, net: 0, tax: 0 }
      })

      payslips.forEach((p) => {
        const d = new Date(p.date + 'T00:00:00')
        if (d.getFullYear() === selectedYear) {
          const idx = d.getMonth()
          months[idx].gross += p.gross_salary
          months[idx].net += p.net_salary
          months[idx].tax += p.tax
        }
      })

      return months
    } else {
      const yearMap = new Map<number, { gross: number; net: number; tax: number }>()
      payslips.forEach((p) => {
        const y = new Date(p.date + 'T00:00:00').getFullYear()
        const existing = yearMap.get(y) || { gross: 0, net: 0, tax: 0 }
        existing.gross += p.gross_salary
        existing.net += p.net_salary
        existing.tax += p.tax
        yearMap.set(y, existing)
      })
      return Array.from(yearMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, vals]) => ({ month: String(year), ...vals }))
    }
  }, [payslips, viewMode, selectedYear])

  // Determine dominant currency
  const dominantCurrency = useMemo(() => {
    const freq = new Map<string, number>()
    payslips.forEach((p) => freq.set(p.currency, (freq.get(p.currency) || 0) + 1))
    let max = 0
    let curr = 'ILS'
    freq.forEach((count, c) => {
      if (count > max) {
        max = count
        curr = c
      }
    })
    return curr
  }, [payslips])

  const symbol = CURRENCY_SYMBOLS[dominantCurrency as Currency] ?? dominantCurrency

  if (payslips.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Income Overview</h3>
        <div className="flex items-center gap-2">
          {viewMode === 'monthly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
                fontSize: '12px',
              }}
              formatter={(value: number | undefined) =>
                `${symbol}${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              }
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }}
            />
            <Bar dataKey="gross" name="Gross" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" name="Net" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="tax" name="Tax" fill="var(--destructive)" radius={[4, 4, 0, 0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
