export interface CashflowBreakdown {
  income: number
  expenses: number
  investments: number
  dividends: number
  correction: number
}

export interface CashflowResult {
  balance: number
  breakdown: CashflowBreakdown
}

/**
 * Calculate the cash balance from all income, expense, and investment flows.
 *
 * Starting from the latest cashflow correction (or 0), the balance is:
 *   correction + income - expenses - investments + dividends
 *
 * "investments" is net stock purchases: buyTotal - sellTotal + fundContributions
 */
export function calculateCashflow({
  netSalaries,
  expensesTotal,
  fundContributionsTotal,
  stockBuyTotal,
  stockSellTotal,
  dividendTotal,
  latestCorrection,
}: {
  netSalaries: number
  expensesTotal: number
  fundContributionsTotal: number
  stockBuyTotal: number
  stockSellTotal: number
  dividendTotal: number
  latestCorrection: number | null
}): CashflowResult {
  const correction = latestCorrection ?? 0
  const income = Math.round(netSalaries * 100) / 100
  const expenses = Math.round(expensesTotal * 100) / 100
  const investments =
    Math.round((stockBuyTotal - stockSellTotal + fundContributionsTotal) * 100) /
    100
  const dividends = Math.round(dividendTotal * 100) / 100

  const balance =
    Math.round(
      (correction + income - expenses - investments + dividends) * 100
    ) / 100

  return {
    balance,
    breakdown: {
      income,
      expenses,
      investments,
      dividends,
      correction,
    },
  }
}
