'use client'

import { Card } from '@/components/ui/card'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import type { NetWorthResult } from '@/lib/dashboard/net-worth'
import { formatCurrency } from '@/lib/portfolio/calculations'

interface NetWorthCardProps {
  data: NetWorthResult
  currency: Currency
}

const SEGMENT_COLORS: Record<string, string> = {
  cash: 'bg-blue-500',
  stocks: 'bg-emerald-500',
  funds: 'bg-violet-500',
  deposits: 'bg-amber-500',
  assets: 'bg-cyan-500',
  debt: 'bg-destructive',
}

const SEGMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  stocks: 'Stocks',
  funds: 'Funds',
  deposits: 'Deposits',
  assets: 'Assets',
  debt: 'Debt',
}

export function NetWorthCard({ data, currency }: NetWorthCardProps) {
  const { total, breakdown } = data

  // Compute the total positive value for bar proportions (debt shown separately)
  const positiveTotal =
    breakdown.cash +
    breakdown.stocks +
    breakdown.funds +
    breakdown.deposits +
    breakdown.assets

  const segments = (
    ['cash', 'stocks', 'funds', 'deposits', 'assets'] as const
  )
    .map((key) => ({
      key,
      value: breakdown[key],
      percent: positiveTotal > 0 ? (breakdown[key] / positiveTotal) * 100 : 0,
      color: SEGMENT_COLORS[key],
      label: SEGMENT_LABELS[key],
    }))
    .filter((s) => s.value > 0)

  return (
    <Card padding="lg" className="col-span-full">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
        <p className="text-3xl font-bold text-foreground tracking-tight">
          {formatCurrency(total, currency)}
        </p>
      </div>

      {/* Breakdown bar */}
      {positiveTotal > 0 && (
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {segments.map((seg) => (
            <div
              key={seg.key}
              className={`${seg.color} transition-all duration-500`}
              style={{ width: `${seg.percent}%` }}
              title={`${seg.label}: ${formatCurrency(seg.value, currency)}`}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${seg.color}`}
            />
            <span className="text-xs text-muted-foreground">
              {seg.label}
            </span>
            <span className="text-xs font-medium text-foreground">
              {formatCurrency(seg.value, currency)}
            </span>
          </div>
        ))}
        {breakdown.debt > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Debt</span>
            <span className="text-xs font-medium text-destructive">
              -{formatCurrency(breakdown.debt, currency)}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
