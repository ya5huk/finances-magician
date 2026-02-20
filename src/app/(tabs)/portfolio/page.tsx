import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortfolioContent from './components/portfolio-content'

export default async function PortfolioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial data server-side
  const [tradesResult, dividendsResult] = await Promise.all([
    supabase
      .from('stock_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false }),
    supabase
      .from('dividends')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
  ])

  return (
    <PortfolioContent
      initialTrades={tradesResult.data ?? []}
      initialDividends={dividendsResult.data ?? []}
    />
  )
}
