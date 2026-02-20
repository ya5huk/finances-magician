import { createClient } from '@/lib/supabase/client'
import type { FundType, FundEntry, Deposit, Loan } from '@/lib/types/database'
import type { FundTypeFormData, FundEntryFormData, DepositFormData, LoanFormData } from './types'

// ─── Fund Types ────────────────────────────────────────────────

export async function listFundTypes(): Promise<FundType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fund_types')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createFundType(formData: FundTypeFormData): Promise<FundType> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('fund_types')
    .insert({ ...formData, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFundType(
  id: string,
  formData: Partial<FundTypeFormData>,
): Promise<FundType> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fund_types')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFundType(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('fund_types').delete().eq('id', id)
  if (error) throw error
}

// ─── Fund Entries ──────────────────────────────────────────────

export async function listFundEntries(): Promise<FundEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fund_entries')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listFundEntriesByType(fundTypeId: string): Promise<FundEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fund_entries')
    .select('*')
    .eq('fund_type_id', fundTypeId)
    .order('date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createFundEntry(formData: FundEntryFormData): Promise<FundEntry> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('fund_entries')
    .insert({
      ...formData,
      user_id: user.id,
      source_description: formData.source_description || null,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFundEntry(
  id: string,
  formData: Partial<FundEntryFormData>,
): Promise<FundEntry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fund_entries')
    .update({
      ...formData,
      source_description: formData.source_description || null,
      notes: formData.notes || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFundEntry(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('fund_entries').delete().eq('id', id)
  if (error) throw error
}

// ─── Deposits ──────────────────────────────────────────────────

export async function listDeposits(): Promise<Deposit[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deposits')
    .select('*')
    .order('maturity_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createDeposit(formData: DepositFormData): Promise<Deposit> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { calculateProjectedDepositValue } = await import('./calculations')
  const projected_value = calculateProjectedDepositValue(
    formData.principal,
    formData.interest_rate,
    formData.start_date,
    formData.maturity_date,
  )

  const { data, error } = await supabase
    .from('deposits')
    .insert({
      ...formData,
      user_id: user.id,
      projected_value,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDeposit(
  id: string,
  formData: Partial<DepositFormData>,
): Promise<Deposit> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    ...formData,
    notes: formData.notes || null,
  }

  // Recalculate projected value if relevant fields changed
  if (formData.principal !== undefined && formData.interest_rate !== undefined &&
      formData.start_date !== undefined && formData.maturity_date !== undefined) {
    const { calculateProjectedDepositValue } = await import('./calculations')
    updateData.projected_value = calculateProjectedDepositValue(
      formData.principal,
      formData.interest_rate,
      formData.start_date,
      formData.maturity_date,
    )
  }

  const { data, error } = await supabase
    .from('deposits')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDeposit(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('deposits').delete().eq('id', id)
  if (error) throw error
}

// ─── Loans ─────────────────────────────────────────────────────

export async function listLoans(): Promise<Loan[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createLoan(formData: LoanFormData): Promise<Loan> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('loans')
    .insert({
      ...formData,
      user_id: user.id,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLoan(
  id: string,
  formData: Partial<LoanFormData>,
): Promise<Loan> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('loans')
    .update({
      ...formData,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLoan(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('loans').delete().eq('id', id)
  if (error) throw error
}
