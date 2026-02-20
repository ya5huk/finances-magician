import type { Currency } from '@/lib/constants'

export interface PriceData {
  price: number
  change: number
  changePercent: number
  currency: string
  name: string
}

export interface Holding {
  ticker: string
  shares: number
  avgCost: number
  totalInvested: number
  currentPrice: number
  currentValue: number
  unrealizedPL: number
  unrealizedPLPercent: number
  currency: string
}

export interface TaxLot {
  tradeId: string
  ticker: string
  buyDate: string
  quantity: number
  remainingQuantity: number
  costBasis: number // price per share
  totalCost: number
}

export interface RealizedGain {
  ticker: string
  buyDate: string
  sellDate: string
  quantity: number
  costBasis: number
  salePrice: number
  realizedPL: number
}

export interface TaxLotResult {
  openLots: TaxLot[]
  realizedGains: RealizedGain[]
  totalRealizedPL: number
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalUnrealizedPL: number
  totalUnrealizedPLPercent: number
  totalRealizedPL: number
  totalDividendIncome: number
  holdings: Holding[]
}

export interface TradeFormInput {
  ticker: string
  exchange: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price_per_share: number
  currency: Currency
  exchange_rate_at_trade: number
  fees: number
  broker: string
  trade_date: string
  notes: string
}

export interface DividendFormInput {
  ticker: string
  amount: number
  currency: Currency
  date: string
  notes: string
}

export interface ChartDataPoint {
  date: string
  value: number
}
