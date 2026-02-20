'use client'

import { useEffect, useState, useCallback } from 'react'
import type { StockTrade } from '@/lib/types/database'
import type { Holding, PriceData } from '@/lib/portfolio/types'
import { calculateHoldings, formatCurrency, formatPercent } from '@/lib/portfolio/calculations'

type SortKey = 'value' | 'pl' | 'plPercent' | 'ticker'

interface HoldingsListProps {
  trades: StockTrade[]
}

export default function HoldingsList({ trades }: HoldingsListProps) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('value')
  const [sortAsc, setSortAsc] = useState(false)

  const fetchPrices = useCallback(async () => {
    const tickers = [...new Set(trades.map((t) => t.ticker))]
    if (tickers.length === 0) {
      setHoldings([])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `/api/stocks/prices?tickers=${tickers.join(',')}`
      )
      const data = await response.json()

      const priceMap = new Map<string, PriceData>()
      for (const [ticker, priceData] of Object.entries(data)) {
        if (priceData && typeof priceData === 'object' && 'price' in priceData) {
          priceMap.set(ticker, priceData as PriceData)
        }
      }

      const calculated = calculateHoldings(trades, priceMap)
      setHoldings(calculated)
    } catch (err) {
      console.error('Failed to fetch prices:', err)
      // Calculate holdings without prices
      const emptyPrices = new Map<string, PriceData>()
      setHoldings(calculateHoldings(trades, emptyPrices))
    } finally {
      setLoading(false)
    }
  }, [trades])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  const sortedHoldings = [...holdings].sort((a, b) => {
    const dir = sortAsc ? 1 : -1
    switch (sortKey) {
      case 'value':
        return (a.currentValue - b.currentValue) * dir
      case 'pl':
        return (a.unrealizedPL - b.unrealizedPL) * dir
      case 'plPercent':
        return (a.unrealizedPLPercent - b.unrealizedPLPercent) * dir
      case 'ticker':
        return a.ticker.localeCompare(b.ticker) * dir
      default:
        return 0
    }
  })

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function SortHeader({ label, sortKeyValue }: { label: string; sortKeyValue: SortKey }) {
    const isActive = sortKey === sortKeyValue
    return (
      <button
        onClick={() => handleSort(sortKeyValue)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {label}
        {isActive && (
          <svg
            className={`h-3 w-3 transition-transform ${sortAsc ? '' : 'rotate-180'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        )}
      </button>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading prices...
        </div>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No holdings yet. Add a trade to get started.</p>
      </div>
    )
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalInvested, 0)
  const totalPL = totalValue - totalCost
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(totalValue, 'USD')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(totalCost, 'USD')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Unrealized P&L</p>
          <p className={`text-lg font-bold ${totalPL >= 0 ? 'text-accent' : 'text-destructive'}`}>
            {formatCurrency(totalPL, 'USD')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Return</p>
          <p className={`text-lg font-bold ${totalPLPercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
            {formatPercent(totalPLPercent)}
          </p>
        </div>
      </div>

      {/* Holdings table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Ticker" sortKeyValue="ticker" />
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-muted-foreground">Price</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-muted-foreground">Shares</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-muted-foreground">Avg Cost</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader label="Value" sortKeyValue="value" />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader label="P&L" sortKeyValue="pl" />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader label="P&L %" sortKeyValue="plPercent" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding) => (
                <tr
                  key={holding.ticker}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{holding.ticker}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {holding.currentPrice > 0
                      ? formatCurrency(holding.currentPrice, holding.currency)
                      : '--'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {holding.shares}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {formatCurrency(holding.avgCost, holding.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    {holding.currentPrice > 0
                      ? formatCurrency(holding.currentValue, holding.currency)
                      : '--'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span
                      className={
                        holding.unrealizedPL >= 0
                          ? 'text-accent'
                          : 'text-destructive'
                      }
                    >
                      {holding.currentPrice > 0
                        ? formatCurrency(holding.unrealizedPL, holding.currency)
                        : '--'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                        holding.unrealizedPLPercent >= 0
                          ? 'bg-accent/15 text-accent'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {holding.currentPrice > 0
                        ? formatPercent(holding.unrealizedPLPercent)
                        : '--'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
