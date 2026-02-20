import type { StockTrade, Dividend } from '@/lib/types/database'
import type { Holding, PriceData, PortfolioSummary } from './types'
import { calculateAllTaxLots } from './tax-lots'

/**
 * Calculate holdings from trades using FIFO tax lots.
 * Groups by ticker across all brokers, computes total shares,
 * average cost basis, and total invested per holding.
 */
export function calculateHoldings(
  trades: StockTrade[],
  prices: Map<string, PriceData>
): Holding[] {
  const taxLots = calculateAllTaxLots(trades)
  const holdings: Holding[] = []

  for (const [ticker, result] of taxLots) {
    const totalShares = result.openLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity,
      0
    )

    if (totalShares <= 0) continue

    const totalInvested = result.openLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity * lot.costBasis,
      0
    )

    const avgCost = totalShares > 0 ? totalInvested / totalShares : 0

    const priceData = prices.get(ticker)
    const currentPrice = priceData?.price ?? 0
    const currentValue = totalShares * currentPrice
    const unrealizedPL = currentValue - totalInvested
    const unrealizedPLPercent =
      totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0

    // Use the currency from the most recent trade, or from price data
    const tickerTrades = trades.filter((t) => t.ticker === ticker)
    const currency =
      priceData?.currency ||
      tickerTrades[tickerTrades.length - 1]?.currency ||
      'USD'

    holdings.push({
      ticker,
      shares: Math.round(totalShares * 10000) / 10000, // Round to avoid floating point
      avgCost: Math.round(avgCost * 100) / 100,
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentPrice,
      currentValue: Math.round(currentValue * 100) / 100,
      unrealizedPL: Math.round(unrealizedPL * 100) / 100,
      unrealizedPLPercent: Math.round(unrealizedPLPercent * 100) / 100,
      currency,
    })
  }

  return holdings.sort((a, b) => b.currentValue - a.currentValue)
}

/**
 * Calculate full portfolio summary including realized gains and dividends.
 */
export function calculatePortfolioSummary(
  trades: StockTrade[],
  dividends: Dividend[],
  prices: Map<string, PriceData>
): PortfolioSummary {
  const holdings = calculateHoldings(trades, prices)
  const taxLots = calculateAllTaxLots(trades)

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.totalInvested, 0)
  const totalUnrealizedPL = totalValue - totalCost
  const totalUnrealizedPLPercent =
    totalCost > 0 ? (totalUnrealizedPL / totalCost) * 100 : 0

  let totalRealizedPL = 0
  for (const [, result] of taxLots) {
    totalRealizedPL += result.totalRealizedPL
  }

  const totalDividendIncome = dividends.reduce((sum, d) => sum + d.amount, 0)

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalUnrealizedPL: Math.round(totalUnrealizedPL * 100) / 100,
    totalUnrealizedPLPercent:
      Math.round(totalUnrealizedPLPercent * 100) / 100,
    totalRealizedPL: Math.round(totalRealizedPL * 100) / 100,
    totalDividendIncome: Math.round(totalDividendIncome * 100) / 100,
    holdings,
  }
}

/**
 * Format a number as currency with the appropriate symbol.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number as a percentage.
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/**
 * Format a number with commas.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
