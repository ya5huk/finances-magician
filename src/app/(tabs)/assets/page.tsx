'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PhysicalAsset } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY, type Currency } from '@/lib/constants'
import { listAssets } from '@/lib/assets/queries'
import { AssetList } from './components/asset-list'
import { AssetForm } from './components/asset-form'
import { Card, CardHeader, MetricCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function formatCurrency(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<PhysicalAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [snapshotAsset, setSnapshotAsset] = useState<PhysicalAsset | null>(null)

  const loadData = useCallback(async () => {
    try {
      const data = await listAssets()
      setAssets(data)
    } catch (err) {
      console.error('Failed to load assets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalValue = assets.reduce((sum, a) => sum + a.current_value, 0)

  const handleFormSuccess = () => {
    setShowForm(false)
    setSnapshotAsset(null)
    loadData()
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSnapshotAsset(null)
  }

  const handleAddSnapshot = (asset: PhysicalAsset) => {
    setSnapshotAsset(asset)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Physical assets & value tracking
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Physical assets & value tracking
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setSnapshotAsset(null)
            setShowForm(true)
          }}
        >
          + Add Asset
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Total Asset Value"
          value={formatCurrency(totalValue, DEFAULT_CURRENCY)}
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
              <path d="M12 10h.01" /><path d="M12 14h.01" />
              <path d="M16 10h.01" /><path d="M16 14h.01" />
              <path d="M8 10h.01" /><path d="M8 14h.01" />
            </svg>
          }
        />
        <MetricCard
          label="Assets Tracked"
          value={assets.length}
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          }
        />
      </div>

      {/* Asset List */}
      <AssetList
        assets={assets}
        onDataChanged={loadData}
        onAddSnapshot={handleAddSnapshot}
      />

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4">
            <Card padding="lg">
              <CardHeader
                title={snapshotAsset ? 'Add Value Snapshot' : 'Add New Asset'}
                action={
                  <button
                    onClick={handleFormClose}
                    className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                }
              />
              <div className="mt-4">
                <AssetForm
                  existingAsset={snapshotAsset ?? undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormClose}
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
