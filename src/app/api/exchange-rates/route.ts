import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES, type Currency } from '@/lib/constants'

const EXTERNAL_API_BASE = 'https://api.exchangerate-api.com/v4/latest'

/**
 * GET /api/exchange-rates?base=USD&target=ILS&date=2024-01-15
 *
 * Fetches exchange rates with Supabase caching.
 * - If `date` is provided, checks cache for historical rate first.
 * - Fetches from external API if not cached.
 * - Caches the result in the exchange_rates table.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const base = searchParams.get('base')?.toUpperCase() as Currency | undefined
  const target = searchParams.get('target')?.toUpperCase() as Currency | undefined
  const date = searchParams.get('date') ?? undefined

  if (!base || !target) {
    return NextResponse.json(
      { error: 'Missing required query params: base, target' },
      { status: 400 },
    )
  }

  if (!CURRENCIES.includes(base) || !CURRENCIES.includes(target)) {
    return NextResponse.json(
      { error: `Invalid currency. Supported: ${CURRENCIES.join(', ')}` },
      { status: 400 },
    )
  }

  if (base === target) {
    return NextResponse.json({
      base,
      target,
      rate: 1,
      date: date ?? new Date().toISOString().split('T')[0],
    })
  }

  try {
    const supabase = await createClient()
    const rateDate = date ?? new Date().toISOString().split('T')[0]

    // Check cache first
    const { data: cached } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', base)
      .eq('target_currency', target)
      .eq('date', rateDate)
      .maybeSingle()

    if (cached) {
      return NextResponse.json({
        base: cached.base_currency,
        target: cached.target_currency,
        rate: cached.rate,
        date: cached.date,
      })
    }

    // Fetch from external API
    const externalRes = await fetch(`${EXTERNAL_API_BASE}/${base}`)

    if (!externalRes.ok) {
      throw new Error(`External API error: ${externalRes.statusText}`)
    }

    const externalData = await externalRes.json()
    const rate = externalData.rates?.[target]

    if (rate === undefined) {
      return NextResponse.json(
        { error: `Rate not found for ${base} -> ${target}` },
        { status: 404 },
      )
    }

    // Cache the rate in Supabase
    await supabase.from('exchange_rates').upsert(
      {
        base_currency: base,
        target_currency: target,
        rate,
        date: rateDate,
      },
      {
        onConflict: 'base_currency,target_currency,date',
      },
    )

    return NextResponse.json({
      base,
      target,
      rate,
      date: rateDate,
    })
  } catch (error) {
    console.error('Exchange rate fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 },
    )
  }
}
