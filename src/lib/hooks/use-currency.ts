'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY,
  type Currency,
} from '@/lib/constants'
import type { ExchangeRateResponse } from '@/lib/currency/types'

const STORAGE_KEY_PREFIX = 'fm-display-currency-'
const RATE_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface RateCacheEntry {
  rate: number
  fetchedAt: number
}

/**
 * Hook for managing per-section display currency with conversion support.
 *
 * @param section - A section identifier (e.g. "overview", "portfolio") used
 *   to persist the chosen display currency in localStorage independently per section.
 */
export function useCurrency(section: string) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY)
  const rateCache = useRef<Map<string, RateCacheEntry>>(new Map())

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${section}`)
      if (stored && CURRENCIES.includes(stored as Currency)) {
        setCurrencyState(stored as Currency)
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode)
    }
  }, [section])

  const setCurrency = useCallback(
    (newCurrency: Currency) => {
      setCurrencyState(newCurrency)
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${section}`, newCurrency)
      } catch {
        // localStorage unavailable
      }
    },
    [section],
  )

  /**
   * Convert an amount from a given currency to the currently selected display currency.
   * Returns the converted amount, or the original if currencies match or conversion fails.
   */
  const convert = useCallback(
    async (amount: number, fromCurrency: Currency): Promise<number> => {
      if (fromCurrency === currency) return amount

      const cacheKey = `${fromCurrency}-${currency}`
      const cached = rateCache.current.get(cacheKey)

      if (cached && Date.now() - cached.fetchedAt < RATE_CACHE_DURATION) {
        return amount * cached.rate
      }

      try {
        const params = new URLSearchParams({
          base: fromCurrency,
          target: currency,
        })
        const res = await fetch(`/api/exchange-rates?${params}`)

        if (!res.ok) throw new Error('Rate fetch failed')

        const data: ExchangeRateResponse = await res.json()

        rateCache.current.set(cacheKey, {
          rate: data.rate,
          fetchedAt: Date.now(),
        })

        return amount * data.rate
      } catch {
        // Return unconverted amount on error
        return amount
      }
    },
    [currency],
  )

  /**
   * Format an amount with the appropriate currency symbol.
   * Uses the display currency by default, or a specific currency if provided.
   */
  const formatAmount = useCallback(
    (amount: number, overrideCurrency?: Currency): string => {
      const curr = overrideCurrency ?? currency
      const symbol = CURRENCY_SYMBOLS[curr]
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Math.abs(amount))

      const sign = amount < 0 ? '-' : ''
      return `${sign}${symbol}${formatted}`
    },
    [currency],
  )

  return {
    currency,
    setCurrency,
    convert,
    formatAmount,
  }
}
