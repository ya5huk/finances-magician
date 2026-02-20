export interface Profile {
  id: string
  email: string
  display_name: string
  base_currency: string
  created_at: string
  updated_at: string
}

export interface FundType {
  id: string
  user_id: string
  name: string
  category: 'pension' | 'education_fund' | 'deposit' | 'custom'
  is_active: boolean
  created_at: string
}

export interface Payslip {
  id: string
  user_id: string
  date: string
  gross_salary: number
  net_salary: number
  tax: number
  bituach_leumi: number
  health_tax: number
  pension_employee: number
  pension_employer: number
  hishtalmut_employee: number
  hishtalmut_employer: number
  overtime: number
  bonus: number
  vacation_days_balance: number
  sick_days_balance: number
  currency: string
  source_file_url: string | null
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  date: string
  description: string
  amount: number
  currency: string
  category_id: string | null
  source_file_url: string | null
  notes: string | null
  created_at: string
}

export interface ExpenseCategory {
  id: string
  user_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface StockTrade {
  id: string
  user_id: string
  ticker: string
  exchange: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price_per_share: number
  currency: string
  exchange_rate_at_trade: number
  fees: number
  broker: string
  trade_date: string
  lot_id: string | null
  notes: string | null
  created_at: string
}

export interface Dividend {
  id: string
  user_id: string
  ticker: string
  amount: number
  currency: string
  date: string
  notes: string | null
  created_at: string
}

export interface FundEntry {
  id: string
  user_id: string
  fund_type_id: string
  entry_type: 'contribution' | 'withdrawal' | 'value_snapshot'
  amount: number
  currency: string
  date: string
  source_description: string | null
  notes: string | null
  created_at: string
}

export interface Deposit {
  id: string
  user_id: string
  fund_type_id: string
  bank: string
  principal: number
  currency: string
  interest_rate: number
  start_date: string
  maturity_date: string
  projected_value: number
  notes: string | null
  created_at: string
}

export interface Loan {
  id: string
  user_id: string
  name: string
  principal: number
  remaining_balance: number
  currency: string
  interest_rate: number
  monthly_payment: number
  start_date: string
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PhysicalAsset {
  id: string
  user_id: string
  name: string
  current_value: number
  currency: string
  last_valued_at: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AssetValueHistory {
  id: string
  asset_id: string
  user_id: string
  value: number
  currency: string
  date: string
  notes: string | null
  created_at: string
}

export interface CashflowCorrection {
  id: string
  user_id: string
  corrected_balance: number
  currency: string
  date: string
  reason: string | null
  created_at: string
}

export interface ExchangeRate {
  id: string
  base_currency: string
  target_currency: string
  rate: number
  date: string
}

export interface UploadedDocument {
  id: string
  user_id: string
  file_name: string
  file_url: string
  document_type: 'payslip' | 'credit_card_statement'
  parsed_data: Record<string, unknown>
  status: 'processing' | 'parsed' | 'error'
  created_at: string
}
