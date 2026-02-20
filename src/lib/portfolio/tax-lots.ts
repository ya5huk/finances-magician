import type { StockTrade } from '@/lib/types/database'
import type { TaxLot, RealizedGain, TaxLotResult } from './types'

/**
 * Calculate FIFO tax lots for a given ticker's trades.
 * Buys create lots; sells consume lots in FIFO (oldest first) order.
 */
export function calculateTaxLots(trades: StockTrade[]): TaxLotResult {
  // Sort trades by date, then buys before sells on same date
  const sorted = [...trades].sort((a, b) => {
    const dateCompare = a.trade_date.localeCompare(b.trade_date)
    if (dateCompare !== 0) return dateCompare
    // Buys before sells on the same date
    if (a.trade_type === 'buy' && b.trade_type === 'sell') return -1
    if (a.trade_type === 'sell' && b.trade_type === 'buy') return 1
    return 0
  })

  const openLots: TaxLot[] = []
  const realizedGains: RealizedGain[] = []

  for (const trade of sorted) {
    if (trade.trade_type === 'buy') {
      openLots.push({
        tradeId: trade.id,
        ticker: trade.ticker,
        buyDate: trade.trade_date,
        quantity: trade.quantity,
        remainingQuantity: trade.quantity,
        costBasis: trade.price_per_share,
        totalCost: trade.quantity * trade.price_per_share + trade.fees,
      })
    } else {
      // Sell: consume lots FIFO
      let remainingToSell = trade.quantity

      for (const lot of openLots) {
        if (remainingToSell <= 0) break
        if (lot.remainingQuantity <= 0) continue

        const quantitySold = Math.min(lot.remainingQuantity, remainingToSell)
        const costBasisForSold = quantitySold * lot.costBasis
        const saleProceedsForSold = quantitySold * trade.price_per_share
        // Proportional fees: sell fees distributed across lots being consumed
        const proportionalSellFees = (quantitySold / trade.quantity) * trade.fees
        const proportionalBuyFees = (quantitySold / lot.quantity) * (lot.totalCost - lot.quantity * lot.costBasis)

        realizedGains.push({
          ticker: trade.ticker,
          buyDate: lot.buyDate,
          sellDate: trade.trade_date,
          quantity: quantitySold,
          costBasis: lot.costBasis,
          salePrice: trade.price_per_share,
          realizedPL:
            saleProceedsForSold -
            costBasisForSold -
            proportionalSellFees -
            proportionalBuyFees,
        })

        lot.remainingQuantity -= quantitySold
        remainingToSell -= quantitySold
      }

      if (remainingToSell > 0) {
        console.warn(
          `Oversold ${trade.ticker}: ${remainingToSell} shares could not be matched to buy lots`
        )
      }
    }
  }

  const totalRealizedPL = realizedGains.reduce(
    (sum, g) => sum + g.realizedPL,
    0
  )

  return {
    openLots: openLots.filter((lot) => lot.remainingQuantity > 0),
    realizedGains,
    totalRealizedPL,
  }
}

/**
 * Calculate tax lots for multiple tickers at once.
 */
export function calculateAllTaxLots(
  trades: StockTrade[]
): Map<string, TaxLotResult> {
  const byTicker = new Map<string, StockTrade[]>()

  for (const trade of trades) {
    const existing = byTicker.get(trade.ticker) || []
    existing.push(trade)
    byTicker.set(trade.ticker, existing)
  }

  const results = new Map<string, TaxLotResult>()
  for (const [ticker, tickerTrades] of byTicker) {
    results.set(ticker, calculateTaxLots(tickerTrades))
  }

  return results
}
