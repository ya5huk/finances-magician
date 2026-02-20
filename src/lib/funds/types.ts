import type { Currency, FundCategory, FundEntryType } from '@/lib/constants'

export interface FundTypeFormData {
  name: string
  category: FundCategory
  is_active: boolean
}

export interface FundEntryFormData {
  fund_type_id: string
  entry_type: FundEntryType
  amount: number
  currency: Currency
  date: string
  source_description: string
  notes: string
}

export interface DepositFormData {
  fund_type_id: string
  bank: string
  principal: number
  currency: Currency
  interest_rate: number
  start_date: string
  maturity_date: string
  notes: string
}

export interface LoanFormData {
  name: string
  principal: number
  remaining_balance: number
  currency: Currency
  interest_rate: number
  monthly_payment: number
  start_date: string
  end_date: string
  notes: string
}
