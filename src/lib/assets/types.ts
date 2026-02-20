import type { Currency } from '@/lib/constants'

export interface AssetFormData {
  name: string
  current_value: number
  currency: Currency
  notes: string
}

export interface AssetValueSnapshotFormData {
  asset_id: string
  value: number
  currency: Currency
  date: string
  notes: string
}
