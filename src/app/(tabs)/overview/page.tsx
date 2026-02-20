'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_CURRENCY, type Currency } from '@/lib/constants'
import { calculateNetWorth, type NetWorthResult } from '@/lib/dashboard/net-worth'
import { calculateCashflow, type CashflowResult } from '@/lib/dashboard/cashflow'
import {
  calculatePortfolioSummary,
} from '@/lib/portfolio/calculations'
import {
  calculateTotalFundValue,
  calculateTotalDepositValue,
  calculateTotalLoanBalance,
} from '@/lib/funds/calculations'
import type { PriceData, PortfolioSummary } from '@/lib/portfolio/types'
import type {
  Payslip,
  Expense,
  StockTrade,
  FundEntry,
  Deposit,
  Loan,
  PhysicalAsset,
  Dividend,
  CashflowCorrection,
} from '@/lib/types/database'
import { Skeleton } from '@/components/ui/loading-skeleton'

import { NetWorthCard } from './components/net-worth-card'
import { CashBalanceCard } from './components/cash-balance-card'
import { InvestmentSummary } from './components/investment-summary'
import { MiniPortfolio } from './components/mini-portfolio'
import { RecentActivity, type ActivityItem } from './components/recent-activity'
import { QuickStats } from './components/quick-stats'

export default function OverviewPage() {
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY)

  // Data states
  const [netWorth, setNetWorth] = useState<NetWorthResult | null>(null)
  const [cashflow, setCashflowData] = useState<CashflowResult | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map())
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [activeDepositsCount, setActiveDepositsCount] = useState(0)
  const [activeDepositsTotal, setActiveDepositsTotal] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile for currency
      const { data: profile } = await supabase
        .from('profiles')
        .select('base_currency')
        .eq('id', user.id)
        .single()

      const baseCurrency = (profile?.base_currency as Currency) || DEFAULT_CURRENCY
      setCurrency(baseCurrency)

      // Fetch all data in parallel
      const [
        { data: payslips },
        { data: expenses },
        { data: trades },
        { data: fundEntries },
        { data: deposits },
        { data: loans },
        { data: assets },
        { data: dividends },
        { data: corrections },
      ] = await Promise.all([
        supabase
          .from('payslips')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('stock_trades')
          .select('*')
          .eq('user_id', user.id)
          .order('trade_date', { ascending: true }),
        supabase
          .from('fund_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('deposits')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('loans')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('physical_assets')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('dividends')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('cashflow_corrections')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1),
      ])

      const typedPayslips = (payslips || []) as Payslip[]
      const typedExpenses = (expenses || []) as Expense[]
      const typedTrades = (trades || []) as StockTrade[]
      const typedFundEntries = (fundEntries || []) as FundEntry[]
      const typedDeposits = (deposits || []) as Deposit[]
      const typedLoans = (loans || []) as Loan[]
      const typedAssets = (assets || []) as PhysicalAsset[]
      const typedDividends = (dividends || []) as Dividend[]
      const typedCorrections = (corrections || []) as CashflowCorrection[]

      // Fetch live stock prices
      const uniqueTickers = [
        ...new Set(typedTrades.map((t) => t.ticker)),
      ]
      let pricesMap = new Map<string, PriceData>()

      if (uniqueTickers.length > 0) {
        try {
          const res = await fetch(
            `/api/stocks/prices?tickers=${uniqueTickers.join(',')}`
          )
          if (res.ok) {
            const pricesJson = await res.json()
            pricesMap = new Map(
              Object.entries(pricesJson) as [string, PriceData][]
            )
          }
        } catch {
          // Prices unavailable, continue with empty map
        }
      }
      setPrices(pricesMap)

      // Calculate portfolio
      const portfolioSummary = calculatePortfolioSummary(
        typedTrades,
        typedDividends,
        pricesMap
      )
      setPortfolio(portfolioSummary)

      // Calculate fund values
      const fundValue = calculateTotalFundValue(typedFundEntries)
      const depositValue = calculateTotalDepositValue(typedDeposits)
      const loanBalance = calculateTotalLoanBalance(typedLoans)
      const assetValue = typedAssets.reduce(
        (sum, a) => sum + a.current_value,
        0
      )

      // Cashflow calculation
      const netSalaries = typedPayslips.reduce(
        (sum, p) => sum + p.net_salary,
        0
      )
      const expensesTotal = typedExpenses.reduce(
        (sum, e) => sum + e.amount,
        0
      )
      const fundContributionsTotal = typedFundEntries
        .filter((e) => e.entry_type === 'contribution')
        .reduce((sum, e) => sum + e.amount, 0)
      const stockBuyTotal = typedTrades
        .filter((t) => t.trade_type === 'buy')
        .reduce((sum, t) => sum + t.quantity * t.price_per_share + t.fees, 0)
      const stockSellTotal = typedTrades
        .filter((t) => t.trade_type === 'sell')
        .reduce((sum, t) => sum + t.quantity * t.price_per_share - t.fees, 0)
      const dividendTotal = typedDividends.reduce(
        (sum, d) => sum + d.amount,
        0
      )
      const latestCorrection =
        typedCorrections.length > 0
          ? typedCorrections[0].corrected_balance
          : null

      const cashflowResult = calculateCashflow({
        netSalaries,
        expensesTotal,
        fundContributionsTotal,
        stockBuyTotal,
        stockSellTotal,
        dividendTotal,
        latestCorrection,
      })
      setCashflowData(cashflowResult)

      // Calculate net worth
      const netWorthResult = calculateNetWorth({
        cashBalance: cashflowResult.balance,
        portfolioValue: portfolioSummary.totalValue,
        fundValue,
        depositValue,
        assetValue,
        loanBalance,
      })
      setNetWorth(netWorthResult)

      // Monthly stats (current month)
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const monthPayslips = typedPayslips.filter((p) => {
        const d = new Date(p.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      setMonthlyIncome(
        monthPayslips.reduce((sum, p) => sum + p.net_salary, 0)
      )

      const monthExpenses = typedExpenses.filter((e) => {
        const d = new Date(e.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      setMonthlyExpenses(
        monthExpenses.reduce((sum, e) => sum + e.amount, 0)
      )

      // Active deposits
      const today = new Date().toISOString().split('T')[0]
      const activeDeposits = typedDeposits.filter(
        (d) => d.maturity_date >= today
      )
      setActiveDepositsCount(activeDeposits.length)
      setActiveDepositsTotal(
        activeDeposits.reduce((sum, d) => sum + d.projected_value, 0)
      )

      // Recent activity (last 5 across all types)
      const allActivity: ActivityItem[] = [
        ...typedPayslips.slice(0, 10).map(
          (p): ActivityItem => ({
            id: p.id,
            type: 'payslip',
            description: `Salary - ${new Date(p.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
            amount: p.net_salary,
            currency: p.currency,
            date: p.date,
          })
        ),
        ...typedExpenses.slice(0, 10).map(
          (e): ActivityItem => ({
            id: e.id,
            type: 'expense',
            description: e.description,
            amount: e.amount,
            currency: e.currency,
            date: e.date,
          })
        ),
        ...typedTrades
          .slice(-10)
          .reverse()
          .map(
            (t): ActivityItem => ({
              id: t.id,
              type: 'trade',
              description: `${t.trade_type === 'buy' ? 'Buy' : 'Sell'} ${t.quantity} ${t.ticker}`,
              amount: t.quantity * t.price_per_share,
              currency: t.currency,
              date: t.trade_date,
            })
          ),
        ...typedFundEntries.slice(0, 10).map(
          (f): ActivityItem => ({
            id: f.id,
            type: 'fund',
            description: `${f.entry_type === 'contribution' ? 'Contribution' : f.entry_type === 'withdrawal' ? 'Withdrawal' : 'Snapshot'}`,
            amount: f.amount,
            currency: f.currency,
            date: f.date,
          })
        ),
      ]

      allActivity.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setRecentActivity(allActivity.slice(0, 5))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton variant="card" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    )
  }

  const portfolioReturnPercent =
    portfolio && portfolio.totalCost > 0
      ? ((portfolio.totalUnrealizedPL + portfolio.totalRealizedPL) /
          portfolio.totalCost) *
        100
      : 0

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your financial dashboard
        </p>
      </div>

      {/* Net Worth - full width */}
      {netWorth && <NetWorthCard data={netWorth} currency={currency} />}

      {/* Cash Balance + Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cashflow && (
          <CashBalanceCard
            data={cashflow}
            currency={currency}
            onCorrectionSubmitted={fetchData}
          />
        )}
        {portfolio && (
          <InvestmentSummary portfolio={portfolio} currency={currency} />
        )}
      </div>

      {/* Mini Portfolio + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolio && (
          <MiniPortfolio
            holdings={portfolio.holdings}
            prices={prices}
            currency={currency}
          />
        )}
        <RecentActivity items={recentActivity} currency={currency} />
      </div>

      {/* Quick Stats Grid */}
      <QuickStats
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        portfolioReturnPercent={
          Math.round(portfolioReturnPercent * 100) / 100
        }
        activeDepositsCount={activeDepositsCount}
        activeDepositsTotal={activeDepositsTotal}
        currency={currency}
      />
    </div>
  )
}
