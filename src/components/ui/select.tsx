'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  searchable?: boolean
  disabled?: boolean
  className?: string
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  searchable = false,
  disabled = false,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = searchable && search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open, searchable])

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={`
            w-full h-10 px-3 flex items-center justify-between
            bg-card text-sm rounded-lg
            border transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
            ${error ? 'border-destructive' : 'border-border'}
            ${open ? 'ring-2 ring-ring border-transparent' : ''}
          `}
        >
          <span
            className={
              selected ? 'text-foreground flex items-center gap-2' : 'text-muted-foreground'
            }
          >
            {selected ? (
              <>
                {selected.icon}
                {selected.label}
              </>
            ) : (
              placeholder
            )}
          </span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
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
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-border">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-8 px-2 text-sm bg-muted text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No options found
                </div>
              )}
              {filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={`
                    w-full px-3 py-2 text-sm text-left flex items-center gap-2
                    transition-colors duration-150 cursor-pointer
                    ${option.value === value ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-muted'}
                  `}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
