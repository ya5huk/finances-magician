'use client'

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles: Record<NonNullable<InputProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full bg-card text-foreground placeholder:text-muted-foreground
              border border-border rounded-lg
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-destructive focus:ring-destructive' : ''}
              ${sizeStyles[size]}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-muted-foreground pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export interface CurrencyInputProps
  extends Omit<InputProps, 'type' | 'leftIcon'> {
  currency?: Currency
  onCurrencyChange?: (currency: Currency) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      currency = 'ILS',
      onCurrencyChange,
      label,
      error,
      helperText,
      className = '',
      size: _size,
      rightIcon: _rightIcon,
      ...inputProps
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node)
        ) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="
                h-10 px-3 flex items-center gap-1
                bg-secondary text-secondary-foreground
                border border-border border-r-0 rounded-l-lg
                text-sm font-medium transition-colors duration-150
                hover:bg-secondary/80 cursor-pointer
              "
            >
              <span>{CURRENCY_SYMBOLS[currency]}</span>
              <span>{currency}</span>
              <svg
                className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
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
              <div className="absolute top-full left-0 z-50 mt-1 w-28 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onCurrencyChange?.(c)
                      setOpen(false)
                    }}
                    className={`
                      w-full px-3 py-2 text-sm text-left flex items-center gap-2
                      transition-colors duration-150 cursor-pointer
                      ${c === currency ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-muted'}
                    `}
                  >
                    <span>{CURRENCY_SYMBOLS[c]}</span>
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            ref={ref}
            type="number"
            step="0.01"
            className={`
              flex-1 h-10 px-3 text-sm
              bg-card text-foreground placeholder:text-muted-foreground
              border border-border rounded-r-lg
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              ${error ? 'border-destructive focus:ring-destructive' : ''}
              ${className}
            `}
            placeholder="0.00"
            {...inputProps}
          />
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'
