'use client'

import { useState, useCallback } from 'react'
import type { StockTrade, Dividend } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { listTrades, listDividends } from '@/lib/portfolio/queries'
import { useSupabase } from '@/providers/supabase-provider'
import HoldingsList from './holdings-list'
import TradeForm from './trade-form'
import TradeHistory from './trade-history'
import DividendList from './dividend-list'
import PortfolioChart from './portfolio-chart'

type Tab = 'holdings' | 'trades' | 'dividends'

interface PortfolioContentProps {
  initialTrades: StockTrade[]
  initialDividends: Dividend[]
}

export default function PortfolioContent({
  initialTrades,
  initialDividends,
}: PortfolioContentProps) {
  const [trades, setTrades] = useState<StockTrade[]>(initialTrades)
  const [dividends, setDividends] = useState<Dividend[]>(initialDividends)
  const [activeTab, setActiveTab] = useState<Tab>('holdings')
  const { user } = useSupabase()

  const refreshTrades = useCallback(async () => {
    if (!user) return
    try {
      const supabase = createClient()
      const data = await listTrades(supabase, user.id)
      setTrades(data)
    } catch (err) {
      console.error('Failed to refresh trades:', err)
    }
  }, [user])

  const refreshDividends = useCallback(async () => {
    if (!user) return
    try {
      const supabase = createClient()
      const data = await listDividends(supabase, user.id)
      setDividends(data)
    } catch (err) {
      console.error('Failed to refresh dividends:', err)
    }
  }, [user])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'holdings', label: 'Holdings' },
    { key: 'trades', label: 'Trades' },
    { key: 'dividends', label: 'Dividends' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your stock holdings, trades & dividends
          </p>
        </div>
        <TradeForm onTradeAdded={refreshTrades} />
      </div>

      {/* Chart */}
      <PortfolioChart trades={trades} />

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.key === 'trades' && trades.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                {trades.length}
              </span>
            )}
            {tab.key === 'dividends' && dividends.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                {dividends.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'holdings' && <HoldingsList trades={trades} />}
      {activeTab === 'trades' && (
        <TradeHistory trades={trades} onTradeDeleted={refreshTrades} />
      )}
      {activeTab === 'dividends' && (
        <DividendList
          dividends={dividends}
          onDividendChanged={refreshDividends}
        />
      )}
    </div>
  )
}
