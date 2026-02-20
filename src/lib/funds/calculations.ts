import type { FundEntry, Deposit, Loan } from '@/lib/types/database'

/**
 * Calculate the total contributions (contributions minus withdrawals) for a set of fund entries.
 */
export function calculateTotalContributions(entries: FundEntry[]): number {
  return entries.reduce((total, entry) => {
    if (entry.entry_type === 'contribution') return total + entry.amount
    if (entry.entry_type === 'withdrawal') return total - entry.amount
    return total
  }, 0)
}

/**
 * Get the latest snapshot value from a set of fund entries.
 * Returns the most recent value_snapshot amount, or null if none exists.
 */
export function getLatestSnapshotValue(entries: FundEntry[]): number | null {
  const snapshots = entries
    .filter((e) => e.entry_type === 'value_snapshot')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return snapshots.length > 0 ? snapshots[0].amount : null
}

/**
 * Calculate gain/loss for a fund given its entries.
 * gain = latestSnapshot - totalContributions (if a snapshot exists)
 */
export function calculateGainLoss(entries: FundEntry[]): number | null {
  const latestValue = getLatestSnapshotValue(entries)
  if (latestValue === null) return null
  const totalContributions = calculateTotalContributions(entries)
  return latestValue - totalContributions
}

/**
 * Calculate projected deposit value at maturity using compound interest.
 * Formula: P * (1 + r/n)^(n*t)
 * where P = principal, r = annual rate, n = compounding periods per year, t = years
 */
export function calculateProjectedDepositValue(
  principal: number,
  annualRate: number,
  startDate: string,
  maturityDate: string,
  compoundingPeriodsPerYear: number = 12,
): number {
  const start = new Date(startDate)
  const maturity = new Date(maturityDate)
  const years =
    (maturity.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

  if (years <= 0) return principal

  const r = annualRate / 100
  const n = compoundingPeriodsPerYear

  return principal * Math.pow(1 + r / n, n * years)
}

/**
 * Calculate total fund value across all fund entries (using latest snapshots per fund).
 * Groups entries by fund_type_id and sums the latest snapshot or total contributions.
 */
export function calculateTotalFundValue(
  entries: FundEntry[],
): number {
  const byFund = groupEntriesByFund(entries)
  let total = 0

  for (const fundEntries of Object.values(byFund)) {
    const snapshot = getLatestSnapshotValue(fundEntries)
    total += snapshot !== null ? snapshot : calculateTotalContributions(fundEntries)
  }

  return total
}

/**
 * Calculate total deposit value (sum of projected values).
 */
export function calculateTotalDepositValue(deposits: Deposit[]): number {
  return deposits.reduce((total, d) => total + d.projected_value, 0)
}

/**
 * Calculate total loan remaining balance.
 */
export function calculateTotalLoanBalance(loans: Loan[]): number {
  return loans.reduce((total, l) => total + l.remaining_balance, 0)
}

/**
 * Calculate net position: total fund value + total deposits - total loan balance.
 */
export function calculateNetPosition(
  entries: FundEntry[],
  deposits: Deposit[],
  loans: Loan[],
): number {
  const fundValue = calculateTotalFundValue(entries)
  const depositValue = calculateTotalDepositValue(deposits)
  const loanBalance = calculateTotalLoanBalance(loans)

  return fundValue + depositValue - loanBalance
}

/**
 * Group fund entries by fund_type_id.
 */
export function groupEntriesByFund(
  entries: FundEntry[],
): Record<string, FundEntry[]> {
  return entries.reduce(
    (groups, entry) => {
      const key = entry.fund_type_id
      if (!groups[key]) groups[key] = []
      groups[key].push(entry)
      return groups
    },
    {} as Record<string, FundEntry[]>,
  )
}
