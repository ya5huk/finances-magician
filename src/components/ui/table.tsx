'use client'

import { useState, type ReactNode, type HTMLAttributes } from 'react'

/* ─── Types ────────────────────────────────────────────────────── */

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => ReactNode
  mobileLabel?: string
  className?: string
}

export interface TableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  emptyMessage?: string
}

/* ─── Component ────────────────────────────────────────────────── */

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  onSort,
  emptyMessage = 'No data to display',
  className = '',
  ...props
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  const getValue = (row: T, key: string): unknown => {
    return row[key]
  }

  // Client-side sort if no onSort provided
  const sortedData =
    sortKey && !onSort
      ? [...data].sort((a, b) => {
          const aVal = getValue(a, sortKey)
          const bVal = getValue(b, sortKey)
          if (aVal == null || bVal == null) return 0
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal
          }
          const aStr = String(aVal)
          const bStr = String(bVal)
          return sortDir === 'asc'
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr)
        })
      : data

  return (
    <div className={className} {...props}>
      {/* ─ Desktop table ─────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      {col.header}
                      <SortIcon active={sortKey === col.key} direction={sortKey === col.key ? sortDir : undefined} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {sortedData.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-foreground ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(getValue(row, col.key) ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─ Mobile card list ──────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-2">
        {sortedData.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        )}
        {sortedData.map((row) => (
          <div
            key={rowKey(row)}
            className="bg-card border border-border rounded-xl p-4 space-y-2"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {col.mobileLabel || col.header}
                </span>
                <span className="text-sm text-foreground text-right">
                  {col.render
                    ? col.render(row)
                    : String(getValue(row, col.key) ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Sort Icon ────────────────────────────────────────────────── */

function SortIcon({
  active,
  direction,
}: {
  active: boolean
  direction?: 'asc' | 'desc'
}) {
  return (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 2L9 5H3L6 2Z"
        fill={active && direction === 'asc' ? 'currentColor' : 'currentColor'}
        opacity={active && direction === 'asc' ? 1 : 0.3}
      />
      <path
        d="M6 10L3 7H9L6 10Z"
        fill={active && direction === 'desc' ? 'currentColor' : 'currentColor'}
        opacity={active && direction === 'desc' ? 1 : 0.3}
      />
    </svg>
  )
}
