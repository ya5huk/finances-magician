export interface ParsedPayslip {
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
  date: string // YYYY-MM-DD
  currency: string
}

export interface ParsedTransaction {
  date: string // YYYY-MM-DD
  description: string
  amount: number
  currency: string
  suggested_category: string
}

export interface ParsedCreditCardStatement {
  transactions: ParsedTransaction[]
}

export interface AIResponse {
  success: boolean
  data: ParsedPayslip | ParsedCreditCardStatement | null
  error?: string
}
