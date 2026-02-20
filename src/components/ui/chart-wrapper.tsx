'use client'

import { type ReactNode, type HTMLAttributes, type CSSProperties } from 'react'
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  type XAxisProps,
  type YAxisProps,
} from 'recharts'

/* ─── Theme constants ──────────────────────────────────────────── */

const CHART_COLORS = {
  primary: '#3b82f6',
  accent: '#10b981',
  destructive: '#ef4444',
  amber: '#f59e0b',
  purple: '#a855f7',
  cyan: '#06b6d4',
} as const

export { CHART_COLORS }

const AXIS_COLOR = '#a0a0a0'
const GRID_COLOR = '#2a2a2a'

/* ─── Dark Tooltip ─────────────────────────────────────────────── */

const tooltipStyle: CSSProperties = {
  backgroundColor: '#141414',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '8px 12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
}

const tooltipLabelStyle: CSSProperties = {
  color: '#a0a0a0',
  fontSize: '12px',
  marginBottom: '4px',
}

const tooltipItemStyle: CSSProperties = {
  color: '#ededed',
  fontSize: '13px',
}

export function DarkTooltip() {
  return (
    <RechartsTooltip
      contentStyle={tooltipStyle}
      labelStyle={tooltipLabelStyle}
      itemStyle={tooltipItemStyle}
      cursor={{ stroke: AXIS_COLOR, strokeWidth: 1, strokeDasharray: '4 4' }}
    />
  )
}

/* ─── Dark Axes ────────────────────────────────────────────────── */

export function DarkXAxis(props: XAxisProps) {
  return (
    <XAxis
      tick={{ fill: AXIS_COLOR, fontSize: 12 }}
      tickLine={{ stroke: AXIS_COLOR }}
      axisLine={{ stroke: GRID_COLOR }}
      {...props}
    />
  )
}

export function DarkYAxis(props: YAxisProps) {
  return (
    <YAxis
      tick={{ fill: AXIS_COLOR, fontSize: 12 }}
      tickLine={false}
      axisLine={false}
      {...props}
    />
  )
}

/* ─── Dark Grid ────────────────────────────────────────────────── */

export function DarkGrid() {
  return (
    <CartesianGrid
      strokeDasharray="3 3"
      stroke={GRID_COLOR}
      vertical={false}
    />
  )
}

/* ─── Chart Container ──────────────────────────────────────────── */

export interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  height?: number
  children: ReactNode
}

export function ChartContainer({
  height = 300,
  children,
  className = '',
  ...props
}: ChartContainerProps) {
  return (
    <div className={`w-full ${className}`} style={{ height }} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}
