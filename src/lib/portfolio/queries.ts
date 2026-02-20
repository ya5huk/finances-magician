import type { SupabaseClient } from '@supabase/supabase-js'
import type { StockTrade, Dividend } from '@/lib/types/database'
import type { TradeFormInput, DividendFormInput } from './types'

// ---------- TRADES ----------

export async function listTrades(
  supabase: SupabaseClient,
  userId: string
): Promise<StockTrade[]> {
  const { data, error } = await supabase
    .from('stock_trades')
    .select('*')
    .eq('user_id', userId)
    .order('trade_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createTrade(
  supabase: SupabaseClient,
  userId: string,
  input: TradeFormInput
): Promise<StockTrade> {
  const { data, error } = await supabase
    .from('stock_trades')
    .insert({
      user_id: userId,
      ticker: input.ticker.toUpperCase().trim(),
      exchange: input.exchange.trim(),
      trade_type: input.trade_type,
      quantity: input.quantity,
      price_per_share: input.price_per_share,
      currency: input.currency,
      exchange_rate_at_trade: input.exchange_rate_at_trade,
      fees: input.fees,
      broker: input.broker.trim(),
      trade_date: input.trade_date,
      notes: input.notes.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrade(
  supabase: SupabaseClient,
  tradeId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('stock_trades')
    .delete()
    .eq('id', tradeId)
    .eq('user_id', userId)

  if (error) throw error
}

// ---------- DIVIDENDS ----------

export async function listDividends(
  supabase: SupabaseClient,
  userId: string
): Promise<Dividend[]> {
  const { data, error } = await supabase
    .from('dividends')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createDividend(
  supabase: SupabaseClient,
  userId: string,
  input: DividendFormInput
): Promise<Dividend> {
  const { data, error } = await supabase
    .from('dividends')
    .insert({
      user_id: userId,
      ticker: input.ticker.toUpperCase().trim(),
      amount: input.amount,
      currency: input.currency,
      date: input.date,
      notes: input.notes.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDividend(
  supabase: SupabaseClient,
  dividendId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('dividends')
    .delete()
    .eq('id', dividendId)
    .eq('user_id', userId)

  if (error) throw error
}
