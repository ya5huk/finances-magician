import type { SupabaseClient } from '@supabase/supabase-js'
import type { Expense, ExpenseCategory } from '@/lib/types/database'
import type { ExpenseFormData, ExpenseCategoryFormData, ExpenseWithCategory } from './types'

// --- Expenses ---

export async function listExpenses(
  supabase: SupabaseClient,
  userId: string
): Promise<ExpenseWithCategory[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_categories(id, name, is_active)')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []) as ExpenseWithCategory[]
}

export async function getExpense(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export async function createExpense(
  supabase: SupabaseClient,
  userId: string,
  input: ExpenseFormData
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateExpense(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  input: Partial<ExpenseFormData>
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteExpense(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

// --- Expense Categories ---

export async function listExpenseCategories(
  supabase: SupabaseClient,
  userId: string
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createExpenseCategory(
  supabase: SupabaseClient,
  userId: string,
  input: ExpenseCategoryFormData
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateExpenseCategory(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  input: Partial<ExpenseCategoryFormData>
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteExpenseCategory(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
