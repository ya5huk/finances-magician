'use client'

import { useState } from 'react'
import type { PhysicalAsset } from '@/lib/types/database'
import { CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { deleteAsset } from '@/lib/assets/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ValueHistoryChart } from './value-history-chart'

interface AssetListProps {
  assets: PhysicalAsset[]
  onDataChanged: () => void
  onAddSnapshot: (asset: PhysicalAsset) => void
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function AssetList({ assets, onDataChanged, onAddSnapshot }: AssetListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset and its history?')) return
    setDeleting(id)
    try {
      await deleteAsset(id)
      onDataChanged()
    } catch {
      alert('Failed to delete asset')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (assets.length === 0) {
    return (
      <Card>
        <p className="text-center py-8 text-sm text-muted-foreground">
          No assets tracked yet. Add your first asset to start tracking its value.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => {
        const isExpanded = expandedId === asset.id

        return (
          <Card key={asset.id} padding="none" className="overflow-hidden">
            {/* Asset row */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => handleToggleExpand(asset.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{asset.name}</p>
                  <svg
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    Last valued: {new Date(asset.last_valued_at).toLocaleDateString()}
                  </span>
                  {asset.notes && (
                    <span className="text-xs text-muted-foreground truncate max-w-48">
                      {asset.notes}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(asset.current_value, asset.currency)}
                </span>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border px-4 py-4 space-y-4">
                <ValueHistoryChart assetId={asset.id} currency={asset.currency} />

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddSnapshot(asset)
                    }}
                  >
                    Add Value Snapshot
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(asset.id)
                    }}
                    loading={deleting === asset.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
