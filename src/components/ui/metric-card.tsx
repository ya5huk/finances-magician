'use client'

import { type ReactNode, type HTMLAttributes } from 'react'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { Badge } from './badge'
import { Card } from './card'

export interface StandaloneMetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: number | string
  changePercent?: number
  icon?: ReactNode
  currency?: Currency
  formatValue?: (value: number | string) => string
}

function defaultFormat(value: number | string, currency?: Currency): string {
  if (typeof value === 'string') return value
  const symbol = currency ? CURRENCY_SYMBOLS[currency] : ''
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function StandaloneMetricCard({
  label,
  value,
  changePercent,
  icon,
  currency,
  formatValue,
  className = '',
  ...props
}: StandaloneMetricCardProps) {
  const isPositive = changePercent !== undefined && changePercent >= 0
  const formattedValue = formatValue ? formatValue(value) : defaultFormat(value, currency)

  return (
    <Card className={`flex flex-col gap-3 ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="text-sm">{label}</span>
        </div>
        {currency && (
          <Badge variant="outline" size="sm">
            {CURRENCY_SYMBOLS[currency]} {currency}
          </Badge>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground tracking-tight">
          {formattedValue}
        </span>
        {changePercent !== undefined && (
          <span
            className={`
              inline-flex items-center gap-0.5 text-xs font-medium mb-1 px-1.5 py-0.5 rounded-md
              ${isPositive ? 'text-accent bg-accent/10' : 'text-destructive bg-destructive/10'}
            `}
          >
            <svg
              className={`h-3 w-3 ${isPositive ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
            {Math.abs(changePercent).toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  )
}
