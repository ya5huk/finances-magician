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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { ExpenseCategory } from '@/lib/types/database'
import type { ExpenseWithCategory } from '@/lib/expenses/types'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'

interface ExpenseChartProps {
  expenses: ExpenseWithCategory[]
  categories: ExpenseCategory[]
}

type ViewMode = 'monthly' | 'yearly'
type ChartType = 'bar' | 'pie'

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48',
]

export function ExpenseChart({ expenses, categories }: ExpenseChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [chartType, setChartType] = useState<ChartType>('bar')

  const years = useMemo(() => {
    const set = new Set(expenses.map((e) => new Date(e.date + 'T00:00:00').getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [expenses])

  const [selectedYear, setSelectedYear] = useState<number>(years[0] ?? new Date().getFullYear())

  const dominantCurrency = useMemo(() => {
    const freq = new Map<string, number>()
    expenses.forEach((e) => freq.set(e.currency, (freq.get(e.currency) || 0) + 1))
    let max = 0
    let curr = 'ILS'
    freq.forEach((count, c) => {
      if (count > max) {
        max = count
        curr = c
      }
    })
    return curr
  }, [expenses])

  const symbol = CURRENCY_SYMBOLS[dominantCurrency as Currency] ?? dominantCurrency

  // Bar chart data: monthly totals
  const barData = useMemo(() => {
    if (viewMode === 'monthly') {
      const months = Array.from({ length: 12 }, (_, i) => {
        const label = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })
        return { month: label, total: 0 }
      })

      expenses.forEach((e) => {
        const d = new Date(e.date + 'T00:00:00')
        if (d.getFullYear() === selectedYear) {
          months[d.getMonth()].total += e.amount
        }
      })

      return months
    } else {
      const yearMap = new Map<number, number>()
      expenses.forEach((e) => {
        const y = new Date(e.date + 'T00:00:00').getFullYear()
        yearMap.set(y, (yearMap.get(y) || 0) + e.amount)
      })
      return Array.from(yearMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, total]) => ({ month: String(year), total }))
    }
  }, [expenses, viewMode, selectedYear])

  // Pie chart data: spending by category
  const pieData = useMemo(() => {
    const catMap = new Map<string, number>()
    const relevantExpenses = viewMode === 'monthly'
      ? expenses.filter((e) => new Date(e.date + 'T00:00:00').getFullYear() === selectedYear)
      : expenses

    relevantExpenses.forEach((e) => {
      const catName = e.expense_categories?.name ?? 'Uncategorized'
      catMap.set(catName, (catMap.get(catName) || 0) + e.amount)
    })

    return Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, viewMode, selectedYear])

  if (expenses.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground">Spending Overview</h3>
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
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                chartType === 'pie'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Categories
            </button>
          </div>
        </div>
      </div>

      <div className="h-64">
        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
              <Bar dataKey="total" name="Spending" fill="var(--destructive)" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
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
                wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
