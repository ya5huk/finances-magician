'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface FabAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

export function FabMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  const actions: FabAction[] = [
    {
      label: 'Upload PDF',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      onClick: () => {
        close()
        fileInputRef.current?.click()
      },
    },
    {
      label: 'Add Income Entry',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7V4a1 1 0 00-1-1H5a2 2 0 000 4h15a1 1 0 011 1v4h-3a2 2 0 000 4h3a1 1 0 001-1v-2a1 1 0 00-1-1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14a2 2 0 002 2h15a1 1 0 001-1v-4" />
        </svg>
      ),
      onClick: () => {
        close()
        router.push('/income?action=add')
      },
    },
    {
      label: 'Add Expense',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
      onClick: () => {
        close()
        router.push('/expenses?action=add')
      },
    },
    {
      label: 'Add Stock Trade',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
      onClick: () => {
        close()
        router.push('/portfolio?action=add-trade')
      },
    },
    {
      label: 'Add Fund Entry',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
          <path d="M2 9.5a.5.5 0 111 0v3a.5.5 0 11-1 0z" />
        </svg>
      ),
      onClick: () => {
        close()
        router.push('/funds?action=add')
      },
    },
    {
      label: 'Add/Edit Asset',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
        </svg>
      ),
      onClick: () => {
        close()
        router.push('/assets?action=add')
      },
    },
    {
      label: 'Add Loan',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      onClick: () => {
        close()
        router.push('/assets?action=add-loan')
      },
    },
    {
      label: 'Correct Cash Balance',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => {
        close()
        router.push('/overview?action=correct-balance')
      },
    },
  ]

  return (
    <>
      {/* Hidden file input for PDF upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            // Navigate to upload flow with the file name in the URL
            // The upload page will handle the actual upload
            router.push('/income?action=upload')
          }
          // Reset so the same file can be selected again
          e.target.value = ''
        }}
      />

      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={close}
        />
      )}

      {/* Action items */}
      <div className="fixed right-4 md:right-8 bottom-24 md:bottom-8 z-50 flex flex-col-reverse items-end gap-2">
        {/* Menu items */}
        {actions.map((action, index) => (
          <div
            key={action.label}
            className={`
              flex items-center gap-3 transition-all duration-200
              ${open
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
              }
            `}
            style={{
              transitionDelay: open ? `${index * 30}ms` : '0ms',
            }}
          >
            <span className="px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg shadow-lg whitespace-nowrap">
              {action.label}
            </span>
            <button
              type="button"
              onClick={action.onClick}
              className="
                flex items-center justify-center
                w-10 h-10 rounded-full
                bg-secondary text-secondary-foreground
                border border-border shadow-lg
                hover:bg-secondary/80 transition-colors duration-150
                cursor-pointer
              "
            >
              {action.icon}
            </button>
          </div>
        ))}

        {/* Main FAB button */}
        <button
          type="button"
          onClick={toggle}
          className={`
            flex items-center justify-center
            w-14 h-14 rounded-full
            bg-primary text-primary-foreground
            shadow-xl shadow-primary/25
            hover:bg-primary/90 transition-all duration-200
            cursor-pointer
            ${open ? 'rotate-45' : 'rotate-0'}
          `}
          aria-label={open ? 'Close menu' : 'Open quick actions'}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  )
}
