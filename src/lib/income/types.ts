export interface PayslipFormData {
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
  source_file_url?: string | null
  notes?: string | null
}

export interface PayslipFilters {
  year?: number
  month?: number
  currency?: string
}
