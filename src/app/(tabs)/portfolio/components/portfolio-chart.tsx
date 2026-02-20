'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { StockTrade } from '@/lib/types/database'
import type { ChartDataPoint } from '@/lib/portfolio/types'

interface PortfolioChartProps {
  trades: StockTrade[]
}

type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL'

export default function PortfolioChart({ trades }: PortfolioChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [range, setRange] = useState<TimeRange>('1Y')
  const [loading, setLoading] = useState(true)

  const buildChartData = useCallback(async () => {
    const tickers = [...new Set(trades.map((t) => t.ticker))]
    if (tickers.length === 0) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // Get current prices for all tickers
      const response = await fetch(
        `/api/stocks/prices?tickers=${tickers.join(',')}`
      )
      const priceData = await response.json()

      // Build a simplified portfolio value timeline based on trades
      // Each trade date is a data point, current date is the last point
      const sortedTrades = [...trades].sort((a, b) =>
        a.trade_date.localeCompare(b.trade_date)
      )

      // Calculate cumulative holdings and invested amounts at each trade date
      const holdingsAtDate: Record<string, number> = {} // ticker -> shares
      const dataPoints: ChartDataPoint[] = []
      const seenDates = new Set<string>()

      for (const trade of sortedTrades) {
        const current = holdingsAtDate[trade.ticker] || 0
        if (trade.trade_type === 'buy') {
          holdingsAtDate[trade.ticker] = current + trade.quantity
        } else {
          holdingsAtDate[trade.ticker] = Math.max(0, current - trade.quantity)
        }

        if (!seenDates.has(trade.trade_date)) {
          seenDates.add(trade.trade_date)

          // Calculate portfolio cost basis at this point (approximation)
          let totalInvested = 0
          for (const ticker of Object.keys(holdingsAtDate)) {
            const shares = holdingsAtDate[ticker]
            if (shares <= 0) continue
            // Use the average price of all buy trades up to this date
            const buyTrades = sortedTrades.filter(
              (t) =>
                t.ticker === ticker &&
                t.trade_type === 'buy' &&
                t.trade_date <= trade.trade_date
            )
            if (buyTrades.length > 0) {
              const avgPrice =
                buyTrades.reduce((sum, t) => sum + t.price_per_share, 0) /
                buyTrades.length
              totalInvested += shares * avgPrice
            }
          }

          dataPoints.push({
            date: trade.trade_date,
            value: Math.round(totalInvested * 100) / 100,
          })
        }
      }

      // Add current data point with live prices
      let currentValue = 0
      for (const [ticker, shares] of Object.entries(holdingsAtDate)) {
        if (shares <= 0) continue
        const price = priceData[ticker]?.price
        if (price) {
          currentValue += shares * price
        } else {
          // Fallback to last known trade price
          const lastBuy = sortedTrades
            .filter((t) => t.ticker === ticker && t.trade_type === 'buy')
            .pop()
          if (lastBuy) {
            currentValue += shares * lastBuy.price_per_share
          }
        }
      }

      const today = new Date().toISOString().split('T')[0]
      if (!seenDates.has(today)) {
        dataPoints.push({
          date: today,
          value: Math.round(currentValue * 100) / 100,
        })
      }

      // Filter by time range
      const now = new Date()
      let cutoff: Date
      switch (range) {
        case '1M':
          cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case '3M':
          cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          break
        case '6M':
          cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          break
        case 'YTD':
          cutoff = new Date(now.getFullYear(), 0, 1)
          break
        case '1Y':
          cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        case 'ALL':
        default:
          cutoff = new Date(2000, 0, 1)
          break
      }

      const cutoffStr = cutoff.toISOString().split('T')[0]
      const filtered = dataPoints.filter((p) => p.date >= cutoffStr)

      setData(filtered.length > 0 ? filtered : dataPoints)
    } catch (err) {
      console.error('Failed to build chart data:', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [trades, range])

  useEffect(() => {
    buildChartData()
  }, [buildChartData])

  const ranges: TimeRange[] = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL']

  if (trades.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Portfolio Value</h3>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                range === r
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading chart...
        </div>
      ) : data.length < 2 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Not enough data points to display a chart. Add more trades across different dates.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(val: string) => {
                const d = new Date(val)
                return d.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
              stroke="var(--border)"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(val: number) =>
                `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              }
              stroke="var(--border)"
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--foreground)',
              }}
              labelFormatter={(label) =>
                new Date(String(label)).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
              formatter={(value: number | undefined) => [
                `$${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                'Value',
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--primary)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
