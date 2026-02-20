'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

/* ─── Types ────────────────────────────────────────────────────── */

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

/* ─── Context ──────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

/* ─── Provider ─────────────────────────────────────────────────── */

export interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9)
      const newToast: Toast = { id, duration: 4000, ...t }
      setToasts((prev) => [...prev, newToast])
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/* ─── Container ────────────────────────────────────────────────── */

interface ToastContainerProps {
  toasts: Toast[]
  dismiss: (id: string) => void
}

function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  )
}

/* ─── Item ─────────────────────────────────────────────────────── */

const variantStyles: Record<ToastVariant, { bg: string; icon: string; iconPath: string }> = {
  success: {
    bg: 'border-accent/30',
    icon: 'text-accent',
    iconPath: 'M5 13l4 4L19 7',
  },
  error: {
    bg: 'border-destructive/30',
    icon: 'text-destructive',
    iconPath: 'M6 18L18 6M6 6l12 12',
  },
  info: {
    bg: 'border-primary/30',
    icon: 'text-primary',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
  },
}

interface ToastItemProps {
  toast: Toast
  dismiss: (id: string) => void
}

function ToastItem({ toast: t, dismiss }: ToastItemProps) {
  const style = variantStyles[t.variant]

  useEffect(() => {
    if (!t.duration) return
    const timer = setTimeout(() => dismiss(t.id), t.duration)
    return () => clearTimeout(timer)
  }, [t.id, t.duration, dismiss])

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3 p-4
        bg-card border ${style.bg} rounded-xl shadow-lg
        animate-in slide-in-from-right-full fade-in duration-300
      `}
    >
      <svg
        className={`h-5 w-5 shrink-0 mt-0.5 ${style.icon}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={style.iconPath} />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{t.title}</p>
        {t.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(t.id)}
        className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
