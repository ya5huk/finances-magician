import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payslip } from '@/lib/types/database'
import type { PayslipFormData } from './types'

export async function listPayslips(
  supabase: SupabaseClient,
  userId: string
): Promise<Payslip[]> {
  const { data, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getPayslip(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<Payslip | null> {
  const { data, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export async function createPayslip(
  supabase: SupabaseClient,
  userId: string,
  input: PayslipFormData
): Promise<Payslip> {
  const { data, error } = await supabase
    .from('payslips')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePayslip(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  input: Partial<PayslipFormData>
): Promise<Payslip> {
  const { data, error } = await supabase
    .from('payslips')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePayslip(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('payslips')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
