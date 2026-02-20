'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { AssetValueHistory } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { listAssetValueHistory } from '@/lib/assets/queries'

interface ValueHistoryChartProps {
  assetId: string
  currency: string
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function ValueHistoryChart({ assetId, currency }: ValueHistoryChartProps) {
  const [history, setHistory] = useState<AssetValueHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await listAssetValueHistory(assetId)
        setHistory(data)
      } catch (err) {
        console.error('Failed to load value history:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assetId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No value history yet. Add a snapshot to start tracking.
      </p>
    )
  }

  if (history.length === 1) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Only one data point recorded ({formatCurrency(history[0].value, currency)} on{' '}
        {new Date(history[0].date).toLocaleDateString()}). Add more snapshots to see a chart.
      </p>
    )
  }

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    }),
    value: h.value,
  }))

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
            stroke="currentColor"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
            stroke="currentColor"
            tickFormatter={(val: number) => formatCurrency(val, currency)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(val: number | undefined) => [formatCurrency(val ?? 0, currency), 'Value']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
