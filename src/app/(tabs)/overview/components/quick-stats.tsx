'use client'

import { MetricCard } from '@/components/ui/card'
import type { Currency } from '@/lib/constants'
import { formatCurrency } from '@/lib/portfolio/calculations'

interface QuickStatsProps {
  monthlyIncome: number
  monthlyExpenses: number
  portfolioReturnPercent: number
  activeDepositsCount: number
  activeDepositsTotal: number
  currency: Currency
}

export function QuickStats({
  monthlyIncome,
  monthlyExpenses,
  portfolioReturnPercent,
  activeDepositsCount,
  activeDepositsTotal,
  currency,
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        label="Monthly Income"
        value={formatCurrency(monthlyIncome, currency)}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <MetricCard
        label="Monthly Expenses"
        value={formatCurrency(monthlyExpenses, currency)}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
        }
      />
      <MetricCard
        label="Portfolio Return"
        value={`${portfolioReturnPercent >= 0 ? '+' : ''}${portfolioReturnPercent.toFixed(2)}%`}
        changePercent={portfolioReturnPercent}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
            />
          </svg>
        }
      />
      <MetricCard
        label="Active Deposits"
        value={`${activeDepositsCount}`}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
            />
          </svg>
        }
      />
    </div>
  )
}
