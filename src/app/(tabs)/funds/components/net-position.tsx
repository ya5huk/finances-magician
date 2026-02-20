'use client'

import type { FundEntry, Deposit, Loan } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import {
  calculateTotalFundValue,
  calculateTotalDepositValue,
  calculateTotalLoanBalance,
  calculateNetPosition,
} from '@/lib/funds/calculations'
import { MetricCard } from '@/components/ui/card'

interface NetPositionProps {
  entries: FundEntry[]
  deposits: Deposit[]
  loans: Loan[]
  baseCurrency: Currency
}

function formatCurrency(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const prefix = amount < 0 ? '-' : ''
  const absAmount = Math.abs(amount)
  return `${prefix}${symbol}${absAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function NetPosition({ entries, deposits, loans, baseCurrency }: NetPositionProps) {
  const totalFundValue = calculateTotalFundValue(entries)
  const totalDepositValue = calculateTotalDepositValue(deposits)
  const totalDebt = calculateTotalLoanBalance(loans)
  const netPosition = calculateNetPosition(entries, deposits, loans)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Fund Value"
        value={formatCurrency(totalFundValue, baseCurrency)}
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
            <path d="M2 9.5a.5.5 0 1 1 1 0v3a.5.5 0 1 1-1 0z" />
          </svg>
        }
      />
      <MetricCard
        label="Deposits"
        value={formatCurrency(totalDepositValue, baseCurrency)}
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        }
      />
      <MetricCard
        label="Total Debt"
        value={formatCurrency(totalDebt, baseCurrency)}
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3l-5 3Z" />
            <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3l-5 3Z" />
            <path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" />
          </svg>
        }
      />
      <MetricCard
        label="Net Position"
        value={formatCurrency(netPosition, baseCurrency)}
        className={netPosition >= 0 ? 'border-accent/30' : 'border-destructive/30'}
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        }
      />
    </div>
  )
}
