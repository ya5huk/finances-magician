'use client'

import { Card, CardHeader } from '@/components/ui/card'
import type { Currency } from '@/lib/constants'
import type { PortfolioSummary } from '@/lib/portfolio/types'
import {
  formatCurrency,
  formatPercent,
} from '@/lib/portfolio/calculations'

interface InvestmentSummaryProps {
  portfolio: PortfolioSummary
  currency: Currency
}

export function InvestmentSummary({
  portfolio,
  currency,
}: InvestmentSummaryProps) {
  const totalReturn =
    portfolio.totalUnrealizedPL + portfolio.totalRealizedPL
  const totalReturnPercent =
    portfolio.totalCost > 0
      ? (totalReturn / portfolio.totalCost) * 100
      : 0
  const isPositive = totalReturn >= 0

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader
        title="Investment Summary"
        subtitle="Stocks overview"
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Total Invested</span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(portfolio.totalCost, currency)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Current Value</span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(portfolio.totalValue, currency)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <span className="text-sm text-muted-foreground">Total Return</span>
        <span
          className={`text-sm font-semibold ${
            isPositive ? 'text-accent' : 'text-destructive'
          }`}
        >
          {formatCurrency(totalReturn, currency)} (
          {formatPercent(totalReturnPercent)})
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Unrealized</span>
          <span
            className={`font-medium ${
              portfolio.totalUnrealizedPL >= 0
                ? 'text-accent'
                : 'text-destructive'
            }`}
          >
            {formatCurrency(portfolio.totalUnrealizedPL, currency)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Realized</span>
          <span
            className={`font-medium ${
              portfolio.totalRealizedPL >= 0
                ? 'text-accent'
                : 'text-destructive'
            }`}
          >
            {formatCurrency(portfolio.totalRealizedPL, currency)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Dividends</span>
          <span className="font-medium text-accent">
            {formatCurrency(portfolio.totalDividendIncome, currency)}
          </span>
        </div>
      </div>
    </Card>
  )
}
