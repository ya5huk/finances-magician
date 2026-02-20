import { type Currency } from '@/lib/constants'
import type { ExchangeRateResponse, ConvertedAmount } from './types'

const API_BASE = '/api/exchange-rates'

/**
 * Fetch the current exchange rate between two currencies.
 * Calls the internal API route which handles caching in Supabase.
 */
export async function fetchCurrentRate(
  base: Currency,
  target: Currency,
): Promise<ExchangeRateResponse> {
  const params = new URLSearchParams({ base, target })
  const res = await fetch(`${API_BASE}?${params}`)

  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rate: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Fetch a historical exchange rate for a specific date.
 * The API route checks the Supabase cache first.
 */
export async function fetchHistoricalRate(
  base: Currency,
  target: Currency,
  date: string,
): Promise<ExchangeRateResponse> {
  const params = new URLSearchParams({ base, target, date })
  const res = await fetch(`${API_BASE}?${params}`)

  if (!res.ok) {
    throw new Error(`Failed to fetch historical exchange rate: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Convert an amount from one currency to another using the current rate.
 */
export async function convertAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  date?: string,
): Promise<ConvertedAmount> {
  if (fromCurrency === toCurrency) {
    const today = new Date().toISOString().split('T')[0]
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      targetCurrency: toCurrency,
      rate: 1,
      date: date ?? today,
    }
  }

  const rateData = date
    ? await fetchHistoricalRate(fromCurrency, toCurrency, date)
    : await fetchCurrentRate(fromCurrency, toCurrency)

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: amount * rateData.rate,
    targetCurrency: toCurrency,
    rate: rateData.rate,
    date: rateData.date,
  }
}

/**
 * Convert an amount synchronously when the rate is already known.
 */
export function convertWithRate(amount: number, rate: number): number {
  return amount * rate
}
