'use client'

import { type HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'card' | 'table-row'
  width?: string
  height?: string
  lines?: number
}

function SkeletonBase({
  className = '',
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-md ${className}`}
      style={style}
      {...props}
    />
  )
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
  ...props
}: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <SkeletonBase
        className={`rounded-full ${className}`}
        style={{
          width: width || '40px',
          height: height || '40px',
        }}
        {...props}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`bg-card border border-border rounded-xl p-4 space-y-3 ${className}`}
        {...props}
      >
        <SkeletonBase className="h-4 w-1/3" />
        <SkeletonBase className="h-8 w-2/3" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
    )
  }

  if (variant === 'table-row') {
    return (
      <div
        className={`flex items-center gap-4 py-3 ${className}`}
        {...props}
      >
        <SkeletonBase className="h-4 w-1/4" />
        <SkeletonBase className="h-4 w-1/3" />
        <SkeletonBase className="h-4 w-1/5" />
        <SkeletonBase className="h-4 w-1/6 ml-auto" />
      </div>
    )
  }

  // text variant
  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBase
            key={i}
            className="h-4"
            style={{
              width:
                width || (i === lines - 1 ? '66%' : '100%'),
              height: height,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <SkeletonBase
      className={className}
      style={{
        width: width || '100%',
        height: height || '16px',
      }}
      {...props}
    />
  )
}
