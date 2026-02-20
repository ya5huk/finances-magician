'use client'

import { type ReactNode, type HTMLAttributes } from 'react'

export interface Tab {
  value: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: Tab[]
  value: string
  onChange: (value: string) => void
}

export function Tabs({
  tabs,
  value,
  onChange,
  className = '',
  ...props
}: TabsProps) {
  return (
    <div
      className={`flex items-center gap-1 p-1 bg-muted rounded-xl overflow-x-auto ${className}`}
      role="tablist"
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value

        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            className={`
              flex items-center gap-1.5 px-3 py-2
              text-sm font-medium rounded-lg
              transition-all duration-150 whitespace-nowrap
              cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Tab Content helper ───────────────────────────────────────── */

export interface TabContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  activeValue: string
  children: ReactNode
}

export function TabContent({
  value,
  activeValue,
  children,
  className = '',
  ...props
}: TabContentProps) {
  if (value !== activeValue) return null

  return (
    <div role="tabpanel" className={className} {...props}>
      {children}
    </div>
  )
}
