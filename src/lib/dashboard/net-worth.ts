export interface NetWorthBreakdown {
  cash: number
  stocks: number
  funds: number
  deposits: number
  assets: number
  debt: number
}

export interface NetWorthResult {
  total: number
  breakdown: NetWorthBreakdown
}

/**
 * Calculate total net worth from all financial components.
 *
 * Net worth = cash + stocks + funds + deposits + assets - debt
 */
export function calculateNetWorth({
  cashBalance,
  portfolioValue,
  fundValue,
  depositValue,
  assetValue,
  loanBalance,
}: {
  cashBalance: number
  portfolioValue: number
  fundValue: number
  depositValue: number
  assetValue: number
  loanBalance: number
}): NetWorthResult {
  const breakdown: NetWorthBreakdown = {
    cash: Math.round(cashBalance * 100) / 100,
    stocks: Math.round(portfolioValue * 100) / 100,
    funds: Math.round(fundValue * 100) / 100,
    deposits: Math.round(depositValue * 100) / 100,
    assets: Math.round(assetValue * 100) / 100,
    debt: Math.round(loanBalance * 100) / 100,
  }

  const total =
    breakdown.cash +
    breakdown.stocks +
    breakdown.funds +
    breakdown.deposits +
    breakdown.assets -
    breakdown.debt

  return {
    total: Math.round(total * 100) / 100,
    breakdown,
  }
}
