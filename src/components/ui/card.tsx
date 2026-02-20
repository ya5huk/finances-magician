'use client'

import { type HTMLAttributes, type ReactNode } from 'react'

/* ─── Base Card ────────────────────────────────────────────────── */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-xl ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── Card Header / Title ──────────────────────────────────────── */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="flex flex-col gap-0.5">
        {title && (
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ─── Metric Card ──────────────────────────────────────────────── */

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  label: string
  value: string | number
  changePercent?: number
}

export function MetricCard({
  icon,
  label,
  value,
  changePercent,
  className = '',
  ...props
}: MetricCardProps) {
  const isPositive = changePercent !== undefined && changePercent >= 0

  return (
    <Card className={`flex flex-col gap-3 ${className}`} {...props}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {changePercent !== undefined && (
          <span
            className={`text-xs font-medium mb-0.5 ${
              isPositive ? 'text-accent' : 'text-destructive'
            }`}
          >
            {isPositive ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  )
}

/* ─── Chart Card ───────────────────────────────────────────────── */

export interface ChartCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}: ChartCardProps) {
  return (
    <Card padding="lg" className={className} {...props}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <div className="mt-4">{children}</div>
    </Card>
  )
}

/* ─── List Item Card ───────────────────────────────────────────── */

export interface ListItemCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  title: string
  subtitle?: string
  trailing?: ReactNode
}

export function ListItemCard({
  icon,
  title,
  subtitle,
  trailing,
  className = '',
  ...props
}: ListItemCardProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl transition-colors duration-150 hover:bg-muted/50 ${className}`}
      {...props}
    >
      {icon && (
        <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}
