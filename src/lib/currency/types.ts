import { type Currency } from '@/lib/constants'

export interface ExchangeRateResponse {
  base: Currency
  target: Currency
  rate: number
  date: string
}

export interface ConvertedAmount {
  originalAmount: number
  originalCurrency: Currency
  convertedAmount: number
  targetCurrency: Currency
  rate: number
  date: string
}

export interface ExchangeRateAPIResponse {
  base: string
  date: string
  time_last_updated: number
  rates: Record<string, number>
}
