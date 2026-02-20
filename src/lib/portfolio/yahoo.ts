import type { PriceData } from './types'

interface YahooChartResult {
  meta: {
    currency: string
    symbol: string
    shortName?: string
    longName?: string
    regularMarketPrice: number
    previousClose: number
    chartPreviousClose: number
  }
  indicators: {
    quote: Array<{
      close: (number | null)[]
    }>
  }
  timestamp: number[]
}

interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null
    error: { code: string; description: string } | null
  }
}

/**
 * Fetch live stock prices from Yahoo Finance v8 chart endpoint.
 * No API key required - this is a public endpoint.
 */
export async function fetchStockPrices(
  tickers: string[]
): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>()

  if (tickers.length === 0) return results

  // Fetch prices in parallel, but limit concurrency
  const batchSize = 5
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize)
    const promises = batch.map((ticker) => fetchSinglePrice(ticker))
    const batchResults = await Promise.allSettled(promises)

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        results.set(batch[idx], result.value)
      }
    })
  }

  return results
}

async function fetchSinglePrice(ticker: string): Promise<PriceData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      console.error(`Yahoo Finance error for ${ticker}: ${response.status}`)
      return null
    }

    const data: YahooChartResponse = await response.json()

    if (data.chart.error || !data.chart.result || data.chart.result.length === 0) {
      console.error(`No data for ${ticker}`)
      return null
    }

    const meta = data.chart.result[0].meta
    const currentPrice = meta.regularMarketPrice
    const previousClose = meta.chartPreviousClose || meta.previousClose
    const change = currentPrice - previousClose
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0

    return {
      price: currentPrice,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      currency: meta.currency || 'USD',
      name: meta.longName || meta.shortName || ticker,
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch historical prices for a ticker over a time range.
 * Used for portfolio chart.
 */
export async function fetchHistoricalPrices(
  ticker: string,
  range: '1mo' | '3mo' | '6mo' | '1y' | '5y' | 'max' = '1y'
): Promise<{ date: string; close: number }[]> {
  try {
    const interval = range === '1mo' || range === '3mo' ? '1d' : '1wk'
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) return []

    const data: YahooChartResponse = await response.json()

    if (!data.chart.result || data.chart.result.length === 0) return []

    const result = data.chart.result[0]
    const timestamps = result.timestamp || []
    const closes = result.indicators.quote[0]?.close || []

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i] ?? 0,
      }))
      .filter((p) => p.close > 0)
  } catch (error) {
    console.error(`Failed to fetch historical prices for ${ticker}:`, error)
    return []
  }
}
