'use client'

import { useState } from 'react'
import type { StockTrade } from '@/lib/types/database'
import { formatCurrency } from '@/lib/portfolio/calculations'
import { createClient } from '@/lib/supabase/client'
import { deleteTrade } from '@/lib/portfolio/queries'
import { useSupabase } from '@/providers/supabase-provider'

interface TradeHistoryProps {
  trades: StockTrade[]
  onTradeDeleted: () => void
}

export default function TradeHistory({ trades, onTradeDeleted }: TradeHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { user } = useSupabase()

  async function handleDelete(tradeId: string) {
    if (!user) return
    if (!confirm('Are you sure you want to delete this trade?')) return

    setDeletingId(tradeId)
    try {
      const supabase = createClient()
      await deleteTrade(supabase, tradeId, user.id)
      onTradeDeleted()
    } catch (err) {
      console.error('Failed to delete trade:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const sorted = [...trades].sort(
    (a, b) => b.trade_date.localeCompare(a.trade_date)
  )

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No trades recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Ticker</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Fees</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Broker</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((trade) => {
              const total = trade.quantity * trade.price_per_share
              return (
                <tr
                  key={trade.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(trade.trade_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {trade.ticker}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                        trade.trade_type === 'buy'
                          ? 'bg-accent/15 text-accent'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {trade.trade_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {trade.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {formatCurrency(trade.price_per_share, trade.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    {formatCurrency(total, trade.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {trade.fees > 0 ? formatCurrency(trade.fees, trade.currency) : '--'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {trade.broker || '--'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(trade.id)}
                      disabled={deletingId === trade.id}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 cursor-pointer"
                      title="Delete trade"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
