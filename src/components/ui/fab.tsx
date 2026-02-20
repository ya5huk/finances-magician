'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'

export interface FabAction {
  label: string
  icon: ReactNode
  onClick: () => void
}

export interface FabProps {
  icon?: ReactNode
  actions?: FabAction[]
  onClick?: () => void
  className?: string
}

export function Fab({
  icon,
  actions,
  onClick,
  className = '',
}: FabProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasActions = actions && actions.length > 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleMainClick() {
    if (hasActions) {
      setOpen(!open)
    } else {
      onClick?.()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6 ${className}`}
    >
      {/* Action items */}
      {hasActions && open && (
        <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                action.onClick()
                setOpen(false)
              }}
              className="
                flex items-center gap-3 px-4 py-2.5
                bg-card border border-border rounded-xl shadow-lg
                text-sm font-medium text-foreground
                hover:bg-muted transition-colors duration-150
                cursor-pointer whitespace-nowrap
              "
            >
              <span className="shrink-0 text-primary">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        type="button"
        onClick={handleMainClick}
        className={`
          flex items-center justify-center
          w-14 h-14 rounded-full
          bg-primary text-primary-foreground
          shadow-lg shadow-primary/25
          transition-all duration-200
          hover:bg-primary/90 hover:scale-105
          active:scale-95
          cursor-pointer
          ${open ? 'rotate-45' : ''}
        `}
      >
        {icon || (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
