'use client'

import { useState, useRef, useEffect } from 'react'
import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'

export interface CurrencySelectorProps {
  value: Currency
  onChange: (currency: Currency) => void
  disabled?: boolean
  className?: string
}

export function CurrencySelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`
          h-10 px-3 flex items-center gap-2
          bg-card text-foreground text-sm font-medium
          border border-border rounded-lg
          transition-colors duration-150
          hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
          ${open ? 'ring-2 ring-ring border-transparent' : ''}
        `}
      >
        <span className="text-base">{CURRENCY_SYMBOLS[value]}</span>
        <span>{value}</span>
        <svg
          className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-32 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c)
                setOpen(false)
              }}
              className={`
                w-full px-3 py-2.5 text-sm text-left flex items-center gap-2.5
                transition-colors duration-150 cursor-pointer
                ${c === value ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-muted'}
              `}
            >
              <span className="text-base w-5 text-center">
                {CURRENCY_SYMBOLS[c]}
              </span>
              <span>{c}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
