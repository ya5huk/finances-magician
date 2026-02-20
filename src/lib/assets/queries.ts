import { createClient } from '@/lib/supabase/client'
import type { PhysicalAsset, AssetValueHistory } from '@/lib/types/database'
import type { AssetFormData, AssetValueSnapshotFormData } from './types'

// ─── Physical Assets ───────────────────────────────────────────

export async function listAssets(): Promise<PhysicalAsset[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('physical_assets')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function createAsset(formData: AssetFormData): Promise<PhysicalAsset> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('physical_assets')
    .insert({
      ...formData,
      user_id: user.id,
      last_valued_at: now,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAsset(
  id: string,
  formData: Partial<AssetFormData>,
): Promise<PhysicalAsset> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('physical_assets')
    .update({
      ...formData,
      notes: formData.notes || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAsset(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('physical_assets').delete().eq('id', id)
  if (error) throw error
}

// ─── Asset Value History ───────────────────────────────────────

export async function listAssetValueHistory(
  assetId: string,
): Promise<AssetValueHistory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('asset_value_history')
    .select('*')
    .eq('asset_id', assetId)
    .order('date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createAssetValueSnapshot(
  formData: AssetValueSnapshotFormData,
): Promise<AssetValueHistory> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Insert history record
  const { data, error } = await supabase
    .from('asset_value_history')
    .insert({
      asset_id: formData.asset_id,
      user_id: user.id,
      value: formData.value,
      currency: formData.currency,
      date: formData.date,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) throw error

  // Also update the asset's current_value and last_valued_at
  const { error: updateError } = await supabase
    .from('physical_assets')
    .update({
      current_value: formData.value,
      last_valued_at: formData.date,
    })
    .eq('id', formData.asset_id)

  if (updateError) throw updateError

  return data
}

export async function deleteAssetValueHistory(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('asset_value_history')
    .delete()
    .eq('id', id)
  if (error) throw error
}
