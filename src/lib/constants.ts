export const CURRENCIES = ['ILS', 'USD', 'GBP', 'EUR'] as const
export type Currency = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: Currency = 'ILS'

export const FUND_CATEGORIES = ['pension', 'education_fund', 'deposit', 'custom'] as const
export type FundCategory = (typeof FUND_CATEGORIES)[number]

export const TRADE_TYPES = ['buy', 'sell'] as const
export type TradeType = (typeof TRADE_TYPES)[number]

export const DOCUMENT_TYPES = ['payslip', 'credit_card_statement'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_STATUSES = ['processing', 'parsed', 'error'] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const FUND_ENTRY_TYPES = ['contribution', 'withdrawal', 'value_snapshot'] as const
export type FundEntryType = (typeof FUND_ENTRY_TYPES)[number]

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ILS: '₪',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

export const TAB_ROUTES = [
  { name: 'Overview', href: '/overview', icon: 'LayoutDashboard' },
  { name: 'Portfolio', href: '/portfolio', icon: 'TrendingUp' },
  { name: 'Income', href: '/income', icon: 'Wallet' },
  { name: 'Expenses', href: '/expenses', icon: 'CreditCard' },
  { name: 'Funds', href: '/funds', icon: 'PiggyBank' },
  { name: 'Assets', href: '/assets', icon: 'Building' },
] as const
