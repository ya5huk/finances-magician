'use client'

import { Card, CardHeader } from '@/components/ui/card'
import type { Currency } from '@/lib/constants'
import { formatCurrency } from '@/lib/portfolio/calculations'

export interface ActivityItem {
  id: string
  type: 'payslip' | 'expense' | 'trade' | 'fund'
  description: string
  amount: number
  currency: string
  date: string
}

const TYPE_ICONS: Record<ActivityItem['type'], string> = {
  payslip: 'W',
  expense: 'E',
  trade: 'T',
  fund: 'F',
}

const TYPE_COLORS: Record<ActivityItem['type'], string> = {
  payslip: 'bg-emerald-500/15 text-emerald-400',
  expense: 'bg-red-500/15 text-red-400',
  trade: 'bg-blue-500/15 text-blue-400',
  fund: 'bg-violet-500/15 text-violet-400',
}

const TYPE_LABELS: Record<ActivityItem['type'], string> = {
  payslip: 'Payslip',
  expense: 'Expense',
  trade: 'Trade',
  fund: 'Fund Entry',
}

interface RecentActivityProps {
  items: ActivityItem[]
  currency: Currency
}

export function RecentActivity({ items, currency }: RecentActivityProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <CardHeader title="Recent Activity" subtitle="Last 5 transactions" />

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No recent activity.
        </p>
      )}

      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const isIncome = item.type === 'payslip'
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors duration-150"
            >
              <span
                className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${TYPE_COLORS[item.type]}`}
              >
                {TYPE_ICONS[item.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {item.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[item.type]} &middot;{' '}
                  {new Date(item.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <span
                className={`text-sm font-medium shrink-0 ${
                  isIncome ? 'text-accent' : 'text-foreground'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(Math.abs(item.amount), item.currency || currency)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
