import { NextRequest, NextResponse } from 'next/server'
import { fetchStockPrices } from '@/lib/portfolio/yahoo'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tickersParam = searchParams.get('tickers')

  if (!tickersParam) {
    return NextResponse.json(
      { error: 'Missing tickers query parameter' },
      { status: 400 }
    )
  }

  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  if (tickers.length === 0) {
    return NextResponse.json(
      { error: 'No valid tickers provided' },
      { status: 400 }
    )
  }

  if (tickers.length > 50) {
    return NextResponse.json(
      { error: 'Maximum 50 tickers per request' },
      { status: 400 }
    )
  }

  try {
    const prices = await fetchStockPrices(tickers)

    // Convert Map to plain object for JSON serialization
    const result: Record<string, unknown> = {}
    for (const [ticker, data] of prices) {
      result[ticker] = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch stock prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock prices' },
      { status: 500 }
    )
  }
}
