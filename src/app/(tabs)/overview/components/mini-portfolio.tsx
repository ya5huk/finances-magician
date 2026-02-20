'use client'

import Link from 'next/link'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Currency } from '@/lib/constants'
import type { Holding } from '@/lib/portfolio/types'
import type { PriceData } from '@/lib/portfolio/types'
import {
  formatCurrency,
  formatPercent,
} from '@/lib/portfolio/calculations'

interface MiniPortfolioProps {
  holdings: Holding[]
  prices: Map<string, PriceData>
  currency: Currency
}

export function MiniPortfolio({
  holdings,
  prices,
  currency,
}: MiniPortfolioProps) {
  const top5 = holdings.slice(0, 5)

  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <CardHeader
        title="Top Holdings"
        action={
          <Link
            href="/portfolio"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        }
      />

      {top5.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No stock holdings yet.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {top5.map((h) => {
          const priceData = prices.get(h.ticker)
          const dailyChange = priceData?.changePercent ?? 0
          const isUp = dailyChange >= 0

          return (
            <div
              key={h.ticker}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-foreground">
                  {h.ticker}
                </span>
                <Badge
                  variant={isUp ? 'success' : 'destructive'}
                  size="sm"
                >
                  {formatPercent(dailyChange)}
                </Badge>
              </div>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(h.currentValue, h.currency || currency)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
