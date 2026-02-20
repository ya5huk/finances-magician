export interface ExpenseFormData {
  date: string
  description: string
  amount: number
  currency: string
  category_id?: string | null
  source_file_url?: string | null
  notes?: string | null
}

export interface ExpenseCategoryFormData {
  name: string
  is_active?: boolean
}

export interface ExpenseWithCategory {
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
  expense_categories: {
    id: string
    name: string
    is_active: boolean
  } | null
}

export interface ExpenseFilters {
  category_id?: string | null
  year?: number
  month?: number
  currency?: string
}
